import 'dotenv/config'
import express from 'express'
import ViteExpress from 'vite-express'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { fetchTranscript } from '@egoist/youtube-transcript-plus'
import { buildSystemPrompt } from './lib/profileContextBuilder.js'
import { findSimilarRules } from './lib/ruleSimilarity.js'

const RE_YOUTUBE_VIDEO_ID = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i

function extractVideoId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null
  const m = urlOrId.trim().match(RE_YOUTUBE_VIDEO_ID)
  return m ? m[1] : (urlOrId.length === 11 ? urlOrId : null)
}

const app = express()
app.use(express.json())

const PORT = process.env.PORT || process.env.API_PORT || 3005

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// Health check – verify API server is up
app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/api/create-content', async (req, res) => {
  console.log('POST /api/create-content received')
  const sendError = (status, msg) => {
    if (res.headersSent) return
    try {
      res.status(status).json({ error: msg })
    } catch (e) {
      console.error('Failed to send error response:', e)
    }
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return sendError(500, 'OpenAI API key not configured')
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(401, 'Unauthorized')
    }
    const token = authHeader.slice(7).trim()
    if (!token) {
      return sendError(401, 'Unauthorized')
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return sendError(500, 'Supabase not configured')
    }

    const { prompt, duration, platform } = req.body ?? {}
    if (!prompt || typeof prompt !== 'string') {
      return sendError(400, 'Prompt is required')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user')
      return sendError(401, 'Unauthorized')
    }

    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    let profile = null
    let rules = []
    const { data: profileData, error: profileError } = await supabaseWithAuth
      .from('profiles')
      .select('first_name, last_name, content_platforms, speaking_speed_wpm, target_audience, audience_knowledge_level, content_goal, desired_feeling, experience_background, tone_style')
      .eq('id', user.id)
      .single()
    if (!profileError && profileData) profile = profileData

    const { data: rulesData, error: rulesError } = await supabaseWithAuth
      .from('voice_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!rulesError && Array.isArray(rulesData)) rules = rulesData

    const systemContent = buildSystemPrompt({
      profile,
      rules,
      prompt: prompt.trim(),
      duration: duration ?? 60,
      platform,
    })

    // Debug: log full AI context (look in the terminal where npm start is running)
    console.log('\n' + '='.repeat(60))
    console.log('AI SYSTEM PROMPT (injected context)')
    console.log('='.repeat(60))
    console.log(systemContent)
    console.log('='.repeat(60) + '\n')

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt.trim() },
      ],
    })
    let text = completion.choices?.[0]?.message?.content ?? ''
    // Post-process: strip em-dashes (AI sometimes ignores the rule)
    text = text.replace(/—/g, ', ')
    res.json({ content: text })
  } catch (err) {
    console.error('create-content error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to generate content' })
    }
  }
})

// Extract rules from feedback and insert into voice_rules
app.post('/api/feedback', async (req, res) => {
  const sendError = (status, msg) => {
    if (res.headersSent) return
    try {
      res.status(status).json({ error: msg })
    } catch (e) {
      console.error('Failed to send error response:', e)
    }
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return sendError(500, 'OpenAI API key not configured')
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(401, 'Unauthorized')
    }
    const token = authHeader.slice(7).trim()
    if (!token) {
      return sendError(401, 'Unauthorized')
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return sendError(500, 'Supabase not configured')
    }

    const { feedbackText, scriptContent, scriptId } = req.body ?? {}
    if (!feedbackText || typeof feedbackText !== 'string' || !feedbackText.trim()) {
      return sendError(400, 'Feedback text is required')
    }
    if (!scriptContent || typeof scriptContent !== 'string') {
      return sendError(400, 'Script content is required')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return sendError(401, 'Unauthorized')
    }

    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    // Save feedback
    const { error: insertError } = await supabaseWithAuth
      .from('script_feedback')
      .insert({
        user_id: user.id,
        script_id: scriptId || null,
        script_snapshot: scriptContent.slice(0, 5000),
        feedback_text: feedbackText.trim(),
      })
    if (insertError) {
      console.error('script_feedback insert error:', insertError)
      return sendError(500, 'Failed to save feedback')
    }

    // Extract rules via OpenAI
    const extractPrompt = `Here is a script the user received:

---
${scriptContent.slice(0, 4000)}
---

The user gave this feedback: "${feedbackText.trim()}"

Extract 1–3 COMMUNICATION STYLE or TONE rules directly from this feedback. Be conservative: only extract what the user clearly asked for. Do not extrapolate, generalize, or add related ideas they did not mention. Prefer fewer, precise rules over many overlapping ones. Return each rule on its own line, numbered as ##1, ##2, ##3. If nothing actionable can be extracted, return "NONE".`

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: extractPrompt }],
    })
    const raw = completion.choices?.[0]?.message?.content ?? ''

    // Parse ##1, ##2, ##3 etc
    const rules = []
    const lines = raw.split(/\n/)
    for (const line of lines) {
      const m = line.match(/^##\d+\s*[.:]?\s*(.+)$/)
      if (m) {
        const text = m[1].trim()
        if (text && !/^NONE$/i.test(text)) rules.push(text)
      }
    }

    // Fetch current voice rules once for similarity checks
    const { data: existingRules } = await supabaseWithAuth
      .from('voice_rules')
      .select('id, content, category')
      .eq('user_id', user.id)

    const currentRules = existingRules ?? []

    // Insert each rule — deduplicate against existing voice rules first
    let rulesAdded = 0
    let rulesConsolidated = 0

    for (const content of rules) {
      const similar = findSimilarRules(content, currentRules, 'voice')

      if (similar.length === 0) {
        // No overlap — safe to insert
        const { error: ruleError } = await supabaseWithAuth
          .from('voice_rules')
          .insert({ user_id: user.id, content, rule_type: 'general', source: 'feedback', category: 'voice' })
        if (!ruleError) {
          rulesAdded++
          currentRules.push({ id: 'pending', content, category: 'voice' })
        }
      } else {
        // Potential overlap — ask GPT to merge or keep both
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
            await supabaseWithAuth
              .from('voice_rules')
              .update({ content: merged, updated_at: new Date().toISOString() })
              .eq('id', topMatch.id)
              .eq('user_id', user.id)
            rulesConsolidated++
            // Update in-memory list so later rules in this loop see the merge
            const idx = currentRules.findIndex((r) => r.id === topMatch.id)
            if (idx !== -1) currentRules[idx].content = merged
          }
        } else {
          // KEPT_BOTH — insert new rule anyway
          const { error: ruleError } = await supabaseWithAuth
            .from('voice_rules')
            .insert({ user_id: user.id, content, rule_type: 'general', source: 'feedback', category: 'voice' })
          if (!ruleError) {
            rulesAdded++
            currentRules.push({ id: 'pending', content, category: 'voice' })
          }
        }
      }
    }

    res.json({ rulesAdded, rulesConsolidated })
  } catch (err) {
    console.error('feedback error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to generate content' })
    }
  }
})

// Extract knowledge, perspectives, and communication styles from a YouTube transcript
app.post('/api/expertise/extract', async (req, res) => {
  const sendError = (status, msg) => {
    if (res.headersSent) return
    try {
      res.status(status).json({ error: msg })
    } catch (e) {
      console.error('Failed to send error response:', e)
    }
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return sendError(500, 'OpenAI API key not configured')
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(401, 'Unauthorized')
    }
    const token = authHeader.slice(7).trim()
    if (!token) {
      return sendError(401, 'Unauthorized')
    }

    const { youtubeUrl } = req.body ?? {}
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      return sendError(400, 'Valid YouTube URL or video ID is required')
    }

    // Fetch transcript (uses @egoist/youtube-transcript-plus for better compatibility)
    let transcriptText
    try {
      const result = await fetchTranscript(videoId)
      const segments = result?.segments ?? []
      transcriptText = segments
        .map((s) => (s?.text || '').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    } catch (err) {
      const msg = err?.message || String(err)
      if (/disabled|unavailable|not available|too many/i.test(msg)) {
        return sendError(400, msg.replace(/\[YoutubeTranscript\]\s*🚨\s*/i, ''))
      }
      throw err
    }

    if (!transcriptText || transcriptText.length < 100) {
      return sendError(400, 'Transcript is empty or too short to analyze')
    }

    // Extract knowledge, perspectives, communication styles via OpenAI
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

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: extractPrompt }],
    })
    const raw = completion.choices?.[0]?.message?.content ?? ''

    let extracted
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch {
      extracted = { knowledge: [], perspectives: [], communicationStyles: [] }
    }

    const knowledge = Array.isArray(extracted.knowledge) ? extracted.knowledge : []
    const perspectives = Array.isArray(extracted.perspectives) ? extracted.perspectives : []
    const communicationStyles = Array.isArray(extracted.communicationStyles)
      ? extracted.communicationStyles
      : []

    res.json({
      transcript: transcriptText.slice(0, 2000),
      transcriptLength: transcriptText.length,
      knowledge,
      perspectives,
      communicationStyles,
    })
  } catch (err) {
    console.error('expertise/extract error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to extract expertise' })
    }
  }
})

ViteExpress.listen(app, PORT, () => {
  console.log(`App running at http://localhost:${PORT}`)
  console.log('(AI context will be logged here when you CREATE content)')
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY not set – create-content will fail')
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('WARNING: Supabase URL/key not set – create-content will fail')
  }
})
