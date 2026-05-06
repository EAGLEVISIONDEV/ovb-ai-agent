# 🧠 OVB AI Agent — Ana

Real-time AI voice financial consultant powered by Claude. Speaks Romanian, analyses your financial situation, and provides personalized recommendations.

## Features

- 🎤 **Voice conversations** — Web Speech API for speech-to-text and text-to-speech
- 🧠 **Claude AI reasoning** — Anthropic Claude for intelligent financial analysis
- 📋 **Auto lead extraction** — Structured client profiles extracted from conversation
- 🇷🇴 **Romanian language** — Full conversation flow in Romanian
- 🎨 **Ultra-modern UI** — Dark theme, animated orbs, glassmorphism

## Quick Start

```bash
# 1. Install deps
npm install && cd client && npm install && cd ..

# 2. Add your Anthropic API key
cp .env.example .env
# Edit .env → ANTHROPIC_API_KEY=sk-ant-xxxxx

# 3. Start (backend + frontend)
npm run dev
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:3001  

## Architecture

```
ovb-ai-agent/
├── server/                 # Express API
│   ├── index.js            # Entry point
│   ├── routes/ai.js        # AI chat endpoints
│   └── services/claude.js  # Claude integration
├── client/                 # Next.js frontend
│   └── src/
│       ├── app/            # Pages
│       └── components/     # UI components
├── .env.example
└── package.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/session` | Create chat session |
| POST | `/api/ai/chat` | Send message, get response |
| POST | `/api/ai/chat/stream` | SSE streaming response |
| POST | `/api/ai/extract` | Extract lead data from session |
| GET | `/api/ai/session/:id` | Get session info |

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Lucide Icons
- **Backend**: Express 5, Node.js
- **AI**: Anthropic Claude (claude-sonnet-4-20250514)
- **Voice**: Web Speech API (browser-native, free)
