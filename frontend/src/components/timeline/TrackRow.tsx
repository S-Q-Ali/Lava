import type { Clip, Track } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { PX_PER_SECOND } from './scale'
import ClipBlock from './ClipBlock'
import TransitionOverlay from './TransitionOverlay'

export default function TrackRow({
  track,
  clips,
  durationByAsset,
}: {
  track: Track
  clips: Clip[]
  durationByAsset: Record<string, number | undefined>
}) {
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const setPlayhead = useEditorStore((s) => s.setPlayhead)

  const sorted = [...clips].sort((a, b) => a.start - b.start)

  return (
    <div
      className="timeline-lane"
      data-track={track.type}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const seconds = (e.clientX - rect.left) / PX_PER_SECOND
        setPlayhead(Math.max(0, seconds))
      }}
    >
      {sorted.map((clip) => (
        <ClipBlock
          key={clip.id}
          clip={clip}
          selected={clip.id === selectedClipId}
          maxDuration={durationByAsset[clip.assetId]}
        />
      ))}
      <TransitionOverlay clips={sorted} />
    </div>
  )
}