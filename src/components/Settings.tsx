import { useEffect, useState } from 'react'
import { X, Shield, Trash2, Globe, Keyboard } from 'lucide-react'
import { useSettingsStore } from '../stores/settings'
import { PRIVACY_LEVELS } from '../utils/constants'
import { ExtensionManager } from './ExtensionManager'
import { PasswordManager } from './PasswordManager'

interface SettingsProps {
  onClose: () => void
}

export function Settings({ onClose }: SettingsProps) {
  const { privacyLevel, searchEngine, setPrivacyLevel, setSearchEngine } = useSettingsStore()
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => {
    window.electronAPI?.getHistory().then((h) => setHistoryCount(h.length))
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-ox-surface border border-ox-border rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-ox-border">
            <h2 className="text-base font-semibold text-ox-text">Settings</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#1a1a1a] rounded-lg transition-colors text-ox-text-muted hover:text-ox-text"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <section>
              <h3 className="text-xs font-semibold text-ox-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield size={14} /> Privacy Level
              </h3>
              <div className="space-y-1.5">
                {Object.entries(PRIVACY_LEVELS).map(([key, val]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      privacyLevel === key
                        ? 'bg-ox-surface-active text-ox-text'
                        : 'text-ox-text-secondary hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value={key}
                      checked={privacyLevel === key}
                      onChange={() => setPrivacyLevel(key)}
                      className="accent-ox-accent"
                    />
                    <div>
                      <div className="text-sm font-medium">{val.label}</div>
                      <div className="text-[11px] text-ox-text-muted">{val.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ox-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe size={14} /> Search Engine
              </h3>
              <select
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value)}
                className="w-full bg-ox-bg border border-ox-border rounded-xl px-3 py-2.5 text-sm text-ox-text outline-none focus:border-ox-text-muted transition-colors"
              >
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="google">Google</option>
                <option value="brave">Brave Search</option>
                <option value="bing">Bing</option>
              </select>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ox-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trash2 size={14} /> Data
              </h3>
              <button
                onClick={async () => { await window.electronAPI?.clearHistory(); setHistoryCount(0) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-ox-bg border border-ox-border rounded-xl text-sm text-ox-text-secondary hover:text-ox-text hover:bg-[#1a1a1a] transition-colors"
              >
                <Trash2 size={14} />
                Clear browsing history ({historyCount} entries)
              </button>
            </section>

            <section>
              <ExtensionManager />
            </section>

            <section>
              <PasswordManager />
            </section>

            <section>
              <h3 className="text-xs font-semibold text-ox-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Keyboard size={14} /> Shortcuts
              </h3>
              <div className="text-xs text-ox-text-muted space-y-1.5 bg-ox-bg rounded-xl p-3 border border-ox-border">
                {[
                  ['Ctrl+T', 'New tab'],
                  ['Ctrl+W', 'Close tab'],
                  ['Ctrl+L', 'Focus URL bar'],
                  ['Ctrl+F', 'Find in page'],
                  ['Ctrl+H', 'History sidebar'],
                  ['Ctrl+R / F5', 'Reload'],
                  ['Ctrl+D', 'Bookmark page'],
                  ['Ctrl+Tab', 'Next tab'],
                  ['Ctrl+1-9', 'Switch to tab'],
                  ['Escape', 'Close find bar / stop loading'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <kbd className="bg-ox-surface border border-ox-border rounded-md px-2 py-0.5 text-[10px] text-ox-text font-mono">{key}</kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-3 border-t border-ox-border">
              <div className="text-[11px] text-ox-text-muted space-y-0.5">
                <p>Oxium Browser v0.1.0</p>
                <p>Electron + React · Ad blocking by Ghostery</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
