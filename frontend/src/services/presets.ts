import { backendBaseUrl } from './ffmpeg'
import { parsePreset, type Preset } from '../editor/presets'

export class PresetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PresetError'
  }
}

async function failHttp(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as
    | { error?: { code?: string; message?: string } }
    | null
  const message =
    body?.error?.message ??
    (res.status === 0
      ? 'No sidecar reachable. Start the local media service.'
      : `Preset request failed (HTTP ${res.status})`)
  const error = new PresetError(message)
  return Promise.reject(error)
}

export async function listPresets(baseUrl = backendBaseUrl()): Promise<Preset[]> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/presets`)
  if (!res.ok) await failHttp(res)
  const body = (await res.json()) as unknown
  if (!Array.isArray(body)) throw new PresetError('The sidecar returned an unexpected preset list.')
  return body.map((entry) => parsePreset(entry))
}

export interface PresetExportPayload {
  kind: 'lava-preset'
  version: 1
  preset: Omit<Preset, never>
}

export function exportPresetPayload(preset: Preset): PresetExportPayload {
  return { kind: 'lava-preset', version: 1, preset }
}

export async function importPreset(
  payload: unknown,
  baseUrl = backendBaseUrl(),
): Promise<Preset> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/presets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) await failHttp(res)
  return parsePreset(await res.json())
}

export async function deletePreset(id: string, baseUrl = backendBaseUrl()): Promise<void> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/presets/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 204) await failHttp(res)
}

export async function updatePreset(
  id: string,
  payload: unknown,
  baseUrl = backendBaseUrl(),
): Promise<Preset> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/presets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) await failHttp(res)
  return parsePreset(await res.json())
}

export function downloadPresetFile(preset: Preset): void {
  const json = JSON.stringify(exportPresetPayload(preset), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${preset.id}.lava-preset.json`
  anchor.click()
  URL.revokeObjectURL(url)
}