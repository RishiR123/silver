// WebSocket message contract — client ↔ server

export type ClientEvent =
  | { type: 'user:message'; content: string }

export type ServerEvent =
  | { type: 'agent:thinking' }                                      // agent started, awaiting first token
  | { type: 'agent:thought'; text: string }                         // Gemini thinking token
  | { type: 'agent:token'; text: string }                           // visible response token
  | { type: 'agent:tool_call'; id: string; name: string; args: Record<string, unknown> }
  | { type: 'agent:tool_result'; id: string; name: string; result: unknown }
  | { type: 'agent:done' }
  | { type: 'agent:error'; message: string }
