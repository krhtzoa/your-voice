import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'

const app = express()
app.use(express.json())

const PORT = process.env.API_PORT || 3001

app.post('/api/create-content', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  const { prompt, duration, platform } = req.body ?? {}
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  const openai = new OpenAI({ apiKey })
  const platformLabel = platform || 'general content'
  const durationLabel = duration ? `${duration} seconds` : 'variable length'
  const systemContent = `You are a content creator assistant. The user wants to create ${platformLabel} content, approximately ${durationLabel} in length. Write in their voice—warm, authentic, and engaging.`

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
