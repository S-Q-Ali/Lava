import { FontError } from '../services/fonts'

export interface FontLicense {
  type: 'open' | 'commercial' | 'personal' | 'unknown'
  source: string | null
  embeddingAllowed: boolean
}

export interface FontMetadata {
  id: string
  family: string
  fileName: string
  ext: string
  license: FontLicense
  addedAt: string
}

export function parseFontMetadata(raw: unknown): FontMetadata {
  if (typeof raw !== 'object' || raw === null) {
    throw new FontError('Font metadata must be a non-null object.')
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.id !== 'string' || typeof obj.family !== 'string') {
    throw new FontError('Font metadata must include id and family strings.')
  }
  const license = parseLicense(obj.license)
  return {
    id: obj.id,
    family: obj.family,
    fileName: typeof obj.fileName === 'string' ? obj.fileName : `${obj.id}.ttf`,
    ext: typeof obj.ext === 'string' ? obj.ext : 'ttf',
    license,
    addedAt: typeof obj.addedAt === 'string' ? obj.addedAt : new Date().toISOString(),
  }
}

function parseLicense(raw: unknown): FontLicense {
  const def: FontLicense = { type: 'unknown', source: null, embeddingAllowed: true }
  if (typeof raw !== 'object' || raw === null) return def
  const obj = raw as Record<string, unknown>
  const type =
    obj.type === 'open' || obj.type === 'commercial' || obj.type === 'personal'
      ? obj.type
      : 'unknown'
  const source = typeof obj.source === 'string' ? obj.source : null
  const embeddingAllowed = typeof obj.embeddingAllowed === 'boolean' ? obj.embeddingAllowed : true
  return { type, source, embeddingAllowed }
}

const registered = new Set<string>()

export function ensureFontFace(meta: FontMetadata, baseUrl: string) {
  const key = `${meta.id}:${baseUrl}`
  if (registered.has(key)) return
  if (meta.ext !== 'ttf' && meta.ext !== 'otf') return
  const url = `${baseUrl.replace(/\/$/, '')}/api/fonts/${meta.id}/file`
  const family = `"${meta.family.replace(/"/g, '\\"')}"`
  const rule = `@font-face{font-family:${family};src:url("${url}") format("${meta.ext === 'otf' ? 'opentype' : 'truetype'}")}`
  const style = document.createElement('style')
  style.dataset.fontFamily = meta.family
  style.textContent = rule
  document.head.appendChild(style)
  registered.add(key)
}