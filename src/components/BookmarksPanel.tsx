import { useEffect, useState, useRef } from 'react'
import { Star, Trash2, Search, Bookmark } from 'lucide-react'

interface BookmarksPanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (url: string) => void
}

export function BookmarksPanel({ isOpen, onClose, onNavigate }: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      window.electronAPI?.getBookmarks().then(setBookmarks)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    const cleanup = window.electronAPI?.onBookmarksChanged(() => {
      window.electronAPI?.getBookmarks().then(setBookmarks)
    })
    return () => cleanup?.()
  }, [isOpen])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await window.electronAPI?.removeBookmark(id)
  }

  const filtered = bookmarks.filter((b) =>
    !search ||
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.url.toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <div className="absolute left-0 top-full mt-1 z-20 w-80 bg-ox-surface border border-ox-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-ox-border">
          <Bookmark size={13} className="text-ox-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks..."
            className="flex-1 bg-transparent text-sm text-ox-text outline-none placeholder-ox-text-muted select-text"
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
          />
          <span className="text-[10px] text-ox-text-muted tabular-nums flex-shrink-0">
            {bookmarks.length}
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="text-xs text-ox-text-muted text-center py-6">
              {bookmarks.length === 0 ? 'No bookmarks yet' : 'No matches'}
            </div>
          )}
          {filtered.map((bm) => (
            <button
              key={bm.id}
              onClick={() => { onNavigate(bm.url); onClose() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ox-surface-hover transition-colors text-left"
            >
              <Star size={12} className="text-amber-400 flex-shrink-0" fill="currentColor" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-ox-text truncate">{bm.title}</div>
                <div className="text-[10px] text-ox-text-muted truncate">
                  {bm.url.replace(/^https?:\/\//, '')}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(bm.id, e)}
                className="p-0.5 text-ox-text-muted hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover/item:opacity-100"
              >
                <Trash2 size={11} />
              </button>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
