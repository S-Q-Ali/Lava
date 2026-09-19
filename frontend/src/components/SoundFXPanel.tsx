import { useState, useCallback } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './SoundFXPanel.css'

interface SFXResult {
  id: string
  title: string
  source: string
  download_url: string
}

const ZZFX_PRESETS = [
  'whoosh', 'impact', 'click', 'ding', 'buzz', 'pop',
  'swoosh', 'alert', 'notification', 'glitch', 'rumble', 'sparkle',
]

export function SoundFXPanel() {
  const [tab, setTab] = useState<'generate' | 'search'>('generate')
  const [preset, setPreset] = useState('whoosh')
  const [frequency, setFrequency] = useState(440)
  const [generating, setGenerating] = useState(false)

  const [query, setQuery] = useState('')
  const [source, setSource] = useState<'wikimedia' | 'archive'>('wikimedia')
  const [results, setResults] = useState<SFXResult[]>([])
  const [searching, setSearching] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/sfx/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset, frequency }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sfx_${preset}.wav`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // Ignore
    } finally {
      setGenerating(false)
    }
  }

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const baseUrl = backendBaseUrl()
      const endpoint = source === 'wikimedia' ? 'wikimedia' : 'archive'
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/sfx/search/${endpoint}?query=${encodeURIComponent(query)}&limit=10`)
      const body = await res.json()
      setResults(body.results || [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [query, source])

  return (
    <section className="sfx-panel" aria-label="Sound Effects">
      <div className="sfx-header">
        <span className="sfx-icon">🎵</span>
        <span className="sfx-title">Sound Effects</span>
      </div>

      <div className="sfx-tabs">
        <button
          type="button"
          className={`sfx-tab${tab === 'generate' ? ' active' : ''}`}
          onClick={() => setTab('generate')}
        >
          Generate
        </button>
        <button
          type="button"
          className={`sfx-tab${tab === 'search' ? ' active' : ''}`}
          onClick={() => setTab('search')}
        >
          Search
        </button>
      </div>

      <div className="sfx-body">
        {tab === 'generate' ? (
          <div className="sfx-gen">
            <label className="sfx-field">
              <span className="sfx-label">Preset</span>
              <div className="sfx-preset-grid">
                {ZZFX_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`sfx-preset${preset === p ? ' active' : ''}`}
                    onClick={() => setPreset(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </label>

            <label className="sfx-field">
              <span className="sfx-label">Frequency: {frequency}Hz</span>
              <input
                type="range"
                min={20}
                max={2000}
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
              />
            </label>

            <button
              type="button"
              className="sfx-generate-btn"
              disabled={generating}
              onClick={() => void handleGenerate()}
            >
              {generating ? 'Generating…' : 'Generate & Download'}
            </button>
          </div>
        ) : (
          <div className="sfx-search">
            <div className="sfx-search-row">
              <input
                type="text"
                className="sfx-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sound effects…"
                onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch() }}
              />
              <select value={source} onChange={(e) => setSource(e.target.value as 'wikimedia' | 'archive')}>
                <option value="wikimedia">Wikimedia</option>
                <option value="archive">Internet Archive</option>
              </select>
              <button type="button" className="sfx-search-btn" onClick={() => void handleSearch()}>
                {searching ? '…' : '🔍'}
              </button>
            </div>

            <div className="sfx-results">
              {results.map((r) => (
                <div key={r.id} className="sfx-result-row">
                  <div className="sfx-result-info">
                    <span className="sfx-result-title">{r.title}</span>
                    <span className="sfx-result-source">{r.source}</span>
                  </div>
                  <a href={r.download_url} target="_blank" rel="noopener noreferrer" className="sfx-download-link">
                    ↓
                  </a>
                </div>
              ))}
              {results.length === 0 && !searching && (
                <p className="sfx-empty">Search for sound effects above.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
