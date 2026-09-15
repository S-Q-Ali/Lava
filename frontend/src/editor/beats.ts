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

function stableBeatId(start: number, end: number, text: string): string {
  const key = `${start.toFixed(4)}:${end.toFixed(4)}:${text}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const ch = key.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return `b${(hash >>> 0).toString(36)}`
}

/**
 * Turns an M2 transcript into ordered visual beats: one per segment, split
 * further whenever an intra-segment pause is at or above the beat threshold.
 * A pause at or above threshold means a pause belongs to the following beat.
 * Uses positional IDs (b0, b1, ...) for initial segmentation.
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

/**
 * Re-segments a transcript after text edits, using stable content-based IDs.
 * Beats whose text matches a previous beat preserve the old ID; new/changed
 * beats get a content-based stable ID (hash of start+end+text).
 */
export function resegmentBeats(
  transcript: { segments: TranscriptSegment[]; pauses: TranscriptPause[] },
  previousBeats: Beat[],
  { pauseThreshold = PAUSE_BEAT_THRESHOLD } = {},
): Beat[] {
  const newBeats = segmentBeats(transcript, { pauseThreshold })

  const prevByText = new Map<string, Beat>()
  for (const beat of previousBeats) {
    if (!prevByText.has(beat.text)) prevByText.set(beat.text, beat)
  }

  return newBeats.map((beat) => {
    const prev = prevByText.get(beat.text)
    if (prev) {
      prevByText.delete(beat.text)
      return { ...beat, id: prev.id }
    }
    return { ...beat, id: stableBeatId(beat.start, beat.end, beat.text) }
  })
}