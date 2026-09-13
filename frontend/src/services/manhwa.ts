import { backendBaseUrl } from './ffmpeg'

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

export interface ManhwaStripDetail extends ManhwaStripSummary {
  panels: ManhwaPanel[]
}

export interface ManhwaDetectResult {
  sourceId: string
  sourceFile: string
  width: number
  height: number
  mime: string
  panels: ManhwaPanel[]
  saved: boolean
}

export type ManhwaOp =
  | { op: 'split'; panelId: string; y: number }
  | { op: 'merge'; ids: [string, string] }
  | { op: 'adjust'; panelId: string; x: number; y: number; w: number; h: number }
  | { op: 'delete'; panelId: string }
  | { op: 'add'; x: number; y: number; w: number; h: number; afterId?: string }
  | { op: 'reorder'; ids: string[] }
  | { op: 'reset' }

export class ManhwaError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ManhwaError'
  }
}

export function manhwaBase(baseUrl = backendBaseUrl()): string {
  return `${baseUrl.replace(/\/$/, '')}/api/manhwa`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0) || 0
}

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === true || value === 'true'
}

function requireShape<T>(value: unknown, kind: string, check: (record: Record<string, unknown>) => T, body: unknown): T {
  const record = asRecord(value)
  if (!record) throw new ManhwaError('BAD_RESPONSE', `The sidecar returned an unexpected ${kind} shape.`)
  try {
    return check(record)
  } catch (error) {
    if (error instanceof ManhwaError) throw error
    throw new ManhwaError('BAD_RESPONSE', `The sidecar returned an unexpected ${kind} shape.`)
  }
}

function parsePanel(record: Record<string, unknown>): ManhwaPanel {
  return {
    id: String(record.id ?? ''),
    sourceId: String(record.sourceId ?? ''),
    x: asNumber(record.x),
    y: asNumber(record.y),
    w: asNumber(record.w),
    h: asNumber(record.h),
    confidence: asNumber(record.confidence),
    order: asNumber(record.order),
    userCorrected: asBoolean(record.userCorrected),
  }
}

function parseSummary(record: Record<string, unknown>): ManhwaStripSummary {
  return {
    sourceId: String(record.sourceId ?? ''),
    sourceFile: String(record.sourceFile ?? ''),
    width: asNumber(record.width),
    height: asNumber(record.height),
    mime: String(record.mime ?? ''),
    panelCount: asNumber(record.panelCount),
    correctedCount: asNumber(record.correctedCount),
  }
}

function parsePanels(value: unknown): ManhwaPanel[] {
  if (!Array.isArray(value)) throw new ManhwaError('BAD_RESPONSE', 'Expected a panels array from the sidecar.')
  return (value as Array<Record<string, unknown>>).map((record) => parsePanel(record))
}

export function parseStripSummaryList(value: unknown): ManhwaStripSummary[] {
  const record = asRecord(value)
  if (!record)
    throw new ManhwaError('BAD_RESPONSE', 'The sidecar returned an unexpected strips shape.')
  const strips = record.strips
  if (!Array.isArray(strips)) throw new ManhwaError('BAD_RESPONSE', 'The sidecar returned an unexpected strips shape.')
  return (strips as Array<Record<string, unknown>>).map((item) => parseSummary(item))
}

export function parseStripDetailList(value: unknown): Omit<ManhwaStripDetail, 'panels'> & { panels: ManhwaPanel[] } {
  return requireShape(value, 'strip detail', (record) => ({
    ...parseSummary(record),
    panels: parsePanels(record.panels),
  }), value)
}

export function parseDetectResult(value: unknown): ManhwaDetectResult {
  return requireShape(value, 'detect result', (record) => ({
    sourceId: String(record.sourceId ?? ''),
    sourceFile: String(record.sourceFile ?? ''),
    width: asNumber(record.width),
    height: asNumber(record.height),
    mime: String(record.mime ?? ''),
    panels: parsePanels(record.panels),
    saved: asBoolean(record.saved),
  }), value)
}

export function sourceUrl(baseUrl: string, sourceId: string): string {
  return `${baseUrl}/strips/${encodeURIComponent(sourceId)}/source`
}

export function panelUrl(baseUrl: string, sourceId: string, panelId: string): string {
  return `${baseUrl}/strips/${encodeURIComponent(sourceId)}/panels/${encodeURIComponent(panelId)}`
}

export function exportUrl(
  baseUrl: string,
  sourceId: string,
  format: 'png' | 'jpg',
  quality?: number,
): string {
  const q = typeof quality === 'number' ? `&quality=${quality}` : ''
  return `${baseUrl}/strips/${encodeURIComponent(sourceId)}/export?format=${format}${q}`
}

export function manhwaStripsUrl(baseUrl: string, suffix?: string): string {
  return suffix ? `${manhwaBase(baseUrl)}/strips/${suffix}` : `${manhwaBase(baseUrl)}/strips`
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw new ManhwaError('NETWORK_ERROR', 'The Manhwa sidecar is unreachable.')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = asRecord(body as Record<string, unknown>)?.error
    const code = error && typeof error.code === 'string' ? error.code : `HTTP ${response.status}`
    const message =
      error && typeof error.message === 'string' ? error.message : `Manhwa sidecar error (HTTP ${response.status}).`
    throw new ManhwaError(code, message)
  }
  return body
}

export async function listStrips(baseUrl: string): Promise<ManhwaStripSummary[]> {
  const body = await requestJson(manhwaStripsUrl(baseUrl))
  return parseStripSummaryList(body)
}

export async function uploadStrip(baseUrl: string, file: File): Promise<ManhwaDetectResult> {
  const form = new FormData()
  form.append('file', file, file.name)
  const body = await requestJson(manhwaStripsUrl(baseUrl), {
    method: 'POST',
    body: form,
  })
  return parseDetectResult(body)
}

export async function getStrip(baseUrl: string, sourceId: string): Promise<ManhwaStripDetail> {
  const body = await requestJson(manhwaStripsUrl(baseUrl, sourceId))
  return parseStripDetailList(body)
}

export async function applyCorrection(
  baseUrl: string,
  sourceId: string,
  op: ManhwaOp,
): Promise<ManhwaStripDetail> {
  const body = await requestJson(manhwaStripsUrl(baseUrl, `${sourceId}/panels`), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(op),
  })
  return parseStripDetailList(body)
}

export async function redetectStrip(baseUrl: string, sourceId: string): Promise<ManhwaDetectResult> {
  const body = await requestJson(manhwaStripsUrl(baseUrl, `${sourceId}/redetect`), {
    method: 'POST',
  })
  return parseDetectResult(body)
}

export async function deleteStrip(baseUrl: string, sourceId: string): Promise<boolean> {
  let response: Response
  try {
    response = await fetch(manhwaStripsUrl(baseUrl, sourceId), { method: 'DELETE' })
  } catch {
    throw new ManhwaError('NETWORK_ERROR', 'The Manhwa sidecar is unreachable.')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const error = asRecord(body as Record<string, unknown>)?.error
    throw new ManhwaError(
      error && typeof error.code === 'string' ? error.code : `HTTP ${response.status}`,
      error && typeof error.message === 'string' ? error.message : `Deleting the strip failed (HTTP ${response.status}).`,
    )
  }
  return true
}