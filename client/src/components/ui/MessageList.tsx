import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCircle2, CircleDotDashed, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingBreadcrumb } from '@/components/ui/animated-loading-svg-text-shimmer'
import type { Message, MessageBlock, TextBlock, ToolBlock } from '@/types/message'

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-ink-1 mt-5 mb-3 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-ink-1 mt-4 mb-2 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-ink-2 mt-3 mb-1.5 first:mt-0">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 space-y-1 pl-5 list-disc marker:text-ink-5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 space-y-1 pl-5 list-decimal marker:text-ink-5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-ink-1">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-ink-3">{children}</em>
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = Boolean(className)
          if (isBlock) {
            return (
              <code
                className="block font-mono text-[0.82rem] text-ink-2 leading-relaxed"
                {...props}
              >
                {children}
              </code>
            )
          }
          return (
            <code
              className="px-1.5 py-0.5 rounded-md bg-surface-overlay text-ink-2 font-mono text-[0.82em] border border-line-strong"
              {...props}
            >
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="mb-3 rounded-xl bg-surface-card border border-line p-4 overflow-x-auto">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-3 pl-4 border-l-2 border-line-strong text-ink-4 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-4 border-line" />,
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-surface-card border-b border-line">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-line">{children}</tbody>
        ),
        tr: ({ children }) => <tr className="hover:bg-surface-card">{children}</tr>,
        th: ({ children }) => (
          <th className="px-4 py-2.5 text-left text-xs font-semibold text-ink-4 uppercase tracking-wide">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2.5 text-ink-3">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ── Tool detail extraction ────────────────────────────────────────────────────
function toolDetail(name: string, args: Record<string, unknown>): string {
  const s = (v: unknown) => String(v ?? '').trim()
  switch (name) {
    case 'run_command':    return s(args.command)
    case 'read_file':      return s(args.path)
    case 'write_file':     return s(args.path)
    case 'list_directory': return s(args.path || '.')
    case 'search_files':   return s(args.pattern)
    case 'grep_search':    return s(args.pattern)
    case 'web_search':     return s(args.query)
    default:               return ''
  }
}

// ── Tool group (consecutive tool blocks collapsed into one widget) ─────────────
function ToolGroup({ blocks }: { blocks: ToolBlock[] }) {
  const [open, setOpen] = useState(false)
  const allDone = blocks.every((b) => b.done)
  const running = blocks.find((b) => !b.done)

  return (
    <div className="my-2">
      {allDone ? (
        // Sealed: click to expand/collapse
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[11px] text-ink-5 hover:text-ink-3 transition-colors duration-150 group"
        >
          <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-500/70" />
          <span>
            {blocks.length} tool call{blocks.length > 1 ? 's' : ''}
          </span>
          <ChevronRight
            size={10}
            className={cn('transition-transform duration-150 text-ink-7 group-hover:text-ink-5', open && 'rotate-90')}
          />
        </button>
      ) : (
        // Live: show the running tool
        <div className="flex items-center gap-1.5 text-[11px] text-ink-4">
          <CircleDotDashed className="h-3 w-3 flex-shrink-0 text-blue-400 animate-pulse" />
          <span className="font-mono">{running!.name.replace(/_/g, ' ')}</span>
          {(() => {
            const detail = toolDetail(running!.name, running!.args)
            return detail ? (
              <span className="text-ink-7 truncate max-w-[36ch]">{detail}</span>
            ) : null
          })()}
        </div>
      )}

      {/* Expanded detail rows */}
      {open && (
        <div className="mt-1.5 pl-1 space-y-px border-l border-line ml-1.5">
          {blocks.map((b) => {
            const detail = toolDetail(b.name, b.args)
            return (
              <div
                key={b.id}
                className="flex items-center gap-2 py-0.5 pl-2 text-[11px] font-mono"
              >
                <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-500/60" />
                <span className="text-ink-5">{b.name.replace(/_/g, ' ')}</span>
                {detail && (
                  <span className="text-ink-7 truncate max-w-[40ch]">{detail}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Thought block ─────────────────────────────────────────────────────────────
function ThoughtBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-ink-6 hover:text-ink-4 transition-colors"
      >
        <ChevronRight
          size={12}
          className={cn('transition-transform duration-200 flex-shrink-0', open && 'rotate-90')}
        />
        <span className="font-medium">Thought</span>
      </button>
      {open && (
        <div className="mt-2 text-ink-5 text-xs leading-relaxed whitespace-pre-wrap pl-4">
          {text}
        </div>
      )}
    </div>
  )
}

// ── Live thought line ─────────────────────────────────────────────────────────
function LiveThoughts({ line }: { line: string }) {
  const [displayed, setDisplayed] = useState(line)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!line || line === displayed) return
    setVisible(false)
    const t = setTimeout(() => {
      setDisplayed(line)
      setVisible(true)
    }, 180)
    return () => clearTimeout(t)
  }, [line]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!displayed) return null
  return (
    <p
      className="mt-1.5 text-xs text-ink-5 leading-relaxed truncate transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {displayed}
    </p>
  )
}

// ── Block grouping ────────────────────────────────────────────────────────────
type Group =
  | { type: 'text'; content: string }
  | { type: 'tools'; blocks: ToolBlock[] }

function groupBlocks(blocks: MessageBlock[]): Group[] {
  const groups: Group[] = []
  for (const block of blocks) {
    const last = groups[groups.length - 1]
    if (block.type === 'text') {
      if (last?.type === 'text') {
        last.content += block.content
      } else {
        groups.push({ type: 'text', content: block.content })
      }
    } else {
      if (last?.type === 'tools') {
        last.blocks.push(block)
      } else {
        groups.push({ type: 'tools', blocks: [block] })
      }
    }
  }
  return groups
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function userText(m: Message): string {
  const first = m.blocks[0]
  return first?.type === 'text' ? first.content : ''
}

// ── Message list ──────────────────────────────────────────────────────────────
interface MessageListProps {
  messages: Message[]
  thoughts: string
  currentThought: string
  isThinking: boolean
  thinkingLabel: string
}

export function MessageList({
  messages,
  thoughts,
  currentThought,
  isThinking,
  thinkingLabel,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thoughts, isThinking])

  return (
    <div className="w-full max-w-3xl flex flex-col gap-8">
      {messages.map((m, i) => {
        const isLast = i === messages.length - 1
        const isAssistant = m.role === 'assistant'
        const hasBlocks = m.blocks.length > 0
        const showExtras = isAssistant && isLast
        const showThinking = showExtras && isThinking && !hasBlocks
        const showSealedThought = showExtras && !!thoughts && hasBlocks
        const groups = groupBlocks(m.blocks)

        return (
          <div key={m.id} className={cn('flex flex-col', isAssistant ? 'items-start' : 'items-end')}>
            {isAssistant ? (
              <div className="w-full flex flex-col text-sm text-ink-2">
                {showSealedThought && <ThoughtBlock text={thoughts} />}

                {showThinking ? (
                  <div>
                    <LoadingBreadcrumb text={thinkingLabel} />
                    <LiveThoughts line={currentThought} />
                  </div>
                ) : hasBlocks ? (
                  groups.map((g, gi) =>
                    g.type === 'text' ? (
                      <MarkdownContent key={gi} content={g.content} />
                    ) : (
                      <ToolGroup key={gi} blocks={g.blocks} />
                    )
                  )
                ) : (
                  <span className="text-ink-6 animate-pulse">▍</span>
                )}
              </div>
            ) : (
              <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words bg-surface-overlay text-ink-1">
                {userText(m)}
              </div>
            )}
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}
