import type { Clip } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { PX_PER_SECOND } from './scale'

export default function ClipBlock({
  clip,
  selected,
}: {
  clip: Clip
  selected: boolean
}) {
  const selectClip = useEditorStore((s) => s.selectClip)
  const removeClip = useEditorStore((s) => s.removeClip)
  const splitClip = useEditorStore((s) => s.splitClip)
  const setPlayhead = useEditorStore((s) => s.setPlayhead)

  return (
    <div
      className={`clip-block${selected ? ' selected' : ''}`}
      style={{
        left: clip.start * PX_PER_SECOND,
        width: clip.duration * PX_PER_SECOND,
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        selectClip(clip.id)
      }}
      title={`${clip.name} · ${clip.start.toFixed(2)}s → ${(clip.start + clip.duration).toFixed(2)}s`}
    >
      <span className="clip-title">{clip.name}</span>
      {selected && (
        <div className="clip-actions">
          <button
            type="button"
            title="Split at playhead"
            onClick={(e) => {
              e.stopPropagation()
              const playhead = useEditorStore.getState().playhead
              if (playhead > clip.start && playhead < clip.start + clip.duration) {
                splitClip(clip.id, playhead)
              } else {
                setPlayhead(clip.start + clip.duration / 2)
              }
            }}
          >
            ✂
          </button>
          <button
            type="button"
            title="Delete clip"
            onClick={(e) => {
              e.stopPropagation()
              removeClip(clip.id)
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}