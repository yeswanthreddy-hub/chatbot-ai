import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({ limit: '256kb' }))

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
})

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object' || !msg.role || typeof msg.content !== 'string') {
      return res.status(400).json({ error: 'invalid message format' })
    }
    msg.content = msg.content.trim()
  }

  const hasContent = messages.some((msg) => msg.content.length > 0)
  if (!hasContent) {
    return res.status(400).json({ error: 'messages must have content' })
  }

  const MAX_HISTORY = 12
  const history = messages.slice(-MAX_HISTORY)

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  let aborted = false
  res.on('close', () => {
    aborted = true
  })

  const systemPrompt = {
    role: 'system',
    content:
      'You are a friendly AI assistant. Always respond in a clean, attractive, ' +
      'well-structured format using Markdown. Follow these rules:\n' +
      '- Start key sections with a short heading prefixed with an emoji (e.g. 📌 Title).\n' +
      '- Use short paragraphs and bullet points. Never write text walls.\n' +
      '- Use ✅ for important points, 💡 for examples, ⚡ for key notes.\n' +
      '- Wrap any code in fenced code blocks with syntax highlighting.\n' +
      '- Use simple Markdown tables only when they help (keep them small).\n' +
      '- Use emojis naturally, never overuse them.\n' +
      '- Keep the tone clear, professional, and easy to read.',
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [systemPrompt, ...history],
      stream: true,
    })

    let wroteContent = false
    for await (const chunk of completion) {
      if (aborted || res.writableEnded) break
      const delta = chunk.choices[0]?.delta?.content || ''
      if (delta) {
        wroteContent = true
        res.write(delta)
      }
    }
    if (aborted || res.writableEnded) return
    if (!wroteContent) {
      res.write('⚠️ The model returned an empty response. Please try again.')
    }
    res.end()
  } catch (err) {
    console.error('Groq error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Something went wrong' })
    } else if (!res.writableEnded) {
      res.write(`\n\n> ⚠️ Error: ${err.message || 'Something went wrong'}`)
      res.end()
    }
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

export default app
