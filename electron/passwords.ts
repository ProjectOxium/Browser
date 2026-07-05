import { app, safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

interface PasswordEntry {
  id: string
  name: string
  url: string
  username: string
  password: string
  createdAt: number
}

interface VaultData {
  entries: PasswordEntry[]
}

interface EncryptedVault {
  salt: string
  iv: string
  tag: string
  data: string
  hash: string
}

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const PBKDF2_ITERATIONS = 600000

let vaultPath = ''
let masterKey: Buffer | null = null
let storedKeyPath = ''

export function initPasswords() {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) mkdirSync(userDataPath, { recursive: true })
  vaultPath = join(userDataPath, 'oxium-passwords.enc')
  storedKeyPath = join(userDataPath, 'oxium-vault-key.enc')

  if (existsSync(storedKeyPath) && existsSync(vaultPath) && safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = readFileSync(storedKeyPath)
      const decrypted = safeStorage.decryptString(encrypted)
      masterKey = Buffer.from(decrypted, 'hex')
    } catch {
      masterKey = null
    }
  }
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
}

function encrypt(data: string, key: Buffer): EncryptedVault {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return {
    salt: '',
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted,
    hash: '',
  }
}

function decrypt(vault: EncryptedVault, key: Buffer): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(vault.iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(vault.tag, 'hex'))
  let decrypted = decipher.update(vault.data, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function readVault(): EncryptedVault | null {
  if (!existsSync(vaultPath)) return null
  try {
    return JSON.parse(readFileSync(vaultPath, 'utf-8'))
  } catch {
    return null
  }
}

function writeVault(data: VaultData) {
  if (!masterKey) throw new Error('Vault is locked')
  const json = JSON.stringify(data)
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = crypto.pbkdf2Sync(masterKey.toString('hex'), salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
  const encrypted = encrypt(json, key)
  encrypted.salt = salt.toString('hex')
  writeFileSync(vaultPath, JSON.stringify(encrypted, null, 2))
}

function getEntries(): PasswordEntry[] {
  const vault = readVault()
  if (!vault || !masterKey) return []

  const key = crypto.pbkdf2Sync(
    masterKey.toString('hex'),
    Buffer.from(vault.salt, 'hex'),
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha512'
  )

  try {
    const decrypted = decrypt(vault, key)
    const data: VaultData = JSON.parse(decrypted)
    return data.entries
  } catch {
    return []
  }
}

export function setMasterPassword(password: string): boolean {
  if (password.length < 6) return false
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = deriveKey(password, salt)
  masterKey = key

  const hash = crypto.createHash('sha256').update(key).digest('hex')

  const vault: VaultData = { entries: [] }
  const json = JSON.stringify(vault)
  const storageKey = crypto.pbkdf2Sync(key.toString('hex'), salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
  const encrypted = encrypt(json, storageKey)
  encrypted.salt = salt.toString('hex')
  encrypted.hash = hash
  writeFileSync(vaultPath, JSON.stringify(encrypted, null, 2))

  if (safeStorage.isEncryptionAvailable()) {
    writeFileSync(storedKeyPath, safeStorage.encryptString(key.toString('hex')))
  }
  return true
}

export function unlockVault(password: string): boolean {
  const vault = readVault()
  if (!vault) return false
  const salt = Buffer.from(vault.salt, 'hex')
  const key = deriveKey(password, salt)
  const testKey = crypto.pbkdf2Sync(key.toString('hex'), salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
  try {
    decrypt(vault, testKey)
    masterKey = key

    if (safeStorage.isEncryptionAvailable()) {
      writeFileSync(storedKeyPath, safeStorage.encryptString(key.toString('hex')))
    }
    return true
  } catch {
    return false
  }
}

export function isVaultLocked(): boolean {
  return masterKey === null
}

export function hasVault(): boolean {
  return existsSync(vaultPath)
}

export function getPasswords(): PasswordEntry[] {
  return getEntries()
}

export function addPassword(entry: { name: string; url: string; username: string; password: string }): PasswordEntry {
  const entries = getEntries()
  const pw: PasswordEntry = {
    id: Date.now().toString(36),
    name: entry.name,
    url: entry.url,
    username: entry.username,
    password: entry.password,
    createdAt: Date.now(),
  }
  entries.push(pw)
  writeVault({ entries })
  return pw
}

export function updatePassword(id: string, updates: Partial<PasswordEntry>) {
  const entries = getEntries()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx < 0) return
  entries[idx] = { ...entries[idx], ...updates }
  writeVault({ entries })
}

export function deletePassword(id: string) {
  const entries = getEntries().filter((e) => e.id !== id)
  writeVault({ entries })
}

export function lockVault() {
  masterKey = null
  try { if (existsSync(storedKeyPath)) unlinkSync(storedKeyPath) } catch { /* ok */ }
}

export function importCSV(csvText: string): number {
  const entries = getEntries()
  const lines = csvText.split('\n').filter((l) => l.trim())
  let count = 0

  // Detect header: name,url,username,password
  const header = lines[0].toLowerCase()
  let nameIdx = 0, urlIdx = 1, userIdx = 2, passIdx = 3

  if (header.includes('name') || header.includes('url') || header.includes('username')) {
    const cols = parseCSVLine(lines[0])
    nameIdx = cols.findIndex((c: string) => c.includes('name'))
    urlIdx = cols.findIndex((c: string) => c.includes('url'))
    userIdx = cols.findIndex((c: string) => c.includes('username') || c.includes('login') || c.includes('user'))
    passIdx = cols.findIndex((c: string) => c.includes('password') || c.includes('pass'))
    lines.shift()
  }

  for (const line of lines) {
    const cols = parseCSVLine(line)
    const name = (cols[nameIdx] || '').trim()
    const url = (cols[Math.max(0, urlIdx)] || '').trim()
    const username = (cols[Math.max(0, userIdx)] || '').trim()
    const password = (cols[Math.max(0, passIdx)] || '').trim()

    if (!username && !password) continue
    if (!url && !name) continue

    entries.push({
      id: Date.now().toString(36) + count,
      name: name || url || 'Imported',
      url: url || '',
      username,
      password,
      createdAt: Date.now(),
    })
    count++
  }

  writeVault({ entries })
  return count
}

export function exportCSV(): string {
  const entries = getEntries()
  const lines = ['name,url,username,password']
  for (const e of entries) {
    lines.push([
      escapeCSV(e.name),
      escapeCSV(e.url),
      escapeCSV(e.username),
      escapeCSV(e.password),
    ].join(','))
  }
  return lines.join('\n')
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}
