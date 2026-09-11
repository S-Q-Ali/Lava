import type { TranscriptPause, TranscriptSegment, TranscriptWord } from './types'

export interface Beat {
  id: string
  text: string
  start: number
  end: number
}

export const PAUSE_BEAT_THRESHOLD = 0.4
const EPSILON = 1e-9

function wordsInPart(words: TranscriptWord[], start: number, end: number): TranscriptWord[] {
  return words.filter(
    (word) => word.start >= start - EPSILON && word.end <= end + EPSILON,
  )
}

function labelFor(partStart: number, partEnd: number, segment: TranscriptSegment): string {
  const words = wordsInPart(segment.words, partStart, partEnd)
  if (words.length === 0) {
    return segment.text
  }
  return words.map((word) => word.word.trim()).join(' ').trim()
}

function splitSegment(
  segment: TranscriptSegment,
  boundaries: number[],
): Array<{ start: number; end: number }> {
  const splits = boundaries.filter(
    (boundary) => segment.start < boundary && boundary < segment.end,
  )
  const anchors = [segment.start, ...splits, segment.end]
  const parts: Array<{ start: number; end: number }> = []
  for (let index = 0; index < anchors.length - 1; index++) {
    parts.push({ start: anchors[index], end: anchors[index + 1] })
  }
  return parts
}

/**
 * Turns an M2 transcript into ordered visual beats: one per segment, split
 * further whenever an intra-segment pause is at or above the beat threshold.
 * A pause at or above threshold means a pause belongs to the following beat.
 */
export function segmentBeats(
  transcript: { segments: TranscriptSegment[]; pauses: TranscriptPause[] },
  { pauseThreshold = PAUSE_BEAT_THRESHOLD } = {},
): Beat[] {
  const boundaries = transcript.pauses
    .filter((pause) => pause.gap >= pauseThreshold)
    .map((pause) => pause.end)
    .sort((a, b) => a - b)

  const beats: Beat[] = []
  let index = 0
  for (const segment of [...transcript.segments].sort((a, b) => a.start - b.start)) {
    for (const part of splitSegment(segment, boundaries)) {
      beats.push({
        id: `b${index}`,
        text: labelFor(part.start, part.end, segment),
        start: part.start,
        end: part.end,
      })
      index++
    }
  }
  return beats
}