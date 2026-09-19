import { useState } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './ClipperPanel.css'

interface ClipResult {
  id: string
  file_path: string
  start_time: number
  duration: number
  file_size: number
}

export function ClipperPanel() {
  const [videoPath, setVideoPath] = useState('')
  const [clipDuration, setClipDuration] = useState(60)
  const [clipCount, setClipCount] = useState(5)
  const [cropMode, setCropMode] = useState('center')
  const [loading, setLoading] = useState(false)
  const [clips, setClips] = useState<ClipResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    if (!videoPath.trim()) return
    setLoading(true)
    setError(null)
    try {
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/clipper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_path: videoPath,
          clip_duration: clipDuration,
          clip_count: clipCount,
          crop_mode: cropMode,
        }),
      })
      const body = await res.json()
      if (body.success) {
        setClips(body.clips)
      } else {
        setError(body.error ?? 'Extraction failed')
      }
    } catch {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1048576) return `${(bytes / 1048576).toFixed(1)}MB`
    return `${(bytes / 1024).toFixed(1)}KB`
  }

  return (
    <section className="clipper-panel" aria-label="Video Clipper">
      <div className="cp-header">
        <span className="cp-icon">✂</span>
        <span className="cp-title">Video Clipper</span>
      </div>

      <div className="cp-body">
        <label className="cp-field">
          <span className="cp-label">Source Video Path</span>
          <input
            type="text"
            className="cp-input"
            value={videoPath}
            onChange={(e) => setVideoPath(e.target.value)}
            placeholder="C:/Videos/source.mp4"
          />
        </label>

        <div className="cp-row">
          <label className="cp-field cp-field-third">
            <span className="cp-label">Clip Duration (s)</span>
            <input
              type="number"
              className="cp-input"
              value={clipDuration}
              onChange={(e) => setClipDuration(Number(e.target.value))}
              min={10}
              max={300}
            />
          </label>
          <label className="cp-field cp-field-third">
            <span className="cp-label">Clip Count</span>
            <input
              type="number"
              className="cp-input"
              value={clipCount}
              onChange={(e) => setClipCount(Number(e.target.value))}
              min={1}
              max={20}
            />
          </label>
          <label className="cp-field cp-field-third">
            <span className="cp-label">Crop Mode</span>
            <select value={cropMode} onChange={(e) => setCropMode(e.target.value)}>
              <option value="center">Center</option>
              <option value="face-track">Face Track</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className="cp-extract-btn"
          disabled={loading || !videoPath.trim()}
          onClick={() => void handleExtract()}
        >
          {loading ? 'Extracting…' : 'Extract 9:16 Clips'}
        </button>

        {error && <p className="cp-error">{error}</p>}

        {clips.length > 0 && (
          <div className="cp-results">
            <span className="cp-label">{clips.length} clips extracted</span>
            <div className="cp-clip-list">
              {clips.map((c) => (
                <div key={c.id} className="cp-clip-row">
                  <span className="cp-clip-id">#{c.id.slice(0, 6)}</span>
                  <span className="cp-clip-meta">
                    {c.start_time.toFixed(0)}s · {c.duration}s · {formatSize(c.file_size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
