import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Jaccard similarity (mirrors server/lib/ruleSimilarity.js) ──

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'is', 'are', 'be', 'was', 'this', 'that', 'it', 'they',
  'do', 'not', 'no', 'as', 'by', 'from', 'you', 'your', 'i', 'my', 'we',
  'our', 'when', 'where', 'how', 'what', 'which', 'who', 'will', 'should',
  'can', 'may', 'must', 'never', 'always', 'any', 'all', 'more', 'than',
  'so', 'if', 'then', 'use', 'used', 'using', 'also', 'just', 'very',
])

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a))
  const setB = new Set(tokenize(b))
  if (setA.size === 0 && setB.size === 0) return 0
  const intersection = [...setA].filter((w) => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

interface Rule { id: string; content: string; category?: string }

function findSimilarRules(newText: string, existing: Rule[], threshold = 0.38): Array<{ rule: Rule; score: number }> {
  return existing
    .filter((r) => (r.category ?? 'voice') === 'voice')
    .map((r) => ({ rule: r, score: jaccardSimilarity(newText, r.content) }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
}

// ── Handler ──

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return json({ error: 'OpenAI API key not configured' }, 500)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const { feedbackText, scriptContent, scriptId } = await req.json()
    if (!feedbackText?.trim()) return json({ error: 'Feedback text is required' }, 400)
    if (!scriptContent) return json({ error: 'Script content is required' }, 400)

    // Save feedback snapshot
    await supabase.from('script_feedback').insert({
      user_id: user.id,
      script_id: scriptId || null,
      script_snapshot: (scriptContent as string).slice(0, 5000),
      feedback_text: (feedbackText as string).trim(),
    })

    const openai = new OpenAI({ apiKey: openaiKey })

    // Extract rules from feedback (gpt-4o-mini — classification task)
    const extractPrompt = `Here is a script the user received:

---
${(scriptContent as string).slice(0, 4000)}
---

The user gave this feedback: "${(feedbackText as string).trim()}"

Extract 1–3 COMMUNICATION STYLE or TONE rules directly from this feedback. Be conservative: only extract what the user clearly asked for. Do not extrapolate, generalize, or add related ideas they did not mention. Prefer fewer, precise rules over many overlapping ones. Return each rule on its own line, numbered as ##1, ##2, ##3. If nothing actionable can be extracted, return "NONE".`

    const extractCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: extractPrompt }],
    })
    const raw = extractCompletion.choices?.[0]?.message?.content ?? ''

    const extractedRules: string[] = []
    for (const line of raw.split('\n')) {
      const m = line.match(/^##\d+\s*[.:]?\s*(.+)$/)
      if (m) {
        const text = m[1].trim()
        if (text && !/^NONE$/i.test(text)) extractedRules.push(text)
      }
    }

    // Fetch existing voice rules for deduplication
    const { data: existingData } = await supabase
      .from('voice_rules')
      .select('id, content, category')
      .eq('user_id', user.id)

    const currentRules: Rule[] = existingData ?? []
    let rulesAdded = 0
    let rulesConsolidated = 0

    for (const content of extractedRules) {
      const similar = findSimilarRules(content, currentRules)

      if (similar.length === 0) {
        const { error } = await supabase.from('voice_rules').insert({
          user_id: user.id, content, rule_type: 'general', source: 'feedback', category: 'voice',
        })
        if (!error) {
          rulesAdded++
          currentRules.push({ id: 'pending', content, category: 'voice' })
        }
      } else {
        // Ask gpt-4o-mini to merge or keep both
        const topMatch = similar[0].rule
        const consolidatePrompt = `Two communication style rules may overlap:

Rule A (existing): "${topMatch.content}"
Rule B (new): "${content}"

Should they be MERGED into one improved rule, or are they distinct enough to KEEP_BOTH?
Reply with exactly one of:
MERGED: <single combined rule text>
KEPT_BOTH`

        const consolidation = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: consolidatePrompt }],
        })
        const decision = consolidation.choices?.[0]?.message?.content?.trim() ?? ''

        if (decision.startsWith('MERGED:')) {
          const merged = decision.slice(7).trim()
          if (merged) {
            await supabase.from('voice_rules')
              .update({ content: merged, updated_at: new Date().toISOString() })
              .eq('id', topMatch.id).eq('user_id', user.id)
            rulesConsolidated++
            const idx = currentRules.findIndex((r) => r.id === topMatch.id)
            if (idx !== -1) currentRules[idx].content = merged
          }
        } else {
          const { error } = await supabase.from('voice_rules').insert({
            user_id: user.id, content, rule_type: 'general', source: 'feedback', category: 'voice',
          })
          if (!error) {
            rulesAdded++
            currentRules.push({ id: 'pending', content, category: 'voice' })
          }
        }
      }
    }

    return json({ rulesAdded, rulesConsolidated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to process feedback'
    return json({ error: msg }, 500)
  }
})
