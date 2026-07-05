import { useEffect, useState, useCallback } from 'react'
import { X, Clock, Trash2 } from 'lucide-react'

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (url: string) => void
}

interface HistoryItem {
  title: string
  url: string
  visitedAt: number
}

export function HistoryPanel({ isOpen, onClose, onNavigate }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])

  const load = useCallback(() => {
    window.electronAPI?.getHistory().then(setHistory)
  }, [])

  useEffect(() => {
    if (isOpen) load()
  }, [isOpen, load])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="fixed left-0 top-9 bottom-0 z-20 w-72 bg-ox-surface border-r border-ox-border shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-ox-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-ox-text uppercase tracking-wider">
            <Clock size={13} />
            History
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={async () => { await window.electronAPI?.clearHistory(); setHistory([]) }}
              className="p-1 hover:bg-ox-surface-hover rounded-md transition-colors text-ox-text-muted hover:text-ox-text"
              title="Clear history"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-ox-surface-hover rounded-md transition-colors text-ox-text-muted hover:text-ox-text"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {history.length === 0 && (
            <div className="text-xs text-ox-text-muted text-center py-12">No history yet</div>
          )}
          {history.slice(0, 200).map((entry, i) => (
            <button
              key={`${entry.url}-${entry.visitedAt}-${i}`}
              onClick={() => { onNavigate(entry.url); onClose() }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-ox-surface-hover transition-colors"
            >
              <div className="text-xs text-ox-text truncate">{entry.title || entry.url}</div>
              <div className="text-[10px] text-ox-text-muted truncate">
                {entry.url.replace(/^https?:\/\//, '')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
