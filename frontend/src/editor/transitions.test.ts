import { describe, expect, it } from 'vitest'

import {
  MAX_DURATION,
  MIN_DURATION,
  TRANSITION_TYPES,
  Transition,
  clampTransitionDuration,
  defaultDuration,
  evaluateTransitions,
  makeBetweenTransition,
  makeEdgeTransition,
} from './transitions'

describe('transition constants', () => {
  it('declares exactly the five types', () => {
    expect(TRANSITION_TYPES).toEqual(['match', 'dissolve', 'fade', 'wipe', 'zoom'])
  })

  it('keeps duration bounds sane', () => {
    expect(MIN_DURATION).toBe(0.1)
    expect(MAX_DURATION).toBe(2)
  })
})

describe('clampTransitionDuration', () => {
  it('passes through in-range durations', () => {
    expect(clampTransitionDuration(0.5)).toBe(0.5)
    expect(clampTransitionDuration(2)).toBe(2)
  })

  it('clamps below the minimum', () => {
    expect(clampTransitionDuration(-0.3)).toBe(MIN_DURATION)
    expect(clampTransitionDuration(0.05)).toBe(MIN_DURATION)
  })

  it('clamps above the maximum', () => {
    expect(clampTransitionDuration(5)).toBe(MAX_DURATION)
  })
})

describe('defaultDuration', () => {
  it('uses the per-type defaults', () => {
    expect(defaultDuration('dissolve')).toBe(0.5)
    expect(defaultDuration('match')).toBe(0.3)
    expect(defaultDuration('fade')).toBe(0.5)
  })
})

describe('makeBetweenTransition', () => {
  it('builds a between transition with clamped default duration', () => {
    const t = makeBetweenTransition('clip-a', 'clip-b', 'dissolve')
    expect(t.kind).toBe('between')
    expect(t.type).toBe('dissolve')
    expect(t.clipAId).toBe('clip-a')
    expect(t.clipBId).toBe('clip-b')
    expect(t.duration).toBe(0.5)
    expect(t.source).toBe('auto')
    expect(t.id).toBeTruthy()
  })
})

describe('makeEdgeTransition', () => {
  it('builds a fade edge transition', () => {
    const t = makeEdgeTransition('start', 'clip-a')
    expect(t.kind).toBe('edge')
    expect(t.at).toBe('start')
    expect(t.type).toBe('fade')
    expect(t.clipId).toBe('clip-a')
    expect(t.duration).toBe(0.5)
    expect(t.source).toBe('auto')
  })
})
interface ClipLike {
  id: string
  trackId: string
  assetId: string
  start: number
  duration: number
  beatId?: string
}

const V = (id: string, trackId: string, assetId: string, start: number, duration: number, beatId?: string): ClipLike => ({
  id,
  trackId,
  assetId,
  start,
  duration,
  beatId,
})

const RATIONALE_CONTINUITY =
  'Same image continues across the cut — match cut keeps continuity.'
const RATIONALE_PASSAGE =
  'Between matched narration beats — dissolve signals the passage of time.'

describe('evaluateTransitions', () => {
  it('suggests a match cut when the same asset continues to the next clip', () => {
    const clips = [
      V('a', 't0', 'img1', 0, 2),
      V('b', 't0', 'img1', 2, 2),
    ]
    const out = evaluateTransitions(clips)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      kind: 'between',
      clipAId: 'a',
      clipBId: 'b',
      type: 'match',
      duration: 0.3,
      source: 'auto',
      reason: 'continuity',
      rationale: RATIONALE_CONTINUITY,
    })
  })

  it('suggests a dissolve when matched beats have a >= 0.5s gap', () => {
    const clips = [
      V('a', 't0', 'img1', 0, 1.5, 'b0'),
      V('b', 't0', 'img2', 2, 2, 'b1'),
    ]
    const out = evaluateTransitions(clips)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      type: 'dissolve',
      duration: 0.5,
      reason: 'passage',
      rationale: RATIONALE_PASSAGE,
    })
  })

  it('suggests nothing for a tight cut between different assets', () => {
    const clips = [V('a', 't0', 'img1', 0, 2), V('b', 't0', 'img2', 2, 2)]
    expect(evaluateTransitions(clips)).toEqual([])
  })

  it('does not dissolve when the gap is below the threshold', () => {
    const clips = [V('a', 't0', 'img1', 0, 2, 'b0'), V('b', 't0', 'img2', 2.3, 2, 'b1')]
    expect(evaluateTransitions(clips)).toEqual([])
  })

  it('does not dissolve a large gap unless both clips are matched beats', () => {
    const clips = [V('a', 't0', 'img1', 0, 2), V('b', 't0', 'img2', 3, 2)]
    expect(evaluateTransitions(clips)).toEqual([])
  })

  it('prefers continuity over passage when both signals fire', () => {
    const clips = [V('a', 't0', 'img1', 0, 1.5, 'b0'), V('b', 't0', 'img1', 2, 1.5, 'b1')]
    const out = evaluateTransitions(clips)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ type: 'match', reason: 'continuity' })
  })

  it('never suggests wipe or zoom', () => {
    const clips = [
      V('a', 't0', 'img1', 0, 1, 'b0'),
      V('b', 't0', 'img2', 1.6, 1, 'b1'),
      V('c', 't0', 'img3', 3, 1, 'b2'),
    ]
    for (const t of evaluateTransitions(clips)) {
      expect(['match', 'dissolve', 'fade']).toContain(t.type)
    }
  })

  it('only considers clips adjacent on the same track', () => {
    const clips = [
      V('a', 't0', 'img1', 0, 2),
      V('x', 't1', 'other', 0, 2),
      V('b', 't0', 'img1', 2, 2),
    ]
    const out = evaluateTransitions(clips)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ clipAId: 'a', clipBId: 'b' })
  })

  it('does not mutate its inputs', () => {
    const clips = [V('a', 't0', 'img1', 0, 1.5, 'b0'), V('b', 't0', 'img2', 2, 2, 'b1')]
    const before = JSON.stringify(clips)
    evaluateTransitions(clips)
    expect(JSON.stringify(clips)).toBe(before)
  })
})
