import { useEditorStore } from '../store/editorStore'
import {
  MAX_DURATION,
  MIN_DURATION,
  TRANSITION_TYPES,
  validateTransitions,
} from '../editor/transitions'
import type { BetweenTransition } from '../editor/transitions'
import type { Clip } from '../editor/types'

function clipName(clips: Clip[], id: string): string {
  return clips.find((c) => c.id === id)?.name ?? 'missing clip'
}

function betweenLabel(t: BetweenTransition, clips: Clip[]): string {
  return `${clipName(clips, t.clipAId)} → ${clipName(clips, t.clipBId)}`
}

export default function TransitionsPanel() {
  const clips = useEditorStore((s) => s.clips)
  const transitions = useEditorStore((s) => s.transitions)
  const selectedTransitionId = useEditorStore((s) => s.selectedTransitionId)
  const setSelectedTransitionId = useEditorStore((s) => s.setSelectedTransitionId)
  const suggestTransitions = useEditorStore((s) => s.suggestTransitions)
  const overrideTransition = useEditorStore((s) => s.overrideTransition)
  const removeTransition = useEditorStore((s) => s.removeTransition)
  const resolveInvalidTransitions = useEditorStore((s) => s.resolveInvalidTransitions)

  const invalidIds = new Set(
    transitions
      .filter((t) => validateTransitions(clips, [t]).length > 0)
      .map((t) => t.id),
  )
  const invalid = transitions.filter((t) => invalidIds.has(t.id))

  return (
    <section className="transitions-panel">
      <div className="inspector-stats">
        <h4>Transitions</h4>
        <p className="transcript-hint">
          Transitions keep cuts explainable. Editing a suggestion makes it manual — re-suggesting
          never overwrites your changes.
        </p>
        {invalid.length > 0 && (
          <div className="transition-errors" role="status">
            <p>{invalid.length} transition{invalid.length === 1 ? '' : 's'} no longer valid
              (clip moved, removed or edge changed).</p>
            <button
              type="button"
              aria-label="Resolve invalid transitions"
              onClick={() => resolveInvalidTransitions()}
            >
              Remove invalid
            </button>
          </div>
        )}
        <button
          type="button"
          disabled={clips.length < 2}
          onClick={() => suggestTransitions()}
        >
          Suggest
        </button>
      </div>
      <div className="transition-list">
        {transitions.map((t) => {
          const rowClass = selectedTransitionId === t.id ? 'transition-row selected' : 'transition-row'
          return (
            <div
              key={t.id}
              className={rowClass}
              onClick={() => setSelectedTransitionId(t.id)}
            >
              {t.kind === 'between' ? (
                <>
                  <div className="transition-row-head">
                    <span className="transition-label" title={t.rationale}>
                      {betweenLabel(t, clips)}
                    </span>
                    {t.source === 'manual' && <span className="transition-manual">manual</span>}
                    {invalidIds.has(t.id) && <span className="transition-invalid">invalid</span>}
                  </div>
                  <div className="transition-controls" onClick={(e) => e.stopPropagation()}>
                    <select
                      aria-label={`Type for transition ${t.id}`}
                      data-transition-id={t.id}
                      value={t.type}
                      onChange={(e) => overrideTransition(t.id, e.target.value as BetweenTransition['type'])}
                    >
                      {TRANSITION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      aria-label={`Duration for transition ${t.id}`}
                      data-transition-id={t.id}
                      min={MIN_DURATION}
                      max={MAX_DURATION}
                      step={0.1}
                      value={t.duration}
                      onChange={(e) =>
                        overrideTransition(t.id, t.type, Number.parseFloat(e.target.value) || 0)
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Remove transition ${t.id}`}
                      onClick={() => removeTransition(t.id)}
                    >
                      Remove
                    </button>
                  </div>
                  {t.rationale && <p className="transition-rationale">{t.rationale}</p>}
                </>
              ) : (
                <>
                  <div className="transition-row-head">
                    <span className="transition-label">
                      Fade {t.at} {clipName(clips, t.clipId)}
                    </span>
                    {t.source === 'manual' && <span className="transition-manual">manual</span>}
                    {invalidIds.has(t.id) && <span className="transition-invalid">invalid</span>}
                  </div>
                  <div className="transition-controls" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      aria-label={`Duration for transition ${t.id}`}
                      data-transition-id={t.id}
                      min={MIN_DURATION}
                      max={MAX_DURATION}
                      step={0.1}
                      value={t.duration}
                      onChange={(e) =>
                        overrideTransition(t.id, t.type, Number.parseFloat(e.target.value) || 0)
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Remove transition ${t.id}`}
                      onClick={() => removeTransition(t.id)}
                    >
                      Remove
                    </button>
                  </div>
                  {t.rationale && <p className="transition-rationale">{t.rationale}</p>}
                </>
              )}
            </div>
          )
        })}
        {transitions.length === 0 && (
          <p className="transition-empty">
            {clips.length < 2
              ? 'Add clips on the video track, then Suggest builds explainable transitions.'
              : 'No transitions yet — Suggest scans same-image cuts and matched-beat passages.'}
          </p>
        )}
      </div>
    </section>
  )
}