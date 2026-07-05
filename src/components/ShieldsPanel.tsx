import { Shield, ShieldCheck, ShieldAlert, Info } from 'lucide-react'
import { usePrivacyStore } from '../stores/privacy'
import { useSettingsStore } from '../stores/settings'
import { useTabStore } from '../stores/tabs'
import { PRIVACY_LEVELS } from '../utils/constants'

export function ShieldsPanel() {
  const { isShieldsOpen, toggleShields } = usePrivacyStore()
  const { privacyLevel, setPrivacyLevel } = useSettingsStore()
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  const level = PRIVACY_LEVELS[privacyLevel as keyof typeof PRIVACY_LEVELS] ?? PRIVACY_LEVELS.balanced
  const Icon = privacyLevel === 'strict' ? ShieldCheck : privacyLevel === 'relaxed' ? ShieldAlert : Shield
  const blockedCount = activeTab?.blockedCount ?? 0

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={toggleShields}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs ${
          blockedCount > 0
            ? 'text-amber-300 hover:bg-amber-300/10'
            : 'text-ox-text-muted hover:bg-[#1a1a1a] hover:text-ox-text'
        }`}
        title={`${level.label} — ${blockedCount} blocked`}
      >
        <Icon size={15} />
        {blockedCount > 0 && <span className="font-medium tabular-nums">{blockedCount}</span>}
      </button>

      {isShieldsOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={toggleShields} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-72 bg-ox-surface border border-ox-border rounded-xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-ox-text" />
                <span className="text-sm font-semibold text-ox-text">Shields</span>
              </div>
              <span className="text-[10px] text-ox-text-muted uppercase tracking-wider">{level.label}</span>
            </div>

            <div className="space-y-1 mb-3">
              {Object.entries(PRIVACY_LEVELS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setPrivacyLevel(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    privacyLevel === key
                      ? 'bg-ox-surface-active text-ox-text'
                      : 'text-ox-text-secondary hover:bg-[#1a1a1a] hover:text-ox-text'
                  }`}
                >
                  <div className="font-medium">{val.label}</div>
                  <div className="text-xs text-ox-text-muted">{val.description}</div>
                </button>
              ))}
            </div>

            <div className="border-t border-ox-border pt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-ox-text-muted">
                <span>Trackers blocked on this page</span>
                <span className="text-ox-text font-medium tabular-nums">{blockedCount}</span>
              </div>
              {blockedCount === 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-ox-text-muted">
                  <Info size={10} />
                  No trackers detected on this page
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
