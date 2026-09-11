import { describe, expect, it } from 'vitest'
import {
  addClip,
  addClips,
  clipsAtTime,
  createClip,
  duplicateClip,
  moveClip,
  projectDuration,
  removeClip,
  replaceClipAsset,
  replaceClips,
  splitClip,
  trimClip,
} from './ops'

const base = { trackId: 'track-video', assetId: 'asset-1', name: 'clip' }

describe('createClip', () => {
  it('defaults start to 0 and clamps negative duration', () => {
    expect(createClip({ ...base, duration: 5 })).toMatchObject({
      start: 0,
      duration: 5,
    })
    expect(createClip({ ...base, duration: 0 }).duration).toBeGreaterThan(0)
  })

  it('carries match metadata (confidence, beatId)', () => {
    const clip = createClip({ ...base, duration: 5, confidence: 0.42, beatId: 'b3' })
    expect(clip.confidence).toBe(0.42)
    expect(clip.beatId).toBe('b3')
  })

  it('clamps negative start to 0', () => {
    expect(createClip({ ...base, start: -3, duration: 2 }).start).toBe(0)
  })
})

describe('addClip / removeClip', () => {
  it('appends and removes clips by id', () => {
    const c = createClip({ ...base, duration: 4 })
    const withClip = addClip([], { ...base, duration: 4 })
    expect(withClip).toHaveLength(1)
    expect(withClip[0]).toMatchObject({ start: 0, duration: 4 })

    const after = removeClip(withClip, withClip[0].id)
    expect(after).toHaveLength(0)
    expect(c.id).not.toBe(after[0]?.id)
  })
})

describe('moveClip', () => {
  it('re-times a clip and clamps to non-negative', () => {
    const [clip] = addClip([], { ...base, duration: 2, start: 0 })
    const moved = moveClip([clip], clip.id, 10)
    expect(moved).toHaveLength(1)
    expect(moved[0].start).toBe(10)

    const clamped = moveClip([clip], clip.id, -5)
    expect(clamped[0].start).toBe(0)
  })
})

describe('trimClip', () => {
  it('adjusts start and/or duration', () => {
    const [clip] = addClip([], { ...base, duration: 10, start: 2 })
    const trimmed = trimClip([clip], clip.id, { start: 4, duration: 3 })
    expect(trimmed[0]).toMatchObject({ start: 4, duration: 3 })
  })

  it('clamps start and keeps positive duration', () => {
    const [clip] = addClip([], { ...base, duration: 10, start: 2 })
    const trimmed = trimClip([clip], clip.id, { start: -1, duration: 0 })
    expect(trimmed[0].start).toBe(0)
    expect(trimmed[0].duration).toBeGreaterThan(0)
  })
})

describe('splitClip', () => {
  it('splits a clip into two ordered segments at absolute time', () => {
    const [clip] = addClip([], { ...base, duration: 10, start: 0 })
    const result = splitClip([clip], clip.id, 4)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ start: 0, duration: 4 })
    expect(result[1]).toMatchObject({ start: 4, duration: 6 })
    expect(result[0].id).toBe(clip.id)
    expect(result[1].id).not.toBe(clip.id)
  })

  it('returns the same clips for out-of-bounds split', () => {
    const [clip] = addClip([], { ...base, duration: 10, start: 0 })
    expect(splitClip([clip], clip.id, -1)).toEqual([clip])
    expect(splitClip([clip], clip.id, 20)).toEqual([clip])
  })
})

describe('duplicateClip', () => {
  it('copies the clip after its original range', () => {
    const [clip] = addClip([], { ...base, duration: 5, start: 2 })
    const result = duplicateClip([clip], clip.id)
    expect(result).toHaveLength(2)
    expect(result[1]).toMatchObject({ start: 7, duration: 5 })
    expect(result[1].id).not.toBe(clip.id)
  })
})

describe('replaceClipAsset', () => {
  it('swaps the assetId on the target clip only', () => {
    const clipsA = addClip([], { ...base, duration: 4 })
    const clipsAB = addClip(clipsA, { trackId: 'track-voice', assetId: 'asset-2', name: 'v', duration: 2 })
    const result = replaceClipAsset(clipsAB, clipsA[0].id, 'asset-9')
    expect(result[0].assetId).toBe('asset-9')
    expect(result[1].assetId).toBe('asset-2')
  })
})

describe('addClips / replaceClips', () => {
  it('adds many clips in one call', () => {
    const clips = addClips([], [
      { ...base, trackId: 'track-image', duration: 2, start: 0 },
      { ...base, trackId: 'track-image', duration: 3, start: 2 },
    ])
    expect(clips).toHaveLength(2)
    expect(clips[0].start).toBe(0)
    expect(clips[1].start).toBe(2)
  })

  it('replaces the given ids and preserves the rest', () => {
    const kept = createClip({ ...base, duration: 1 })
    const old = createClip({ ...base, trackId: 'track-image', duration: 2 })
    const next = replaceClips([kept, old], [old.id], [
      { ...base, trackId: 'track-image', duration: 3, start: 0, beatId: 'b9', confidence: 0.7 },
    ])
    expect(next.map((c) => c.id)).toEqual([kept.id, next[1].id])
    expect(next).toHaveLength(2)
    expect(next[1]).toMatchObject({ beatId: 'b9', confidence: 0.7, duration: 3 })
  })
})

describe('clipsAtTime / projectDuration', () => {
  it('finds clips covering a given time', () => {
    const clipsA = addClip([], { ...base, duration: 5, start: 0 })
    const clipsAB = addClip(clipsA, { trackId: 'track-image', assetId: 'asset-2', name: 'i', duration: 3, start: 2 })
    expect(clipsAtTime(clipsAB, 3)).toHaveLength(2)
    expect(clipsAtTime(clipsAB, 6)).toHaveLength(0)
  })

  it('computes project duration from clip end', () => {
    const clipsA = addClip([], { ...base, duration: 4, start: 0 })
    const clipsAB = addClip(clipsA, { trackId: 'track-image', assetId: 'asset-2', name: 'i', duration: 3, start: 6 })
    expect(projectDuration(clipsAB)).toBe(9)
    expect(projectDuration([])).toBe(0)
  })
})