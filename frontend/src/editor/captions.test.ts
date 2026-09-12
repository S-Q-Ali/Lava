import { describe, expect, it } from 'vitest'
import {
  CAPTION_PAUSE_SPLIT_THRESHOLD,
  CAPTION_TRACK_ID,
  DEFAULT_CAPTION_STYLE_ID,
  MIN_CAPTION_DURATION,
  clampCaptionDuration,
  isCaption,
  makeCaption,
  removeCaption,
  segmentCaptions,
  updateCaptionText,
  updateCaptionTiming,
  validateCaptions,
} from './captions'
import type { Transcript } from './types'

function transcriptFixture(): Transcript {
  return {
    text: 'Warm sunsets feel rare. Green forests sound calm.',
    language: 'en',
    segments: [
      {
        id: 0,
        text: 'Warm sunsets feel rare.',
        start: 0,
        end: 2,
        avgLogprob: -0.2,
        confidence: 0.9,
        words: [
          { word: 'Warm', start: 0, end: 0.5, confidence: 0.9 },
          { word: 'sunsets', start: 0.5, end: 1, confidence: 0.9 },
          { word: 'feel', start: 1, end: 1.5, confidence: 0.9 },
          { word: 'rare.', start: 1.5, end: 2, confidence: 0.9 },
        ],
      },
      {
        id: 1,
        text: 'Green forests sound calm.',
        start: 2.4,
        end: 4.4,
        avgLogprob: -0.2,
        confidence: 0.9,
        words: [
          { word: 'Green', start: 2.4, end: 2.9, confidence: 0.9 },
          { word: 'forests', start: 2.9, end: 3.4, confidence: 0.9 },
          { word: 'sound', start: 3.4, end: 3.9, confidence: 0.9 },
          { word: 'calm.', start: 3.9, end: 4.4, confidence: 0.9 },
        ],
      },
    ],
    pauses: [{ start: 2, end: 2.4, gap: 0.4 }],
  }
}

describe('caption model', () => {
  it('makeCaption builds a normal auto caption on the captions track', () => {
    const caption = makeCaption(1.5, 2)
    expect(caption.id).toMatch(/^cap-/)
    expect(caption.trackId).toBe(CAPTION_TRACK_ID)
    expect(caption.start).toBe(1.5)
    expect(caption.duration).toBe(2)
    expect(caption.text).toBe('')
    expect(caption.styleId).toBe(DEFAULT_CAPTION_STYLE_ID)
    expect(caption.source).toBe('auto')
    expect(caption.words).toBeUndefined()
  })

  it('makeCaption accepts text, style and words', () => {
    const caption = makeCaption(0, 1, {
      text: 'hello',
      styleId: 'karaoke',
      words: [{ word: 'hello', start: 0, end: 1 }],
    })
    expect(caption.text).toBe('hello')
    expect(caption.styleId).toBe('karaoke')
    expect(caption.words).toHaveLength(1)
  })

  it('clampCaptionDuration enforces the minimum duration', () => {
    expect(clampCaptionDuration(0.05)).toBe(MIN_CAPTION_DURATION)
    expect(clampCaptionDuration(3)).toBe(3)
  })

  it('isCaption accepts valid items and rejects junk', () => {
    const caption = makeCaption(0, 1, { text: 'hi' })
    expect(isCaption(caption)).toBe(true)
    expect(isCaption({ ...caption, source: 'nope' })).toBe(false)
    expect(isCaption({ ...caption, duration: 'x' })).toBe(false)
    expect(isCaption(null)).toBe(false)
    expect(isCaption('cap')).toBe(false)
  })
})

describe('segmentCaptions', () => {
  it('creates one caption per transcript segment', () => {
    const captions = segmentCaptions(transcriptFixture())
    expect(captions).toHaveLength(2)
    expect(captions[0].start).toBe(0)
    expect(captions[0].duration).toBeCloseTo(2)
    expect(captions[1].start).toBeCloseTo(2.4)
  })

  it('splits a segment on an intra-segment pause at or above the threshold', () => {
    const transcript = transcriptFixture()
    transcript.segments[0].words.splice(2, 0, {
      word: 'deep',
      start: 1.2,
      end: 1.4,
      confidence: 0.9,
    })
    const captions = segmentCaptions({
      ...transcript,
      pauses: [
        { start: 2, end: 2.4, gap: 0.4 },
        { start: 1.4, end: 1.8, gap: 0.4 },
      ],
    })
    expect(captions.length).toBe(3)
    const first = captions.find((c) => Math.abs(c.start - 0) < 1e-6)
    expect(first?.text).toBe('Warm sunsets deep feel')
  })

  const EPS = 1e-6
  it('reuses transcript words inside each caption time range', () => {
    const captions = segmentCaptions(transcriptFixture())
    expect(captions[0].words?.map((w) => w.word)).toEqual([
      'Warm',
      'sunsets',
      'feel',
      'rare.',
    ])
    expect(captions[0].words?.[0].start).toBe(0)
    expect(Math.abs(captions[1].words![0].start - 2.4) < EPS).toBe(true)
  })

  it('falls back to segment text when a part has no words', () => {
    const transcript = transcriptFixture()
    transcript.segments[1].words = []
    const captions = segmentCaptions(transcript)
    const last = captions[captions.length - 1]
    expect(last.text).toBe('Green forests sound calm.')
  })

  it('returns an empty list for a transcript without segments', () => {
    const transcript = transcriptFixture()
    transcript.segments = []
    expect(segmentCaptions(transcript)).toEqual([])
  })

  it('uses the default pause threshold constant', () => {
    expect(CAPTION_PAUSE_SPLIT_THRESHOLD).toBe(0.4)
  })
})

describe('caption edit ops', () => {
  it('updateCaptionText marks manual and drops stale word timings', () => {
    const caption = makeCaption(0, 1, {
      text: 'old',
      words: [{ word: 'old', start: 0, end: 1 }],
    })
    const updated = updateCaptionText(caption, 'new text')
    expect(updated.text).toBe('new text')
    expect(updated.source).toBe('manual')
    expect(updated.words).toBeUndefined()
  })

  it('updateCaptionTiming clamps duration and start and marks manual', () => {
    const caption = makeCaption(0.5, 1)
    const updated = updateCaptionTiming(caption, { start: -1, duration: 0.01 })
    expect(updated.start).toBe(0)
    expect(updated.duration).toBe(MIN_CAPTION_DURATION)
    expect(updated.source).toBe('manual')
  })

  it('removeCaption filters by id', () => {
    const a = makeCaption(0, 1)
    const b = makeCaption(2, 1)
    const rest = removeCaption([a, b], a.id)
    expect(rest).toEqual([b])
  })

  it('validateCaptions reports duplicate ids', () => {
    const a = makeCaption(0, 1)
    const b = { ...makeCaption(2, 1), id: a.id }
    expect(validateCaptions([a, b])).toHaveLength(1)
  })

  it('validateCaptions reports non-positive duration and negative start', () => {
    const a = { ...makeCaption(0, 1), duration: 0 }
    const b = { ...makeCaption(0, 1), start: -0.5 }
    const errors = validateCaptions([a, b])
    expect(errors.some((e) => e.includes('non-positive duration'))).toBe(true)
    expect(errors.some((e) => e.includes('starts before the timeline start'))).toBe(true)
  })

  it('validateCaptions reports overlapping captions', () => {
    const a = makeCaption(0, 2)
    const b = makeCaption(1, 2)
    expect(validateCaptions([a, b])).toHaveLength(1)
  })

  it('validateCaptions tolerates float drift on adjacency', () => {
    const a = makeCaption(0, 2)
    const b = makeCaption(2 - 1e-9, 2)
    expect(validateCaptions([a, b])).toHaveLength(0)
  })
})