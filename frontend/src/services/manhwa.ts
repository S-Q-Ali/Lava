import { backendBaseUrl } from './ffmpeg'

// -- Types ------------------------------------------------------------------

export interface ManhwaPanel {
  id: string
  sourceId: string
  x: number
  y: number
  w: number
  h: number
  confidence: number
  order: number
  userCorrected: boolean
}

export interface ManhwaStripSummary {
  sourceId: string
  sourceFile: string
  width: number
  height: number
  mime: string
  panelCount: number
  correctedCount: number
}

export interface ManhwaStripDetail {
  sourceId: string
  sourceFile: string
  width: number
  height: number
  mime: string
  panels: ManhwaPanel[]
}

export type CorrectionOp =
  | { op: 'split'; panelId: string; y: number }
  | { op: 'merge'; ids: [string, string] }
  | { op: 'adjust'; panelId: string; x: number; y: number; w: number; h: number }
  | { op: 'delete'; panelId: string }
  | { op: 'add'; x: number; y: number; w: number; h: number; afterId?: string }
  | { op: 'reorder'; ids: string[] }
  | { op: 'reset' }

// -- Error ------------------------------------------------------------------

export class ManhwaError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'ManhwaError'
    this.code = code
  }
}

// -- Parsers ----------------------------------------------------------------

function parsePanel(value: unknown): ManhwaPanel {
  const record = value as Record<string, unknown> | null
  if (!record || typeof record.id !== 'string') {
    throw new ManhwaError('INVALID_RESPONSE', 'The sidecar returned an unexpected panel shape.')
  }
  return {
    id: record.id,
    sourceId: typeof record.sourceId === 'string' ? record.sourceId : '',
    x: typeof record.x === 'number' ? record.x : 0,
    y: typeof record.y === 'number' ? record.y : 0,
    w: typeof record.w === 'number' ? record.w : 0,
    h: typeof record.h === 'number' ? record.h : 0,
    confidence: typeof record.confidence === 'number' ? record.confidence : 0,
    order: typeof record.order === 'number' ? record.order : 0,
    userCorrected: typeof record.userCorrected === 'boolean' ? record.userCorrected : false,
  }
}

function parseStripSummary(value: unknown): ManhwaStripSummary {
  const record = value as Record<string, unknown> | null
  if (!record || typeof record.sourceId !== 'string') {
    throw new ManhwaError('INVALID_RESPONSE', 'The sidecar returned an unexpected strip summary shape.')
  }
  return {
    sourceId: record.sourceId,
    sourceFile: typeof record.sourceFile === 'string' ? record.sourceFile : '',
    width: typeof record.width === 'number' ? record.width : 0,
    height: typeof record.height === 'number' ? record.height : 0,
    mime: typeof record.mime === 'string' ? record.mime : '',
    panelCount: typeof record.panelCount === 'number' ? record.panelCount : 0,
    correctedCount: typeof record.correctedCount === 'number' ? record.correctedCount : 0,
  }
}

function parseStripDetail(value: unknown): ManhwaStripDetail {
  const record = value as Record<string, unknown> | null
  if (!record || typeof record.sourceId !== 'string' || !Array.isArray(record.panels)) {
    throw new ManhwaError('INVALID_RESPONSE', 'The sidecar returned an unexpected strip detail shape.')
  }
  return {
    sourceId: record.sourceId,
    sourceFile: typeof record.sourceFile === 'string' ? record.sourceFile : '',
    width: typeof record.width === 'number' ? record.width : 0,
    height: typeof record.height === 'number' ? record.height : 0,
    mime: typeof record.mime === 'string' ? record.mime : '',
    panels: (record.panels as Array<unknown>).map(parsePanel),
  }
}

// -- HTTP helper ------------------------------------------------------------

async function manhwaFetch(
  path: string,
  options: { method?: string; body?: FormData | string; signal?: AbortSignal } = {},
): Promise<unknown> {
  const baseUrl = backendBaseUrl().replace(/\/$/, '')
  const init: RequestInit = {
    method: options.method ?? 'GET',
    signal: options.signal,
  }
  if (options.body) {
    init.body = options.body
  }
  const res = await fetch(`${baseUrl}/api/manhwa${path}`, init)

  if (res.status === 204) {
    if (!res.ok) {
      throw new ManhwaError('REQUEST_FAILED', `Manhwa request failed (HTTP ${res.status})`)
    }
    return null
  }

  const body = (await res.json().catch(() => null)) as
    | (Record<string, unknown> & { error?: { code?: string; message?: string } })
    | null

  if (!res.ok || !body) {
    const code = body?.error?.code ?? 'REQUEST_FAILED'
    const message =
      body?.error?.message ??
      (res.status === 0
        ? 'No sidecar reachable. Start the local media service.'
        : `Manhwa request failed (HTTP ${res.status})`)
    throw new ManhwaError(code, message)
  }
  return body
}

// -- Client -----------------------------------------------------------------

export async function listStrips(signal?: AbortSignal): Promise<ManhwaStripSummary[]> {
  const body = (await manhwaFetch('/strips', { signal })) as Record<string, unknown>
  if (!Array.isArray(body.strips)) {
    throw new ManhwaError('INVALID_RESPONSE', 'The sidecar returned an unexpected strips list shape.')
  }
  return (body.strips as Array<unknown>).map(parseStripSummary)
}

export async function uploadStrip(file: File, signal?: AbortSignal): Promise<ManhwaStripDetail> {
  const form = new FormData()
  form.append('file', file, file.name)
  return parseStripDetail(await manhwaFetch('/strips', { method: 'POST', body: form, signal }))
}

export async function getStrip(sourceId: string, signal?: AbortSignal): Promise<ManhwaStripDetail> {
  return parseStripDetail(await manhwaFetch(`/strips/${encodeURIComponent(sourceId)}`, { signal }))
}

export async function correctStrip(sourceId: string, op: CorrectionOp): Promise<ManhwaStripDetail> {
  return parseStripDetail(
    await manhwaFetch(`/strips/${encodeURIComponent(sourceId)}/panels`, {
      method: 'PATCH',
      body: JSON.stringify(op),
    }),
  )
}

export async function redetectStrip(sourceId: string, signal?: AbortSignal): Promise<ManhwaStripDetail> {
  return parseStripDetail(
    await manhwaFetch(`/strips/${encodeURIComponent(sourceId)}/redetect`, {
      method: 'POST',
      signal,
    }),
  )
}

export async function deleteStrip(sourceId: string): Promise<void> {
  await manhwaFetch(`/strips/${encodeURIComponent(sourceId)}`, { method: 'DELETE' })
}

export function exportUrl(sourceId: string, format: 'png' | 'jpg' = 'png'): string {
  const baseUrl = backendBaseUrl().replace(/\/$/, '')
  return `${baseUrl}/api/manhwa/strips/${encodeURIComponent(sourceId)}/export?format=${format}`
}

export function panelImageUrl(sourceId: string, panelId: string): string {
  const baseUrl = backendBaseUrl().replace(/\/$/, '')
  return `${baseUrl}/api/manhwa/strips/${encodeURIComponent(sourceId)}/panels/${encodeURIComponent(panelId)}`
}

export function sourceImageUrl(sourceId: string): string {
  const baseUrl = backendBaseUrl().replace(/\/$/, '')
  return `${baseUrl}/api/manhwa/strips/${encodeURIComponent(sourceId)}/source`
}