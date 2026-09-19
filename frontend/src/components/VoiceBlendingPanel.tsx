import { useState, useCallback } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './VoiceBlendingPanel.css'

interface BlendEntry {
  file: File
  name: string
  volume: number
}

interface CloneStatus {
  available: boolean
  message: string
  download_instructions: string
}

export function VoiceBlendingPanel() {
  const [entries, setEntries] = useState<BlendEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ file_id: string; duration: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Clone state
  const [cloneText, setCloneText] = useState('')
  const [cloneLang, setCloneLang] = useState('en')
  const [cloneRef, setCloneRef] = useState<File | null>(null)
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneResult, setCloneResult] = useState<{ file_id: string; duration: number } | null>(null)
  const [cloneError, setCloneError] = useState<string | null>(null)
  const [cloneStatus, setCloneStatus] = useState<CloneStatus | null>(null)

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const newEntries: BlendEntry[] = Array.from(files).map((f) => ({
      file: f,
      name: f.name,
      volume: 1.0,
    }))
    setEntries((prev) => [...prev, ...newEntries])
    setResult(null)
    setError(null)
  }, [])

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVolume = (index: number, volume: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, volume } : e))
    )
  }

  const handleBlend = async () => {
    if (entries.length < 2) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      entries.forEach((e) => form.append('files', e.file))
      form.append('volumes', entries.map((e) => e.volume).join(','))

      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/voiceover/blend`, {
        method: 'POST',
        body: form,
      })
      const body = await res.json()
      if (body.success) {
        setResult({ file_id: body.file_id, duration: body.duration })
      } else {
        setError(body.error ?? 'Blend failed')
      }
    } catch {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const checkCloneStatus = async () => {
    try {
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/voiceover/clone/status`)
      const body = await res.json()
      setCloneStatus(body)
    } catch {
      setCloneStatus({ available: false, message: 'Connection failed', download_instructions: '' })
    }
  }

  const handleClone = async () => {
    if (!cloneText.trim() || !cloneRef) return
    setCloneLoading(true)
    setCloneError(null)
    try {
      const form = new FormData()
      form.append('text', cloneText)
      form.append('language', cloneLang)
      form.append('reference', cloneRef)

      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/voiceover/clone`, {
        method: 'POST',
        body: form,
      })
      const body = await res.json()
      if (body.success) {
        setCloneResult({ file_id: body.file_id, duration: body.duration })
      } else {
        setCloneError(body.error ?? 'Clone failed')
      }
    } catch {
      setCloneError('Connection failed')
    } finally {
      setCloneLoading(false)
    }
  }

  return (
    <section className="voice-blend-panel" aria-label="Voice Blending & Cloning">
      <div className="vb-header">
        <span className="vb-icon">🎭</span>
        <span className="vb-title">Voice Studio</span>
      </div>

      <div className="vb-body">
        {/* Voice Blending Section */}
        <div className="vb-section">
          <h4 className="vb-section-title">Voice Blending</h4>
          <p className="vb-hint">Mix 2+ audio files with custom volume weights. Uses FFmpeg (local, no download).</p>

          <div
            className="vb-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
            onClick={() => document.getElementById('vb-file-input')?.click()}
          >
            <input
              id="vb-file-input"
              type="file"
              multiple
              accept="audio/*"
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
            <span>Drop audio files or click to add</span>
          </div>

          {entries.length > 0 && (
            <div className="vb-entries">
              {entries.map((entry, i) => (
                <div key={i} className="vb-entry">
                  <span className="vb-entry-name" title={entry.name}>{entry.name}</span>
                  <label className="vb-volume">
                    Vol
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.1}
                      value={entry.volume}
                      onChange={(e) => updateVolume(i, Number(e.target.value))}
                    />
                    <span className="vb-volume-val">{entry.volume.toFixed(1)}</span>
                  </label>
                  <button type="button" className="vb-remove" onClick={() => removeEntry(i)}>×</button>
                </div>
              ))}
            </div>
          )}

          {entries.length >= 2 && (
            <button
              type="button"
              className="vb-action-btn"
              disabled={loading}
              onClick={() => void handleBlend()}
            >
              {loading ? 'Blending…' : `Blend ${entries.length} Files`}
            </button>
          )}

          {error && <p className="vb-error">{error}</p>}

          {result && (
            <div className="vb-result">
              <span>✓ Blended ({result.duration?.toFixed(1)}s)</span>
              <a
                href={`${backendBaseUrl()}/api/voiceover/blend/download/${result.file_id}`}
                className="vb-download-link"
              >
                Download
              </a>
            </div>
          )}
        </div>

        {/* Voice Cloning Section */}
        <div className="vb-section">
          <h4 className="vb-section-title">Voice Cloning</h4>
          <p className="vb-hint">Generate speech in a cloned voice from a reference sample.</p>

          <button
            type="button"
            className="vb-check-btn"
            onClick={() => void checkCloneStatus()}
          >
            Check Model Status
          </button>

          {cloneStatus && (
            <div className={`vb-model-status ${cloneStatus.available ? 'ready' : 'missing'}`}>
              <p>{cloneStatus.message}</p>
              {!cloneStatus.available && cloneStatus.download_instructions && (
                <pre className="vb-download-instructions">{cloneStatus.download_instructions}</pre>
              )}
            </div>
          )}

          {cloneStatus?.available && (
            <>
              <label className="vb-field">
                <span>Text</span>
                <textarea
                  value={cloneText}
                  onChange={(e) => setCloneText(e.target.value)}
                  placeholder="Text to speak in cloned voice..."
                  rows={3}
                />
              </label>

              <label className="vb-field">
                <span>Language</span>
                <select value={cloneLang} onChange={(e) => setCloneLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="pl">Polish</option>
                  <option value="tr">Turkish</option>
                  <option value="ru">Russian</option>
                  <option value="nl">Dutch</option>
                  <option value="ar">Arabic</option>
                  <option value="zh-cn">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="hi">Hindi</option>
                  <option value="ur">Urdu</option>
                </select>
              </label>

              <label className="vb-field">
                <span>Reference Audio (5-30s)</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setCloneRef(e.target.files?.[0] ?? null)}
                />
              </label>

              {cloneText.trim() && cloneRef && (
                <button
                  type="button"
                  className="vb-action-btn"
                  disabled={cloneLoading}
                  onClick={() => void handleClone()}
                >
                  {cloneLoading ? 'Cloning…' : 'Clone Voice'}
                </button>
              )}
            </>
          )}

          {cloneError && <p className="vb-error">{cloneError}</p>}

          {cloneResult && (
            <div className="vb-result">
              <span>✓ Cloned ({cloneResult.duration?.toFixed(1)}s)</span>
              <a
                href={`${backendBaseUrl()}/api/voiceover/clone/download/${cloneResult.file_id}`}
                className="vb-download-link"
              >
                Download
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
