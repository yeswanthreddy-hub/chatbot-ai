import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

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
      messages: [systemPrompt, ...messages],
    })

    res.json({ reply: completion.choices[0].message.content })
  } catch (err) {
    console.error('Groq error:', err)
    res.status(500).json({
      error: err.message || 'Something went wrong',
    })
  }
})

app.listen(port, () => {
  console.log(`Chatbot API running on http://localhost:${port}`)
})