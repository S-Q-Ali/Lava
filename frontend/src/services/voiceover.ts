const BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:7860'

export interface VoiceoverRequest {
  text: string
  voice?: string
  rate?: string
  pitch?: string
  volume?: string
  format?: 'mp3' | 'wav'
}

export interface VoiceoverResult {
  success: boolean
  file_id?: string
  file_path?: string
  file_size?: number
  voice?: string
  error?: string
}

export interface VoiceInfo {
  name: string
  gender: string
  locale: string
  language: string
}

export interface PresetInfo {
  name: string
  voice: string
}

export async function generateVoiceover(req: VoiceoverRequest): Promise<VoiceoverResult> {
  const res = await fetch(`${BASE}/api/voiceover/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return res.json()
}

export async function listVoices(language?: string): Promise<VoiceInfo[]> {
  const params = language ? `?language=${encodeURIComponent(language)}` : ''
  const res = await fetch(`${BASE}/api/voiceover/voices${params}`)
  return res.json()
}

export async function listVoicePresets(): Promise<PresetInfo[]> {
  const res = await fetch(`${BASE}/api/voiceover/presets`)
  return res.json()
}

export function getVoiceoverDownloadUrl(fileId: string, format: string = 'mp3'): string {
  return `${BASE}/api/voiceover/download/${fileId}?format=${format}`
}
