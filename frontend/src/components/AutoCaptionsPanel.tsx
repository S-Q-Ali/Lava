import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { usePresetStore } from '../store/presetStore'
import {
  CAPTION_STYLES,
  DEFAULT_CAPTION_STYLE_ID,
} from '../editor/captionStyles'
import './AutoCaptionsPanel.css'

function formatTimestamp(t: number): string {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  const ms = Math.floor((t % 1) * 100)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

export function AutoCaptionsPanel({ onCustomize }: { onCustomize?: () => void }) {
  const [enabled, setEnabled] = useState(true)
  const [timingMode, setTimingMode] = useState<'auto' | 'manual'>('auto')

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
    <section className="auto-captions-panel" aria-label="Auto Captions">
      <div className="auto-captions-header">
        <span className="auto-captions-icon">💬</span>
        <span className="auto-captions-title">Auto Captions</span>
        <label className="auto-captions-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="auto-captions-toggle-track" />
        </label>
      </div>

      {enabled && (
        <div className="auto-captions-body">
          <div className="auto-captions-controls">
            <label className="auto-captions-field">
              <span className="auto-captions-label">Language</span>
              <select className="auto-captions-select" defaultValue="auto">
                <option value="auto">Auto-detect</option>
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="rom">Roman Urdu</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>

            <label className="auto-captions-field">
              <span className="auto-captions-label">Style</span>
              <select className="auto-captions-select" defaultValue={DEFAULT_CAPTION_STYLE_ID}>
                {styleOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>

            <button type="button" className="auto-captions-customize" onClick={onCustomize}>
              Customize
            </button>
          </div>

          {captions.length > 0 && (
            <div className="auto-captions-preview">
              <div className="auto-captions-preview-header">
                <span className="auto-captions-label">Transcript Preview</span>
              </div>
              <div className="auto-captions-preview-text">
                {captions.slice(0, 8).map((c) => (
                  <div key={c.id} className="auto-captions-preview-line">
                    <span className="auto-captions-preview-time">[{formatTimestamp(c.start)}]</span>
                    {' '}{c.text}
                  </div>
                ))}
                {captions.length > 8 && (
                  <div className="auto-captions-preview-line auto-captions-preview-more">
                    … {captions.length - 8} more lines
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="auto-captions-timing">
            <span className="auto-captions-label">Caption Timing</span>
            <div className="auto-captions-timing-options">
              <button
                type="button"
                className={`auto-captions-timing-btn${timingMode === 'auto' ? ' active' : ''}`}
                onClick={() => setTimingMode('auto')}
              >
                Auto
              </button>
              <button
                type="button"
                className={`auto-captions-timing-btn${timingMode === 'manual' ? ' active' : ''}`}
                onClick={() => setTimingMode('manual')}
              >
                Manual
              </button>
            </div>
          </div>

          <div className="auto-captions-generate">
            {analyzed.length === 0 ? (
              <p className="auto-captions-hint">
                Analyze a voice-over first — captions generate from the transcript.
              </p>
            ) : (
              analyzed.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="auto-captions-generate-btn"
                  onClick={() => generateCaptions(asset.id, timingMode)}
                >
                  Generate Captions — {asset.name}
                </button>
              ))
            )}
          </div>

          {captions.length > 0 && (
            <div className="auto-captions-list">
              {captions.map((caption) => {
                return (
                  <div key={caption.id} className="auto-captions-item">
                    <div className="auto-captions-item-meta">
                      <span className="auto-captions-time">
                        {caption.start.toFixed(2)}s → {(caption.start + caption.duration).toFixed(2)}s
                      </span>
                      <span className={`auto-captions-source auto-captions-source-${caption.source}`}>
                        {caption.source}
                      </span>
                    </div>
                    <input
                      className="auto-captions-text"
                      value={caption.text}
                      onChange={(e) => updateCaptionText(caption.id, e.target.value)}
                      aria-label="Caption text"
                    />
                    <div className="auto-captions-item-controls">
                      <label className="auto-captions-field-inline">
                        Style
                        <select
                          value={caption.styleId}
                          onChange={(e) => setCaptionStyle(caption.id, e.target.value)}
                        >
                          {styleOptions.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="auto-captions-field-inline">
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
                      <button
                        type="button"
                        className="auto-captions-remove"
                        onClick={() => removeCaption(caption.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export { DEFAULT_CAPTION_STYLE_ID }
