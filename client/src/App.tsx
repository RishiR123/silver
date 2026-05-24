import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { GradientAIChatInput } from './components/ui/gradient-ai-chat-input'
import { MessageList } from './components/ui/MessageList'
import { Sidebar } from './components/layout/Sidebar'
import { BrainPanel } from './components/layout/BrainPanel'
import { useAgent } from './hooks/useAgent'
import { cn } from './lib/utils'

function App() {
  const { messages, isThinking, thinkingLabel, thoughts, currentThought, sendMessage } = useAgent()
  const [brainOpen, setBrainOpen] = useState(false)
  const hasMessages = messages.length > 0

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar brainOpen={brainOpen} onBrainToggle={() => setBrainOpen((o) => !o)} />

      <AnimatePresence>{brainOpen && <BrainPanel />}</AnimatePresence>

      <main
        className={cn('flex-1 flex flex-col h-screen overflow-hidden transition-[padding] duration-300 ease-out', brainOpen ? 'pl-[296px]' : 'pl-[56px]')}
      >
        {hasMessages && (
          <div className="flex-1 overflow-y-auto flex flex-col items-center pt-10 px-8 pb-4">
            <MessageList
              messages={messages}
              thoughts={thoughts}
              currentThought={currentThought}
              isThinking={isThinking}
              thinkingLabel={thinkingLabel}
            />
          </div>
        )}

        <div
          className={cn(
            'flex flex-col items-center gap-3 px-8 pb-8',
            !hasMessages ? 'flex-1 justify-center' : 'pt-3'
          )}
        >
          <div className="w-full max-w-3xl">
            <GradientAIChatInput
              placeholder="Send a message…"
              onSend={sendMessage}
              silverAnimated
              disabled={isThinking}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
