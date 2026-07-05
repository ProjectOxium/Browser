import { useEffect, useRef, useCallback, useState } from 'react'
import { Star } from 'lucide-react'
import { useTabStore } from '../stores/tabs'
import { useSettingsStore } from '../stores/settings'
import { TitleBar } from './TitleBar'
import { TabBar } from './TabBar'
import { UrlBar } from './UrlBar'
import { NavButtons } from './NavButtons'
import { ShieldsPanel } from './ShieldsPanel'
import { BookmarkBar } from './BookmarkBar'
import { TabWebview } from './TabWebview'
import { Settings } from './Settings'
import { FindBar } from './FindBar'
import { HistoryPanel } from './HistoryPanel'
import { DownloadsPanel } from './DownloadsPanel'
import { NewTabPage } from './NewTabPage'
import { ToolbarExtensions } from './ToolbarExtensions'
import { BookmarksPanel } from './BookmarksPanel'

export function BrowserWindow() {
  const { tabs, activeTabId, addTab, removeTab, updateTab, setActiveTab } = useTabStore()
  const { loadSettings } = useSettingsStore()
  const webviewRefs = useRef<Map<string, HTMLWebViewElement>>(new Map())
  const webviewContentsMap = useRef<Map<number, string>>(new Map())
  const initialized = useRef(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [downloads, setDownloads] = useState<DownloadData[]>([])
  const [showDownloads, setShowDownloads] = useState(false)

  const registerWebview = useCallback((tabId: string, wv: HTMLWebViewElement) => {
    webviewRefs.current.set(tabId, wv)
    try {
      const wcId = (wv as any).getWebContentsId()
      if (wcId) {
        webviewContentsMap.current.set(wcId, tabId)
        updateTab(tabId, { webContentsId: wcId })
      }
    } catch { /* webContentsId not available yet */ }
  }, [updateTab])

  const unregisterWebview = useCallback((tabId: string) => {
    const wv = webviewRefs.current.get(tabId)
    if (wv) {
      try {
        const wcId = (wv as any).getWebContentsId()
        webviewContentsMap.current.delete(wcId)
      } catch { /* ignore */ }
    }
    webviewRefs.current.delete(tabId)
  }, [])

  const getActiveWebview = useCallback(() => {
    if (!activeTabId) return null
    return webviewRefs.current.get(activeTabId) ?? null
  }, [activeTabId])

  const navigate = useCallback((url: string) => {
    getActiveWebview()?.loadURL(url)
  }, [getActiveWebview])

  const goBack = useCallback(() => getActiveWebview()?.goBack(), [getActiveWebview])
  const goForward = useCallback(() => getActiveWebview()?.goForward(), [getActiveWebview])
  const reload = useCallback(() => getActiveWebview()?.reload(), [getActiveWebview])
  const stop = useCallback(() => getActiveWebview()?.stop(), [getActiveWebview])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadSettings()
    const state = useTabStore.getState()
    if (state.tabs.length === 0) state.addTab('about:blank')
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI?.onPerTabBlocked(({ webContentsId, count }) => {
      const tabId = webviewContentsMap.current.get(webContentsId)
      if (tabId) useTabStore.getState().updateTab(tabId, { blockedCount: count })
    })
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI?.onContextMenuAction((action) => {
      const wv = action.tabId ? webviewRefs.current.get(action.tabId) : webviewRefs.current.get(useTabStore.getState().activeTabId ?? '')
      switch (action.action) {
        case 'back':
          wv?.goBack()
          break
        case 'forward':
          wv?.goForward()
          break
        case 'reload':
          wv?.reload()
          break
        case 'navigate':
          if (action.url) wv?.loadURL(action.url)
          break
        case 'search':
          if (action.query) wv?.loadURL(action.query)
          break
        case 'newtab':
          if (action.url) useTabStore.getState().addTab(action.url)
          break
        case 'bookmark': {
          const state = useTabStore.getState()
          const tab = state.tabs.find((t) => t.id === action.tabId)
          if (tab && tab.url !== 'about:blank') {
            window.electronAPI?.addBookmark({ title: tab.title, url: tab.url })
          }
          break
        }
      }
    })
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    const cleanup1 = window.electronAPI?.onDownloadStarted((data: DownloadData) => {
      setDownloads((prev) => {
        const existing = prev.findIndex((d) => d.id === data.id)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = data
          return next
        }
        return [...prev, data]
      })
      setShowDownloads(true)
    })
    const cleanup2 = window.electronAPI?.onDownloadUpdated((data: DownloadData) => {
      setDownloads((prev) => {
        const idx = prev.findIndex((d) => d.id === data.id)
        if (idx < 0) return [...prev, data]
        const next = [...prev]
        next[idx] = data
        return next
      })
    })
    return () => { cleanup1?.(); cleanup2?.() }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const state = useTabStore.getState()
      const activeId = state.activeTabId

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (!(ctrl && (e.key === 'l' || e.key === 'f' || e.key === 'h' || e.key === 'w' || e.key === 't'))) {
          return
        }
      }

      if (ctrl && e.key === 't') { e.preventDefault(); state.addTab('about:blank'); return }
      if (ctrl && e.key === 'w') { e.preventDefault(); if (activeId) state.removeTab(activeId); return }
      if (ctrl && e.key === 'l') { e.preventDefault(); document.querySelector<HTMLInputElement>('#urlbar-input')?.select(); return }
      if (ctrl && e.key === 'f') { e.preventDefault(); setShowFind((v) => { if (!v) setTimeout(() => document.querySelector<HTMLInputElement>('#findbar-input')?.focus(), 50); return true }); return }
      if (ctrl && e.key === 'h') { e.preventDefault(); setShowHistory((v) => !v); return }
      if (ctrl && e.key === 'r') { e.preventDefault(); getActiveWebview()?.reload(); return }
      if (ctrl && e.key === 'j') { e.preventDefault(); setShowDownloads((v) => !v); return }
      if (ctrl && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const idx = parseInt(e.key) - 1
        const ts = state.tabs
        if (ts[idx]) state.setActiveTab(ts[idx].id)
        return
      }
      if (ctrl && e.key === 'Tab') {
        e.preventDefault()
        const ts = state.tabs
        if (!activeId || ts.length < 2) return
        const idx = ts.findIndex((t) => t.id === activeId)
        const next = e.shiftKey ? (idx - 1 + ts.length) % ts.length : (idx + 1) % ts.length
        state.setActiveTab(ts[next].id)
        return
      }
      if (e.key === 'Escape') {
        if (showFind) { setShowFind(false); getActiveWebview()?.stopFindInPage(); return }
      }
      if (e.key === 'F5') { e.preventDefault(); getActiveWebview()?.reload() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [getActiveWebview, showFind])

  return (
    <div className="h-screen flex flex-col bg-ox-bg">
      <TitleBar onOpenSettings={() => setShowSettings(true)} />
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-shrink-0 items-center gap-1 px-2 pt-1 bg-ox-bg">
          <NavButtons onBack={goBack} onForward={goForward} onReload={reload} onStop={stop} />
          <BookmarksPanel isOpen={showBookmarks} onClose={() => setShowBookmarks(false)} onNavigate={navigate} />
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={`p-1.5 rounded-md transition-colors ${showBookmarks ? 'text-amber-400 bg-[#1a1a1a]' : 'text-ox-text-muted hover:bg-[#1a1a1a] hover:text-ox-text'}`}
            title="Bookmarks"
          >
            <Star size={16} />
          </button>
          <UrlBar onNavigate={navigate} />
          <ToolbarExtensions onNavigate={navigate} />
          <ShieldsPanel />
        </div>
        <TabBar />
        <BookmarkBar onNavigate={navigate} />
        <FindBar webview={getActiveWebview()} isOpen={showFind} onClose={() => setShowFind(false)} />
        <div className="webview-container flex-1">
          {tabs.map((tab) => (
            <TabWebview
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onRegister={registerWebview}
              onUnregister={unregisterWebview}
            />
          ))}
          {(() => {
            const activeTab = tabs.find((t) => t.id === activeTabId)
            if (activeTab?.url === 'about:blank') {
              return <NewTabPage onNavigate={navigate} />
            }
            return null
          })()}
        </div>
      </div>
      <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} onNavigate={navigate} />
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      <DownloadsPanel items={downloads} isOpen={showDownloads} onClose={() => setShowDownloads(false)} />
    </div>
  )
}
