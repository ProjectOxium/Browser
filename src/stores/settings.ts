import { create } from 'zustand'

interface SettingsState {
  privacyLevel: string
  searchEngine: string
  settingsLoaded: boolean
  loadSettings: () => Promise<void>
  setPrivacyLevel: (level: string) => Promise<void>
  setSearchEngine: (engine: string) => Promise<void>
  getSearchEngine: () => string
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  privacyLevel: 'balanced',
  searchEngine: 'duckduckgo',
  settingsLoaded: false,

  loadSettings: async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      set({ privacyLevel: settings.privacyLevel, searchEngine: settings.searchEngine, settingsLoaded: true })
    } catch {
      set({ settingsLoaded: true })
    }
  },

  setPrivacyLevel: async (level) => {
    await window.electronAPI.setPrivacyLevel(level)
    set({ privacyLevel: level })
  },

  setSearchEngine: async (engine) => {
    await window.electronAPI.updateSettings({ searchEngine: engine })
    set({ searchEngine: engine })
  },

  getSearchEngine: () => get().searchEngine,
}))
