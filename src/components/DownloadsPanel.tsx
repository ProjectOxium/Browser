import { Download, X, CheckCircle, XCircle } from 'lucide-react'

interface DownloadsPanelProps {
  items: DownloadData[]
  isOpen: boolean
  onClose: () => void
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '...'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DownloadsPanel({ items, isOpen, onClose }: DownloadsPanelProps) {
  if (!isOpen || items.length === 0) return null

  return (
    <div className="fixed right-4 bottom-4 z-30 w-80 bg-ox-surface border border-ox-border rounded-xl shadow-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ox-text">
          <Download size={14} />
          Downloads ({items.length})
        </div>
        <button onClick={onClose} className="p-1 hover:bg-ox-surface-hover rounded-lg transition-colors text-ox-text-muted hover:text-ox-text">
          <X size={14} />
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="text-xs">
            <div className="text-ox-text truncate mb-1 font-medium">{item.filename}</div>
            {item.state === 'progressing' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-ox-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ox-accent rounded-full transition-all duration-300"
                      style={{ width: `${item.totalBytes ? Math.min((item.receivedBytes / item.totalBytes) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-ox-text-muted tabular-nums w-12 text-right">
                    {item.totalBytes ? Math.round((item.receivedBytes / item.totalBytes) * 100) + '%' : '...'}
                  </span>
                </div>
                <div className="text-[10px] text-ox-text-muted">
                  {formatBytes(item.receivedBytes)} / {item.totalBytes ? formatBytes(item.totalBytes) : 'unknown'}
                </div>
              </div>
            )}
            {item.state === 'completed' && (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle size={10} />
                Download complete
              </div>
            )}
            {item.state === 'interrupted' && (
              <div className="flex items-center gap-1 text-amber-400">
                <XCircle size={10} />
                Interrupted
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
