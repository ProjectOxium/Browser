import { ipcMain, BrowserWindow, session, dialog } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  getHistory,
  addHistoryEntry,
  clearHistory,
  getSettings,
  updateSettings,
  getExtensions,
  addExtension,
  removeExtension,
  setExtensionEnabled,
  reloadProfile,
} from './storage'
import { getTotalBlockedCount, resetAllBlockedCounts, setPrivacyLevel as setEnginePrivacyLevel } from './privacy-engine'
import { installFromStore, parseStoreUrl } from './extension-store'
import {
  getProfiles,
  getActiveProfile,
  createProfile,
  switchProfile,
  deleteProfile,
} from './profiles'
import {
  initPasswords,
  setMasterPassword,
  unlockVault,
  isVaultLocked,
  hasVault,
  getPasswords,
  addPassword,
  updatePassword,
  deletePassword,
  lockVault,
  importCSV,
  exportCSV,
} from './passwords'

function notifyBookmarksChanged() {
  BrowserWindow.getAllWindows().forEach((w) =>
    w.webContents.send('bookmarks-changed')
  )
}

function notifyProfileChanged() {
  BrowserWindow.getAllWindows().forEach((w) =>
    w.webContents.send('profile-changed')
  )
}

export function setupIpcHandlers() {
  ipcMain.on('close-window', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.on('minimize-window', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.on('maximize-window', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })

  ipcMain.on('get-webview-preload-path-sync', (event) => {
    const preloadPath = join(__dirname, 'webview-preload.js')
    if (!existsSync(preloadPath)) {
      console.error('Webview preload not found at:', preloadPath)
    }
    event.returnValue = preloadPath
  })

  // Bookmarks
  ipcMain.handle('get-bookmarks', () => getBookmarks())
  ipcMain.handle('add-bookmark', (_e, bookmark) => {
    const result = addBookmark(bookmark)
    notifyBookmarksChanged()
    return result
  })
  ipcMain.handle('remove-bookmark', (_e, id) => {
    removeBookmark(id)
    notifyBookmarksChanged()
  })

  // History
  ipcMain.handle('get-history', () => getHistory())
  ipcMain.handle('add-history-entry', (_e, entry) => addHistoryEntry(entry))
  ipcMain.handle('clear-history', () => clearHistory())

  // Settings
  ipcMain.handle('get-settings', () => getSettings())
  ipcMain.handle('update-settings', (_e, settings) => updateSettings(settings))

  // Privacy
  ipcMain.handle('get-blocked-count', () => getTotalBlockedCount())
  ipcMain.handle('reset-blocked-count', () => {
    resetAllBlockedCounts()
    return 0
  })
  ipcMain.handle('set-privacy-level', (_e, level: string) => {
    updateSettings({ privacyLevel: level })
    setEnginePrivacyLevel(level)
  })

  // Extensions
  ipcMain.handle('pick-extension', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Select extension folder',
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const dir = result.filePaths[0]
    const manifestPath = join(dir, 'manifest.json')
    if (!existsSync(manifestPath)) return null
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      return {
        path: dir,
        name: manifest.name || dir.split(/[\\/]/).pop() || 'Extension',
        version: manifest.version || '1.0',
      }
    } catch {
      return null
    }
  })

  ipcMain.handle('load-extension', async (_e, extPath: string) => {
    const s = session.defaultSession
    const ext = await s.loadExtension(extPath)
    let name = extPath.split(/[\\/]/).pop() || 'Extension'
    let version = '1.0'
    try {
      const manifest = JSON.parse(readFileSync(join(extPath, 'manifest.json'), 'utf-8'))
      name = manifest.name || name
      version = manifest.version || version
    } catch { /* ignore */ }
    addExtension({ id: ext.id, name, version, path: extPath, enabled: true })
    return { id: ext.id, name, version, path: extPath, enabled: true }
  })

  ipcMain.handle('remove-extension', async (_e, id: string) => {
    try {
      const s = session.defaultSession
      const all = s.getAllExtensions()
      if (all.find((e) => e.id === id)) await s.removeExtension(id)
    } catch { /* already removed */ }
    removeExtension(id)
  })

  ipcMain.handle('toggle-extension', async (_e, id: string, enabled: boolean) => {
    const s = session.defaultSession
    if (enabled) {
      const entry = getExtensions().find((e) => e.id === id)
      if (entry) await s.loadExtension(entry.path)
    } else {
      try { await s.removeExtension(id) } catch { /* ok */ }
    }
    setExtensionEnabled(id, enabled)
  })

  ipcMain.handle('get-extensions', () => getExtensions())

  ipcMain.handle('get-toolbar-extensions', async () => {
    const s = session.defaultSession
    const loaded = s.getAllExtensions()
    const toolbar: { id: string; name: string; icon: string; popup: string }[] = []

    for (const ext of loaded) {
      const stored = getExtensions().find((e) => e.id === ext.id)
      if (!stored?.enabled) continue

      let icon = ''
      let popup = ''
      try {
        const manifestPath = join(ext.path, 'manifest.json')
        if (existsSync(manifestPath)) {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
          const icons = manifest.icons || manifest.browser_action?.default_icon || manifest.action?.default_icon
          if (icons) {
            const iconKey = Object.keys(icons).sort((a, b) => parseInt(a) - parseInt(b))[0]
            const iconRelPath = typeof icons === 'string' ? icons : icons[iconKey]
            if (iconRelPath) {
              const iconPath = join(ext.path, iconRelPath)
              if (existsSync(iconPath)) {
                icon = 'data:image/png;base64,' + readFileSync(iconPath).toString('base64')
              }
            }
          }
          const popupRel = manifest.browser_action?.default_popup || manifest.action?.default_popup
          if (popupRel) {
            popup = `chrome-extension://${ext.id}/${popupRel}`
          }
        }
      } catch { /* icon not available */ }

      toolbar.push({ id: ext.id, name: ext.name, icon, popup })
    }
    return toolbar
  })
  ipcMain.handle('parse-store-url', (_e, input: string) => parseStoreUrl(input))

  ipcMain.handle('install-from-store', async (_e, input: string) => {
    const result = await installFromStore(input)
    addExtension({ id: result.id, name: result.name, version: result.version, path: result.path, enabled: true })
    return result
  })

  // Profiles
  ipcMain.handle('get-profiles', () => getProfiles())
  ipcMain.handle('get-active-profile', () => getActiveProfile())
  ipcMain.handle('create-profile', (_e, name: string) => createProfile(name))
  ipcMain.handle('switch-profile', (_e, id: string) => {
    switchProfile(id)
    reloadProfile(id)
    notifyProfileChanged()
    notifyBookmarksChanged()
  })
  ipcMain.handle('delete-profile', (_e, id: string) => {
    deleteProfile(id)
    notifyProfileChanged()
    notifyBookmarksChanged()
  })

  initPasswords()

  ipcMain.handle('has-vault', () => hasVault())
  ipcMain.handle('is-locked', () => isVaultLocked())
  ipcMain.handle('set-master-password', (_e, password: string) => setMasterPassword(password))
  ipcMain.handle('unlock-vault', (_e, password: string) => unlockVault(password))
  ipcMain.handle('lock-vault', () => lockVault())
  ipcMain.handle('get-passwords', () => getPasswords())
  ipcMain.handle('add-password', (_e, entry: { name: string; url: string; username: string; password: string }) =>
    addPassword(entry)
  )
  ipcMain.handle('update-password', (_e, id: string, updates: Partial<{ name: string; url: string; username: string; password: string }>) =>
    updatePassword(id, updates)
  )
  ipcMain.handle('delete-password', (_e, id: string) => deletePassword(id))
  ipcMain.handle('import-passwords-csv', (_e, csv: string) => {
    try { return importCSV(csv) } catch (err: any) { throw new Error(err.message) }
  })
  ipcMain.handle('export-passwords-csv', () => exportCSV())
}
