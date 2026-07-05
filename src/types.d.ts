interface Bookmark {
  id: string
  title: string
  url: string
  createdAt: number
}

interface HistoryEntry {
  title: string
  url: string
  visitedAt: number
}

interface Settings {
  privacyLevel: string
  searchEngine: string
  startupBehavior: string
}

interface ContextMenuParams {
  x: number
  y: number
  linkURL: string
  selectionText: string
  editable: boolean
  tabId: string
  pageURL: string
}

interface ContextMenuAction {
  action: string
  tabId?: string
  url?: string
  query?: string
}

interface PerTabBlockedData {
  webContentsId: number
  count: number
}

interface DownloadData {
  id: number
  filename: string
  url: string
  state: string
  receivedBytes: number
  totalBytes: number
}

interface ExtensionData {
  id: string
  name: string
  version: string
  path: string
  enabled: boolean
}

interface ProfileData {
  id: string
  name: string
  color: string
  createdAt: number
}

interface PasswordEntry {
  id: string
  name: string
  url: string
  username: string
  password: string
  createdAt: number
}

interface ElectronAPI {
  closeWindow: () => void
  minimizeWindow: () => void
  maximizeWindow: () => void

  getBookmarks: () => Promise<Bookmark[]>
  addBookmark: (bookmark: { title: string; url: string }) => Promise<Bookmark>
  removeBookmark: (id: string) => Promise<void>

  getHistory: () => Promise<HistoryEntry[]>
  clearHistory: () => Promise<void>
  addHistoryEntry: (entry: { title: string; url: string }) => Promise<void>

  getSettings: () => Promise<Settings>
  updateSettings: (settings: Partial<Settings>) => Promise<void>

  getBlockedCount: () => Promise<number>
  resetBlockedCount: () => Promise<number>
  setPrivacyLevel: (level: string) => Promise<void>

  getWebviewPreloadPath: () => string

  pickExtension: () => Promise<{ path: string; name: string; version: string } | null>
  loadExtension: (path: string) => Promise<ExtensionData>
  removeExtension: (id: string) => Promise<void>
  toggleExtension: (id: string, enabled: boolean) => Promise<void>
  getExtensions: () => Promise<ExtensionData[]>
  getToolbarExtensions: () => Promise<{ id: string; name: string; icon: string; popup: string }[]>
  parseStoreUrl: (input: string) => Promise<{ id: string } | null>
  installFromStore: (input: string) => Promise<ExtensionData>

  getProfiles: () => Promise<ProfileData[]>
  getActiveProfile: () => Promise<ProfileData>
  createProfile: (name: string) => Promise<ProfileData>
  switchProfile: (id: string) => Promise<void>
  deleteProfile: (id: string) => Promise<void>

  hasVault: () => Promise<boolean>
  isLocked: () => Promise<boolean>
  setMasterPassword: (password: string) => Promise<boolean>
  unlockVault: (password: string) => Promise<boolean>
  lockVault: () => Promise<void>
  getPasswords: () => Promise<PasswordEntry[]>
  addPassword: (entry: { name: string; url: string; username: string; password: string }) => Promise<PasswordEntry>
  updatePassword: (id: string, updates: Partial<{ name: string; url: string; username: string; password: string }>) => Promise<void>
  deletePassword: (id: string) => Promise<void>
  importPasswordsCSV: (csv: string) => Promise<number>
  exportPasswordsCSV: () => Promise<string>

  showContextMenu: (params: ContextMenuParams) => Promise<void>

  onBookmarksChanged: (callback: () => void) => () => void
  onProfileChanged: (callback: () => void) => () => void
  onPerTabBlocked: (callback: (data: PerTabBlockedData) => void) => () => void
  onContextMenuAction: (callback: (action: ContextMenuAction) => void) => () => void
  onDownloadStarted: (callback: (data: DownloadData) => void) => () => void
  onDownloadUpdated: (callback: (data: DownloadData) => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}
