import { useEffect, useRef } from 'react'
import { useTabStore, TabData } from '../stores/tabs'

interface TabWebviewProps {
  tab: TabData
  isActive: boolean
  onRegister: (tabId: string, wv: HTMLWebViewElement) => void
  onUnregister: (tabId: string) => void
}

function getPreloadPath() {
  try { return window.electronAPI?.getWebviewPreloadPath() } catch { return undefined }
}

export function TabWebview({ tab, isActive, onRegister, onUnregister }: TabWebviewProps) {
  const webviewRef = useRef<HTMLWebViewElement>(null)
  const preloadPath = useRef(getPreloadPath())

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return

    onRegister(tab.id, wv)

    const handleNavigate = (e: Electron.DidNavigateEvent) => {
      if (e.url === 'about:blank') return
      const cur = useTabStore.getState().tabs.find((t) => t.id === tab.id)
      useTabStore.getState().updateTab(tab.id, {
        url: e.url,
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
      })
      window.electronAPI?.addHistoryEntry({
        title: cur?.title || e.url.split('/')[2] || e.url,
        url: e.url,
      })
    }

    const handleNavigateInPage = (e: Electron.DidNavigateInPageEvent) => {
      if (!e.isMainFrame || e.url === 'about:blank') return
      useTabStore.getState().updateTab(tab.id, {
        url: e.url,
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
      })
    }

    const handleTitleUpdate = (e: Electron.PageTitleUpdatedEvent) => {
      if (e.title && e.title !== 'about:blank') {
        useTabStore.getState().updateTab(tab.id, { title: e.title })
      }
    }

    const handleStartLoading = () => {
      useTabStore.getState().updateTab(tab.id, { isLoading: true })
    }

    const handleStopLoading = () => {
      useTabStore.getState().updateTab(tab.id, { isLoading: false })
    }

    const handleNewWindow = (e: Electron.NewWindowEvent) => {
      wv.loadURL(e.url)
    }

    const handleContextMenu = (e: any) => {
      const cur = useTabStore.getState().tabs.find((t) => t.id === tab.id)
      window.electronAPI?.showContextMenu({
        x: e.params.x,
        y: e.params.y,
        linkURL: e.params.linkURL || '',
        selectionText: e.params.selectionText || '',
        editable: e.params.isEditable || false,
        tabId: tab.id,
        pageURL: cur?.url || tab.url,
      })
    }

    wv.addEventListener('did-navigate', handleNavigate)
    wv.addEventListener('did-navigate-in-page', handleNavigateInPage)
    wv.addEventListener('page-title-updated', handleTitleUpdate)
    wv.addEventListener('did-start-loading', handleStartLoading)
    wv.addEventListener('did-stop-loading', handleStopLoading)
    wv.addEventListener('new-window', handleNewWindow)
    ;(wv as any).addEventListener('context-menu', handleContextMenu)

    return () => {
      wv.removeEventListener('did-navigate', handleNavigate)
      wv.removeEventListener('did-navigate-in-page', handleNavigateInPage)
      wv.removeEventListener('page-title-updated', handleTitleUpdate)
      wv.removeEventListener('did-start-loading', handleStartLoading)
      wv.removeEventListener('did-stop-loading', handleStopLoading)
      wv.removeEventListener('new-window', handleNewWindow)
      ;(wv as any).removeEventListener('context-menu', handleContextMenu)
      onUnregister(tab.id)
    }
  }, [tab.id])

  return (
    <webview
      ref={webviewRef}
      src={tab.url}
      preload={preloadPath.current || undefined}
      style={{ display: isActive ? 'flex' : 'none', flex: 1, height: '100%' }}
      partition="persist:oxium"
      webpreferences="contextIsolation=yes,nodeIntegration=no"
    />
  )
}
