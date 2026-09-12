import type { Clip, Track } from '../../editor/types'
import type { CaptionItem } from '../../editor/captions'
import { useEditorStore } from '../../store/editorStore'
import { PX_PER_SECOND } from './scale'
import ClipBlock from './ClipBlock'
import TransitionOverlay from './TransitionOverlay'

export default function TrackRow({
  track,
  clips,
  durationByAsset,
  captions = [],
}: {
  track: Track
  clips: Clip[]
  durationByAsset: Record<string, number | undefined>
  captions?: CaptionItem[]
}) {
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const setPlayhead = useEditorStore((s) => s.setPlayhead)

  const sorted = [...clips].sort((a, b) => a.start - b.start)
  const sortedCaptions = [...captions].sort((a, b) => a.start - b.start)

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
      {sortedCaptions.map((caption) => (
        <div
          key={caption.id}
          className={`caption-block caption-block-${caption.source}`}
          title={caption.text}
          style={{
            left: caption.start * PX_PER_SECOND,
            width: Math.max(24, caption.duration * PX_PER_SECOND),
          }}
          onClick={(e) => {
            e.stopPropagation()
            setPlayhead(caption.start + 0.01)
          }}
        >
          <span className="caption-block-text">{caption.text}</span>
        </div>
      ))}
      <TransitionOverlay clips={sorted} />
    </div>
  )
}