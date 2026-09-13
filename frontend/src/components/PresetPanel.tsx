import { useEffect, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { BUILTIN_CATEGORIES } from '../editor/presets'
import { downloadPresetFile } from '../services/presets'
import { usePresetStore } from '../store/presetStore'
import { useFontStore } from '../store/fontStore'
import type { FontMetadata } from '../editor/fonts'

export function PresetPanel() {
  const { presets, status, error, selectedCategory } = usePresetStore(
    useShallow((s) => ({
      presets: s.presets,
      status: s.status,
      error: s.error,
      selectedCategory: s.selectedCategory,
    })),
  )
  const fonts = useFontStore((s) => s.fonts)
  const load = usePresetStore((s) => s.load)
  useEffect(() => {
    void load()
    void useFontStore.getState().load()
  }, [load])

  const visible = useMemo(
    () =>
      selectedCategory === 'All'
        ? presets
        : presets.filter((p) => p.category === selectedCategory),
    [presets, selectedCategory],
  )

  const categories = ['All', ...BUILTIN_CATEGORIES]
  const importFileRef = useRef<HTMLInputElement>(null)

  function boundFont(licenseRef: string | undefined): FontMetadata | undefined {
    if (!licenseRef) return undefined
    return fonts.find((font) => font.id === licenseRef)
  }

  function handleImportFile(file: File) {
    const reader = new FileReader()
    reader.onerror = () =>
      usePresetStore.setState({ status: 'error', error: 'Could not read the preset file.' })
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : ''
      try {
        const payload = JSON.parse(raw) as unknown
        usePresetStore.getState().importPreset(payload).catch(() => {})
      } catch (err) {
        const message =
          err instanceof SyntaxError ? `Invalid preset JSON: ${err.message}` : 'Invalid preset JSON.'
        usePresetStore.setState({ status: 'error', error: message })
      }
      if (importFileRef.current) importFileRef.current.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <section className="preset-panel" aria-label="Presets">
      <h3>Style presets</h3>
      {status === 'error' && <p className="preset-error">{error}</p>}

      <div className="preset-actions">
        <button type="button" onClick={() => importFileRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={importFileRef}
          type="file"
          accept="application/json,.json"
          className="preset-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) handleImportFile(file)
          }}
        />
      </div>

      <nav className="preset-categories" aria-label="Preset categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={category === selectedCategory ? 'preset-cat preset-cat-active' : 'preset-cat'}
            onClick={() => usePresetStore.getState().setCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="preset-empty">No presets in this category.</p>
      ) : (
        <ul className="preset-list">
          {visible.map((preset) => {
            const font = boundFont(preset.licenseRef)
            return (
              <li key={preset.id} className="preset-card">
                <div className="preset-card-head">
                  <span className="preset-name">{preset.label}</span>
                  <span className="preset-cat-badge">{preset.category}</span>
                </div>
                <p className="preset-desc">{preset.description}</p>
                <div className="preset-meta">
                  {font ? (
                    <span
                      className="preset-license"
                      title={`${font.family} — embedding ${
                        font.license.embeddingAllowed ? 'allowed' : 'limited'
                      }`}
                    >
                      imported font
                    </span>
                  ) : preset.licenseRef ? (
                    <span className="preset-license" title="Bound to an imported font">
                      imported font
                    </span>
                  ) : (
                    <span className="preset-license preset-license-stack" title="Safe CSS font stack">
                      system stack
                    </span>
                  )}
                  {preset.rtl && <span className="preset-flag">RTL</span>}
                </div>
                <button type="button" onClick={() => usePresetStore.getState().applyPreset(preset.id)}>
                  Apply
                </button>
                {preset.id.startsWith('custom-') && (
                  <div className="preset-card-actions">
                    <button type="button" onClick={() => downloadPresetFile(preset)}>
                      Export
                    </button>
                    <button
                      type="button"
                      className="preset-danger"
                      onClick={() => {
                        usePresetStore.getState().removePreset(preset.id).catch(() => {})
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}