import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Profile context builder (mirrors server/lib/profileContextBuilder.js) ──

const TONE_STYLE_MAP: Record<string, string> = {
  'Like a teacher': "The creator's tone should sound like a teacher teaching students: clear, educational, patient, and structured.",
  'Like a friendly conversation': "The creator's tone should feel like a friendly conversation: warm, casual, approachable.",
  'Like a coach pushing you': "The creator's tone should feel like a coach pushing the audience: motivating, direct, energizing.",
  'Like a performer/storyteller': "The creator's tone should feel like a performer or storyteller: engaging, narrative, captivating.",
  'Neutral / informative': "The creator's tone should be neutral and informative: factual, balanced, objective.",
}

const CONTENT_GOAL_MAP: Record<string, string> = {
  'Teach them something': 'The primary goal is to teach the audience something new.',
  'Solve a problem': 'The primary goal is to help the audience solve a problem.',
  'Entertain them': 'The primary goal is to entertain the audience.',
  'Inspire or motivate': 'The primary goal is to inspire or motivate the audience.',
  'Make them feel understood': 'The primary goal is to make the audience feel understood and validated.',
  'Share news or information': 'The primary goal is to share news or information.',
}

const AUDIENCE_KNOWLEDGE_MAP: Record<string, string> = {
  'Nothing': 'The audience has no prior knowledge. Explain from basics, avoid jargon.',
  'A little': "The audience has some prior knowledge. Don't oversimplify; explain clearly.",
  'A lot': 'The audience is knowledgeable. You can go deeper and use more technical language.',
  "They're experts": "The audience are experts. Use technical language; skip basics.",
}

const RULE_TYPE_LABELS: Record<string, string> = {
  avoid: 'Avoid', prefer: 'Prefer', never: 'Never', tone: 'Tone',
  style: 'Style', delivery: 'Delivery', phrasing: 'Phrasing',
  speech_patterns: 'Speech Patterns', non_negotiables: 'Non-Negotiables', general: 'General',
}

function buildSystemPrompt({ profile, rules, prompt, duration, platform }: {
  profile: Record<string, unknown> | null
  rules: Array<{ content: string; rule_type: string; category?: string }>
  prompt: string
  duration: number
  platform: string
}): string {
  const wpm = (profile?.speaking_speed_wpm as number) ?? 145
  const maxWords = Math.round(((wpm / 60) * duration) / 10) * 10
  const firstName = (profile?.first_name as string)?.trim() ?? ''
  const lastName = (profile?.last_name as string)?.trim() ?? ''
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'The creator'
  const tone = (profile?.tone_style && TONE_STYLE_MAP[profile.tone_style as string]) || 'Use a warm, authentic, engaging tone.'
  const goal = (profile?.content_goal && CONTENT_GOAL_MAP[profile.content_goal as string]) || ''
  const audienceKnowledge = (profile?.audience_knowledge_level && AUDIENCE_KNOWLEDGE_MAP[profile.audience_knowledge_level as string]) || ''
  const audience = (profile?.target_audience as string)?.trim() ?? ''
  const desiredFeeling = (profile?.desired_feeling as string)?.trim() ?? ''
  const experienceBackground = (profile?.experience_background as string)?.trim() ?? ''
  const platforms = Array.isArray(profile?.content_platforms) && profile.content_platforms.length > 0
    ? (profile.content_platforms as string[]).join(', ') : ''

  // Split rules by category
  const voiceRules = rules.filter((r) => (r.category ?? 'voice') === 'voice')
  const expertiseRules = rules.filter((r) => r.category === 'expertise')

  const voiceRuleLines: string[] = []
  const ruleOrder = ['never', 'avoid', 'prefer', 'non_negotiables', 'tone', 'style', 'delivery', 'phrasing', 'speech_patterns', 'general']
  const byType: Record<string, string[]> = {}
  for (const r of voiceRules) {
    const t = r.rule_type || 'general'
    if (!byType[t]) byType[t] = []
    byType[t].push(r.content?.trim() ?? '')
  }
  for (const t of ruleOrder) {
    for (const c of byType[t] ?? []) {
      if (c) voiceRuleLines.push(`${RULE_TYPE_LABELS[t] ?? t}: ${c}`)
    }
  }

  const parts: string[] = []
  parts.push(`Generate a script about the following topic for ${platform} content. Maximum length: ${maxWords} words.\n`)
  parts.push(`Topic: ${prompt}\n`)
  parts.push('Format the script with line breaks between paragraphs or sections. Use short paragraphs (2-4 sentences each). Do not output a single wall of text.\n')
  parts.push('## Creator Profile')
  parts.push(`The creator is ${name}.`)
  if (goal) parts.push(goal)
  if (desiredFeeling) parts.push(`They want the audience to feel: ${desiredFeeling}.`)
  if (audienceKnowledge) parts.push(audienceKnowledge)
  if (audience) parts.push(`Target audience: ${audience}.`)
  if (experienceBackground) parts.push(`Creator background: ${experienceBackground}.`)
  if (platforms) parts.push(`Platforms: ${platforms}.`)
  parts.push('')

  if (expertiseRules.length > 0) {
    parts.push('## Subject Matter Context')
    parts.push('The creator has these areas of expertise and perspective. Use this to add depth, credibility, and accurate nuance to the script content:')
    parts.push(expertiseRules.map((r) => `- ${r.content?.trim()}`).join('\n'))
    parts.push('')
  }

  parts.push('## Style and Voice Rules')
  parts.push(`When writing the script, use the style and tone of: ${tone}`)
  parts.push('')
  parts.push('Always apply these rules:')
  parts.push('- Sound human and natural. Avoid anything that reads as AI-generated (e.g. overly polished, generic, or formulaic).')
  parts.push('- NEVER use em-dashes (—). Use commas, periods, or parentheses instead. This is mandatory.')
  parts.push('- Use zero emojis unless the user explicitly asks for them.')
  if (voiceRuleLines.length > 0) {
    parts.push('')
    parts.push('Make sure you follow these rules:')
    parts.push(voiceRuleLines.join('\n'))
  }
  parts.push('')
  parts.push("Write the script in this creator's voice. Follow all rules above. Do not violate any Avoid or Never rules.")

  return parts.join('\n')
}

// ── Handler ──

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { prompt, duration, platform } = await req.json()
    if (!prompt || typeof prompt !== 'string') return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const [{ data: profileData }, { data: rulesData }] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, content_platforms, speaking_speed_wpm, target_audience, audience_knowledge_level, content_goal, desired_feeling, experience_background, tone_style').eq('id', user.id).single(),
      supabase.from('voice_rules').select('content, rule_type, category').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    const systemContent = buildSystemPrompt({
      profile: profileData ?? null,
      rules: rulesData ?? [],
      prompt: prompt.trim(),
      duration: duration ?? 60,
      platform: platform || 'general content',
    })

    const openai = new OpenAI({ apiKey: openaiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt.trim() },
      ],
    })
    let text = completion.choices?.[0]?.message?.content ?? ''
    text = text.replace(/—/g, ', ')

    return new Response(JSON.stringify({ content: text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate content'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
