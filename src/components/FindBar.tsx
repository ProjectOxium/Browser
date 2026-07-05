import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'

interface FindBarProps {
  webview: HTMLWebViewElement | null
  isOpen: boolean
  onClose: () => void
}

export function FindBar({ webview, isOpen, onClose }: FindBarProps) {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const lastQuery = useRef('')

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(timer)
    }
    setQuery('')
    setMatches('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !webview) return
    const handler = (e: any) => {
      if (e.result) {
        setMatches(`${e.result.activeMatchOrdinal}/${e.result.matches}`)
      }
    }
    ;(webview as any).addEventListener('found-in-page', handler)
    return () => { (webview as any).removeEventListener('found-in-page', handler) }
  }, [isOpen, webview])

  useEffect(() => {
    if (!webview || !isOpen) return
    const text = query
    lastQuery.current = text
    const timer = setTimeout(() => {
      if (text === lastQuery.current) {
        if (text) {
          webview.findInPage(text)
        } else {
          webview.stopFindInPage()
          setMatches('')
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [query, webview, isOpen])

  const handleNext = useCallback(() => {
    if (!webview || !query) return
    webview.findInPage(query, { forward: true, findNext: true })
  }, [webview, query])

  const handlePrev = useCallback(() => {
    if (!webview || !query) return
    webview.findInPage(query, { forward: false, findNext: true })
  }, [webview, query])

  const handleClose = useCallback(() => {
    webview?.stopFindInPage()
    onClose()
  }, [webview, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.shiftKey ? handlePrev() : handleNext()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="flex items-center gap-2 bg-ox-surface border-t border-ox-border px-3 py-1.5">
      <input
        id="findbar-input"
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in page"
        className="flex-1 bg-ox-bg border border-ox-border rounded-md px-2.5 py-1 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
      />
      <span className="text-xs text-ox-text-muted min-w-[3em] tabular-nums text-right">
        {matches}
      </span>
      <button onClick={handlePrev} disabled={!query} className="p-1 hover:bg-ox-surface-hover rounded transition-colors text-ox-text-secondary hover:text-ox-text disabled:opacity-30">
        <ChevronUp size={14} />
      </button>
      <button onClick={handleNext} disabled={!query} className="p-1 hover:bg-ox-surface-hover rounded transition-colors text-ox-text-secondary hover:text-ox-text disabled:opacity-30">
        <ChevronDown size={14} />
      </button>
      <button onClick={handleClose} className="p-1 hover:bg-ox-surface-hover rounded transition-colors text-ox-text-secondary hover:text-ox-text">
        <X size={14} />
      </button>
    </div>
  )
}
