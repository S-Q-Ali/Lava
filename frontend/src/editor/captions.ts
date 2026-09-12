import type { TranscriptPause, TranscriptSegment, TranscriptWord } from './types'

export const CAPTION_TRACK_ID = 'track-captions'
export const DEFAULT_CAPTION_STYLE_ID = 'normal'
export const MIN_CAPTION_DURATION = 0.2
export const CAPTION_PAUSE_SPLIT_THRESHOLD = 0.4
const EPSILON = 1e-6

export type CaptionSource = 'auto' | 'manual'

export interface CaptionWord {
  word: string
  start: number
  end: number
}

export interface CaptionItem {
  id: string
  trackId: string
  start: number
  duration: number
  text: string
  styleId: string
  words?: CaptionWord[]
  source: CaptionSource
}

export function clampCaptionDuration(duration: number): number {
  if (duration < MIN_CAPTION_DURATION) return MIN_CAPTION_DURATION
  return duration
}

function nextId(): string {
  return `cap-${crypto.randomUUID()}`
}

export function makeCaption(
  start: number,
  duration: number,
  options: { text?: string; styleId?: string; words?: CaptionWord[]; source?: CaptionSource } = {},
): CaptionItem {
  return {
    id: nextId(),
    trackId: CAPTION_TRACK_ID,
    start: Math.max(0, start),
    duration: clampCaptionDuration(duration),
    text: options.text ?? '',
    styleId: options.styleId ?? DEFAULT_CAPTION_STYLE_ID,
    words: options.words,
    source: options.source ?? 'auto',
  }
}

function wordsInPart(words: TranscriptWord[], start: number, end: number): CaptionWord[] {
  return words
    .filter((word) => word.start >= start - EPSILON && word.end <= end + EPSILON)
    .map((word) => ({ word: word.word, start: word.start, end: word.end }))
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
 * Pure caption generation from an M2 transcript: one caption per segment,
 * split further whenever an intra-segment pause is at or above the split
 * threshold (same rule as beat segmentation so captions stay aligned with
 * matched image beats). Word timings are reused onto each item.
 */
export function segmentCaptions(
  transcript: { segments: TranscriptSegment[]; pauses: TranscriptPause[] },
  { pauseThreshold = CAPTION_PAUSE_SPLIT_THRESHOLD } = {},
): CaptionItem[] {
  const boundaries = transcript.pauses
    .filter((pause) => pause.gap >= pauseThreshold)
    .map((pause) => pause.end)
    .sort((a, b) => a - b)

  const captions: CaptionItem[] = []
  for (const segment of [...transcript.segments].sort((a, b) => a.start - b.start)) {
    for (const part of splitSegment(segment, boundaries)) {
      const words = wordsInPart(segment.words, part.start, part.end)
      const text =
        words.length > 0
          ? words.map((word) => word.word.trim()).join(' ').trim()
          : segment.text
      captions.push(
        makeCaption(part.start, part.end - part.start, {
          text,
          words: words.length > 0 ? words : undefined,
        }),
      )
    }
  }
  return captions
}

export function updateCaptionText(caption: CaptionItem, text: string): CaptionItem {
  return { ...caption, text, source: 'manual', words: undefined }
}

export function updateCaptionTiming(
  caption: CaptionItem,
  patch: { start?: number; duration?: number },
): CaptionItem {
  return {
    ...caption,
    start: Math.max(0, patch.start ?? caption.start),
    duration: clampCaptionDuration(patch.duration ?? caption.duration),
    source: 'manual',
  }
}

export function removeCaption(captions: CaptionItem[], id: string): CaptionItem[] {
  return captions.filter((caption) => caption.id !== id)
}

export function validateCaptions(captions: CaptionItem[]): string[] {
  const errors: string[] = []
  const seenIds = new Set<string>()
  const sorted = [...captions].sort((a, b) => a.start - b.start)
  for (let index = 0; index < captions.length; index++) {
    const caption = captions[index]
    if (seenIds.has(caption.id)) {
      errors.push(`Duplicate caption id ${caption.id}.`)
    }
    seenIds.add(caption.id)
    if (caption.duration <= 0) {
      errors.push(`Caption ${caption.id} has a non-positive duration.`)
    }
    if (caption.start < 0) {
      errors.push(`Caption ${caption.id} starts before the timeline start.`)
    }
  }
  for (let index = 1; index < sorted.length; index++) {
    const prev = sorted[index - 1]
    const current = sorted[index]
    if (current.start < prev.start + prev.duration - EPSILON) {
      errors.push(`Caption ${current.id} overlaps caption ${prev.id}.`)
    }
  }
  return errors
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isCaption(value: unknown): value is CaptionItem {
  if (!isRecord(value)) return false
  if (
    typeof value.id !== 'string' ||
    typeof value.trackId !== 'string' ||
    typeof value.start !== 'number' ||
    typeof value.duration !== 'number' ||
    typeof value.text !== 'string' ||
    typeof value.styleId !== 'string'
  ) {
    return false
  }
  if (value.source !== 'auto' && value.source !== 'manual') return false
  if (value.words !== undefined) {
    if (!Array.isArray(value.words)) return false
    for (const word of value.words) {
      if (
        !isRecord(word) ||
        typeof word.word !== 'string' ||
        typeof word.start !== 'number' ||
        typeof word.end !== 'number'
      ) {
        return false
      }
    }
  }
  return true
}