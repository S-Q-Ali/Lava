import type { Transition } from './transitions'
import type { CaptionItem } from './captions'

export const TRACK_TYPES = [
  'video',
  'image',
  'voice',
  'music',
  'sfx',
  'captions',
  'text',
] as const

export type TrackType = (typeof TRACK_TYPES)[number]

export const DEFAULT_TRACKS: Track[] = TRACK_TYPES.map((type) => ({
  id: `track-${type}`,
  type,
  name: type,
}))

export interface Track {
  id: string
  type: TrackType
  name: string
}

export type AssetKind = 'image' | 'video' | 'audio'

export interface AssetMeta {
  width?: number
  height?: number
  duration?: number
  mimeType?: string
  size?: number
}

export interface Asset {
  id: string
  kind: AssetKind
  name: string
  url: string
  meta: AssetMeta
}

export type MotionType =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down'

export interface MotionSpec {
  type: MotionType
  strength: number
}

export interface Clip {
  id: string
  trackId: string
  assetId: string
  name: string
  start: number
  duration: number
  confidence?: number
  beatId?: string
  motion?: MotionSpec
}

export interface TimelineModel {
  tracks: Track[]
  clips: Clip[]
  assets: Asset[]
  playhead: number
  selectedClipId: string | null
  transcripts?: Record<string, Transcript>
  transitions?: Transition[]
  captions?: CaptionItem[]
}

export interface TranscriptWord {
  word: string
  start: number
  end: number
  confidence: number
}

export interface TranscriptSegment {
  id: number
  text: string
  start: number
  end: number
  avgLogprob: number
  confidence: number
  words: TranscriptWord[]
}

export interface TranscriptPause {
  start: number
  end: number
  gap: number
}

export interface Transcript {
  text: string
  language: string
  segments: TranscriptSegment[]
  pauses: TranscriptPause[]
}