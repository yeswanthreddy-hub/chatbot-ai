import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import bash from 'highlight.js/lib/languages/bash'
import java from 'highlight.js/lib/languages/java'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import SpaceBackground from './components/SpaceBackground.jsx'
import './App.css'

const languages = {
  js,
  javascript: js,
  ts,
  typescript: ts,
  python,
  json,
  xml,
  html: xml,
  css,
  bash,
  shell: bash,
  java,
  c,
  cpp,
  csharp,
  'c-sharp': csharp,
  go,
  rust,
  sql,
  yaml,
  markdown,
}

const SUGGESTIONS = [
  'Explain what is quantum computing',
  'Write a Python script to sort a list',
  'Help me plan a study schedule',
  'Tell me a fun fact about space',
]

const STORAGE_KEY = 'yash-chat-messages'

function makeTitle(text) {
  const line = text
    .split('\n')
    .map((l) => l.replace(/^#{1,6}\s*/, '').replace(/[*_`~]/g, ''))
    .map((l) => l.trim())
    .find(Boolean)
  const title = line || text
  return title.length > 34 ? `${title.slice(0, 34)}…` : title
}

function extractText(node) {
  if (node == null || typeof node === 'string') return node || ''
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node.props?.dangerouslySetInnerHTML?.__html) {
    return node.props.dangerouslySetInnerHTML.__html.replace(/<[^>]*>/g, '')
  }
  if (node.props?.children != null) return extractText(node.props.children)
  return ''
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false)
  const className = children?.props?.className || ''
  const langMatch = /language-([\w-]+)/.exec(className)
  const language = langMatch ? langMatch[1] : ''
  const code = extractText(children)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="code-block">
      <div className="code-head">
        <span className="code-lang">{language || 'text'}</span>
        <button type="button" className="code-copy" onClick={copy}>
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      /* ignore invalid stored data */
    }
    return []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      /* storage unavailable (e.g. private mode), keep chat in memory only */
    }
  }, [messages])

  const history = []
  messages.forEach((msg, i) => {
    if (msg.role === 'user') history.push({ idx: i, title: makeTitle(msg.content) })
  })

  function scrollToMessage(idx) {
    document.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  async function submit(text) {
    const t = text.trim()
    if (!t || loading) return

    const nextMessages = [...messages, { role: 'user', content: t }]
    const controller = new AbortController()
    abortRef.current = controller
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)
    setError('')

    let reply = ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Request failed')
      }
      if (!res.body) {
        throw new Error('Empty response body')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: reply }
          return next
        })
      }
      reply += decoder.decode()
      if (reply) {
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: reply }
          return next
        })
      } else {
        dropLastEmptyAssistant()
        setError('The model returned an empty response. Please try again.')
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!reply) dropLastEmptyAssistant()
      } else {
        dropLastEmptyAssistant()
        setError(err.message)
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  function dropLastEmptyAssistant() {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && !last.content) return prev.slice(0, -1)
      return prev
    })
  }

  async function sendMessage(e) {
    e.preventDefault()
    submit(input)
  }

  return (
    <div className="app">
      <SpaceBackground />
      <div className="chat">
        <header className="chat-header">
          <h1>
            <span className="title-accent">Y</span>a<span className="title-accent">S</span>h
          </h1>
        </header>

        <main className="chat-messages">
          {messages.length === 0 ? (
            <div className="intro">
              <div className="intro-badge">🛸</div>
              <h2>
                I&apos;m <span className="intro-accent">YaSh</span> AI Assistant
              </h2>
              <p>Ask me anything — code, ideas, explanations, and more.</p>
              <div className="intro-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => submit(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} data-idx={i} className={`message ${msg.role}`}>
                <div className="bubble">
                  {msg.role === 'assistant' ? (
                    loading && i === messages.length - 1 && !msg.content ? (
                      <div className="typing-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[[rehypeHighlight, { languages }]]}
                        components={{ pre: CodeBlock }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          {error && <div className="error">{error}</div>}
          <div ref={endRef} />
        </main>

        <form className="chat-input" onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything to YaSh..."
            autoFocus
          />
          {loading ? (
            <button type="button" className="chat-stop" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()}>
              Send
            </button>
          )}
        </form>
      </div>

      <aside className="history">
        <div className="history-header">
          <h2 className="history-title">History</h2>
          <span className="history-count">{history.length}</span>
        </div>
        {history.length === 0 ? (
          <p className="history-empty">No questions yet</p>
        ) : (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.idx}>
                <button type="button" onClick={() => scrollToMessage(item.idx)}>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

export default App