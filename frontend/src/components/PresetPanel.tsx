import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { BUILTIN_CATEGORIES } from '../editor/presets'
import { usePresetStore } from '../store/presetStore'

export function PresetPanel() {
  const { presets, status, error, selectedCategory } = usePresetStore(
    useShallow((s) => ({
      presets: s.presets,
      status: s.status,
      error: s.error,
      selectedCategory: s.selectedCategory,
    })),
  )
  const load = usePresetStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () =>
      selectedCategory === 'All'
        ? presets
        : presets.filter((p) => p.category === selectedCategory),
    [presets, selectedCategory],
  )

  const categories = ['All', ...BUILTIN_CATEGORIES]

  return (
    <section className="preset-panel" aria-label="Presets">
      <h3>Style presets</h3>
      {status === 'error' && <p className="preset-error">{error}</p>}

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
          {visible.map((preset) => (
            <li key={preset.id} className="preset-card">
              <div className="preset-card-head">
                <span className="preset-name">{preset.label}</span>
                <span className="preset-cat-badge">{preset.category}</span>
              </div>
              <p className="preset-desc">{preset.description}</p>
              <div className="preset-meta">
                {preset.licenseRef ? (
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
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}