import { describe, expect, it } from 'vitest'
import { analyzeRetention } from './retention'
import type { Beat } from './beats'
import type { Clip } from './types'

function beat(id: string, text: string, start: number, end: number): Beat {
  return { id, text, start, end }
}

function clip(beatId: string, duration: number, start: number): Clip {
  return {
    id: `clip-${beatId}`,
    trackId: 'img',
    assetId: 'asset',
    name: 'test',
    start,
    duration,
    beatId,
  }
}

describe('analyzeRetention', () => {
  it('returns zero metrics for empty input', () => {
    const result = analyzeRetention([], [])
    expect(result.metrics.length).toBe(4)
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(0.5)
  })

  it('computes hook strength from opening text', () => {
    const beats = [beat('b0', 'Did you know this secret?', 0, 2)]
    const result = analyzeRetention(beats, [])
    const hook = result.metrics.find((m) => m.id === 'hook')!
    expect(hook.value).toBeGreaterThan(0)
  })

  it('computes pacing score from varied durations', () => {
    const beats = [
      beat('b0', 'first', 0, 1),
      beat('b1', 'second', 1, 2.5),
      beat('b2', 'third', 2.5, 3),
      beat('b3', 'fourth', 3, 5),
    ]
    const clips = [
      clip('b0', 1, 0),
      clip('b1', 1.5, 1),
      clip('b2', 0.5, 2.5),
      clip('b3', 2, 3),
    ]
    const result = analyzeRetention(beats, clips)
    const pacing = result.metrics.find((m) => m.id === 'pacing')!
    expect(pacing.value).toBeGreaterThan(0.3)
  })

  it('computes narrative progression from text length increase', () => {
    const beats = [
      beat('b0', 'short', 0, 1),
      beat('b1', 'medium length text', 1, 2),
      beat('b2', 'much longer text that builds to a conclusion', 2, 3),
    ]
    const result = analyzeRetention(beats, [])
    const progression = result.metrics.find((m) => m.id === 'progression')!
    expect(progression.value).toBeGreaterThanOrEqual(0.5)
  })

  it('generates suggestions for low metrics', () => {
    const beats = [beat('b0', 'hello', 0, 5)]
    const clips = [clip('b0', 5, 0)]
    const result = analyzeRetention(beats, clips)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('returns overall score between 0 and 1', () => {
    const beats = [
      beat('b0', 'first', 0, 1),
      beat('b1', 'second', 1, 2),
    ]
    const clips = [clip('b0', 1, 0), clip('b1', 1, 1)]
    const result = analyzeRetention(beats, clips)
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(1)
  })
})
