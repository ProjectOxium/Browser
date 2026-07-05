import { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react'
import { useTabStore } from '../stores/tabs'
import { useSettingsStore } from '../stores/settings'
import { normalizeUrl } from '../utils/constants'
import { Shield, Lock, Globe, Loader, Star } from 'lucide-react'

interface UrlBarProps {
  onNavigate: (url: string) => void
}

export function UrlBar({ onNavigate }: UrlBarProps) {
  const { tabs, activeTabId, updateTab } = useTabStore()
  const { getSearchEngine } = useSettingsStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const isBookmarked = activeTab?.url && activeTab.url !== 'about:blank'
    ? bookmarks.some((b) => b.url === activeTab.url)
    : false

  useEffect(() => {
    window.electronAPI?.getBookmarks().then(setBookmarks)
    const cleanup = window.electronAPI?.onBookmarksChanged(() => {
      window.electronAPI?.getBookmarks().then(setBookmarks)
    })
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    if (!isFocused && activeTab) setInputValue(activeTab.url)
  }, [activeTab?.url, isFocused])

  const handleSubmit = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const url = normalizeUrl(inputValue, getSearchEngine())
      setInputValue(url)
      updateTab(activeTabId!, { url })
      onNavigate(url)
      inputRef.current?.blur()
    }
  }, [inputValue, activeTabId, onNavigate, updateTab, getSearchEngine])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    setTimeout(() => inputRef.current?.select(), 10)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (activeTab) setInputValue(activeTab.url)
  }, [activeTab])

  const handleBookmark = async () => {
    if (!activeTab || activeTab.url === 'about:blank') return
    if (isBookmarked) {
      const bm = bookmarks.find((b) => b.url === activeTab.url)
      if (bm) await window.electronAPI?.removeBookmark(bm.id)
    } else {
      await window.electronAPI?.addBookmark({ title: activeTab.title || activeTab.url, url: activeTab.url })
    }
  }

  const displayUrl = isFocused
    ? inputValue
    : activeTab?.url !== 'about:blank' && activeTab?.url
      ? activeTab.url.replace(/^https?:\/\//, '')
      : ''

  const isSecure = activeTab?.url?.startsWith('https://')

  return (
    <div className="flex-1 flex items-center gap-1.5 bg-ox-surface rounded-lg px-3 py-1.5 border border-ox-border focus-within:border-[#888] transition-all duration-150">
      {!isFocused && activeTab?.url !== 'about:blank' && (
        <div className="flex-shrink-0 text-ox-text-muted">
          {isSecure ? <Lock size={13} /> : <Globe size={13} />}
        </div>
      )}
      <input
        id="urlbar-input"
        ref={inputRef}
        type="text"
        value={displayUrl}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleSubmit}
        placeholder={activeTab?.url === 'about:blank' ? 'Search or enter address' : ''}
        className="flex-1 bg-transparent text-sm text-ox-text outline-none placeholder-ox-text-muted select-text"
      />
      {activeTab?.isLoading && (
        <Loader size={14} className="text-ox-text-muted animate-spin flex-shrink-0" />
      )}
      {activeTab?.url && activeTab.url !== 'about:blank' && (
        <button
          onClick={handleBookmark}
          className={`flex-shrink-0 p-0.5 rounded transition-colors ${isBookmarked ? 'text-amber-400 hover:text-amber-300' : 'text-ox-text-muted hover:text-ox-text'}`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        >
          <Star size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      )}
      {!isFocused && (activeTab?.blockedCount ?? 0) > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 text-ox-text-muted text-xs">
          <Shield size={12} />
          <span className="tabular-nums">{activeTab?.blockedCount}</span>
        </div>
      )}
    </div>
  )
}
