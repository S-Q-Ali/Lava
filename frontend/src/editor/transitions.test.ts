import { describe, expect, it } from 'vitest'

import {
  MAX_DURATION,
  MIN_DURATION,
  TRANSITION_TYPES,
  clampTransitionDuration,
  defaultDuration,
  evaluateTransitions,
  makeBetweenTransition,
  makeEdgeTransition,
  overrideTransition,
  removeTransition,
  validateTransitions,
} from './transitions'
import type { Transition } from './transitions'

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


const withId = <T>(t: T): T => ({ ...(t as object), id: 't' }) as T
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


describe('validateTransitions', () => {
  const clips: ClipLike[] = [
    V('a', 't0', 'img1', 0, 2),
    V('b', 't0', 'img2', 2, 2),
    V('c', 't1', 'img3', 0, 2),
  ]

  it('accepts a valid between transition', () => {
    const t = makeBetweenTransition('a', 'b', 'dissolve', 0.5)
    expect(validateTransitions(clips, [t])).toEqual([])
  })

  it('flags transitions anchored to missing clips', () => {
    const t = withId(makeBetweenTransition('a', 'nope', 'dissolve'))
    expect(validateTransitions(clips, [t])).toEqual([
      'Transition t references missing clips: a, nope.',
    ])
  })

  it('flags cross-track anchors', () => {
    const t = withId(makeBetweenTransition('a', 'c', 'dissolve'))
    expect(validateTransitions(clips, [t])).toEqual([
      'Transition t spans tracks t0 and t1 — a between transition needs two consecutive clips on the same track.',
    ])
  })

  it('flags non-contiguous clips beyond tolerance', () => {
    const t = makeBetweenTransition('a', 'b', 'dissolve', 0.5)
    const shifted = clips.map((c) => (c.id === 'b' ? V('b', 't0', 'img2', 2.5, 2) : c))
    expect(validateTransitions(shifted, [t])).toHaveLength(1)
  })

  it('flags over-long durations that exceed the shorter clip', () => {
    const t = withId(makeBetweenTransition('a', 'b', 'dissolve', 0.5))
    const short = clips.map((c) => (c.id === 'b' ? V('b', 't0', 'img2', 2, 0.2) : c))
    expect(validateTransitions(short, [t])).toEqual([
      'Transition t duration 0.5 exceeds what both clips can cover.',
    ])
  })

  it('flags unknown kinds and types', () => {
    const bad = { kind: 'edge', at: 'start', clipId: 'a', type: 'wipe', duration: 0.5 } as unknown as Transition
    expect(validateTransitions(clips, [bad])).toEqual([
      'Transition with kind edge must be a fade type.',
    ])
  })

  it('accepts a valid fade edge on a reel edge clip', () => {
    const t = makeEdgeTransition('start', 'a', 0.5)
    expect(validateTransitions(clips, [t])).toEqual([])
  })

  it('flags edge fades anchored to non-edge clips', () => {
    const t = makeEdgeTransition('start', 'b', 0.5)
    expect(validateTransitions(clips, [t])).toHaveLength(1)
  })

  it('flags duplicate between transitions for the same pair', () => {
    const one = makeBetweenTransition('a', 'b', 'dissolve', 0.5)
    const two = makeBetweenTransition('a', 'b', 'fade', 0.5)
    expect(validateTransitions(clips, [one, two])).toEqual([
      'Duplicate transition on pair a→b.',
    ])
  })
})

describe('overrideTransition', () => {
  it('changes type, clamps duration and flips source to manual', () => {
    const t = makeBetweenTransition('a', 'b', 'dissolve', 0.5)
    const overridden = overrideTransition(t, 'fade', 9)
    expect(overridden.type).toBe('fade')
    expect(overridden.duration).toBe(MAX_DURATION)
    expect(overridden.source).toBe('manual')
    expect(overridden.id).toBe(t.id)
  })

  it('does not mutate the original', () => {
    const t = makeBetweenTransition('a', 'b', 'dissolve', 0.5)
    const overridden = overrideTransition(t, 'fade', 0.8)
    expect(t.type).toBe('dissolve')
    expect(t.source).toBe('auto')
    expect(overridden).not.toBe(t)
  })
})

describe('removeTransition', () => {
  it('removes only the targeted transition', () => {
    const one = makeBetweenTransition('a', 'b', 'dissolve', 0.5)
    const two = makeBetweenTransition('b', 'a', 'fade', 0.4)
    const left = removeTransition([one, two], two.id)
    expect(left).toEqual([one])
  })

  it('returns a new array and does not mutate the input list', () => {
    const one = makeBetweenTransition('a', 'b', 'dissolve', 0.5)
    const before = JSON.stringify([one])
    const left = removeTransition([one], 'missing')
    expect(left).toHaveLength(1)
    expect(JSON.stringify([one])).toBe(before)
  })
})
