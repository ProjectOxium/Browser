import { app, BrowserWindow, session, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { setupIpcHandlers } from './ipc-handlers'
import { setupPrivacyEngine } from './privacy-engine'
import { initStore, getExtensions } from './storage'
import { initProfiles, getActiveProfileId } from './profiles'
import { initPasswords } from './passwords'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f0f',
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function setupSecurityHeaders() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self'",
        ],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
      },
    })
  })
}

function setupDownloadTracking(sess: Electron.Session) {
  sess.on('will-download', (_e, item) => {
    const id = Date.now()
    mainWindow?.webContents.send('download-started', {
      id,
      filename: item.getFilename(),
      url: item.getURL(),
      state: 'progressing',
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
    })
    item.on('updated', () => {
      mainWindow?.webContents.send('download-updated', {
        id,
        state: item.getState(),
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
      })
    })
    item.on('done', (_e, state) => {
      mainWindow?.webContents.send('download-updated', {
        id,
        state,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
      })
    })
  })
}

function setupContextMenuHandler() {
  ipcMain.handle('show-context-menu', async (event, params) => {
    const { x, y, linkURL, selectionText, editable, tabId, pageURL } = params
    const template: Electron.MenuItemConstructorOptions[] = []

    if (editable) {
      template.push({ label: 'Cut', role: 'cut' })
      template.push({ label: 'Copy', role: 'copy' })
      template.push({ label: 'Paste', role: 'paste' })
      template.push({ type: 'separator' })
    }

    if (selectionText) {
      template.push({
        label: 'Search DuckDuckGo for "' + selectionText.substring(0, 30) + '"',
        click: () => {
          const q = encodeURIComponent(selectionText)
          event.sender.send('context-menu-action', {
            action: 'search',
            query: `https://duckduckgo.com/?q=${q}`,
            tabId,
          })
        },
      })
      template.push({ label: 'Copy', role: 'copy' })
      template.push({ type: 'separator' })
    }

    if (linkURL) {
      template.push({
        label: 'Open link in new tab',
        click: () =>
          event.sender.send('context-menu-action', { action: 'newtab', url: linkURL }),
      })
      template.push({
        label: 'Open link',
        click: () =>
          event.sender.send('context-menu-action', { action: 'navigate', url: linkURL, tabId }),
      })
      template.push({
        label: 'Copy link address',
        click: () => app.clipboard?.writeText(linkURL),
      })
      template.push({ type: 'separator' })
    }

    template.push({
      label: 'Back',
      accelerator: 'Alt+Left',
      click: () => event.sender.send('context-menu-action', { action: 'back', tabId }),
    })
    template.push({
      label: 'Forward',
      accelerator: 'Alt+Right',
      click: () => event.sender.send('context-menu-action', { action: 'forward', tabId }),
    })
    template.push({
      label: 'Reload',
      accelerator: 'CmdOrCtrl+R',
      click: () => event.sender.send('context-menu-action', { action: 'reload', tabId }),
    })
    template.push({ type: 'separator' })

    template.push({
      label: 'Bookmark this page',
      accelerator: 'CmdOrCtrl+D',
      click: () => {
        event.sender.send('context-menu-action', { action: 'bookmark', url: pageURL, tabId })
      },
    })

    const focusedWin = BrowserWindow.getFocusedWindow()
    if (!focusedWin) return
    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: focusedWin, x, y })
  })
}

async function loadPersistedExtensions(sess: Electron.Session) {
  const extensions = getExtensions()
  for (const ext of extensions) {
    if (!ext.enabled) continue
    try {
      await sess.loadExtension(ext.path)
      console.log(`Extension loaded: ${ext.name}`)
    } catch (err) {
      console.error(`Failed to load extension ${ext.name}:`, err)
    }
  }
}

app.whenReady().then(async () => {
  initProfiles()
  initPasswords()
  const profileId = getActiveProfileId()
  initStore(profileId)

  setupIpcHandlers()
  setupContextMenuHandler()
  setupSecurityHeaders()

  const webviewSession = session.fromPartition('persist:oxium')
  setupDownloadTracking(webviewSession)
  await setupPrivacyEngine(webviewSession)
  await loadPersistedExtensions(session.defaultSession)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
