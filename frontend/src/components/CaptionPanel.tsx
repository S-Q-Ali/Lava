import { useEditorStore } from '../store/editorStore'
import { usePresetStore } from '../store/presetStore'
import {
  CAPTION_STYLES,
  DEFAULT_CAPTION_STYLE_ID,
  getCaptionStyle,
} from '../editor/captionStyles'

export function CaptionPanel() {
  const assets = useEditorStore((s) => s.assets)
  const transcripts = useEditorStore((s) => s.transcripts)
  const captions = useEditorStore((s) => s.captions)
  const generateCaptions = useEditorStore((s) => s.generateCaptions)
  const updateCaptionText = useEditorStore((s) => s.updateCaptionText)
  const updateCaptionTiming = useEditorStore((s) => s.updateCaptionTiming)
  const setCaptionStyle = useEditorStore((s) => s.setCaptionStyle)
  const removeCaption = useEditorStore((s) => s.removeCaption)
  const presets = usePresetStore((s) => s.presets)

  const styleOptions = [
    ...CAPTION_STYLES,
    ...presets.filter((p) => !CAPTION_STYLES.some((s) => s.id === p.id)),
  ]

  const voiceAssets = assets.filter((a) => a.kind === 'audio')
  const analyzed = voiceAssets.filter((a) => transcripts[a.id])

  return (
    <section className="caption-panel" aria-label="Captions">
      <h3>Captions</h3>
      {analyzed.length === 0 ? (
        <p className="caption-empty">
          Analyze a voice-over in the Transcript panel first — captions generate from the
          transcript.
        </p>
      ) : (
        <div className="caption-generate">
          {analyzed.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => generateCaptions(asset.id)}
              title="Generate caption items from this transcript (manual edits are kept)"
            >
              Generate captions — {asset.name}
            </button>
          ))}
        </div>
      )}

      {captions.length > 0 && (
        <div className="caption-list">
          {captions.map((caption) => {
            const style = getCaptionStyle(caption.styleId)
            return (
              <div key={caption.id} className="caption-item">
                <div className="caption-item-meta">
                  <span className="caption-time">
                    {caption.start.toFixed(2)}s → {(caption.start + caption.duration).toFixed(2)}s
                  </span>
                  <span className={`caption-source caption-source-${caption.source}`}>
                    {caption.source}
                  </span>
                </div>
                <input
                  className="caption-text"
                  value={caption.text}
                  onChange={(e) => updateCaptionText(caption.id, e.target.value)}
                  aria-label="Caption text"
                />
                <div className="caption-item-controls">
                  <label>
                    Style
                    <select
                      value={caption.styleId}
                      onChange={(e) => setCaptionStyle(caption.id, e.target.value)}
                    >
                      {styleOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Duration
                    <input
                      type="number"
                      min={0.2}
                      step={0.1}
                      value={Number(caption.duration.toFixed(2))}
                      onChange={(e) =>
                        updateCaptionTiming(caption.id, { duration: Number(e.target.value) })
                      }
                    />
                  </label>
                  <button type="button" onClick={() => removeCaption(caption.id)}>
                    Remove
                  </button>
                </div>
                <p className="caption-style-note">{style.description}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export { DEFAULT_CAPTION_STYLE_ID }