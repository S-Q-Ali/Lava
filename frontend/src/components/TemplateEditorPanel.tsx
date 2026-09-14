import { useEffect, useState } from 'react'
import { ANIMATION_OPTIONS, getCaptionStyle } from '../editor/captionStyles'
import {
  draftFromPreset,
  finalizeDraft,
  updateDraft,
  type PresetDraft,
} from '../editor/templateEditor'
import { usePresetStore } from '../store/presetStore'
import { useFontStore } from '../store/fontStore'

const SAMPLE = 'Captions look like this'

const FLAGS: Array<{ key: keyof PresetDraft; label: string }> = [
  { key: 'bold', label: 'Bold' },
  { key: 'uppercase', label: 'Uppercase' },
  { key: 'rtl', label: 'RTL' },
  { key: 'emoji', label: 'Emoji' },
  { key: 'karaoke', label: 'Karaoke' },
  { key: 'wordHighlight', label: 'Word highlight' },
  { key: 'importantWordPop', label: 'Important-word pop' },
  { key: 'punctuation', label: 'Punctuation' },
]

export function TemplateEditorPanel() {
  const presets = usePresetStore((s) => s.presets)
  const presetError = usePresetStore((s) => s.error)
  const fonts = useFontStore((s) => s.fonts)

  const [baseId, setBaseId] = useState('normal')
  const [draft, setDraft] = useState<PresetDraft>(() => draftFromPreset(getCaptionStyle('normal')))

  useEffect(() => {
    void usePresetStore.getState().load()
    void useFontStore.getState().load()
  }, [])

  const basePreset = presets.find((p) => p.id === baseId)
  const canOverwrite = !!basePreset && baseId.startsWith('custom-')
  const canSave = draft.label.trim().length > 0

  function selectBase(id: string) {
    setBaseId(id)
    setDraft(draftFromPreset(presets.find((p) => p.id === id) ?? getCaptionStyle(id)))
  }

  function patch(patch: Partial<PresetDraft>) {
    setDraft((d) => updateDraft(d, patch))
  }

  async function saveAsNew() {
    if (!canSave) return
    try {
      await usePresetStore.getState().savePreset(finalizeDraft(draft))
    } catch {
      /* error surfaces via presetError */
    }
  }

  async function overwrite() {
    if (!canOverwrite) return
    try {
      await usePresetStore.getState().savePreset(finalizeDraft(draft, { id: baseId }))
    } catch {
      /* error surfaces via presetError */
    }
  }

  const alignmentStyle =
    draft.alignment === 'top'
      ? 'flex-start'
      : draft.alignment === 'middle'
        ? 'center'
        : 'flex-end'

  // CSS approximation of each libass animation treatment for live preview.
  const animationPreviewClass =
    draft.animation === 'none'
      ? ''
      : `template-preview-anim template-preview-anim-${draft.animation}`

  return (
    <section className="template-panel" aria-label="Template editor">
      <h3>Template editor</h3>
      {presetError && <p className="template-error">{presetError}</p>}

      <label>
        Base preset
        <select aria-label="Base preset" value={baseId} onChange={(e) => selectBase(e.target.value)}>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({p.id})
            </option>
          ))}
        </select>
      </label>

      <div
        className="template-preview"
        style={{ justifyContent: alignmentStyle }}
        aria-label="Caption preview"
      >
        <span
          className={`template-preview-text${animationPreviewClass ? ` ${animationPreviewClass}` : ''}`}
          style={{
            fontFamily: draft.fontFamily,
            fontSize: `${draft.fontSize}px`,
            color: draft.primaryColor,
            fontWeight: draft.bold ? 700 : 400,
            textTransform: draft.uppercase ? 'uppercase' : 'none',
            WebkitTextStroke: `${draft.outlineWidth}px ${draft.outlineColor}`,
            direction: draft.rtl ? 'rtl' : 'ltr',
          }}
        >
          {SAMPLE}
        </span>
      </div>

      <label>
        Label
        <input aria-label="Label" value={draft.label} onChange={(e) => patch({ label: e.target.value })} />
      </label>

      <label>
        Description
        <input
          aria-label="Description"
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </label>

      <label>
        Font family
        <input
          aria-label="Font family"
          value={draft.fontFamily}
          onChange={(e) => patch({ fontFamily: e.target.value })}
        />
      </label>

      <label>
        Imported font
        <select aria-label="Imported font" value="" onChange={(e) => patch({ fontFamily: `"${e.target.value}", sans-serif` })}>
          <option value="" disabled>
            {fonts.length === 0 ? 'No imported fonts' : 'Pick an imported font'}
          </option>
          {fonts.map((f) => (
            <option key={f.id} value={f.family}>
              {f.family}
            </option>
          ))}
        </select>
      </label>

      <div className="template-fields">
        <label>
          Size
          <input
            aria-label="Font size"
            type="number"
            min={8}
            max={240}
            value={draft.fontSize}
            onChange={(e) => patch({ fontSize: Number(e.target.value) })}
          />
        </label>
        <label>
          Outline w.
          <input
            aria-label="Outline width"
            type="number"
            min={0}
            max={8}
            value={draft.outlineWidth}
            onChange={(e) => patch({ outlineWidth: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="template-fields">
        <label>
          Text
          <input
            aria-label="Text color"
            type="color"
            value={draft.primaryColor}
            onChange={(e) => patch({ primaryColor: e.target.value })}
          />
        </label>
        <label>
          Accent
          <input
            aria-label="Highlight color"
            type="color"
            value={draft.highlightColor}
            onChange={(e) => patch({ highlightColor: e.target.value })}
          />
        </label>
        <label>
          Outline
          <input
            aria-label="Outline color"
            type="color"
            value={draft.outlineColor}
            onChange={(e) => patch({ outlineColor: e.target.value })}
          />
        </label>
      </div>

      <label>
        Alignment
        <select aria-label="Alignment" value={draft.alignment} onChange={(e) => patch({ alignment: e.target.value as PresetDraft['alignment'] })}>
          <option value="bottom">Bottom</option>
          <option value="middle">Middle</option>
          <option value="top">Top</option>
        </select>
      </label>

      <label>
        Animation
        <select
          aria-label="Animation"
          value={draft.animation}
          onChange={(e) => patch({ animation: e.target.value as PresetDraft['animation'] })}
        >
          {ANIMATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="template-flags">
        {FLAGS.map((flag) => (
          <label key={flag.key} className="template-flag">
            <input
              aria-label={flag.label}
              type="checkbox"
              checked={Boolean(draft[flag.key])}
              onChange={(e) => patch({ [flag.key]: e.target.checked } as Partial<PresetDraft>)}
            />
            {flag.label}
          </label>
        ))}
      </div>

      <div className="template-actions">
        <button type="button" onClick={() => void saveAsNew()} disabled={!canSave}>
          Save as new
        </button>
        {canOverwrite && (
          <button type="button" onClick={() => void overwrite()}>
            Overwrite
          </button>
        )}
      </div>
    </section>
  )
}