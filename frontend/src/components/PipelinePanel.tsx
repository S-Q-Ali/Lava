import { useState, useCallback, useRef } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './PipelinePanel.css'

interface Scene {
  index: number
  text: string
  audio_path: string
  image_path: string
  duration_ms: number
  start_ms: number
}

interface PipelineJob {
  job_id: string
  stage: string
  progress: number
  message: string
  error: string | null
  scenes: Scene[]
  output_path: string
  total_duration_ms: number
}

const STAGE_LABELS: Record<string, string> = {
  starting: 'Starting',
  split_script: 'Splitting Script',
  generate_tts: 'Generating Voiceover',
  generate_images: 'Generating Images',
  sync_timeline: 'Syncing Timeline',
  generate_captions: 'Generating Captions',
  render_video: 'Rendering Video',
  done: 'Complete',
  error: 'Error',
}

export default function PipelinePanel() {
  const [script, setScript] = useState('')
  const [voice, setVoice] = useState('en-US-GuyNeural')
  const [speed, setSpeed] = useState('+0%')
  const [style, setStyle] = useState('cinematic')
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '')

  const [loading, setLoading] = useState(false)
  const [job, setJob] = useState<PipelineJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const pollStatus = useCallback((id: string) => {
    cleanup()
    pollRef.current = setInterval(async () => {
      try {
        const baseUrl = backendBaseUrl()
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/pipeline/script-status/${id}`)
        const data: PipelineJob = await res.json()
        setJob(data)
        if (data.stage === 'done' || data.stage === 'error') {
          cleanup()
          setLoading(false)
          if (data.stage === 'error') setError(data.error || 'Pipeline failed')
        }
      } catch { /* ignore */ }
    }, 2000)
  }, [cleanup])

  const handleRun = async () => {
    if (!script.trim()) return
    setLoading(true)
    setError(null)
    setJob(null)
    try {
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/pipeline/run-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, voice, speed, style, gemini_key: geminiKey }),
      })
      const body = await res.json()
      if (body.job_id) {
        pollStatus(body.job_id)
      } else {
        setError('Failed to start pipeline')
        setLoading(false)
      }
    } catch {
      setError('Connection failed')
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!job?.job_id) return
    const baseUrl = backendBaseUrl()
    window.open(`${baseUrl.replace(/\/$/, '')}/api/pipeline/script-download/${job.job_id}`, '_blank')
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  const sceneWordCount = script.split(/\s+/).filter(Boolean).length
  const sceneCount = script.split(/\n\s*\n|\n\s*\d+[\.\)]/).filter((s) => s.trim()).length || 1

  return (
    <div className="pipe-panel">
      {/* Header */}
      <div className="pipe-header">
        <span className="pipe-icon">▶</span>
        <span className="pipe-title">Pipeline</span>
        <span className="pipe-subtitle">Script → Video</span>
      </div>

      <div className="pipe-body">
        {/* Script Input */}
        <label className="pipe-field">
          <span className="pipe-label">Script</span>
          <textarea
            className="pipe-textarea"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder={"1. Open with a strong hook — grab attention in 3 seconds.\n\n2. Explain the core concept simply. Use analogies.\n\n3. End with a memorable CTA that drives action."}
            rows={8}
          />
          <span className="pipe-meta">{sceneWordCount} words · ~{sceneCount} scene{sceneCount > 1 ? 's' : ''}</span>
        </label>

        {/* Settings Row */}
        <div className="pipe-row">
          <label className="pipe-field pipe-third">
            <span className="pipe-label">Voice</span>
            <select value={voice} onChange={(e) => setVoice(e.target.value)}>
              <option value="en-US-GuyNeural">Guy (EN)</option>
              <option value="en-US-JennyNeural">Jenny (EN)</option>
              <option value="en-GB-RyanNeural">Ryan (EN-GB)</option>
              <option value="ur-PK-AsadNeural">Asad (UR)</option>
              <option value="hi-IN-IN NeerjaNeural">Neerja (HI)</option>
              <option value="ar-SA-HamedNeural">Hamed (AR)</option>
            </select>
          </label>
          <label className="pipe-field pipe-third">
            <span className="pipe-label">Speed</span>
            <select value={speed} onChange={(e) => setSpeed(e.target.value)}>
              <option value="-20%">Slow</option>
              <option value="+0%">Normal</option>
              <option value="+20%">Fast</option>
            </select>
          </label>
          <label className="pipe-field pipe-third">
            <span className="pipe-label">Style</span>
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="cinematic">Cinematic</option>
              <option value="anime">Anime</option>
              <option value="realistic">Realistic</option>
              <option value="watercolor">Watercolor</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="fantasy">Fantasy</option>
              <option value="minimalist">Minimalist</option>
            </select>
          </label>
        </div>

        {/* Gemini Key */}
        <label className="pipe-field">
          <span className="pipe-label">Gemini API Key (optional — for AI images)</span>
          <input
            type="password"
            className="pipe-input"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza... (leave blank for placeholder images)"
          />
        </label>

        {/* Run Button */}
        <button
          type="button"
          className="pipe-run-btn"
          disabled={loading || !script.trim()}
          onClick={() => void handleRun()}
        >
          {loading ? `Running… ${job ? Math.round(job.progress * 100) : 0}%` : '▶ Run Pipeline'}
        </button>

        {error && <p className="pipe-error">{error}</p>}

        {/* Progress */}
        {job && (
          <div className="pipe-progress">
            {/* Progress Bar */}
            <div className="pipe-bar-track">
              <div className="pipe-bar-fill" style={{ width: `${job.progress * 100}%` }} />
            </div>
            <span className="pipe-stage-label">{STAGE_LABELS[job.stage] || job.stage}</span>
            <span className="pipe-message">{job.message}</span>

            {/* Scenes */}
            {job.scenes.length > 0 && (
              <div className="pipe-scenes">
                {job.scenes.map((s) => (
                  <div key={s.index} className="pipe-scene">
                    <span className="pipe-scene-idx">#{s.index + 1}</span>
                    <span className="pipe-scene-text" title={s.text}>{s.text.slice(0, 60)}{s.text.length > 60 ? '…' : ''}</span>
                    <span className="pipe-scene-dur">{formatTime(s.duration_ms)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Download */}
            {job.stage === 'done' && job.output_path && (
              <button type="button" className="pipe-download-btn" onClick={handleDownload}>
                Download Video
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
