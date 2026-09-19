import { useState } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './PodcastMakerPanel.css'

interface PodcastTurn {
  speaker: string
  voice: string
  text: string
}

export function PodcastMakerPanel() {
  const [topic, setTopic] = useState('')
  const [numTurns, setNumTurns] = useState(6)
  const [speed, setSpeed] = useState('+0%')
  const [loading, setLoading] = useState(false)
  const [turns, setTurns] = useState<PodcastTurn[]>([])
  const [audioPath, setAudioPath] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError(null)
    try {
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/podcast/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, num_turns: numTurns, speed }),
      })
      const body = await res.json()
      if (body.success) {
        setTurns(body.turns)
        setAudioPath(body.audio_path)
        setDuration(body.duration_ms)
      } else {
        setError(body.error ?? 'Generation failed')
      }
    } catch {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  return (
    <section className="podcast-panel" aria-label="Podcast Maker">
      <div className="pm-header">
        <span className="pm-icon">🎙</span>
        <span className="pm-title">Podcast Maker</span>
      </div>

      <div className="pm-body">
        <label className="pm-field">
          <span className="pm-label">Topic</span>
          <textarea
            className="pm-textarea"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="The future of artificial intelligence in everyday life"
            rows={3}
          />
        </label>

        <div className="pm-row">
          <label className="pm-field pm-field-half">
            <span className="pm-label">Turns</span>
            <input
              type="number"
              className="pm-input"
              value={numTurns}
              onChange={(e) => setNumTurns(Number(e.target.value))}
              min={2}
              max={20}
            />
          </label>
          <label className="pm-field pm-field-half">
            <span className="pm-label">Speed</span>
            <select value={speed} onChange={(e) => setSpeed(e.target.value)}>
              <option value="-20%">Slow</option>
              <option value="-10%">Slightly Slow</option>
              <option value="+0%">Normal</option>
              <option value="+10%">Slightly Fast</option>
              <option value="+20%">Fast</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className="pm-generate-btn"
          disabled={loading || !topic.trim()}
          onClick={() => void handleGenerate()}
        >
          {loading ? 'Generating…' : 'Generate Podcast'}
        </button>

        {error && <p className="pm-error">{error}</p>}

        {turns.length > 0 && (
          <div className="pm-results">
            <div className="pm-meta">
              <span>{turns.length} turns</span>
              {duration > 0 && <span>{formatDuration(duration)}</span>}
            </div>

            {audioPath && (
              <audio controls className="pm-audio">
                <source src={`${backendBaseUrl()}/static/${audioPath.split('\\').pop()}`} />
              </audio>
            )}

            <div className="pm-transcript">
              {turns.map((turn, i) => (
                <div key={i} className="pm-turn">
                  <strong className="pm-speaker">{turn.speaker}:</strong>
                  <span className="pm-text">{turn.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
