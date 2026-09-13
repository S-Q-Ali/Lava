import { backendBaseUrl } from './ffmpeg'
import { parsePreset, type Preset } from '../editor/presets'

export class PresetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PresetError'
  }
}

export async function listPresets(baseUrl = backendBaseUrl()): Promise<Preset[]> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/presets`)
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    const message =
      body?.error?.message ??
      (res.status === 0
        ? 'No sidecar reachable. Start the local media service.'
        : `Preset request failed (HTTP ${res.status})`)
    throw new PresetError(message)
  }
  const body = (await res.json()) as unknown
  if (!Array.isArray(body)) throw new PresetError('The sidecar returned an unexpected preset list.')
  return body.map((entry) => parsePreset(entry))
}