import { create } from 'zustand'

interface ProfileState {
  profiles: ProfileData[]
  activeProfile: ProfileData | null
  loadProfiles: () => Promise<void>
  addProfile: (name: string) => Promise<void>
  switchToProfile: (id: string) => Promise<void>
  removeProfile: (id: string) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  profiles: [],
  activeProfile: null,

  loadProfiles: async () => {
    const [profiles, active] = await Promise.all([
      window.electronAPI.getProfiles(),
      window.electronAPI.getActiveProfile(),
    ])
    set({ profiles, activeProfile: active })
  },

  addProfile: async (name) => {
    await window.electronAPI.createProfile(name)
    const profiles = await window.electronAPI.getProfiles()
    const active = await window.electronAPI.getActiveProfile()
    set({ profiles, activeProfile: active })
  },

  switchToProfile: async (id) => {
    await window.electronAPI.switchProfile(id)
    const [profiles, active] = await Promise.all([
      window.electronAPI.getProfiles(),
      window.electronAPI.getActiveProfile(),
    ])
    set({ profiles, activeProfile: active })
  },

  removeProfile: async (id) => {
    await window.electronAPI.deleteProfile(id)
    const profiles = await window.electronAPI.getProfiles()
    const active = await window.electronAPI.getActiveProfile()
    set({ profiles, activeProfile: active })
  },
}))
