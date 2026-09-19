import type { Transcript } from '../editor/types'
import { backendBaseUrl } from './ffmpeg'

export class VoiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VoiceError'
  }
}

export function parseTranscript(value: unknown): Transcript {
  const record = value as Record<string, unknown> | null
  if (!record || typeof record !== 'object' || !Array.isArray(record.segments)) {
    throw new VoiceError('The sidecar returned an unexpected transcript shape.')
  }
  return {
    text: typeof record.text === 'string' ? record.text : '',
    language: typeof record.language === 'string' ? record.language : '?',
    segments: (record.segments as Array<Record<string, unknown>>).map((segment, index) => ({
      id: typeof segment.id === 'number' ? segment.id : index,
      text: typeof segment.text === 'string' ? segment.text : '',
      start: typeof segment.start === 'number' ? segment.start : 0,
      end: typeof segment.end === 'number' ? segment.end : 0,
      avgLogprob: typeof segment.avgLogprob === 'number' ? segment.avgLogprob : 0,
      confidence: typeof segment.confidence === 'number' ? segment.confidence : 0,
      words: Array.isArray(segment.words)
        ? (segment.words as Array<Record<string, unknown>>).map((word) => ({
            word: typeof word.word === 'string' ? word.word : '',
            start: typeof word.start === 'number' ? word.start : 0,
            end: typeof word.end === 'number' ? word.end : 0,
            confidence: typeof word.confidence === 'number' ? word.confidence : 1,
          }))
        : [],
    })),
    pauses: Array.isArray(record.pauses)
      ? (record.pauses as Array<Record<string, unknown>>).map((pause) => ({
          start: typeof pause.start === 'number' ? pause.start : 0,
          end: typeof pause.end === 'number' ? pause.end : 0,
          gap: typeof pause.gap === 'number' ? pause.gap : 0,
        }))
      : [],
  }
}

export async function transcribeAsset(
  file: File,
  baseUrl = backendBaseUrl(),
  signal?: AbortSignal,
): Promise<Transcript> {
  if (file.size === 0) {
    throw new VoiceError('The selected audio file is empty.')
  }
  const form = new FormData()
  form.append('file', file, file.name)

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/transcribe`, {
    method: 'POST',
    body: form,
    signal,
  })
  const body = (await res.json().catch(() => null)) as
    | (Record<string, unknown> & {
        error?: { code?: string; message?: string }
      })
    | null

  if (!res.ok || !body) {
    const message =
      body?.error?.message ??
      (res.status === 0
        ? 'No sidecar reachable. Start the local media service.'
        : `Narration analysis failed (HTTP ${res.status})`)
    throw new VoiceError(message)
  }
  return parseTranscript(body)
}

export type CaptionExportFormat = 'srt' | 'vtt'

export async function exportCaptions(
  captions: Array<{ start: number; duration: number; text: string }>,
  format: CaptionExportFormat = 'srt',
  baseUrl = backendBaseUrl(),
): Promise<string> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/captions/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ captions, format }),
  })
  if (!res.ok) {
    throw new VoiceError(`Caption export failed (HTTP ${res.status})`)
  }
  return res.text()
}

export function downloadCaptionFile(content: string, format: CaptionExportFormat) {
  const mime = format === 'vtt' ? 'text/vtt' : 'application/x-subrip'
  const ext = format === 'vtt' ? 'vtt' : 'srt'
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `captions.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

export type VisualStyle =
  | 'cinematic'
  | 'anime'
  | 'realistic'
  | 'watercolor'
  | 'cyberpunk'
  | 'fantasy'
  | 'minimalist'
  | 'comic'
  | 'vintage'
  | 'dark_moody'
  | 'bright_vivid'

export interface VisualPromptOptions {
  text: string
  style?: VisualStyle
  count?: number
  language?: string
  apiKey?: string
}

export async function generateVisualPrompts(
  options: VisualPromptOptions,
  baseUrl = backendBaseUrl(),
): Promise<{ success: boolean; prompts: string[]; style: string; error?: string }> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/visual-prompts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: options.text,
      style: options.style ?? 'cinematic',
      count: options.count ?? 1,
      language: options.language ?? 'en',
      api_key: options.apiKey,
    }),
  })
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!res.ok || !body) {
    return { success: false, prompts: [], style: '', error: `HTTP ${res.status}` }
  }
  return body as { success: boolean; prompts: string[]; style: string; error?: string }
}

export type TranscriptionProvider = 'local' | 'groq'

export interface GroqTranscribeOptions {
  language?: string
  model?: string
  apiKey?: string
}

export async function transcribeAssetGroq(
  file: File,
  baseUrl = backendBaseUrl(),
  options: GroqTranscribeOptions = {},
  signal?: AbortSignal,
): Promise<Transcript> {
  if (file.size === 0) {
    throw new VoiceError('The selected audio file is empty.')
  }
  const form = new FormData()
  form.append('file', file, file.name)
  if (options.language) form.append('language', options.language)
  if (options.model) form.append('model', options.model)
  if (options.apiKey) form.append('api_key', options.apiKey)

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/transcribe-groq`, {
    method: 'POST',
    body: form,
    signal,
  })
  const body = (await res.json().catch(() => null)) as
    | (Record<string, unknown> & {
        error?: { code?: string; message?: string }
      })
    | null

  if (!res.ok || !body) {
    const message =
      body?.error?.message ??
      (res.status === 0
        ? 'No sidecar reachable. Start the local media service.'
        : `Groq transcription failed (HTTP ${res.status})`)
    throw new VoiceError(message)
  }
  return parseTranscript(body)
}
