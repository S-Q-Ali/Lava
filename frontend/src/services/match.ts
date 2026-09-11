import type { Beat } from '../editor/beats'
import { backendBaseUrl } from './ffmpeg'

export class MatchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MatchError'
  }
}

export interface MatchAlternative {
  imageKey: string
  confidence: number
}

export interface MatchBeatResult {
  beatId: string
  imageKey: string
  confidence: number
  start: number
  end: number
  alternatives: MatchAlternative[]
}

export interface MatchResponse {
  beats: MatchBeatResult[]
}

export function parseMatch(value: unknown): MatchResponse {
  const record = value as Record<string, unknown> | null
  if (!record || !Array.isArray(record.beats)) {
    throw new MatchError('The sidecar returned an unexpected match shape.')
  }
  const beats = (record.beats as Array<Record<string, unknown>>).map((beat) => ({
    beatId: typeof beat.beatId === 'string' ? beat.beatId : String(beat.beatId ?? ''),
    imageKey: typeof beat.imageKey === 'string' ? beat.imageKey : '',
    confidence: typeof beat.confidence === 'number' ? beat.confidence : 0,
    start: typeof beat.start === 'number' ? beat.start : 0,
    end: typeof beat.end === 'number' ? beat.end : 0,
    alternatives: Array.isArray(beat.alternatives)
      ? (beat.alternatives as Array<Record<string, unknown>>)
          .filter((a) => typeof a.imageKey === 'string')
          .map((a) => ({
            imageKey: a.imageKey as string,
            confidence: typeof a.confidence === 'number' ? a.confidence : 0,
          }))
      : [],
  }))
  return { beats }
}

export interface MatchImageInput {
  assetId: string
  file: File
}

export interface MatchRequest {
  beats: Beat[]
  images: MatchImageInput[]
  baseUrl?: string
  signal?: AbortSignal
}

export async function matchImages(input: MatchRequest): Promise<MatchResponse> {
  const { beats, images, signal } = input
  const baseUrl = input.baseUrl ?? backendBaseUrl()
  if (images.length === 0) {
    throw new MatchError('Add at least one image to match.')
  }
  if (beats.length === 0) {
    throw new MatchError('Narration has no matching beats yet.')
  }

  const form = new FormData()
  form.append('beats', JSON.stringify(beats))
  for (const image of images) {
    form.append('images', image.file, image.assetId)
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/match`, {
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
        : `Image matching failed (HTTP ${res.status})`)
    throw new MatchError(message)
  }
  return parseMatch(body)
}