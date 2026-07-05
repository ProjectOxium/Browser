import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

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

interface ExtensionEntry {
  id: string
  name: string
  version: string
  path: string
  enabled: boolean
}

interface StorageData {
  bookmarks: Bookmark[]
  history: HistoryEntry[]
  settings: Settings
}

const DEFAULT_DATA: StorageData = {
  bookmarks: [],
  history: [],
  settings: {
    privacyLevel: 'balanced',
    searchEngine: 'duckduckgo',
    startupBehavior: 'continue',
  },
}

let data: StorageData = { ...DEFAULT_DATA }
let storagePath = ''
let extensionsPath = ''

export function initStore(profileId: string) {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  storagePath = join(userDataPath, `oxium-data-${profileId}.json`)
  extensionsPath = join(userDataPath, 'oxium-extensions.json')
  if (existsSync(storagePath)) {
    try {
      const raw = readFileSync(storagePath, 'utf-8')
      const parsed = JSON.parse(raw)
      data = { ...DEFAULT_DATA, ...parsed }
    } catch {
      data = { ...DEFAULT_DATA }
      return // Don't save — preserve corrupt file for recovery
    }
  }
  save()
}

export function reloadProfile(profileId: string) {
  const userDataPath = app.getPath('userData')
  storagePath = join(userDataPath, `oxium-data-${profileId}.json`)
  if (existsSync(storagePath)) {
    try {
      const raw = readFileSync(storagePath, 'utf-8')
      data = { ...DEFAULT_DATA, ...JSON.parse(raw) }
    } catch {
      data = { ...DEFAULT_DATA }
      return // Don't save — preserve corrupt file
    }
  } else {
    data = { ...DEFAULT_DATA }
  }
  save()
}

function save() {
  if (storagePath) {
    writeFileSync(storagePath, JSON.stringify(data, null, 2))
  }
}

export function getBookmarks(): Bookmark[] {
  return data.bookmarks
}

export function addBookmark(bookmark: { title: string; url: string }): Bookmark {
  const bm: Bookmark = {
    id: Date.now().toString(36),
    title: bookmark.title,
    url: bookmark.url,
    createdAt: Date.now(),
  }
  data.bookmarks.push(bm)
  save()
  return bm
}

export function removeBookmark(id: string) {
  data.bookmarks = data.bookmarks.filter((b) => b.id !== id)
  save()
}

export function getHistory(): HistoryEntry[] {
  return data.history
}

export function addHistoryEntry(entry: { title: string; url: string }) {
  if (data.history.length > 0 && data.history[0].url === entry.url) return
  data.history.unshift({
    title: entry.title,
    url: entry.url,
    visitedAt: Date.now(),
  })
  if (data.history.length > 5000) {
    data.history = data.history.slice(0, 5000)
  }
  save()
}

export function clearHistory() {
  data.history = []
  save()
}

export function getSettings(): Settings {
  return data.settings
}

export function updateSettings(updates: Partial<Settings>) {
  data.settings = { ...data.settings, ...updates }
  save()
}

function loadExtensions(): ExtensionEntry[] {
  if (!extensionsPath || !existsSync(extensionsPath)) return []
  try {
    return JSON.parse(readFileSync(extensionsPath, 'utf-8'))
  } catch {
    return []
  }
}

function saveExtensions(exts: ExtensionEntry[]) {
  if (extensionsPath) {
    writeFileSync(extensionsPath, JSON.stringify(exts, null, 2))
  }
}

export function getExtensions(): ExtensionEntry[] {
  return loadExtensions()
}

export function addExtension(ext: ExtensionEntry) {
  const exts = loadExtensions()
  const existing = exts.findIndex((e) => e.id === ext.id)
  if (existing >= 0) {
    exts[existing] = ext
  } else {
    exts.push(ext)
  }
  saveExtensions(exts)
}

export function removeExtension(id: string) {
  const exts = loadExtensions().filter((e) => e.id !== id)
  saveExtensions(exts)
}

export function setExtensionEnabled(id: string, enabled: boolean) {
  const exts = loadExtensions()
  const ext = exts.find((e) => e.id === id)
  if (ext) {
    ext.enabled = enabled
    saveExtensions(exts)
  }
}
