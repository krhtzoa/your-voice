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

app.post('/api/create-content', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = authHeader.slice(7).trim()
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  const { prompt, duration, platform } = req.body ?? {}
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
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

  const openai = new OpenAI({ apiKey })
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt.trim() },
      ],
    })
    const text = completion.choices?.[0]?.message?.content ?? ''
    res.json({ content: text })
  } catch (err) {
    console.error('OpenAI error:', err)
    res.status(500).json({ error: err.message || 'Failed to generate content' })
  }
})

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
