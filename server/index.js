import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildSystemPrompt } from './lib/profileContextBuilder.js'

const app = express()
app.use(express.json())

const PORT = process.env.API_PORT || 3001

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
      model: 'gpt-4o-mini',
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

    // Insert each rule into voice_rules
    let rulesAdded = 0
    for (const content of rules) {
      const { error: ruleError } = await supabaseWithAuth
        .from('voice_rules')
        .insert({
          user_id: user.id,
          content,
          rule_type: 'general',
          source: 'feedback',
        })
      if (!ruleError) rulesAdded++
    }

    res.json({ rulesAdded })
  } catch (err) {
    console.error('feedback error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to generate content' })
    }
  }
})

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
  console.log('(AI context will be logged here when you CREATE content)')
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY not set – create-content will fail')
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('WARNING: Supabase URL/key not set – create-content will fail')
  }
})
