import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { FileTree } from '@/components/ui/file-tree'
import type { FileNode } from '@/components/ui/file-tree'

const SERVER = 'http://localhost:3001'

export function BrainPanel() {
  const [tree, setTree] = useState<FileNode[]>([])
  const [root, setRoot] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`${SERVER}/api/filetree`)
      const data = await res.json() as { root: string; tree: FileNode[] }
      setRoot(data.root)
      setTree(data.tree)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 240, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 38 }}
      className="fixed left-14 top-0 bottom-0 z-40 flex flex-col bg-surface-raised border-r border-line-subtle overflow-hidden"
      style={{ width: 240 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-line-subtle flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-widest text-ink-5 uppercase">Brain</span>
          {root && (
            <span className="text-[10px] text-ink-7 font-mono truncate max-w-[120px]" title={root}>
              {root}
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-ink-7 hover:text-ink-4 transition-colors duration-150 disabled:opacity-30"
          title="Refresh"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1">
        {loading && (
          <div className="flex flex-col gap-1.5 px-2 pt-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-[18px] rounded bg-surface-overlay animate-pulse"
                style={{ width: `${55 + (i * 17) % 35}%`, marginLeft: `${(i % 3) * 8}px` }}
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <p className="text-[11px] text-ink-6 px-3 pt-4 text-center leading-relaxed">
            Could not load workspace.<br />Is the server running?
          </p>
        )}

        {!loading && !error && tree.length === 0 && (
          <p className="text-[11px] text-ink-6 px-3 pt-4 text-center">
            Workspace is empty.
          </p>
        )}

        {!loading && !error && tree.length > 0 && (
          <FileTree data={tree} />
        )}
      </div>
    </motion.aside>
  )
}
