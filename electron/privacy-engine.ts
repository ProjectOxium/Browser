import { ElectronBlocker } from '@ghostery/adblocker-electron'
import { BrowserWindow, Session } from 'electron'
import fetch from 'cross-fetch'

let blocker: ElectronBlocker | null = null
const blockedCounts = new Map<number, number>()
let httpsUpgradesEnabled = true
let privacyLevel = 'balanced'

function sendBlockedUpdate(webContentsId: number) {
  const count = blockedCounts.get(webContentsId) || 0
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('per-tab-blocked', { webContentsId, count })
    }
  })
}

export async function setupPrivacyEngine(sess: Session) {
  try {
    blocker = await ElectronBlocker.fromPrebuiltFull(fetch)
    console.log('Adblocker initialized:', blocker ? 'OK' : 'NULL')
  } catch (err) {
    console.error('Adblocker init failed, falling back:', err)
    try {
      blocker = await ElectronBlocker.fromLists(fetch, [
        'https://easylist.to/easylist/easylist.txt',
        'https://easylist.to/easylist/easyprivacy.txt',
      ], { enableCompression: true })
      console.log('Adblocker fallback lists loaded')
    } catch (err2) {
      console.error('Adblocker fallback also failed:', err2)
    }
  }

  sess.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    if (details.resourceType === 'mainFrame' || details.resourceType === 'subFrame') {
      if (httpsUpgradesEnabled && details.url.startsWith('http://')) {
        callback({ redirectURL: details.url.replace('http://', 'https://') })
        return
      }
    }

    if (!blocker) {
      callback({ cancel: false })
      return
    }

    const result = blocker.match({
      url: details.url,
      type: mapResourceType(details.resourceType),
      sourceUrl: details.referrer,
    })

    if (result.redirect) {
      callback({ redirectURL: result.redirect })
      return
    }

    if (result.match) {
      const wcId = details.webContentsId
      blockedCounts.set(wcId, (blockedCounts.get(wcId) || 0) + 1)
      sendBlockedUpdate(wcId)
      callback({ cancel: true })
      return
    }

    callback({ cancel: false })
  })
}

function mapResourceType(type: string) {
  const m: Record<string, string> = {
    mainFrame: 'main_frame',
    subFrame: 'sub_frame',
    stylesheet: 'stylesheet',
    script: 'script',
    image: 'image',
    font: 'font',
    xhr: 'xmlhttprequest',
    media: 'media',
    websocket: 'websocket',
    other: 'other',
  }
  return m[type] || 'other'
}

export function getBlockedCountForTab(webContentsId: number): number {
  return blockedCounts.get(webContentsId) || 0
}

export function getTotalBlockedCount(): number {
  let total = 0
  blockedCounts.forEach((c) => (total += c))
  return total
}

export function resetBlockedCountForTab(webContentsId: number) {
  blockedCounts.set(webContentsId, 0)
}

export function resetAllBlockedCounts() {
  blockedCounts.clear()
}

export function setHttpsUpgradesEnabled(enabled: boolean) {
  httpsUpgradesEnabled = enabled
}

export function setPrivacyLevel(level: string) {
  privacyLevel = level
  if (level === 'strict') {
    httpsUpgradesEnabled = true
  } else if (level === 'relaxed') {
    httpsUpgradesEnabled = false
  } else {
    httpsUpgradesEnabled = true
  }
}

export function getBlocker() {
  return blocker
}
