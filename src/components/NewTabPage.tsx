import { useEffect, useState, useCallback } from 'react'
import { Clock, Shield, Bookmark, Star, Globe, Trash2, Search, Plus } from 'lucide-react'

interface Bookmark {
  id: string
  title: string
  url: string
}

interface NewTabPageProps {
  onNavigate: (url: string) => void
}

function formatTime() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFaviconUrl(url: string) {
  try {
    const u = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`
  } catch {
    return ''
  }
}

function FaviconTile({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-12 h-12 rounded-xl bg-ox-surface border border-ox-border flex items-center justify-center overflow-hidden group-hover:border-ox-text-muted transition-colors">
      {failed ? (
        <span className="text-sm font-semibold text-ox-text-secondary">{getInitial(url)}</span>
      ) : (
        <img
          src={getFaviconUrl(url)}
          alt=""
          className="w-6 h-6"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

export function NewTabPage({ onNavigate }: NewTabPageProps) {
  const [time, setTime] = useState(formatTime())
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [popularSites, setPopularSites] = useState<{ title: string; url: string; count: number }[]>([])
  const [blockedTotal, setBlockedTotal] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addUrl, setAddUrl] = useState('')

  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = useCallback(() => {
    window.electronAPI?.getBookmarks().then(setBookmarks)
    window.electronAPI?.getBlockedCount().then(setBlockedTotal)
    window.electronAPI?.getHistory().then((h: any[]) => {
      const counts = new Map<string, { title: string; count: number }>()
      h.forEach((entry: any) => {
        if (entry.url === 'about:blank') return
        const existing = counts.get(entry.url)
        if (existing) {
          existing.count++
        } else {
          counts.set(entry.url, { title: entry.title, count: 1 })
        }
      })
      const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 6)
        .map(([url, data]) => ({ url, title: data.title, count: data.count }))
      setPopularSites(sorted)
    })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const cleanup = window.electronAPI?.onBookmarksChanged(loadData)
    return () => cleanup?.()
  }, [loadData])

  const handleAddBookmark = async () => {
    if (!addTitle || !addUrl) return
    const url = addUrl.startsWith('http') ? addUrl : `https://${addUrl}`
    await window.electronAPI?.addBookmark({ title: addTitle, url })
    setAddTitle('')
    setAddUrl('')
    setShowAddForm(false)
  }

  const handleRemoveBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await window.electronAPI?.removeBookmark(id)
    loadData()
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start overflow-y-auto bg-ox-bg p-8">
      <div className="flex flex-col items-center mb-10 mt-8">
        <div className="text-6xl font-light text-ox-text tracking-widest tabular-nums mb-2 select-none">
          {time}
        </div>
        <div className="text-sm text-ox-text-muted select-none">
          {getGreeting()}
        </div>
      </div>

      <button
        onClick={() => document.querySelector<HTMLInputElement>('#urlbar-input')?.focus()}
        className="w-full max-w-xl flex items-center gap-3 bg-ox-surface border border-ox-border rounded-xl px-5 py-3 mb-10 hover:border-ox-text-muted transition-colors group cursor-text"
      >
        <Search size={18} className="text-ox-text-muted group-hover:text-ox-text-secondary transition-colors" />
        <span className="text-sm text-ox-text-muted">Search or enter address</span>
      </button>

      {bookmarks.length > 0 && (
        <div className="w-full max-w-4xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-ox-text-muted uppercase tracking-wider">
              <Bookmark size={12} />
              Favorites
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-xs text-ox-text-muted hover:text-ox-text transition-colors"
            >
              <Plus size={12} />
              Add
            </button>
          </div>

          {showAddForm && (
            <div className="flex items-center gap-2 mb-4 bg-ox-surface border border-ox-border rounded-xl p-3">
              <input
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="Name"
                className="flex-1 bg-ox-bg border border-ox-border rounded-lg px-3 py-1.5 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddBookmark(); if (e.key === 'Escape') setShowAddForm(false) }}
                autoFocus
              />
              <input
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                placeholder="URL"
                className="flex-[2] bg-ox-bg border border-ox-border rounded-lg px-3 py-1.5 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddBookmark(); if (e.key === 'Escape') setShowAddForm(false) }}
              />
              <button
                onClick={handleAddBookmark}
                className="px-3 py-1.5 bg-ox-surface-active rounded-lg text-sm text-ox-text hover:bg-ox-surface-hover transition-colors"
              >
                Save
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {bookmarks.slice(0, 16).map((bm) => (
              <button
                key={bm.id}
                onClick={() => onNavigate(bm.url)}
                className="group relative flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-ox-surface-hover transition-colors"
                title={bm.url}
              >
                <FaviconTile url={bm.url} title={bm.title} />
                <span className="text-[11px] text-ox-text-secondary text-center line-clamp-2 leading-tight group-hover:text-ox-text transition-colors">
                  {bm.title}
                </span>
                <button
                  onClick={(e) => handleRemoveBookmark(bm.id, e)}
                  className="absolute -top-0.5 -right-0.5 p-0.5 rounded-full bg-ox-bg opacity-0 group-hover:opacity-100 transition-opacity text-ox-text-muted hover:text-red-400"
                >
                  <Trash2 size={10} />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {popularSites.length > 0 && (
        <div className="w-full max-w-4xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-ox-text-muted uppercase tracking-wider mb-4">
            <Globe size={12} />
            Most Visited
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {popularSites.map((site) => (
              <button
                key={site.url}
                onClick={() => onNavigate(site.url)}
                className="group relative flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-ox-surface-hover transition-colors"
                title={site.url}
              >
                <FaviconTile url={site.url} title={site.title} />
                <span className="text-[11px] text-ox-text-secondary text-center line-clamp-2 leading-tight group-hover:text-ox-text transition-colors">
                  {site.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto mb-4 flex items-center gap-6 text-xs text-ox-text-muted">
        <div className="flex items-center gap-1.5">
          <Shield size={12} />
          <span>{blockedTotal.toLocaleString()} trackers blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Bookmark size={12} />
          <span>{bookmarks.length} favorites</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe size={12} />
          <span>Oxium Browser</span>
        </div>
      </div>
    </div>
  )
}
