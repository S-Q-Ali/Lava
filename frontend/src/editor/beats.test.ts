import { describe, expect, it } from 'vitest'
import { segmentBeats, resegmentBeats } from './beats'
import type { Transcript } from './types'

function transcript(overrides: Partial<Transcript> = {}): Transcript {
  return {
    text: '',
    language: 'en',
    segments: [],
    pauses: [],
    ...overrides,
  }
}

describe('segmentBeats', () => {
  it('creates one beat per segment with no pauses', () => {
    const t = transcript({
      segments: [
        {
          id: 0,
          text: 'Ali jungle mein gaya',
          start: 0,
          end: 3,
          avgLogprob: -0.1,
          confidence: 0.9,
          words: [],
        },
        {
          id: 1,
          text: 'Wahan sher tha',
          start: 4,
          end: 6,
          avgLogprob: -0.2,
          confidence: 0.8,
          words: [],
        },
      ],
    })
    const beats = segmentBeats(t)
    expect(beats).toHaveLength(2)
    expect(beats[0]).toEqual({ id: 'b0', text: 'Ali jungle mein gaya', start: 0, end: 3 })
    expect(beats[1]).toEqual({ id: 'b1', text: 'Wahan sher tha', start: 4, end: 6 })
  })

  it('splits a segment on an intra-segment pause at or above threshold', () => {
    const t = transcript({
      segments: [
        {
          id: 0,
          text: 'first part second part',
          start: 0,
          end: 5,
          avgLogprob: -0.2,
          confidence: 0.8,
          words: [
            { word: 'first', start: 0, end: 0.5, confidence: 0.9 },
            { word: 'part', start: 0.5, end: 1, confidence: 0.9 },
            { word: 'second', start: 2.5, end: 3, confidence: 0.8 },
            { word: 'part', start: 3, end: 3.5, confidence: 0.8 },
          ],
        },
      ],
      pauses: [{ start: 1, end: 2.5, gap: 1.5 }],
    })
    const beats = segmentBeats(t)
    expect(beats).toHaveLength(2)
    expect(beats[0]).toEqual({ id: 'b0', text: 'first part', start: 0, end: 2.5 })
    expect(beats[1]).toEqual({ id: 'b1', text: 'second part', start: 2.5, end: 5 })
  })

  it('ignores pauses below the threshold', () => {
    const t = transcript({
      segments: [
        {
          id: 0,
          text: 'a b',
          start: 0,
          end: 3,
          avgLogprob: -0.1,
          confidence: 0.9,
          words: [
            { word: 'a', start: 0, end: 0.4, confidence: 0.9 },
            { word: 'b', start: 0.55, end: 0.95, confidence: 0.9 },
          ],
        },
      ],
      pauses: [{ start: 0.4, end: 0.55, gap: 0.15 }],
    })
    expect(segmentBeats(t)).toHaveLength(1)
  })

  it('keeps one beat per segment for a pause between segments', () => {
    const t = transcript({
      segments: [
        { id: 0, text: 'one', start: 0, end: 1, avgLogprob: -0.1, confidence: 0.9, words: [] },
        { id: 1, text: 'two', start: 3, end: 4, avgLogprob: -0.1, confidence: 0.9, words: [] },
      ],
      pauses: [{ start: 1, end: 3, gap: 2 }],
    })
    const beats = segmentBeats(t)
    expect(beats).toHaveLength(2)
    expect(beats[0].start).toBe(0)
    expect(beats[1].end).toBe(4)
  })

  it('splits with multiple pauses into ordered parts', () => {
    const seg = {
      id: 0,
      text: 'x',
      start: 0,
      end: 8,
      avgLogprob: -0.1,
      confidence: 0.9,
      words: [
        { word: 'a', start: 0, end: 1, confidence: 0.9 },
        { word: 'b', start: 1, end: 2, confidence: 0.9 },
        { word: 'c', start: 3.5, end: 4.5, confidence: 0.9 },
        { word: 'd', start: 4.5, end: 5.5, confidence: 0.9 },
        { word: 'e', start: 7, end: 8, confidence: 0.9 },
      ],
    }
    const t = transcript({
      segments: [seg],
      pauses: [
        { start: 2, end: 3.5, gap: 1.5 },
        { start: 5.5, end: 7, gap: 1.5 },
      ],
    })
    const beats = segmentBeats(t)
    expect(beats.map((b) => [b.start, b.end])).toEqual([
      [0, 3.5],
      [3.5, 7],
      [7, 8],
    ])
    expect(beats.map((b) => b.id)).toEqual(['b0', 'b1', 'b2'])
  })

  it('falls back to segment text when a part has no words', () => {
    const t = transcript({
      segments: [
        { id: 0, text: 'fallback', start: 0, end: 4, avgLogprob: -0.1, confidence: 0.9, words: [] },
      ],
      pauses: [{ start: 1, end: 3, gap: 2 }],
    })
    const beats = segmentBeats(t)
    expect(beats).toHaveLength(2)
    expect(beats[0].text).toBe('fallback')
    expect(beats[1].text).toBe('fallback')
  })

  it('sorts segments by start before splitting', () => {
    const t = transcript({
      segments: [
        { id: 1, text: 'late', start: 3, end: 5, avgLogprob: -0.1, confidence: 0.9, words: [] },
        { id: 0, text: 'early', start: 0, end: 2, avgLogprob: -0.1, confidence: 0.9, words: [] },
      ],
    })
    const beats = segmentBeats(t)
    expect(beats.map((b) => b.id)).toEqual(['b0', 'b1'])
    expect(beats[0].text).toBe('early')
    expect(beats[1].text).toBe('late')
  })

  it('returns an empty list for an empty transcript', () => {
    expect(segmentBeats(transcript())).toEqual([])
  })
})

describe('resegmentBeats', () => {
  it('preserves beat IDs when text matches', () => {
    const t = transcript({
      segments: [
        { id: 0, text: 'hello world', start: 0, end: 2, avgLogprob: -0.1, confidence: 0.9, words: [] },
        { id: 1, text: 'goodbye', start: 2, end: 4, avgLogprob: -0.1, confidence: 0.9, words: [] },
      ],
    })
    const prev = segmentBeats(t)
    expect(prev.length).toBe(2)
    const reseg = resegmentBeats(t, prev)
    expect(reseg.length).toBe(2)
    expect(reseg[0].id).toBe(prev[0].id)
    expect(reseg[1].id).toBe(prev[1].id)
  })

  it('assigns new IDs when text changes', () => {
    const t1 = transcript({
      segments: [
        { id: 0, text: 'hello world', start: 0, end: 2, avgLogprob: -0.1, confidence: 0.9, words: [] },
      ],
    })
    const prev = segmentBeats(t1)
    const t2 = transcript({
      segments: [
        { id: 0, text: 'changed text', start: 0, end: 2, avgLogprob: -0.1, confidence: 0.9, words: [] },
      ],
    })
    const reseg = resegmentBeats(t2, prev)
    expect(reseg.length).toBe(1)
    expect(reseg[0].id).not.toBe(prev[0].id)
    expect(reseg[0].text).toBe('changed text')
  })

  it('handles empty previous beats', () => {
    const t = transcript({
      segments: [
        { id: 0, text: 'new beat', start: 0, end: 2, avgLogprob: -0.1, confidence: 0.9, words: [] },
      ],
    })
    const reseg = resegmentBeats(t, [])
    expect(reseg.length).toBe(1)
    expect(reseg[0].text).toBe('new beat')
  })

  it('handles empty transcript', () => {
    const reseg = resegmentBeats(transcript(), [])
    expect(reseg).toEqual([])
  })
})
