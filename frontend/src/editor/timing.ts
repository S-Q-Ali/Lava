export const TIMING_EPSILON = 0.01
export const MIN_AUTO_DURATION = 0.5
export const TAIL_HOLD = 0.3

export interface TimedBeat {
  start: number
  end: number
}

export function hasTimingOverride(
  clip: { start: number; duration: number },
  recorded: TimedBeat,
  { epsilon = TIMING_EPSILON } = {},
): boolean {
  return (
    Math.abs(clip.start - recorded.start) > epsilon ||
    Math.abs(clip.duration - (recorded.end - recorded.start)) > epsilon
  )
}

export function pacedEnd(
  beat: TimedBeat,
  {
    isFinal = false,
    horizon = beat.end,
    minDuration = MIN_AUTO_DURATION,
    tailHold = TAIL_HOLD,
  }: { isFinal?: boolean; horizon?: number; minDuration?: number; tailHold?: number } = {},
): number {
  if (!isFinal) return beat.end
  const airtime = Math.max(0, horizon - beat.end)
  if (airtime <= TIMING_EPSILON) return beat.end
  const floorNeed = Math.max(0, minDuration - (beat.end - beat.start))
  const extend = Math.min(Math.max(floorNeed, tailHold), airtime)
  return beat.end + extend
}