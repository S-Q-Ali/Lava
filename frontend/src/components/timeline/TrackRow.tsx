import type { Clip, Track } from '../../editor/types'
import type { CaptionItem } from '../../editor/captions'
import { useEditorStore } from '../../store/editorStore'
import ClipBlock from './ClipBlock'
import TransitionOverlay from './TransitionOverlay'
import { useTimelineZoom } from '../../hooks/useTimelineZoom'

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
  const addClip = useEditorStore((s) => s.addClip)
  const assets = useEditorStore((s) => s.assets)
  const { pps } = useTimelineZoom()

  const sorted = [...clips].sort((a, b) => a.start - b.start)
  const sortedCaptions = [...captions].sort((a, b) => a.start - b.start)

  return (
    <div
      className="timeline-lane"
      data-track={track.type}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const seconds = (e.clientX - rect.left + e.currentTarget.scrollLeft) / pps
        setPlayhead(Math.max(0, seconds))
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-lava-asset-id')) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }
      }}
      onDrop={(e) => {
        const assetId = e.dataTransfer.getData('application/x-lava-asset-id')
        if (!assetId) return
        e.preventDefault()
        const asset = assets.find((a) => a.id === assetId)
        if (!asset) return
        const rect = e.currentTarget.getBoundingClientRect()
        const dropTime = Math.max(0, (e.clientX - rect.left + e.currentTarget.scrollLeft) / pps)
        const duration = asset.meta.duration ?? 5
        addClip({ trackId: track.id, assetId, name: asset.name, start: dropTime, duration })
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
            left: caption.start * pps,
            width: Math.max(24, caption.duration * pps),
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