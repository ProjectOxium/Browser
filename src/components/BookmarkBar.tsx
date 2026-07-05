import { useEffect, useState, useCallback } from 'react'
import { Star } from 'lucide-react'

interface Bookmark {
  id: string
  title: string
  url: string
}

interface BookmarkBarProps {
  onNavigate: (url: string) => void
}

export function BookmarkBar({ onNavigate }: BookmarkBarProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  const fetchBookmarks = useCallback(() => {
    window.electronAPI?.getBookmarks().then(setBookmarks)
  }, [])

  useEffect(() => {
    fetchBookmarks()
    const cleanup = window.electronAPI?.onBookmarksChanged(fetchBookmarks)
    return () => cleanup?.()
  }, [fetchBookmarks])

  const handleClick = useCallback((url: string) => {
    onNavigate(url)
  }, [onNavigate])

  if (bookmarks.length === 0) return null

  return (
    <div className="flex items-center gap-1 px-3 py-0.5 bg-ox-bg border-b border-ox-border overflow-x-auto">
      {bookmarks.map((bm) => (
        <button
          key={bm.id}
          onClick={() => handleClick(bm.url)}
          className="flex items-center gap-1 px-2 py-0.5 text-xs text-ox-text-secondary hover:text-ox-text hover:bg-ox-surface-hover rounded transition-colors whitespace-nowrap"
          title={bm.url}
        >
          <Star size={10} />
          <span className="truncate max-w-24">{bm.title}</span>
        </button>
      ))}
    </div>
  )
}
