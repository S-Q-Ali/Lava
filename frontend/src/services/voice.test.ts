import { describe, expect, it } from 'vitest'
import { parseTranscript, VoiceError } from './voice'

describe('parseTranscript', () => {
  it('parses a well-formed sidecar response', () => {
    const transcript = parseTranscript({
      text: 'Ali jungle mein gaya.',
      language: 'ur',
      segments: [
        {
          id: 0,
          text: 'Ali jungle mein gaya.',
          start: 0,
          end: 3,
          avgLogprob: -0.4,
          confidence: 72,
          words: [
            { word: 'Ali', start: 0, end: 1, confidence: 0.9 },
            { word: 'jungle', start: 1, end: 2, confidence: 0.8 },
          ],
        },
      ],
      pauses: [{ start: 1, end: 1.5, gap: 0.5 }],
    })
    expect(transcript.language).toBe('ur')
    expect(transcript.segments[0].words).toHaveLength(2)
    expect(transcript.pauses[0].gap).toBe(0.5)
  })

  it('rejects an unexpected shape', () => {
    expect(() => parseTranscript({ text: 'nope' })).toThrow(VoiceError)
    expect(() => parseTranscript(null)).toThrow(VoiceError)
  })

  it('defaults missing optional fields defensively', () => {
    const transcript = parseTranscript({ segments: [{}] })
    expect(transcript.text).toBe('')
    expect(transcript.language).toBe('?')
    expect(transcript.segments[0].words).toEqual([])
    expect(transcript.pauses).toEqual([])
  })
})