// Polyfill Web Crypto for LangChain compatibility in Node 18
import { webcrypto } from 'node:crypto'
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).crypto = webcrypto
}

import 'dotenv/config'
import { createServer } from 'http'
import { readdir } from 'node:fs/promises'
import nodePath from 'node:path'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { handleAgentSocket } from './ws/agentSocket.js'

interface FileNode {
  name: string
  type: 'file' | 'folder'
  extension?: string
  children?: FileNode[]
}

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', '__pycache__', '.cache', '.venv', 'venv', 'coverage'])

async function buildTree(dir: string, depth = 0): Promise<FileNode[]> {
  if (depth > 4) return []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const nodes: FileNode[] = []
    for (const entry of entries.slice(0, 300)) {
      if (entry.name.startsWith('.')) continue
      if (SKIP.has(entry.name)) continue
      if (entry.isDirectory()) {
        const children = await buildTree(nodePath.join(dir, entry.name), depth + 1)
        nodes.push({ name: entry.name, type: 'folder', children })
      } else if (entry.isFile()) {
        const ext = nodePath.extname(entry.name).slice(1) || undefined
        nodes.push({ name: entry.name, type: 'file', extension: ext })
      }
    }
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  } catch {
    return []
  }
}

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (Electron file:// renderer sends null or no Origin header)
    if (!origin || origin === 'null') return cb(null, true)
    // Allow any localhost port (Vite dev server, any port)
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/filetree', async (_req, res) => {
  const workspace = process.env.SILVER_WORKSPACE ?? process.cwd()
  const tree = await buildTree(workspace)
  res.json({ root: nodePath.basename(workspace), tree })
})

const httpServer = createServer(app)

const wss = new WebSocketServer({ server: httpServer, path: '/ws/agent' })
wss.on('connection', handleAgentSocket)

httpServer.listen(PORT, () => {
  console.log(`Server  →  http://localhost:${PORT}`)
  console.log(`Agent WS →  ws://localhost:${PORT}/ws/agent`)
})
