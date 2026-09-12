export const TRANSITION_TYPES = ['match', 'dissolve', 'fade', 'wipe', 'zoom'] as const

export type TransitionType = (typeof TRANSITION_TYPES)[number]

export type TransitionSource = 'auto' | 'manual'

export type TransitionReason = 'continuity' | 'passage' | 'template' | 'manual' | 'break'

export const MIN_DURATION = 0.1
export const MAX_DURATION = 2

const DEFAULT_DURATIONS: Record<TransitionType, number> = {
  match: 0.3,
  dissolve: 0.5,
  fade: 0.5,
  wipe: 0.5,
  zoom: 0.4,
}

export interface BetweenTransition {
  kind: 'between'
  id: string
  clipAId: string
  clipBId: string
  type: TransitionType
  duration: number
  source: TransitionSource
  reason?: TransitionReason
  rationale?: string
}

export interface EdgeTransition {
  kind: 'edge'
  id: string
  at: 'start' | 'end'
  clipId: string
  type: 'fade'
  duration: number
  source: TransitionSource
  reason?: 'break' | 'manual'
  rationale?: string
}

export type Transition = BetweenTransition | EdgeTransition

export function clampTransitionDuration(duration: number): number {
  if (duration < MIN_DURATION) return MIN_DURATION
  if (duration > MAX_DURATION) return MAX_DURATION
  return duration
}

export function defaultDuration(type: TransitionType): number {
  return DEFAULT_DURATIONS[type]
}

function nextId(): string {
  return `t-${crypto.randomUUID()}`
}

export function makeBetweenTransition(
  clipAId: string,
  clipBId: string,
  type: TransitionType,
  duration?: number,
  source: TransitionSource = 'auto',
  reason?: TransitionReason,
  rationale?: string,
): BetweenTransition {
  return {
    kind: 'between',
    id: nextId(),
    clipAId,
    clipBId,
    type,
    duration: clampTransitionDuration(duration ?? defaultDuration(type)),
    source,
    reason,
    rationale,
  }
}

export function makeEdgeTransition(
  at: 'start' | 'end',
  clipId: string,
  duration?: number,
  source: TransitionSource = 'auto',
  reason?: EdgeTransition['reason'],
  rationale?: string,
): EdgeTransition {
  return {
    kind: 'edge',
    id: nextId(),
    at,
    clipId,
    type: 'fade',
    duration: clampTransitionDuration(duration ?? defaultDuration('fade')),
    source,
    reason,
    rationale,
  }
}
const MIN_PASSAGE_GAP = 0.5

const RATIONALE_CONTINUITY =
  'Same image continues across the cut — match cut keeps continuity.'
const RATIONALE_PASSAGE =
  'Between matched narration beats — dissolve signals the passage of time.'

export interface ClipLike {
  id: string
  trackId: string
  assetId: string
  start: number
  duration: number
  beatId?: string
}

export interface EvaluateOptions {
  minPassageGap?: number
}

export function evaluateTransitions(
  clips: ClipLike[],
  options: EvaluateOptions = {},
): BetweenTransition[] {
  const minPassageGap = options.minPassageGap ?? MIN_PASSAGE_GAP
  const suggestions: BetweenTransition[] = []
  const byTrack = new Map<string, ClipLike[]>()
  for (const clip of clips) {
    const list = byTrack.get(clip.trackId) ?? []
    list.push(clip)
    byTrack.set(clip.trackId, list)
  }
  for (const trackClips of byTrack.values()) {
    const sorted = [...trackClips].sort((a, b) => a.start - b.start)
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const next = sorted[i]
      const gap = next.start - (prev.start + prev.duration)
      if (prev.assetId === next.assetId) {
        suggestions.push(
          makeBetweenTransition(
            prev.id,
            next.id,
            'match',
            undefined,
            'auto',
            'continuity',
            RATIONALE_CONTINUITY,
          ),
        )
        continue
      }
      if (prev.beatId && next.beatId && gap >= minPassageGap) {
        suggestions.push(
          makeBetweenTransition(
            prev.id,
            next.id,
            'dissolve',
            undefined,
            'auto',
            'passage',
            RATIONALE_PASSAGE,
          ),
        )
      }
    }
  }
  return suggestions
}
