import { contextBridge, ipcRenderer } from 'electron'

const webviewPreloadPath = ipcRenderer.sendSync('get-webview-preload-path-sync')

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),

  getWebviewPreloadPath: () => webviewPreloadPath,

  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  addBookmark: (bookmark: { title: string; url: string }) =>
    ipcRenderer.invoke('add-bookmark', bookmark),
  removeBookmark: (id: string) => ipcRenderer.invoke('remove-bookmark', id),

  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  addHistoryEntry: (entry: { title: string; url: string }) =>
    ipcRenderer.invoke('add-history-entry', entry),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('update-settings', settings),

  getBlockedCount: () => ipcRenderer.invoke('get-blocked-count'),
  resetBlockedCount: () => ipcRenderer.invoke('reset-blocked-count'),
  setPrivacyLevel: (level: string) => ipcRenderer.invoke('set-privacy-level', level),

  pickExtension: () => ipcRenderer.invoke('pick-extension'),
  loadExtension: (path: string) => ipcRenderer.invoke('load-extension', path),
  removeExtension: (id: string) => ipcRenderer.invoke('remove-extension', id),
  toggleExtension: (id: string, enabled: boolean) =>
    ipcRenderer.invoke('toggle-extension', id, enabled),
  getExtensions: () => ipcRenderer.invoke('get-extensions'),
  getToolbarExtensions: () => ipcRenderer.invoke('get-toolbar-extensions'),
  parseStoreUrl: (input: string) => ipcRenderer.invoke('parse-store-url', input),
  installFromStore: (input: string) => ipcRenderer.invoke('install-from-store', input),

  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  getActiveProfile: () => ipcRenderer.invoke('get-active-profile'),
  createProfile: (name: string) => ipcRenderer.invoke('create-profile', name),
  switchProfile: (id: string) => ipcRenderer.invoke('switch-profile', id),
  deleteProfile: (id: string) => ipcRenderer.invoke('delete-profile', id),

  hasVault: () => ipcRenderer.invoke('has-vault'),
  isLocked: () => ipcRenderer.invoke('is-locked'),
  setMasterPassword: (password: string) => ipcRenderer.invoke('set-master-password', password),
  unlockVault: (password: string) => ipcRenderer.invoke('unlock-vault', password),
  lockVault: () => ipcRenderer.invoke('lock-vault'),
  getPasswords: () => ipcRenderer.invoke('get-passwords'),
  addPassword: (entry: { name: string; url: string; username: string; password: string }) =>
    ipcRenderer.invoke('add-password', entry),
  updatePassword: (id: string, updates: Partial<{ name: string; url: string; username: string; password: string }>) =>
    ipcRenderer.invoke('update-password', id, updates),
  deletePassword: (id: string) => ipcRenderer.invoke('delete-password', id),
  importPasswordsCSV: (csv: string) => ipcRenderer.invoke('import-passwords-csv', csv),
  exportPasswordsCSV: () => ipcRenderer.invoke('export-passwords-csv'),

  showContextMenu: (params: {
    x: number; y: number; linkURL: string; selectionText: string
    editable: boolean; tabId: string; pageURL: string
  }) => ipcRenderer.invoke('show-context-menu', params),

  onBookmarksChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('bookmarks-changed', handler)
    return () => ipcRenderer.removeListener('bookmarks-changed', handler)
  },

  onProfileChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('profile-changed', handler)
    return () => ipcRenderer.removeListener('profile-changed', handler)
  },

  onPerTabBlocked: (callback: (data: { webContentsId: number; count: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { webContentsId: number; count: number }) =>
      callback(data)
    ipcRenderer.on('per-tab-blocked', handler)
    return () => ipcRenderer.removeListener('per-tab-blocked', handler)
  },

  onContextMenuAction: (callback: (action: { action: string; tabId?: string; url?: string; query?: string }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      action: { action: string; tabId?: string; url?: string; query?: string }
    ) => callback(action)
    ipcRenderer.on('context-menu-action', handler)
    return () => ipcRenderer.removeListener('context-menu-action', handler)
  },

  onDownloadStarted: (callback: (data: any) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on('download-started', handler)
    return () => ipcRenderer.removeListener('download-started', handler)
  },

  onDownloadUpdated: (callback: (data: any) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on('download-updated', handler)
    return () => ipcRenderer.removeListener('download-updated', handler)
  },
})
