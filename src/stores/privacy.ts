import { create } from 'zustand'

interface PrivacyState {
  blockedCount: number
  isShieldsOpen: boolean
  setBlockedCount: (count: number) => void
  toggleShields: () => void
  setShieldsOpen: (open: boolean) => void
}

export const usePrivacyStore = create<PrivacyState>((set) => ({
  blockedCount: 0,
  isShieldsOpen: false,

  setBlockedCount: (count) => set({ blockedCount: count }),

  toggleShields: () => set((state) => ({ isShieldsOpen: !state.isShieldsOpen })),

  setShieldsOpen: (open) => set({ isShieldsOpen: open }),
}))
