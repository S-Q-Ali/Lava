import type { Clip } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { MAX_DURATION } from '../../editor/transitions'
import type { BetweenTransition, EdgeTransition } from '../../editor/transitions'
import { useTimelineZoom } from '../../hooks/useTimelineZoom'

const MIN_CHIP_PX = 36

export default function TransitionOverlay({
  clips,
}: {
  clips: Clip[]
}) {
  const transitions = useEditorStore((s) => s.transitions)
  const selectedTransitionId = useEditorStore((s) => s.selectedTransitionId)
  const setSelectedTransitionId = useEditorStore((s) => s.setSelectedTransitionId)
  const { pps } = useTimelineZoom()

  const chipWidthPx = (duration: number) =>
    Math.min(MAX_DURATION * pps, Math.max(MIN_CHIP_PX, duration * pps))

  const byId = new Map(clips.map((c) => [c.id, c]))
  const between = transitions.filter(
    (t): t is BetweenTransition =>
      t.kind === 'between' && byId.has(t.clipAId) && byId.has(t.clipBId),
  )
  const edges = transitions.filter(
    (t): t is EdgeTransition => t.kind === 'edge' && byId.has(t.clipId),
  )

  return (
    <>
      {between.map((t) => {
        const a = byId.get(t.clipAId)!
        const b = byId.get(t.clipBId)!
        const cutAt = Math.max(a.start + a.duration, b.start)
        const width = chipWidthPx(t.duration)
        return (
          <button
            key={t.id}
            type="button"
            className={
              selectedTransitionId === t.id ? 'transition-chip selected' : 'transition-chip'
            }
            data-kind="between"
            data-type={t.type}
            data-transition-id={t.id}
            aria-label={`${t.type} transition between clips`}
            style={{ left: cutAt * pps - width / 2, width }}
            onClick={() => setSelectedTransitionId(t.id)}
            title={t.rationale}
          >
            {t.type}
          </button>
        )
      })}
      {edges.map((t) => {
        const clip = byId.get(t.clipId)!
        const width = chipWidthPx(t.duration)
        const left =
          t.at === 'start'
            ? clip.start * pps
            : (clip.start + clip.duration) * pps - width
        return (
          <button
            key={t.id}
            type="button"
            className={
              selectedTransitionId === t.id ? 'transition-chip selected' : 'transition-chip'
            }
            data-kind="edge"
            data-transition-id={t.id}
            aria-label={`fade ${t.at} transition`}
            style={{ left, width }}
            onClick={() => setSelectedTransitionId(t.id)}
            title={`Fade ${t.at} — ${t.duration}s`}
          >
            fade {t.at}
          </button>
        )
      })}
    </>
  )
}
