import { app, session, net } from 'electron'
import { join, dirname, basename } from 'path'
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'fs'
import zlib from 'zlib'

function getExtensionId(url: string): string | null {
  const patterns = [
    /chrome\.google\.com\/webstore\/detail\/[^/]+\/([a-z]{32})/,
    /chromewebstore\.google\.com\/detail\/[^/]+\/([a-z]{32})/,
    /^([a-z]{32})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function downloadCrx(id: string): Promise<Buffer> {
  const version = '130.0.0.0'
  const url = `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&prodversion=${version}&x=id%3D${id}%26installsource%3Dondemand%26uc`

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.abort()
      reject(new Error('Download timed out after 60s'))
    }, 60000)

    const req = net.request({ url, redirect: 'follow' })
    req.on('response', (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        clearTimeout(timer)
        const buf = Buffer.concat(chunks)
        if (buf.length === 0) return reject(new Error('Empty download'))
        resolve(buf)
      })
      res.on('error', (err) => { clearTimeout(timer); reject(err) })
    })
    req.on('error', (err) => { clearTimeout(timer); reject(err) })
    req.end()
  })
}

function extractCrx3(buf: Buffer, outDir: string): void {
  const magic = buf.toString('ascii', 0, 4)
  if (magic !== 'Cr24') {
    throw new Error(`Invalid CRX magic: ${magic}, size: ${buf.length}`)
  }

  // Find ZIP start after CRX header
  const zipMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04])
  const zipStart = buf.indexOf(zipMagic, 12)
  if (zipStart < 0) {
    // Try searching from 0 in case of format variation
    const altStart = buf.indexOf(zipMagic)
    if (altStart < 0) throw new Error('No ZIP data found in CRX')
    extractZip(buf.subarray(altStart), outDir)
    return
  }
  extractZip(buf.subarray(zipStart), outDir)
}

function findEocd(buf: Buffer): number {
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      return i
    }
  }
  return -1
}

function extractZip(buf: Buffer, outDir: string): void {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  const eocdPos = findEocd(buf)
  if (eocdPos < 0) throw new Error('Invalid ZIP: no EOCD found')

  const totalEntries = buf.readUInt16LE(eocdPos + 10)
  const cdOffset = buf.readUInt32LE(eocdPos + 16)

  let cdPos = cdOffset
  for (let i = 0; i < totalEntries; i++) {
    if (buf.readUInt32LE(cdPos) !== 0x02014b50) break

    const nameLen = buf.readUInt16LE(cdPos + 28)
    const extraLen = buf.readUInt16LE(cdPos + 30)
    const commentLen = buf.readUInt16LE(cdPos + 32)
    const method = buf.readUInt16LE(cdPos + 10)
    const compSize = buf.readUInt32LE(cdPos + 20)
    const uncompSize = buf.readUInt32LE(cdPos + 24)
    const localOffset = buf.readUInt32LE(cdPos + 42)
    const name = buf.toString('utf-8', cdPos + 46, cdPos + 46 + nameLen)

    // Read local file header
    const localNameLen = buf.readUInt16LE(localOffset + 26)
    const localExtraLen = buf.readUInt16LE(localOffset + 28)
    const dataStart = localOffset + 30 + localNameLen + localExtraLen
    const dataEnd = dataStart + compSize

    const filePath = join(outDir, name)

    if (name.endsWith('/')) {
      mkdirSync(filePath, { recursive: true })
    } else {
      const parent = dirname(filePath)
      if (!existsSync(parent)) mkdirSync(parent, { recursive: true })

      try {
        let raw: Buffer
        if (method === 0) {
          raw = buf.subarray(dataStart, dataEnd)
        } else if (method === 8) {
          raw = zlib.inflateRawSync(buf.subarray(dataStart, dataEnd))
        } else {
          raw = buf.subarray(dataStart, dataEnd)
        }
        writeFileSync(filePath, raw)
      } catch (err) {
        console.error(`Failed to extract ${name}:`, err)
      }
    }

    cdPos += 46 + nameLen + extraLen + commentLen
  }
}

export async function installFromStore(input: string): Promise<{
  id: string; name: string; version: string; path: string; enabled: boolean
}> {
  const id = getExtensionId(input)
  if (!id) throw new Error('Invalid Chrome Web Store URL or extension ID')

  const crx = await downloadCrx(id)
  const tmpDir = join(app.getPath('temp'), `oxium-ext-${id}`)
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true })

  extractCrx3(crx, tmpDir)

  try { rmSync(join(tmpDir, '__MACOSX'), { recursive: true, force: true }) } catch { /* ok */ }

  // Remove any ._ files (macOS resource forks)
  function cleanDir(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      if (e.name.startsWith('._')) {
        rmSync(join(dir, e.name), { recursive: true, force: true })
      } else if (e.isDirectory()) {
        cleanDir(join(dir, e.name))
      }
    }
  }
  try { cleanDir(tmpDir) } catch { /* ok */ }

  const s = session.defaultSession
  const ext = await s.loadExtension(tmpDir)

  let name = id
  let version = '1.0'
  try {
    const manifest = JSON.parse(readFileSync(join(tmpDir, 'manifest.json'), 'utf-8'))
    name = manifest.name || name
    version = manifest.version || version
  } catch { /* ignore */ }

  return { id: ext.id, name, version, path: tmpDir, enabled: true }
}

export function parseStoreUrl(input: string): { id: string } | null {
  const id = getExtensionId(input)
  return id ? { id } : null
}
