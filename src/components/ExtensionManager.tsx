import { useEffect, useState, useCallback } from 'react'
import { Puzzle, Plus, Trash2, ToggleLeft, ToggleRight, FolderOpen, AlertCircle, Download, Store, Search, ArrowLeft, Check, Loader2 } from 'lucide-react'

const SUGGESTED_EXTENSIONS = [
  {
    id: 'cjpalhdlnbpafiamejdnhcphjbkeiagm',
    name: 'uBlock Origin',
    desc: 'Efficient ad blocker. Fire and forget.',
    icon: 'UB',
  },
  {
    id: 'gcbommkclmclpchllfjekcdonpmejbdp',
    name: 'HTTPS Everywhere',
    desc: 'Encrypt the web. Automatically use HTTPS.',
    icon: 'HE',
  },
  {
    id: 'hfjbmagddngcpeloejdejnfgbamkjaeg',
    name: 'Vimium',
    desc: 'Keyboard shortcuts for browsing.',
    icon: 'VI',
  },
  {
    id: 'gebbhagfogifgggkldgodflihgfeippi',
    name: 'Return YouTube Dislike',
    desc: 'Brings back the dislike count on YouTube.',
    icon: 'RY',
  },
  {
    id: 'dbepggeogbaibhgnhhndojpepiihcmeb',
    name: 'Vimium',
    desc: 'The Hacker\'s Browser. Full keyboard control.',
    icon: 'VM',
  },
  {
    id: 'mnjggcdmjocbbbhaepdhchncahnbgone',
    name: 'SponsorBlock',
    desc: 'Skip sponsorships in YouTube videos.',
    icon: 'SB',
  },
  {
    id: 'efaidnbmnnnibpcajpcglclefindmkaj',
    name: 'Adobe Acrobat PDF',
    desc: 'View, edit, and sign PDFs.',
    icon: 'AD',
  },
  {
    id: 'nngceckbapebfimnlniiiahkandclblb',
    name: 'Bitwarden',
    desc: 'Free password manager.',
    icon: 'BW',
  },
  {
    id: 'kgjfgplpablkjnlkjmjdecgdpfankdle',
    name: 'Zoom Scheduler',
    desc: 'Schedule Zoom meetings from Google Calendar.',
    icon: 'ZS',
  },
  {
    id: 'gighmmpiobklfepjocnamgkkbiglidom',
    name: 'AdBlock',
    desc: 'The original ad blocker. Block ads on all sites.',
    icon: 'AB',
  },
  {
    id: 'bcjindcccaagfpapjjmafapmmgkkhgoa',
    name: 'JSON Formatter',
    desc: 'Makes JSON easy to read. Open source.',
    icon: 'JF',
  },
  {
    id: 'fmkadmapgofadopljbjfkapdkoienihi',
    name: 'React DevTools',
    desc: 'Debug React apps. Required for devs.',
    icon: 'RT',
  },
]

function extractId(input: string): string | null {
  const m = input.match(/([a-z]{32})/)
  return m ? m[1] : null
}

export function ExtensionManager() {
  const [extensions, setExtensions] = useState<ExtensionData[]>([])
  const [error, setError] = useState('')
  const [storeUrl, setStoreUrl] = useState('')
  const [installing, setInstalling] = useState<Set<string>>(new Set())
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [showStore, setShowStore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const load = useCallback(() => {
    window.electronAPI?.getExtensions().then((exts) => {
      setExtensions(exts)
      setInstalledIds(new Set(exts.map((e) => e.id)))
    })
  }, [])

  useEffect(() => { load() }, [load])

  const handlePickAndLoad = async () => {
    setError('')
    try {
      const picked = await window.electronAPI?.pickExtension()
      if (!picked) return
      await window.electronAPI?.loadExtension(picked.path)
      load()
    } catch (err: any) {
      setError(err.message || 'Failed to load extension')
    }
  }

  const handleToggle = async (ext: ExtensionData) => {
    try {
      await window.electronAPI?.toggleExtension(ext.id, !ext.enabled)
      load()
    } catch (err: any) {
      setError(err.message || 'Failed to toggle extension')
    }
  }

  const handleRemove = async (ext: ExtensionData) => {
    try {
      await window.electronAPI?.removeExtension(ext.id)
      load()
    } catch (err: any) {
      setError(err.message || 'Failed to remove extension')
    }
  }

  const handleInstallFromStore = async (input: string) => {
    setError('')
    try {
      const parsed = await window.electronAPI?.parseStoreUrl(input)
      if (!parsed) { setError('Invalid URL or extension ID'); return }
      const id = parsed.id
      setInstalling((prev) => new Set(prev).add(id))
      await window.electronAPI?.installFromStore(input)
      setInstalledIds((prev) => new Set(prev).add(id))
      setInstalling((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      load()
    } catch (err: any) {
      setError(err.message || 'Install failed')
      setInstalling((prev) => {
        const next = new Set(prev)
        const parsed = extractId(input)
        if (parsed) next.delete(parsed)
        return next
      })
    }
  }

  const filteredSuggestions = SUGGESTED_EXTENSIONS.filter(
    (ext) =>
      !searchTerm ||
      ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ext.desc.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-ox-text-muted uppercase tracking-wider">
          {showStore ? (
            <button onClick={() => setShowStore(false)} className="flex items-center gap-1 hover:text-ox-text transition-colors">
              <ArrowLeft size={12} />
              Back
            </button>
          ) : (
            <>
              <Puzzle size={14} /> Extensions
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!showStore && (
            <button
              onClick={handlePickAndLoad}
              className="flex items-center gap-1 text-xs text-ox-text-muted hover:text-ox-text transition-colors"
            >
              <FolderOpen size={12} />
              Load
            </button>
          )}
          <button
            onClick={() => { setShowStore(!showStore); setSearchTerm('') }}
            className={`flex items-center gap-1 text-xs transition-colors ${
              showStore ? 'text-ox-text' : 'text-ox-text-muted hover:text-ox-text'
            }`}
          >
            <Store size={12} />
            {showStore ? 'Installed' : 'Store'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded-xl px-3 py-2 mb-3">
          <AlertCircle size={12} />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-ox-text-muted hover:text-ox-text">Dismiss</button>
        </div>
      )}

      {showStore ? (
        <div>
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2 bg-ox-bg border border-ox-border rounded-xl px-3 py-2 focus-within:border-ox-text-muted transition-colors">
              <Search size={14} className="text-ox-text-muted flex-shrink-0" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search extensions..."
                className="flex-1 bg-transparent text-sm text-ox-text outline-none placeholder-ox-text-muted select-text"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-ox-text-muted">Chrome Web Store URL:</span>
              <input
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="https://chromewebstore.google.com/detail/..."
                className="flex-1 bg-ox-bg border border-ox-border rounded-lg px-2.5 py-1.5 text-xs text-ox-text outline-none focus:border-ox-text-muted select-text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && storeUrl) { handleInstallFromStore(storeUrl); setStoreUrl('') }
                }}
              />
              <button
                onClick={() => { handleInstallFromStore(storeUrl); setStoreUrl('') }}
                disabled={!storeUrl || installing.size > 0}
                className="flex-shrink-0 px-2.5 py-1.5 bg-ox-surface-active rounded-lg text-xs text-ox-text hover:bg-ox-surface-hover transition-colors disabled:opacity-30"
              >
                Install
              </button>
            </div>
          </div>

          <div className="text-[10px] text-ox-text-muted mb-2">Suggested</div>
          <div className="space-y-1.5">
            {filteredSuggestions.map((ext) => {
              const isInstalled = installedIds.has(ext.id)
              const isInstalling = installing.has(ext.id)
              const storeUrl = `https://chromewebstore.google.com/detail/example/${ext.id}`
              return (
                <div
                  key={ext.id}
                  className="flex items-center gap-3 bg-ox-bg border border-ox-border rounded-xl px-3 py-2.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-ox-surface-active border border-ox-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-ox-text-secondary">{ext.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-ox-text truncate font-medium">{ext.name}</div>
                    <div className="text-[10px] text-ox-text-muted truncate">{ext.desc}</div>
                  </div>
                  {isInstalled ? (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 flex-shrink-0">
                      <Check size={12} />
                      Installed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInstallFromStore(storeUrl)}
                      disabled={isInstalling}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-ox-surface-active rounded-lg text-xs text-ox-text hover:bg-ox-surface-hover transition-colors flex-shrink-0 disabled:opacity-40"
                    >
                      {isInstalling ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Download size={12} />
                      )}
                      {isInstalling ? '...' : 'Install'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <>
          {extensions.length === 0 && (
            <div className="text-xs text-ox-text-muted bg-ox-bg border border-ox-border rounded-xl px-3 py-4 text-center">
              <Puzzle size={20} className="mx-auto mb-1.5 opacity-30" />
              <p className="mb-1">No extensions installed</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePickAndLoad}
                  className="inline-flex items-center gap-1 text-ox-text-secondary hover:text-ox-text transition-colors"
                >
                  <FolderOpen size={11} />
                  Load unpacked
                </button>
                <button
                  onClick={() => setShowStore(true)}
                  className="inline-flex items-center gap-1 text-ox-text-secondary hover:text-ox-text transition-colors"
                >
                  <Store size={11} />
                  Browse store
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {extensions.map((ext) => (
              <div
                key={ext.id}
                className="flex items-center gap-3 bg-ox-bg border border-ox-border rounded-xl px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ox-text truncate">{ext.name}</div>
                  <div className="text-[10px] text-ox-text-muted">{ext.version}</div>
                </div>
                <button
                  onClick={() => handleToggle(ext)}
                  className={`p-1 rounded-lg transition-colors ${
                    ext.enabled
                      ? 'text-emerald-400 hover:bg-emerald-400/10'
                      : 'text-ox-text-muted hover:bg-ox-surface-hover'
                  }`}
                  title={ext.enabled ? 'Disable' : 'Enable'}
                >
                  {ext.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button
                  onClick={() => handleRemove(ext)}
                  className="p-1 text-ox-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


