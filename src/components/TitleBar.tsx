import { Minus, Square, X, Settings as SettingsIcon } from 'lucide-react'
import { ProfileSwitcher } from './ProfileSwitcher'

interface TitleBarProps {
  onOpenSettings: () => void
}

export function TitleBar({ onOpenSettings }: TitleBarProps) {
  return (
    <div className="titlebar-drag h-9 flex items-center justify-between bg-ox-bg px-2 border-b border-ox-border select-none">
      <div className="flex items-center gap-2 pl-2 titlebar-no-drag">
        <span className="text-ox-text text-xs font-semibold tracking-wider opacity-70">OXIUM BROWSER</span>
        <ProfileSwitcher />
      </div>
      <div className="titlebar-no-drag flex items-center">
        <button
          onClick={onOpenSettings}
          className="p-1.5 hover:bg-[#1a1a1a] rounded-md transition-colors text-ox-text-muted hover:text-ox-text"
          title="Settings"
        >
          <SettingsIcon size={14} />
        </button>
        <button
          onClick={() => window.electronAPI?.minimizeWindow()}
          className="p-1.5 hover:bg-[#1a1a1a] rounded-md transition-colors text-ox-text-muted hover:text-ox-text"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.electronAPI?.maximizeWindow()}
          className="p-1.5 hover:bg-[#1a1a1a] rounded-md transition-colors text-ox-text-muted hover:text-ox-text"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => window.electronAPI?.closeWindow()}
          className="p-1.5 hover:bg-red-500/30 rounded-md transition-colors text-ox-text-muted hover:text-red-400 ml-0.5"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
