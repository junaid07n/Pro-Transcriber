# Pro-Transcriber
You can Transcribe all youtube vedios including invidual links and as well as complte playlist
# YouTube Transcriber — Complete Source Code

## Project Structure

yt-transcriber-export/
├── README.md                     ← This file
│
├── openapi.yaml                  ← API specification (OpenAPI 3.0)
│
├── frontend-src/                 ← React + Vite frontend (TypeScript)
│   ├── App.tsx                   ← Root app with routing
│   ├── main.tsx                  ← React entry point
│   ├── index.css                 ← Global styles (Tailwind)
│   ├── pages/
│   │   ├── Home.tsx              ← Single video transcription page
│   │   ├── Playlist.tsx          ← Playlist transcription page
│   │   ├── History.tsx           ← History of past transcriptions
│   │   └── not-found.tsx         ← 404 page
│   ├── components/
│   │   ├── Layout.tsx            ← Shared header + navigation layout
│   │   ├── TranscriptViewer.tsx  ← Transcript display (TXT/SRT/Segments tabs)
│   │   └── ui/                   ← shadcn/ui component library
│   ├── hooks/
│   │   ├── useHistory.ts         ← localStorage history management
│   │   ├── use-toast.ts          ← Toast notification hook
│   │   └── use-mobile.tsx        ← Mobile breakpoint hook
│   └── lib/
│       └── utils.ts              ← Utility functions (download, formatDuration...)
│
├── frontend-package.json         ← Frontend dependencies
├── frontend-vite.config.ts       ← Vite configuration
├── frontend-tsconfig.json        ← Frontend TypeScript config
├── frontend-index.html           ← HTML shell
├── frontend-components.json      ← shadcn/ui config
│
├── backend-src/                  ← Express 5 API server (TypeScript)
│   ├── index.ts                  ← Server entry point
│   ├── app.ts                    ← Express app setup
│   ├── lib/
│   │   ├── youtube.ts            ← YouTube InnerTube API transcript fetcher
│   │   └── logger.ts             ← Pino logger setup
│   └── routes/
│       ├── index.ts              ← Route registration
│       ├── transcribe.ts         ← /transcribe/video, /transcribe/playlist, /playlist/info
│       └── health.ts             ← Health check endpoint
│
├── backend-package.json          ← Backend dependencies
├── backend-tsconfig.json         ← Backend TypeScript config
└── backend-build.mjs             ← esbuild bundler script

## Key Features
- Single video transcript extraction via YouTube InnerTube API (no API key needed)
- Playlist batch transcription
- Multi-language caption support (manual + auto-generated)
- Export formats: TXT, SRT, JSON
- History saved to localStorage (persists across sessions)
- Retry on failure, error states, loading states

## Tech Stack
- Frontend: React 18, Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui, wouter, TanStack Query
- Backend: Node.js, Express 5, TypeScript, esbuild, Pino logger

## Running Locally
1. Install: `pnpm install`
2. Start backend: `cd backend && pnpm dev` (runs on port 8080)
3. Start frontend: `cd frontend && PORT=5000 BASE_PATH=/ pnpm dev`
4. Open: http://localhost:5000

