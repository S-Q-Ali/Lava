import { useState, useCallback } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './SyncPanel.css'

interface TimelineClip {
  index: number
  start_ms: number
  end_ms: number
  duration_ms: number
  image_path: string
}

export function SyncPanel() {
  const [audioPath, setAudioPath] = useState('')
  const [imagePaths, setImagePaths] = useState('')
  const [loading, setLoading] = useState(false)
  const [clips, setClips] = useState<TimelineClip[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    if (!audioPath.trim() || !imagePaths.trim()) return
    setLoading(true)
    setError(null)
    try {
      const baseUrl = backendBaseUrl()
      const form = new FormData()
      form.append('audio_file', audioPath)
      form.append('image_files', JSON.stringify(
        imagePaths.split('\n').map((l) => l.trim()).filter(Boolean)
      ))

      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/timeline-sync`, {
        method: 'POST',
        body: form,
      })
      const body = await res.json()
      if (body.success) {
        setClips(body.clips)
      } else {
        setError(body.error ?? 'Sync failed')
      }
    } catch {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  return (
    <section className="sync-panel" aria-label="Timeline Sync">
      <div className="sync-header">
        <span className="sync-icon">🔄</span>
        <span className="sync-title">Timeline Sync</span>
      </div>

      <div className="sync-body">
        <label className="sync-field">
          <span className="sync-label">Voiceover Audio Path</span>
          <input
            type="text"
            className="sync-input"
            value={audioPath}
            onChange={(e) => setAudioPath(e.target.value)}
            placeholder="voiceover_output.mp3"
          />
        </label>

        <label className="sync-field">
          <span className="sync-label">Image Paths (one per line)</span>
          <textarea
            className="sync-textarea"
            value={imagePaths}
            onChange={(e) => setImagePaths(e.target.value)}
            placeholder={"0-00.png\n0-03.png\n0-06.png\n0-09.png"}
            rows={5}
          />
        </label>

        <button
          type="button"
          className="sync-btn"
          disabled={loading || !audioPath.trim() || !imagePaths.trim()}
          onClick={() => void handleSync()}
        >
          {loading ? 'Syncing…' : 'Sync Timeline'}
        </button>

        {error && <p className="sync-error">{error}</p>}

        {clips.length > 0 && (
          <div className="sync-results">
            <span className="sync-label">{clips.length} clips planned</span>
            <div className="sync-clip-list">
              {clips.map((c) => (
                <div key={c.index} className="sync-clip-row">
                  <span className="sync-clip-idx">#{c.index + 1}</span>
                  <span className="sync-clip-time">
                    {formatTime(c.start_ms)} → {formatTime(c.end_ms)}
                  </span>
                  <span className="sync-clip-dur">{formatTime(c.duration_ms)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
