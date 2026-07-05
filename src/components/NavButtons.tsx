import { ArrowLeft, ArrowRight, RotateCw, X } from 'lucide-react'
import { useTabStore } from '../stores/tabs'

interface NavButtonsProps {
  onBack: () => void
  onForward: () => void
  onReload: () => void
  onStop: () => void
}

export function NavButtons({ onBack, onForward, onReload, onStop }: NavButtonsProps) {
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <button
        onClick={onBack}
        disabled={!activeTab?.canGoBack}
        className="p-1.5 rounded-md transition-colors text-ox-text-muted hover:bg-[#1a1a1a] hover:text-ox-text disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title="Back (Alt+Left)"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        onClick={onForward}
        disabled={!activeTab?.canGoForward}
        className="p-1.5 rounded-md transition-colors text-ox-text-muted hover:bg-[#1a1a1a] hover:text-ox-text disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title="Forward (Alt+Right)"
      >
        <ArrowRight size={16} />
      </button>
      {activeTab?.isLoading ? (
        <button
          onClick={onStop}
          className="p-1.5 rounded-md transition-colors text-ox-text-muted hover:bg-[#1a1a1a] hover:text-ox-text"
          title="Stop (Esc)"
        >
          <X size={16} />
        </button>
      ) : (
        <button
          onClick={onReload}
          className="p-1.5 rounded-md transition-colors text-ox-text-muted hover:bg-[#1a1a1a] hover:text-ox-text"
          title="Reload (Ctrl+R)"
        >
          <RotateCw size={16} />
        </button>
      )}
    </div>
  )
}
