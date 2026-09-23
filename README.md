# YaSh AI Chatbot

A space-themed AI chatbot with a ChatGPT-style interface, powered by the Groq API.

## Features

- Space-themed animated background (stars, planets, meteors, spaceships)
- Markdown rendering with syntax highlighting
- Copyable code blocks
- Streaming responses with a stop button
- Chat history persisted in localStorage
- Skyblue history panel to jump back to previous questions

## Getting started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file from the example and set your Groq API key:

   ```sh
   cp .env.example .env
   # then edit .env:
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   ```

3. Run the dev server:

   ```sh
   npm run dev
   ```

4. Open http://localhost:5230

## Scripts

- `npm run dev` — start the client (Vite on :5230) and the API server (Express on :3001)
- `npm run dev:client` — Vite only
- `npm run dev:server` — Express API only
- `npm run start` — run the Express API server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run test` — run the API tests (Node's built-in test runner)
- `npm run lint` — run oxlint

## API

The Express server exposes a small REST API:

- `POST /api/chat` — send `{ "messages": [{ "role", "content" }, ...] }` and
  receive a streamed Markdown reply. The server validates the payload, trims
  message content, and only sends the most recent 12 messages to the model.
- `GET /api/health` — returns `{ "status": "ok" }` when the server is running.

## Tech stack

- React 19 + Vite 8
- Express 5 + OpenAI SDK (Groq-compatible endpoint)
- react-markdown + rehype-highlight

## Deploying to Vercel

The project is set up for Vercel: Vite builds the frontend to `dist/` and the Express
app is served as a serverless function from `api/chat.js` (Vercel routes `/api/chat`
to it automatically — no `vercel.json` needed).

1. Push this repo to GitHub.
2. Import the repo at https://vercel.com/new (framework auto-detected as **Vite**).
3. Add the environment variables from `.env` under **Settings → Environment Variables**:
   - `GROQ_API_KEY` (required)
   - `GROQ_MODEL` (optional, default `openai/gpt-oss-120b`)
4. Deploy. Vercel runs `npm run build` automatically and serves the API at `/api/chat`.

To test a production build locally before deploying:

```sh
npm run build
npm run preview   # serves dist on :4173 and proxies /api to the local server
```

## Project structure

- `server/app.js` — the Express app (exported, used by both local and serverless entrypoints)
- `server/index.js` — local dev entrypoint (`app.listen`)
- `api/chat.js` — Vercel serverless function entrypoint