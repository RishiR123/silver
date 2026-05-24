import { useEffect, useRef, useCallback } from 'react'
import type { ClientEvent, ServerEvent } from '../types/protocol'

const WS_URL = 'ws://localhost:3001/ws/agent'

export function useAgentSocket(onEvent: (event: ServerEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as ServerEvent
        onEventRef.current(event)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => {
      onEventRef.current({ type: 'agent:error', message: 'Cannot connect to server.' })
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [])

  const send = useCallback((event: ClientEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event))
    }
  }, [])

  return { send }
}
