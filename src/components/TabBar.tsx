import { useCallback, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { useTabStore } from '../stores/tabs'

export function TabBar() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleTabClick = useCallback((id: string) => setActiveTab(id), [setActiveTab])
  const handleTabClose = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeTab(id)
  }, [removeTab])
  const handleAddTab = useCallback(() => addTab('about:blank'), [addTab])

  return (
    <div className="flex items-center bg-ox-bg px-1 pt-0.5">
      <div ref={scrollRef} className="flex-1 flex items-center overflow-x-auto gap-0.5 px-1">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                group/tab flex items-center gap-1.5 px-3 py-1.5
                min-w-0 max-w-48 cursor-pointer rounded-t-lg
                transition-all duration-150 text-sm select-none
                ${active
                  ? 'bg-ox-surface text-ox-text border border-ox-border border-b-transparent -mb-px'
                  : 'bg-transparent text-ox-text-muted border border-transparent hover:bg-[#1a1a1a] hover:text-ox-text-secondary'}
              `}
            >
              <span className="truncate text-xs flex-1">{tab.title || 'New Tab'}</span>
              <button
                onClick={(e) => handleTabClose(e, tab.id)}
                className="p-0.5 rounded hover:bg-[#333] opacity-0 group-hover/tab:opacity-100 transition-all flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>
      <button
        onClick={handleAddTab}
        className="flex-shrink-0 p-1.5 mx-0.5 rounded-md hover:bg-[#1a1a1a] transition-colors text-ox-text-muted hover:text-ox-text"
        title="New tab (Ctrl+T)"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
