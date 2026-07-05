import { useEffect, useState, useCallback } from 'react'
import { Key, Lock, Eye, EyeOff, Plus, Trash2, Upload, Download, Copy, Check, Search } from 'lucide-react'

export function PasswordManager() {
  const [hasVault, setHasVault] = useState(false)
  const [isLocked, setIsLocked] = useState(true)
  const [mp, setMp] = useState('')
  const [mpConfirm, setMpConfirm] = useState('')
  const [status, setStatus] = useState('')
  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', url: '', username: '', password: '' })
  const [showPassword, setShowPassword] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI?.hasVault().then(setHasVault)
    window.electronAPI?.isLocked().then(setIsLocked)
  }, [])

  const loadEntries = useCallback(() => {
    window.electronAPI?.getPasswords().then(setEntries)
  }, [])

  useEffect(() => {
    if (!isLocked && hasVault) loadEntries()
  }, [isLocked, hasVault])

  const handleCreateVault = async () => {
    if (mp.length < 6) { setStatus('Password must be at least 6 characters'); return }
    if (mp !== mpConfirm) { setStatus('Passwords do not match'); return }
    const ok = await window.electronAPI?.setMasterPassword(mp)
    if (ok) {
      setHasVault(true)
      setIsLocked(false)
      setMp('')
      setMpConfirm('')
      setStatus('')
      loadEntries()
    } else {
      setStatus('Failed to create vault')
    }
  }

  const handleUnlock = async () => {
    const ok = await window.electronAPI?.unlockVault(mp)
    if (ok) {
      setIsLocked(false)
      setMp('')
      setStatus('')
      loadEntries()
    } else {
      setStatus('Wrong password')
    }
  }

  const handleLock = async () => {
    await window.electronAPI?.lockVault()
    setIsLocked(true)
    setEntries([])
    setShowAdd(false)
    setEditingId(null)
  }

  const handleAdd = async () => {
    if (!form.name && !form.url) return
    try {
      if (editingId) {
        await window.electronAPI?.updatePassword(editingId, form)
        setEditingId(null)
      } else {
        await window.electronAPI?.addPassword(form)
      }
      setForm({ name: '', url: '', username: '', password: '' })
      setShowAdd(false)
      loadEntries()
    } catch (err: any) {
      setStatus('Save failed: ' + (err.message || 'Unknown error'))
    }
  }

  const handleEdit = (entry: PasswordEntry) => {
    setForm({ name: entry.name, url: entry.url, username: entry.username, password: entry.password })
    setEditingId(entry.id)
    setShowAdd(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await window.electronAPI?.deletePassword(id)
      loadEntries()
    } catch (err: any) {
      setStatus('Delete failed')
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const count = await window.electronAPI?.importPasswordsCSV(text)
        setStatus(`Imported ${count} passwords`)
        loadEntries()
      } catch (err: any) {
        setStatus('Import failed: ' + err.message)
      }
    }
    input.click()
  }

  const handleExport = async () => {
    const csv = await window.electronAPI?.exportPasswordsCSV()
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'oxium-passwords.csv'
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Passwords exported')
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch { /* clipboard denied */ }
  }

  const filtered = entries.filter((e) =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.url.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase())
  )

  // Setup screen
  if (!hasVault) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-ox-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Key size={14} /> Password Manager
        </h3>
        <div className="bg-ox-bg border border-ox-border rounded-xl p-4 space-y-3">
          <p className="text-xs text-ox-text-secondary">
            Set a master password to encrypt and protect your saved passwords.
          </p>
          <input
            type="password"
            value={mp}
            onChange={(e) => setMp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateVault()}
            placeholder="Master password (min 6 chars)"
            className="w-full bg-ox-surface border border-ox-border rounded-lg px-3 py-2 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
          />
          <input
            type="password"
            value={mpConfirm}
            onChange={(e) => setMpConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateVault()}
            placeholder="Confirm master password"
            className="w-full bg-ox-surface border border-ox-border rounded-lg px-3 py-2 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
          />
          {status && <div className="text-xs text-amber-400">{status}</div>}
          <button
            onClick={handleCreateVault}
            className="w-full py-2 bg-ox-surface-active rounded-lg text-sm text-ox-text hover:bg-ox-surface-hover transition-colors"
          >
            Create Vault
          </button>
        </div>
      </div>
    )
  }

  // Unlock screen
  if (isLocked) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-ox-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Lock size={14} /> Vault Locked
        </h3>
        <div className="bg-ox-bg border border-ox-border rounded-xl p-4 space-y-3">
          <input
            type="password"
            value={mp}
            onChange={(e) => setMp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Master password"
            className="w-full bg-ox-surface border border-ox-border rounded-lg px-3 py-2 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
          />
          {status && <div className="text-xs text-amber-400">{status}</div>}
          <button
            onClick={handleUnlock}
            className="w-full py-2 bg-ox-surface-active rounded-lg text-sm text-ox-text hover:bg-ox-surface-hover transition-colors"
          >
            Unlock
          </button>
        </div>
      </div>
    )
  }

  // Main view
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-ox-text-muted uppercase tracking-wider flex items-center gap-2">
          <Key size={14} /> Passwords ({entries.length})
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={handleImport} className="p-1 text-ox-text-muted hover:text-ox-text transition-colors" title="Import CSV">
            <Upload size={12} />
          </button>
          <button onClick={handleExport} className="p-1 text-ox-text-muted hover:text-ox-text transition-colors" title="Export CSV">
            <Download size={12} />
          </button>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', url: '', username: '', password: '' }) }}
            className="p-1 text-ox-text-muted hover:text-ox-text transition-colors"
            title="Add password"
          >
            <Plus size={14} />
          </button>
          <button onClick={handleLock} className="p-1 text-ox-text-muted hover:text-amber-400 transition-colors" title="Lock vault">
            <Lock size={13} />
          </button>
        </div>
      </div>

      {status && <div className="text-xs text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 rounded-lg px-3 py-1.5 mb-3">{status}</div>}

      {showAdd && (
        <div className="bg-ox-bg border border-ox-border rounded-xl p-3 mb-3 space-y-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Site name"
            className="w-full bg-ox-surface border border-ox-border rounded-lg px-3 py-1.5 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="URL"
            className="w-full bg-ox-surface border border-ox-border rounded-lg px-3 py-1.5 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex gap-2">
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
              className="flex-1 bg-ox-surface border border-ox-border rounded-lg px-3 py-1.5 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              className="flex-1 bg-ox-surface border border-ox-border rounded-lg px-3 py-1.5 text-sm text-ox-text outline-none focus:border-ox-text-muted select-text"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-1.5 bg-ox-surface-active rounded-lg text-sm text-ox-text hover:bg-ox-surface-hover transition-colors">
              {editingId ? 'Update' : 'Save'}
            </button>
            <button onClick={() => { setShowAdd(false); setEditingId(null) }} className="px-4 py-1.5 text-sm text-ox-text-muted hover:text-ox-text transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center gap-2 bg-ox-bg border border-ox-border rounded-lg px-3 py-1.5">
          <Search size={13} className="text-ox-text-muted flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search passwords..."
            className="flex-1 bg-transparent text-sm text-ox-text outline-none placeholder-ox-text-muted select-text"
          />
        </div>
      </div>

      {filtered.length === 0 && !search && (
        <div className="text-xs text-ox-text-muted text-center py-4 bg-ox-bg border border-ox-border rounded-xl">
          No saved passwords. Add one or import a CSV.
        </div>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {filtered.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2 bg-ox-bg border border-ox-border rounded-xl px-3 py-2">
            <div className="flex-1 min-w-0" onClick={() => handleEdit(entry)} style={{ cursor: 'pointer' }}>
              <div className="text-xs text-ox-text truncate font-medium">{entry.name || entry.url}</div>
              <div className="text-[10px] text-ox-text-muted truncate">{entry.username}</div>
            </div>
            <button
              onClick={() => {
                if (showPassword.has(entry.id)) {
                  const next = new Set(showPassword); next.delete(entry.id); setShowPassword(next)
                } else {
                  setShowPassword(new Set(showPassword).add(entry.id))
                }
              }}
              className="p-1 text-ox-text-muted hover:text-ox-text transition-colors flex-shrink-0"
            >
              {showPassword.has(entry.id) ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              onClick={() => copyToClipboard(entry.password, entry.id)}
              className="p-1 text-ox-text-muted hover:text-ox-text transition-colors flex-shrink-0"
              title="Copy password"
            >
              {copiedId === entry.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            <button
              onClick={() => handleDelete(entry.id)}
              className="p-1 text-ox-text-muted hover:text-red-400 transition-colors flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
