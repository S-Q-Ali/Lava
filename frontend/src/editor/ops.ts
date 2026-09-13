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

export function moveClipRipple(clips: Clip[], id: string, start: number): Clip[] {
  const clip = clips.find((c) => c.id === id)
  if (!clip) return clips

  const trackClips = clips.filter((c) => c.trackId === clip.trackId).sort((a, b) => a.start - b.start)
  const clipIndex = trackClips.findIndex((c) => c.id === id)
  if (clipIndex === -1) return clips

  const newStart = Math.max(0, start)

  // If moving right, shift all following clips to maintain gap
  // If moving left, pull following clips to fill gap (ripple)
  const result = new Map<string, Clip>()

  // Update the moved clip
  result.set(id, { ...clip, start: newStart })

  // Update following clips on the same track
  for (let i = clipIndex + 1; i < trackClips.length; i++) {
    const following = trackClips[i]
    const prev = trackClips[i - 1]
    const prevEnd = i - 1 === clipIndex ? newStart + clip.duration : (result.get(prev.id)?.start ?? prev.start) + prev.duration
    const minStart = prevEnd
    if (following.start < minStart) {
      result.set(following.id, { ...following, start: minStart })
    }
  }

  return clips.map((c) => result.get(c.id) ?? c)
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