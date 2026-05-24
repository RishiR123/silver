# Silver

A personal AI assistant that lives on your desktop — built for one user, fully owned by you. No SaaS, no accounts, no data leaving your machine except to the AI provider you choose.

Silver streams thoughts and responses in real time, supports tool use, and can be extended however you like. It is intentionally opinionated in design and intentionally minimal in dependencies.

---

## What it is

Silver is a local-first AI chat interface. You run it on your own machine, point it at a Gemini API key, and have a private AI assistant with no intermediary. The architecture is simple by design — a React frontend, a Node server, and a WebSocket between them.

**Current capabilities**
- Real-time streaming responses with live "thinking" tokens (Gemini 2.5 Flash / Pro with extended thinking)
- Thought chain visible as it happens, collapsible after completion
- Tool call + result display in the UI
- File tree view of your workspace
- Electron desktop app or browser-based dev mode

**Planned / in progress**
- Tool execution (web search, file read/write, shell) via the built-in tool registry
- Persistent conversation history
- Multiple providers (OpenAI, Claude, Ollama)
- Voice input/output
- Calendar, email, and local file integrations

---

## Architecture

```
silver/
├── client/          # React + Vite + TailwindCSS frontend
│   ├── src/
│   │   ├── components/   # UI components (layout, chat, input)
│   │   ├── hooks/        # useAgent, useAgentSocket
│   │   ├── types/        # Shared TypeScript types
│   │   └── lib/          # Utilities
│   └── electron/         # Electron main + preload (desktop mode)
├── server/          # Express + WebSocket backend
│   └── src/
│       ├── agent/        # Protocol types, LangGraph graph, tool registry
│       ├── ws/           # WebSocket handler (agentSocket.ts)
│       ├── routes/       # REST routes (health, file tree)
│       └── services/     # AI provider wrappers
└── electron-main/   # Legacy electron entry (see client/electron/)
```

**Communication protocol** — a single persistent WebSocket at `ws://localhost:3001/ws/agent`. All chat goes through it. The event types are defined in `server/src/agent/protocol.ts`.

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `user:message` | `{ content: string }` |
| Server → Client | `agent:thinking` | (typing indicator) |
| Server → Client | `agent:thought` | `{ text: string }` |
| Server → Client | `agent:token` | `{ text: string }` |
| Server → Client | `agent:tool_call` | `{ name, input }` |
| Server → Client | `agent:tool_result` | `{ name, output }` |
| Server → Client | `agent:done` | — |
| Server → Client | `agent:error` | `{ message: string }` |

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)

### Setup

```bash
git clone https://github.com/RishiR123/silver.git
cd silver

# Install all dependencies
npm run install:all

# Configure the server
cp server/.env.example server/.env
# Edit server/.env and paste your GEMINI_API_KEY
```

### Run in dev mode (browser)

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

### Run as desktop app (Electron)

```bash
npm run electron:dev
```

---

## Configuration

All server config lives in `server/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | *(required)* | Your Google AI API key |
| `GEMINI_MODEL_ID` | `gemini-2.5-flash-preview` | Model to use |
| `PORT` | `3001` | Server port |
| `SILVER_WORKSPACE` | `$HOME` | Root directory shown in the file tree |

---

## Extending Silver

### Adding a tool

Tools live in `server/src/agent/tools/`. The registry is in `server/src/agent/registry.ts`. Add a new file, register it, and wire it into the active socket handler in `server/src/ws/agentSocket.ts`.

### Adding a provider

The AI call is in `server/src/ws/agentSocket.ts`. Swap the `@google/genai` call for any other SDK — the WebSocket protocol is provider-agnostic.

### Adding a UI component

Client components follow the pattern in `client/src/components/`. Design tokens are CSS variables in `client/src/index.css`, extended in `client/tailwind.config.js`.

---

## Design principles

- **Black background, zinc palette** — readable, distraction-free
- **Streaming first** — nothing waits for a complete response
- **No abstractions until needed** — the tool registry exists but isn't forced on the model until it's useful
- **Local first** — no analytics, no telemetry, no remote config

---

## Contributing

Silver is a personal project, but contributions are welcome if they stay true to the philosophy above.

- Keep the WebSocket protocol typed (`protocol.ts`)
- Don't add third-party services that require accounts
- New tools should degrade gracefully when their dependencies aren't present
- Match the existing dark design language

Open an issue before a large PR.

---

## License

MIT — do whatever you want with it.
