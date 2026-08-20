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
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run oxlint

## Tech stack

- React 19 + Vite 8
- Express 5 + OpenAI SDK (Groq-compatible endpoint)
- react-markdown + rehype-highlight