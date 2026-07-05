import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface ProfileEntry {
  id: string
  name: string
  color: string
  createdAt: number
}

interface ProfilesData {
  profiles: ProfileEntry[]
  activeProfileId: string
}

const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#38bdf8', '#f87171']

const DEFAULT_PROFILE: ProfileEntry = {
  id: 'default',
  name: 'Default',
  color: '#60a5fa',
  createdAt: Date.now(),
}

const DEFAULT_PROFILES: ProfilesData = {
  profiles: [DEFAULT_PROFILE],
  activeProfileId: 'default',
}

let profilesData: ProfilesData = { ...DEFAULT_PROFILES }
let profilesPath = ''
let userDataPath = ''

export function initProfiles() {
  userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  profilesPath = join(userDataPath, 'oxium-profiles.json')
  if (existsSync(profilesPath)) {
    try {
      const raw = readFileSync(profilesPath, 'utf-8')
      profilesData = { ...DEFAULT_PROFILES, ...JSON.parse(raw) }
    } catch {
      profilesData = { ...DEFAULT_PROFILES }
      return // Don't save — preserve corrupt file
    }
  }
  save()
}

function save() {
  if (profilesPath) {
    writeFileSync(profilesPath, JSON.stringify(profilesData, null, 2))
  }
}

export function getProfiles(): ProfileEntry[] {
  return profilesData.profiles
}

export function getActiveProfileId(): string {
  return profilesData.activeProfileId
}

export function getActiveProfile(): ProfileEntry {
  return profilesData.profiles.find((p) => p.id === profilesData.activeProfileId) || DEFAULT_PROFILE
}

export function createProfile(name: string): ProfileEntry {
  const usedColors = new Set(profilesData.profiles.map((p) => p.color))
  const color = COLORS.find((c) => !usedColors.has(c)) || COLORS[profilesData.profiles.length % COLORS.length]
  const profile: ProfileEntry = {
    id: `profile-${Date.now().toString(36)}`,
    name: name || 'Profile',
    color,
    createdAt: Date.now(),
  }
  profilesData.profiles.push(profile)
  save()
  return profile
}

export function switchProfile(id: string) {
  if (!profilesData.profiles.find((p) => p.id === id)) return
  profilesData.activeProfileId = id
  save()
}

export function deleteProfile(id: string) {
  if (profilesData.profiles.length <= 1) return
  if (id === 'default') return
  profilesData.profiles = profilesData.profiles.filter((p) => p.id !== id)
  if (profilesData.activeProfileId === id) {
    profilesData.activeProfileId = profilesData.profiles[0].id
  }
  save()
}

export function getProfileDataPath(profileId: string): string {
  return join(userDataPath, `oxium-data-${profileId}.json`)
}
