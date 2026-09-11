import type { Clip } from './types'

export function newId(prefix = 'id'): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export interface ClipInput {
  trackId: string
  assetId: string
  name: string
  start?: number
  duration: number
  confidence?: number
  beatId?: string
}

export function createClip(input: ClipInput, id = newId('clip')): Clip {
  return {
    id,
    trackId: input.trackId,
    assetId: input.assetId,
    name: input.name,
    start: Math.max(0, input.start ?? 0),
    duration: Math.max(0.001, input.duration),
    confidence: input.confidence,
    beatId: input.beatId,
  }
}

export function addClip(clips: Clip[], input: ClipInput): Clip[] {
  return [...clips, createClip(input)]
}

export function addClips(clips: Clip[], inputs: ClipInput[]): Clip[] {
  return [...clips, ...inputs.map((input) => createClip(input))]
}

export function replaceClips(clips: Clip[], removeIds: string[], inputs: ClipInput[]): Clip[] {
  const removed = new Set(removeIds)
  return [...clips.filter((c) => !removed.has(c.id)), ...inputs.map((input) => createClip(input))]
}

export function removeClip(clips: Clip[], id: string): Clip[] {
  return clips.filter((c) => c.id !== id)
}

export function moveClip(clips: Clip[], id: string, start: number): Clip[] {
  return clips.map((c) =>
    c.id === id ? { ...c, start: Math.max(0, start) } : c,
  )
}

export function trimClip(
  clips: Clip[],
  id: string,
  patch: { start?: number; duration?: number },
): Clip[] {
  return clips.map((c) => {
    if (c.id !== id) return c
    let start = patch.start ?? c.start
    let duration = patch.duration ?? c.duration
    start = Math.max(0, start)
    duration = Math.max(0.001, duration)
    if (start === c.start && duration === c.duration) return c
    return { ...c, start, duration }
  })
}

export function splitClip(clips: Clip[], id: string, at: number): Clip[] {
  const clip = clips.find((c) => c.id === id)
  if (!clip || at <= clip.start || at >= clip.start + clip.duration) return clips

  const before: Clip = { ...clip, id: clip.id, duration: at - clip.start }
  const after: Clip = {
    ...clip,
    id: newId('clip'),
    start: at,
    duration: clip.start + clip.duration - at,
  }

  return [...clips.filter((c) => c.id !== id), before, after]
}

export function duplicateClip(clips: Clip[], id: string): Clip[] {
  const clip = clips.find((c) => c.id === id)
  if (!clip) return clips
  const copy: Clip = {
    ...clip,
    id: newId('clip'),
    start: clip.start + clip.duration,
  }
  return [...clips, copy]
}

export function replaceClipAsset(clips: Clip[], id: string, assetId: string): Clip[] {
  return clips.map((c) =>
    c.id === id ? { ...c, assetId } : c,
  )
}

export function clipsAtTime(clips: Clip[], t: number): Clip[] {
  return clips.filter((c) => t >= c.start && t < c.start + c.duration)
}

export function projectDuration(clips: Clip[]): number {
  if (clips.length === 0) return 0
  return Math.max(...clips.map((c) => c.start + c.duration))
}