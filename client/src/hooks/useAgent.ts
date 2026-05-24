import { useState, useCallback, useRef, useEffect } from 'react'
import { useAgentSocket } from './useAgentSocket'
import type { ServerEvent } from '../types/protocol'
import type { Message, MessageBlock, ToolBlock } from '../types/message'

function uid() {
  return crypto.randomUUID()
}

const THINKING_PHRASES = [
  'Cooking',
  'Thinking hard',
  'On it',
  'Pondering',
  'Brewing',
  'Working on it',
]

export function useAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingLabel, setThinkingLabel] = useState(THINKING_PHRASES[0])
  const [thoughts, setThoughts] = useState<string>('')
  const [currentThought, setCurrentThought] = useState<string>('')

  const assistantIdRef = useRef<string | null>(null)
  const phraseIndexRef = useRef(0)

  useEffect(() => {
    if (!isThinking) return
    phraseIndexRef.current = 0
    setThinkingLabel(THINKING_PHRASES[0])
    const interval = setInterval(() => {
      phraseIndexRef.current = (phraseIndexRef.current + 1) % THINKING_PHRASES.length
      setThinkingLabel(THINKING_PHRASES[phraseIndexRef.current])
    }, 2500)
    return () => clearInterval(interval)
  }, [isThinking])

  const updateBlocks = useCallback((updater: (blocks: MessageBlock[]) => MessageBlock[]) => {
    const id = assistantIdRef.current
    if (!id) return
    setMessages((prev) =>
      prev.map((m) => m.id === id ? { ...m, blocks: updater(m.blocks) } : m)
    )
  }, [])

  const handleEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {

      case 'agent:thinking':
        setIsThinking(true)
        setThoughts('')
        setCurrentThought('')
        break

      case 'agent:thought':
        setCurrentThought(event.text)
        setThoughts((prev) => prev + event.text + '\n')
        break

      case 'agent:token':
        setIsThinking(false)
        updateBlocks((blocks) => {
          const last = blocks[blocks.length - 1]
          if (last && last.type === 'text') {
            return [...blocks.slice(0, -1), { ...last, content: last.content + event.text }]
          }
          return [...blocks, { type: 'text', content: event.text }]
        })
        break

      case 'agent:tool_call': {
        setIsThinking(false)
        const toolBlock: ToolBlock = {
          type: 'tool',
          id: event.id,
          name: event.name,
          args: event.args,
          done: false,
        }
        updateBlocks((blocks) => [...blocks, toolBlock])
        break
      }

      case 'agent:tool_result':
        updateBlocks((blocks) =>
          blocks.map((b) =>
            b.type === 'tool' && b.id === event.id
              ? { ...b, result: event.result, done: true }
              : b
          )
        )
        break

      case 'agent:done':
        setIsThinking(false)
        assistantIdRef.current = null
        break

      case 'agent:error': {
        setIsThinking(false)
        const errorId = assistantIdRef.current
        assistantIdRef.current = null
        if (errorId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === errorId
                ? { ...m, blocks: [{ type: 'text', content: `Error: ${event.message}` }] }
                : m
            )
          )
        }
        break
      }
    }
  }, [updateBlocks])

  const { send } = useAgentSocket(handleEvent)

  const sendMessage = useCallback(
    (content: string) => {
      if (isThinking || !content.trim()) return

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        blocks: [{ type: 'text', content }],
        timestamp: new Date(),
      }
      const asstId = uid()
      const asstMsg: Message = { id: asstId, role: 'assistant', blocks: [], timestamp: new Date() }

      assistantIdRef.current = asstId
      setMessages((prev) => [...prev, userMsg, asstMsg])
      setThoughts('')

      send({ type: 'user:message', content })
    },
    [isThinking, send]
  )

  return { messages, isThinking, thinkingLabel, thoughts, currentThought, sendMessage }
}
