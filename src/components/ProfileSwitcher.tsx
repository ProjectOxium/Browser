import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Plus, Trash2, Check } from 'lucide-react'
import { useProfileStore } from '../stores/profiles'
import { useSettingsStore } from '../stores/settings'

function ProfileAvatar({ profile }: { profile: ProfileData }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
      style={{ backgroundColor: profile.color }}
    >
      {profile.name[0].toUpperCase()}
    </div>
  )
}

export function ProfileSwitcher() {
  const { profiles, activeProfile, loadProfiles, switchToProfile, addProfile, removeProfile } =
    useProfileStore()
  const { loadSettings } = useSettingsStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    loadProfiles().catch((err) => console.error('Failed to load profiles:', err))
    const cleanup = window.electronAPI?.onProfileChanged(() => {
      loadProfiles().catch(console.error)
      loadSettings().catch(console.error)
    })
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    if (isAdding) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isAdding])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setIsAdding(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSwitch = async (id: string) => {
    try {
      await switchToProfile(id)
    } catch (err) {
      console.error('Switch profile failed:', err)
    }
    setIsOpen(false)
  }

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await addProfile(name)
    } catch (err) {
      console.error('Create profile failed:', err)
    }
    setIsAdding(false)
    setNewName('')
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (profiles.length <= 1) return
    try {
      await removeProfile(id)
    } catch (err) {
      console.error('Delete profile failed:', err)
    }
  }

  if (!activeProfile) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[#1a1a1a] transition-colors text-ox-text-secondary hover:text-ox-text"
      >
        <ProfileAvatar profile={activeProfile} />
        <span className="text-xs max-w-[80px] truncate">{activeProfile.name}</span>
        <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-ox-surface border border-ox-border rounded-xl shadow-2xl py-1.5 overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] text-ox-text-muted uppercase tracking-wider font-semibold">
            Profiles
          </div>

          {profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => handleSwitch(profile.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ox-surface-hover transition-colors cursor-pointer"
            >
              <ProfileAvatar profile={profile} />
              <span className="flex-1 text-left text-xs text-ox-text">{profile.name}</span>
              {profile.id === activeProfile.id ? (
                <Check size={12} className="text-ox-accent flex-shrink-0" />
              ) : profiles.length > 1 && profile.id !== 'default' ? (
                <button
                  onClick={(e) => handleDelete(profile.id, e)}
                  className="p-0.5 text-ox-text-muted hover:text-red-400 transition-colors flex-shrink-0"
                  title="Delete profile"
                >
                  <Trash2 size={11} />
                </button>
              ) : null}
            </div>
          ))}

          <div className="border-t border-ox-border mt-1.5 pt-1.5 px-2">
            {isAdding ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd()
                    if (e.key === 'Escape') { setIsAdding(false); setNewName('') }
                  }}
                  placeholder="Profile name"
                  className="flex-1 bg-ox-bg border border-ox-border rounded-md px-2 py-1 text-xs text-ox-text outline-none focus:border-ox-text-muted select-text"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="text-[10px] text-ox-text-secondary hover:text-ox-text disabled:opacity-30 transition-colors"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center gap-1.5 px-1 py-1.5 text-xs text-ox-text-muted hover:text-ox-text hover:bg-ox-surface-hover rounded-md transition-colors"
              >
                <Plus size={12} />
                Create profile
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
