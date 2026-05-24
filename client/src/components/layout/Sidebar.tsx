import { SquarePen, Search, MessageSquare, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'

interface SidebarProps {
  brainOpen: boolean
  onBrainToggle: () => void
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
        active
          ? 'text-ink-1 bg-ui-active'
          : 'text-ink-5 hover:text-ink-2 hover:bg-ui-hover'
      )}
    >
      {icon}
    </button>
  )
}

export function Sidebar({ brainOpen, onBrainToggle }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-14 flex flex-col items-center py-3 gap-1 bg-surface border-r border-line-subtle z-50">
      {/* App logo */}
      <div className="w-9 h-9 flex items-center justify-center mb-3 flex-shrink-0">
        <img src={logo} alt="Silver" className="w-full h-full object-contain" />
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
        <NavButton icon={<SquarePen size={17} />} label="New chat" />
        <NavButton icon={<Search size={17} />} label="Search chats" />
        <NavButton icon={<MessageSquare size={17} />} label="Chats" active />
        <div className="my-1 w-6 border-t border-line-subtle" />
        <NavButton
          icon={<Brain size={17} />}
          label="Brain"
          active={brainOpen}
          onClick={onBrainToggle}
        />
      </nav>

      {/* User avatar */}
      <div
        className="w-8 h-8 rounded-full bg-line-strong flex items-center justify-center flex-shrink-0"
        title="Profile"
      >
        <span className="text-[11px] font-semibold text-ink-1 tracking-wide select-none">RI</span>
      </div>
    </aside>
  )
}
