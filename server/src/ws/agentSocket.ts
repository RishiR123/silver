import { randomUUID } from 'node:crypto'
import type { WebSocket } from 'ws'
import { HumanMessage } from '@langchain/core/messages'
import { agent } from '../agent/graph.js'
import type { ClientEvent, ServerEvent } from '../agent/protocol.js'

export function handleAgentSocket(ws: WebSocket): void {
  const threadId = randomUUID()

  const send = (event: ServerEvent) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(event))
  }

  ws.on('message', async (raw) => {
    let event: ClientEvent
    try {
      event = JSON.parse(raw.toString()) as ClientEvent
    } catch {
      send({ type: 'agent:error', message: 'Invalid message format' })
      return
    }

    if (event.type !== 'user:message' || !event.content.trim()) return

    send({ type: 'agent:thinking' })

    try {
      const stream = agent.streamEvents(
        { messages: [new HumanMessage(event.content)] },
        { version: 'v2', configurable: { thread_id: threadId } }
      )

      for await (const ev of stream) {
        switch (ev.event) {
          case 'on_chat_model_stream': {
            const raw = ev.data.chunk?.content
            const text = typeof raw === 'string' ? raw : ''
            if (text) send({ type: 'agent:token', text })
            break
          }
          case 'on_tool_start':
            send({
              type: 'agent:tool_call',
              id: ev.run_id,
              name: ev.name,
              args: (ev.data.input ?? {}) as Record<string, unknown>,
            })
            break
          case 'on_tool_end':
            send({
              type: 'agent:tool_result',
              id: ev.run_id,
              name: ev.name,
              result: ev.data.output,
            })
            break
        }
      }

      send({ type: 'agent:done' })
    } catch (err) {
      console.error('Agent error:', err)
      send({ type: 'agent:error', message: String(err) })
    }
  })
}
