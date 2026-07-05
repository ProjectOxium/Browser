import { useEffect, useState } from 'react'
import { Puzzle } from 'lucide-react'

interface ToolbarExt {
  id: string
  name: string
  icon: string
  popup: string
}

interface ToolbarExtensionsProps {
  onNavigate: (url: string) => void
}

export function ToolbarExtensions({ onNavigate }: ToolbarExtensionsProps) {
  const [exts, setExts] = useState<ToolbarExt[]>([])

  useEffect(() => {
    window.electronAPI?.getToolbarExtensions().then(setExts)
  }, [])

  if (exts.length === 0) return null

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <div className="w-px h-5 bg-ox-border mx-0.5" />
      {exts.map((ext) => (
        <button
          key={ext.id}
          onClick={() => { if (ext.popup) onNavigate(ext.popup) }}
          className={`w-7 h-7 rounded-lg transition-colors flex items-center justify-center ${ext.popup ? 'hover:bg-[#1a1a1a]' : ''}`}
          title={ext.name + (ext.popup ? '' : ' (no popup)')}
        >
          {ext.icon ? (
            <img src={ext.icon} alt={ext.name} className="w-4 h-4" />
          ) : (
            <Puzzle size={14} className="text-ox-text-muted" />
          )}
        </button>
      ))}
    </div>
  )
}
