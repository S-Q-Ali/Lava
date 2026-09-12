import { useEditorStore } from '../store/editorStore'
import type { Clip, MotionType } from '../editor/types'

const MOTION_TYPES: MotionType[] = [
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'pan-up',
  'pan-down',
]

export default function MotionPanel({ clip }: { clip: Clip }) {
  const assets = useEditorStore((s) => s.assets)
  const setClipMotion = useEditorStore((s) => s.setClipMotion)

  const asset = assets.find((a) => a.id === clip.assetId)
  if (!asset || asset.kind !== 'image') return null

  const type = clip.motion?.type ?? 'none'
  const strength = clip.motion?.strength ?? 0.5

  return (
    <section className="motion-panel">
      <h4>Motion</h4>
      <p className="hint">Subtle pan/zoom for stills — user-set only, rendered as-is.</p>
      <label className="field">
        <span className="label">Type</span>
        <select
          aria-label="Motion type"
          value={type}
          onChange={(e) => {
            const next = e.target.value
            setClipMotion(clip.id, next === 'none' ? undefined : { type: next as MotionType, strength })
          }}
        >
          <option value="none">none</option>
          {MOTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {type !== 'none' && (
        <label className="field">
          <span className="label">Strength</span>
          <input
            type="range"
            aria-label="Motion strength"
            min={0.1}
            max={1}
            step={0.1}
            value={strength}
            onChange={(e) =>
              setClipMotion(clip.id, {
                type: type as MotionType,
                strength: Number.parseFloat(e.target.value),
              })
            }
          />
          <span className="value">{strength.toFixed(1)}</span>
        </label>
      )}
    </section>
  )
}