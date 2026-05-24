import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { glob } from 'glob'

const execFileAsync = promisify(execFile)

function workspace(): string {
  return process.env.SILVER_WORKSPACE ?? process.cwd()
}

function resolveSafe(userPath: string): string | null {
  const ws = workspace()
  const resolved = path.resolve(ws, userPath)
  if (!resolved.startsWith(ws)) return null
  return resolved
}

// ── Existing tools ────────────────────────────────────────────────────────────

export const getDateTime = tool(
  async () => ({
    iso: new Date().toISOString(),
    utc: new Date().toUTCString(),
    timestamp: Date.now(),
  }),
  {
    name: 'get_current_datetime',
    description: 'Returns the current date, time, and timezone. Use when the user asks about time or date.',
    schema: z.object({}),
  }
)

export const webSearch = tool(
  async ({ query }: { query: string }) => {
    const apiKey = process.env.SEARCH_API_KEY
    if (!apiKey) {
      return { error: 'Web search not configured. Add SEARCH_API_KEY to server/.env (Serper.dev).' }
    }
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 5 }),
      })
      const json = await res.json() as {
        organic?: Array<{ title: string; snippet: string; link: string }>
      }
      return {
        query,
        results: (json.organic ?? []).map((r) => ({
          title: r.title,
          snippet: r.snippet,
          url: r.link,
        })),
      }
    } catch (err) {
      return { error: String(err) }
    }
  },
  {
    name: 'web_search',
    description: 'Search the web for up-to-date information, news, or facts outside your training data.',
    schema: z.object({
      query: z.string().describe('The search query'),
    }),
  }
)

// ── Desktop tools ─────────────────────────────────────────────────────────────

export const readFile = tool(
  async ({ path: userPath }: { path: string }) => {
    const resolved = resolveSafe(userPath)
    if (!resolved) return { error: 'Path escapes workspace boundary.' }
    try {
      const content = await fs.readFile(resolved, 'utf-8')
      const truncated = content.length > 100_000
      return {
        path: resolved,
        content: truncated ? content.slice(0, 100_000) + '\n[truncated — file exceeds 100k chars]' : content,
        truncated,
      }
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException
      if (e.code === 'ENOENT') return { error: `File not found: ${resolved}` }
      return { error: String(err) }
    }
  },
  {
    name: 'read_file',
    description: 'Read the full text contents of a file. Paths are relative to the workspace root.',
    schema: z.object({
      path: z.string().describe('File path, relative to workspace root or absolute'),
    }),
  }
)

export const writeFile = tool(
  async ({ path: userPath, content }: { path: string; content: string }) => {
    const resolved = resolveSafe(userPath)
    if (!resolved) return { error: 'Path escapes workspace boundary.' }
    try {
      await fs.mkdir(path.dirname(resolved), { recursive: true })
      await fs.writeFile(resolved, content, 'utf-8')
      return { written: resolved, bytes: Buffer.byteLength(content, 'utf-8') }
    } catch (err) {
      return { error: String(err) }
    }
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file with the given content. Creates parent directories if needed.',
    schema: z.object({
      path: z.string().describe('File path relative to workspace root'),
      content: z.string().describe('Text content to write'),
    }),
  }
)

export const listDirectory = tool(
  async ({ path: userPath = '.' }: { path?: string }) => {
    const resolved = resolveSafe(userPath)
    if (!resolved) return { error: 'Path escapes workspace boundary.' }
    try {
      const dirents = await fs.readdir(resolved, { withFileTypes: true })
      const entries = await Promise.all(
        dirents.slice(0, 500).map(async (d) => {
          const entry: { name: string; type: string; size?: number } = {
            name: d.name,
            type: d.isDirectory() ? 'directory' : 'file',
          }
          if (!d.isDirectory()) {
            try {
              const st = await fs.stat(path.join(resolved, d.name))
              entry.size = st.size
            } catch { /* ignore stat errors */ }
          }
          return entry
        })
      )
      return {
        path: resolved,
        entries,
        truncated: dirents.length > 500,
      }
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException
      if (e.code === 'ENOENT') return { error: `Directory not found: ${resolved}` }
      return { error: String(err) }
    }
  },
  {
    name: 'list_directory',
    description: 'List files and directories at a given path. Returns names, types, and file sizes.',
    schema: z.object({
      path: z.string().optional().describe('Directory path relative to workspace root (default: workspace root)'),
    }),
  }
)

export const searchFiles = tool(
  async ({ pattern, cwd = '.' }: { pattern: string; cwd?: string }) => {
    const resolvedCwd = resolveSafe(cwd)
    if (!resolvedCwd) return { error: 'Path escapes workspace boundary.' }
    try {
      const matches = await glob(pattern, { cwd: resolvedCwd, absolute: false })
      const limited = matches.slice(0, 200)
      return {
        pattern,
        cwd: resolvedCwd,
        matches: limited,
        count: limited.length,
        truncated: matches.length > 200,
      }
    } catch (err) {
      return { error: String(err) }
    }
  },
  {
    name: 'search_files',
    description: 'Find files matching a glob pattern within the workspace (e.g. "**/*.ts", "src/**/*.tsx").',
    schema: z.object({
      pattern: z.string().describe('Glob pattern to search for'),
      cwd: z.string().optional().describe('Directory to search from, relative to workspace root (default: root)'),
    }),
  }
)

export const grepSearch = tool(
  async ({ pattern, searchPath = '.', fileGlob = '**/*' }: { pattern: string; searchPath?: string; fileGlob?: string }) => {
    const resolvedPath = resolveSafe(searchPath)
    if (!resolvedPath) return { error: 'Path escapes workspace boundary.' }
    try {
      const files = await glob(fileGlob, { cwd: resolvedPath, absolute: false, nodir: true })
      const matches: Array<{ file: string; lineNumber: number; line: string }> = []
      const re = new RegExp(pattern)

      for (const relFile of files) {
        if (matches.length >= 100) break
        const absFile = path.join(resolvedPath, relFile)
        try {
          const buf = await fs.readFile(absFile)
          // Skip binary files
          if (buf.slice(0, 512).includes(0)) continue
          const lines = buf.toString('utf-8').split('\n')
          for (let i = 0; i < lines.length && matches.length < 100; i++) {
            if (re.test(lines[i])) {
              matches.push({ file: relFile, lineNumber: i + 1, line: lines[i].trim() })
            }
          }
        } catch { /* skip unreadable files */ }
      }

      return { pattern, matches, count: matches.length, truncated: matches.length >= 100 }
    } catch (err) {
      return { error: String(err) }
    }
  },
  {
    name: 'grep_search',
    description: 'Search file contents using a regex pattern. Returns matching lines with file paths and line numbers.',
    schema: z.object({
      pattern: z.string().describe('Regex pattern to search for in file contents'),
      searchPath: z.string().optional().describe('Directory to search in, relative to workspace root (default: root)'),
      fileGlob: z.string().optional().describe('Glob to filter which files to search (default: **/* — all files)'),
    }),
  }
)

const BLOCKED_COMMANDS = ['rm -rf /', 'mkfs', 'dd if=', ':(){:|:&};:']

export const runCommand = tool(
  async ({ command, cwd = '.' }: { command: string; cwd?: string }) => {
    for (const blocked of BLOCKED_COMMANDS) {
      if (command.includes(blocked)) {
        return { error: `Command blocked for safety: contains "${blocked}"` }
      }
    }
    const resolvedCwd = resolveSafe(cwd)
    if (!resolvedCwd) return { error: 'Path escapes workspace boundary.' }
    try {
      const { stdout, stderr } = await execFileAsync(command, [], {
        shell: true,
        cwd: resolvedCwd,
        timeout: 30_000,
        maxBuffer: 512 * 1024,
      })
      return { command, cwd: resolvedCwd, stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 }
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number; killed?: boolean }
      if (e.killed) return { error: 'Command timed out after 30s', stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
      return {
        command,
        cwd: resolvedCwd,
        stdout: e.stdout?.trim() ?? '',
        stderr: e.stderr?.trim() ?? '',
        exitCode: typeof e.code === 'number' ? e.code : 1,
      }
    }
  },
  {
    name: 'run_command',
    description: 'Execute a shell command in the workspace. Times out after 30s. Use for git, npm, file operations, etc.',
    schema: z.object({
      command: z.string().describe('Shell command to execute'),
      cwd: z.string().optional().describe('Working directory relative to workspace root (default: workspace root)'),
    }),
  }
)

// ── Registry ──────────────────────────────────────────────────────────────────

export const agentTools = [
  getDateTime,
  webSearch,
  readFile,
  writeFile,
  listDirectory,
  searchFiles,
  grepSearch,
  runCommand,
]
