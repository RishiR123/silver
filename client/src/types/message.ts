export interface TextBlock {
  type: 'text'
  content: string
}

export interface ToolBlock {
  type: 'tool'
  id: string
  name: string
  args: Record<string, unknown>
  result?: unknown
  done: boolean
}

export type MessageBlock = TextBlock | ToolBlock

export interface Message {
  id: string
  role: 'user' | 'assistant'
  blocks: MessageBlock[]
  timestamp: Date
}
