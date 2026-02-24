import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'
import { fetchTranscript } from 'npm:@egoist/youtube-transcript-plus'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RE_YOUTUBE_VIDEO_ID = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i

function extractVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null
  const m = urlOrId.trim().match(RE_YOUTUBE_VIDEO_ID)
  return m ? m[1] : (urlOrId.length === 11 ? urlOrId : null)
}

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

    const { youtubeUrl } = await req.json()
    const videoId = extractVideoId(youtubeUrl ?? '')
    if (!videoId) return json({ error: 'Valid YouTube URL or video ID is required' }, 400)

    // Fetch transcript
    let transcriptText: string
    try {
      const result = await fetchTranscript(videoId)
      const segments = (result as { segments?: Array<{ text?: string }> })?.segments ?? []
      transcriptText = segments
        .map((s) => (s?.text || '').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/disabled|unavailable|not available|too many/i.test(msg)) {
        return json({ error: msg.replace(/\[YoutubeTranscript\]\s*🚨\s*/i, '') }, 400)
      }
      throw err
    }

    if (!transcriptText || transcriptText.length < 100) {
      return json({ error: 'Transcript is empty or too short to analyze' }, 400)
    }

    const extractPrompt = `You are analyzing a YouTube video transcript to extract reusable expertise for a content creator.

TRANSCRIPT (excerpt, may be truncated):
---
${transcriptText.slice(0, 12000)}
---

Extract and return a JSON object with exactly these keys (each an array of strings):

1. **knowledge** — Key facts, concepts, frameworks, or teachings from the transcript. Be specific and actionable.
2. **perspectives** — The speaker's viewpoints, principles, or "why" behind their approach. What do they believe or emphasize?
3. **communicationStyles** — How they communicate: tone, structure, analogies, phrases they repeat, how they explain complex topics, direct address patterns, etc.

Be concise. Each item should be 1–2 sentences. Prefer 3–8 items per category. Focus on what a content creator could learn and apply.`

    const openai = new OpenAI({ apiKey: openaiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: extractPrompt }],
    })
    const raw = completion.choices?.[0]?.message?.content ?? ''

    let extracted: { knowledge?: string[]; perspectives?: string[]; communicationStyles?: string[] } = {}
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) extracted = JSON.parse(jsonMatch[0])
    } catch {
      extracted = {}
    }

    return json({
      transcript: transcriptText.slice(0, 2000),
      transcriptLength: transcriptText.length,
      knowledge: Array.isArray(extracted.knowledge) ? extracted.knowledge : [],
      perspectives: Array.isArray(extracted.perspectives) ? extracted.perspectives : [],
      communicationStyles: Array.isArray(extracted.communicationStyles) ? extracted.communicationStyles : [],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to extract expertise'
    return json({ error: msg }, 500)
  }
})
