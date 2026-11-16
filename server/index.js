import app from './app.js'

const port = process.env.PORT || 3001

const server = app.listen(port, () => {
  console.log(`Chatbot API running on http://localhost:${port}`)
})

function shutdown() {
  console.log('Shutting down gracefully...')
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
