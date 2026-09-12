import type { Clip } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { MAX_DURATION } from '../../editor/transitions'
import type { BetweenTransition, EdgeTransition } from '../../editor/transitions'
import { PX_PER_SECOND } from './scale'

const MIN_CHIP_PX = 36
const MAX_CHIP_PX = MAX_DURATION * PX_PER_SECOND

function chipWidthPx(duration: number): number {
  return Math.min(MAX_CHIP_PX, Math.max(MIN_CHIP_PX, duration * PX_PER_SECOND))
}

export default function TransitionOverlay({
  clips,
}: {
  clips: Clip[]
}) {
  const transitions = useEditorStore((s) => s.transitions)
  const selectedTransitionId = useEditorStore((s) => s.selectedTransitionId)
  const setSelectedTransitionId = useEditorStore((s) => s.setSelectedTransitionId)

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
            style={{ left: cutAt * PX_PER_SECOND - width / 2, width }}
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
            ? clip.start * PX_PER_SECOND
            : (clip.start + clip.duration) * PX_PER_SECOND - width
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