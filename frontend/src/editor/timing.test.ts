import { describe, expect, it } from 'vitest'
import { hasTimingOverride, pacedEnd, MIN_AUTO_DURATION, TAIL_HOLD } from './timing'

describe('hasTimingOverride', () => {
  it('returns false when the clip matches the recorded beat timing exactly', () => {
    expect(hasTimingOverride({ start: 2, duration: 1.5 }, { start: 2, end: 3.5 })).toBe(false)
  })

  it('returns true when the start was moved beyond epsilon', () => {
    expect(hasTimingOverride({ start: 2.4, duration: 1.5 }, { start: 2, end: 3.5 })).toBe(true)
  })

  it('returns true when the duration was trimmed beyond epsilon', () => {
    expect(hasTimingOverride({ start: 2, duration: 1.1 }, { start: 2, end: 3.5 })).toBe(true)
  })

  it('tolerates sub-epsilon float drift', () => {
    expect(hasTimingOverride({ start: 2.004, duration: 1.498 }, { start: 2, end: 3.5 })).toBe(false)
  })
})

describe('pacedEnd', () => {
  it('never extends an interior beat, even with airtime available', () => {
    expect(pacedEnd({ start: 0, end: 1 }, { isFinal: false, horizon: 4 })).toBeCloseTo(1)
  })

  it('extends a final short beat up to the minimum auto duration', () => {
    const end = pacedEnd({ start: 0, end: 0.2 }, { isFinal: true, horizon: 2 })
    expect(end).toBeCloseTo(MIN_AUTO_DURATION)
  })

  it('settles the final image by tail hold when the beat is long enough already', () => {
    const end = pacedEnd({ start: 0, end: 1 }, { isFinal: true, horizon: 3 })
    expect(end).toBeCloseTo(1 + TAIL_HOLD)
  })

  it('caps the extension at the hold horizon', () => {
    const end = pacedEnd({ start: 0, end: 1 }, { isFinal: true, horizon: 1.15 })
    expect(end).toBeCloseTo(1.15)
  })

  it('returns the beat end when there is no airtime', () => {
    expect(pacedEnd({ start: 0, end: 1 }, { isFinal: true, horizon: 1 })).toBeCloseTo(1)
  })

  it('returns the beat end when the beat extends past the horizon', () => {
    expect(pacedEnd({ start: 0, end: 1.2 }, { isFinal: true, horizon: 1 })).toBeCloseTo(1.2)
  })

  it('honours custom floor and hold options', () => {
    const end = pacedEnd(
      { start: 0, end: 0.3 },
      { isFinal: true, horizon: 3, minDuration: 1, tailHold: 0.1 },
    )
    expect(end).toBeCloseTo(1)
  })
})