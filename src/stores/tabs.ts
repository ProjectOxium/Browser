import { create } from 'zustand'

export interface TabData {
  id: string
  url: string
  title: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  blockedCount: number
  webContentsId: number | null
}

interface TabState {
  tabs: TabData[]
  activeTabId: string | null
  addTab: (url?: string) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<TabData>) => void
  reorderTabs: (ids: string[]) => void
  getActiveTab: () => TabData | undefined
}

let nextId = 1
function generateId() {
  return `tab-${nextId++}`
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (url = 'about:blank') => {
    const id = generateId()
    const tab: TabData = {
      id,
      url,
      title: url === 'about:blank' ? 'New Tab' : url,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      blockedCount: 0,
      webContentsId: null,
    }
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: id,
    }))
  },

  removeTab: (id) => {
    set((state) => {
      if (state.tabs.length <= 1) return state
      const filtered = state.tabs.filter((t) => t.id !== id)
      let newActive = state.activeTabId
      if (state.activeTabId === id) {
        const idx = state.tabs.findIndex((t) => t.id === id)
        newActive = filtered[Math.min(idx, filtered.length - 1)]?.id ?? null
      }
      return { tabs: filtered, activeTabId: newActive }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  reorderTabs: (ids) =>
    set((state) => {
      const ordered = ids.map((id) => state.tabs.find((t) => t.id === id)).filter(Boolean) as TabData[]
      if (ordered.length !== state.tabs.length) return state
      return { tabs: ordered }
    }),

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId)
  },
}))
