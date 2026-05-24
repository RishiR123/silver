export type ClientEvent =
  | { type: 'user:message'; content: string }

export type ServerEvent =
  | { type: 'agent:thinking' }
  | { type: 'agent:thought'; text: string }
  | { type: 'agent:token'; text: string }
  | { type: 'agent:tool_call'; id: string; name: string; args: Record<string, unknown> }
  | { type: 'agent:tool_result'; id: string; name: string; result: unknown }
  | { type: 'agent:done' }
  | { type: 'agent:error'; message: string }
