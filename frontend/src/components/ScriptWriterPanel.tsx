import { useState, useEffect, useCallback } from 'react'
import {
  generateScript,
  listScriptStyles,
  type ScriptSegment,
  type ScriptStyle,
} from '../services/scriptwriter'
import './ScriptWriterPanel.css'

type ScriptWriterPanelProps = {
  onApplyScript?: (segments: ScriptSegment[], fullText: string) => void
}

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'ur', label: 'Urdu' },
  { id: 'hi', label: 'Hindi' },
  { id: 'mixed', label: 'Mixed (Roman Urdu)' },
]

export default function ScriptWriterPanel({ onApplyScript }: ScriptWriterPanelProps) {
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('shorts')
  const [language, setLanguage] = useState('en')
  const [duration, setDuration] = useState(45)
  const [hooks, setHooks] = useState(true)
  const [extraNotes, setExtraNotes] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [styles, setStyles] = useState<ScriptStyle[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    title?: string
    hook?: string
    segments?: ScriptSegment[]
    fullText?: string
    duration?: number
    error?: string
  } | null>(null)

  useEffect(() => {
    listScriptStyles().then((s) => setStyles(Array.isArray(s) ? s : [])).catch(() => {})
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || !apiKey.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await generateScript({
        topic,
        style,
        language,
        duration_seconds: duration,
        hooks,
        extra_instructions: extraNotes,
        api_key: apiKey,
      })
      if (res.success) {
        setResult({
          title: res.title,
          hook: res.hook,
          segments: res.segments,
          fullText: res.full_text,
          duration: res.estimated_duration,
        })
      } else {
        setResult({ error: res.error || 'Generation failed' })
      }
    } catch (e) {
      setResult({ error: String(e) })
    } finally {
      setLoading(false)
    }
  }, [topic, style, language, duration, hooks, extraNotes, apiKey])

  return (
    <div className="scriptwriter-panel">
      <h3 className="panel-heading">AI Script Writer</h3>
      <p className="panel-subtext">Generate short-form video scripts with Groq Llama 3.3 70B</p>

      {/* API Key */}
      <label className="field-label" htmlFor="sw-key">Groq API Key</label>
      <input
        id="sw-key"
        type="password"
        className="sw-input"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="gsk_..."
      />
      <a
        href="https://console.groq.com/keys"
        target="_blank"
        rel="noopener noreferrer"
        className="sw-hint"
      >
        Get free key at console.groq.com
      </a>

      {/* Topic */}
      <label className="field-label" htmlFor="sw-topic">Topic</label>
      <textarea
        id="sw-topic"
        className="sw-textarea"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. 5 AI tools that will blow your mind"
        rows={2}
      />

      {/* Style + Language */}
      <div className="sw-row">
        <div className="sw-col">
          <label className="field-label" htmlFor="sw-style">Style</label>
          <select id="sw-style" className="vo-select" value={style} onChange={(e) => setStyle(e.target.value)}>
            {styles.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="sw-col">
          <label className="field-label" htmlFor="sw-lang">Language</label>
          <select id="sw-lang" className="vo-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration + Hooks */}
      <div className="sw-row">
        <div className="sw-col">
          <label className="field-label" htmlFor="sw-dur">Duration ({duration}s)</label>
          <input
            id="sw-dur"
            type="range"
            min={10}
            max={120}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="sw-slider"
          />
        </div>
        <div className="sw-col sw-col-center">
          <label className="sw-checkbox-label">
            <input type="checkbox" checked={hooks} onChange={(e) => setHooks(e.target.checked)} />
            Include hooks
          </label>
        </div>
      </div>

      {/* Extra notes */}
      <label className="field-label" htmlFor="sw-notes">Extra Notes</label>
      <textarea
        id="sw-notes"
        className="sw-textarea"
        value={extraNotes}
        onChange={(e) => setExtraNotes(e.target.value)}
        placeholder="Any specific instructions..."
        rows={2}
      />

      {/* Generate */}
      <button
        type="button"
        className="vo-generate-btn"
        onClick={handleGenerate}
        disabled={loading || !topic.trim() || !apiKey.trim()}
      >
        {loading ? 'Writing...' : 'Generate Script'}
      </button>

      {/* Result */}
      {result?.title && (
        <div className="sw-result">
          <h4 className="sw-result-title">{result.title}</h4>
          {result.hook && <p className="sw-result-hook">Hook: {result.hook}</p>}

          <div className="sw-segments">
            {result.segments?.map((seg, i) => (
              <div key={i} className="sw-segment">
                <span className="sw-seg-time">{seg.duration_hint.toFixed(1)}s</span>
                <div className="sw-seg-content">
                  <span className="sw-seg-text">{seg.text}</span>
                  {seg.visual_note && (
                    <span className="sw-seg-visual">[{seg.visual_note}]</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="sw-result-meta">
            <span>~{result.duration?.toFixed(0)}s</span>
            <span>{result.segments?.length} segments</span>
          </div>

          {onApplyScript && result.segments && (
            <button
              type="button"
              className="vo-add-btn"
              onClick={() => onApplyScript(result.segments!, result.fullText || '')}
            >
              Apply to Timeline
            </button>
          )}
        </div>
      )}

      {result?.error && (
        <div className="vo-error">{result.error}</div>
      )}
    </div>
  )
}
