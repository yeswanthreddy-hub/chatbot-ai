import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import app from './app.js'

let server
let base

before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://localhost:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test('health endpoint returns ok', async () => {
  const res = await fetch(`${base}/api/health`)
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.status, 'ok')
})

test('chat endpoint rejects an empty messages array', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [] }),
  })
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.ok(data.error)
})

test('chat endpoint rejects invalid message format', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 42 }] }),
  })
  assert.equal(res.status, 400)
})

test('chat endpoint rejects messages with blank content', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: '   ' }] }),
  })
  assert.equal(res.status, 400)
})

test('unknown routes return 404 json', async () => {
  const res = await fetch(`${base}/api/does-not-exist`)
  assert.equal(res.status, 404)
  const data = await res.json()
  assert.equal(data.error, 'Not found')
})