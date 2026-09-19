import { useState } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './BulkGenerationPanel.css'

interface BulkResult {
  index: number
  text: string
  filename: string
  file_size: number
}

export function BulkGenerationPanel() {
  const [input, setInput] = useState('')
  const [voice, setVoice] = useState('en-US-GuyNeural')
  const [speed, setSpeed] = useState('+0%')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<BulkResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const lines = input.split('\n').filter((l) => l.trim())

  const handleGenerate = async () => {
    if (lines.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/bulk-tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines, voice, speed }),
      })
      const body = await res.json()
      if (body.success) {
        setResults(body.results)
      } else {
        setError(body.error ?? 'Generation failed')
      }
    } catch {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadZip = async () => {
    if (lines.length === 0) return
    try {
      const baseUrl = backendBaseUrl()
      const form = new FormData()
      form.append('lines', JSON.stringify(lines))
      form.append('voice', voice)
      form.append('speed', speed)

      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/bulk-tts/download-zip`, {
        method: 'POST',
        body: form,
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'bulk_tts_output.zip'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // Ignore
    }
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setInput(reader.result as string)
    }
    reader.readAsText(file)
  }

  return (
    <section className="bulkgen-panel" aria-label="Bulk TTS Generation">
      <div className="bg-header">
        <span className="bg-icon">📦</span>
        <span className="bg-title">Bulk TTS</span>
      </div>

      <div className="bg-body">
        <label className="bg-field">
          <span className="bg-label">Scripts (one per line)</span>
          <textarea
            className="bg-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Hello and welcome to the show\nToday we discuss AI\nThanks for watching!"}
            rows={6}
          />
        </label>

        <label className="bg-import-btn">
          Import TXT
          <input type="file" accept=".txt,.text" hidden onChange={handleFileImport} />
        </label>

        <div className="bg-row">
          <label className="bg-field bg-field-half">
            <span className="bg-label">Voice</span>
            <select value={voice} onChange={(e) => setVoice(e.target.value)}>
              <option value="en-US-GuyNeural">Guy (EN)</option>
              <option value="en-US-JennyNeural">Jenny (EN)</option>
              <option value="en-GB-RyanNeural">Ryan (EN-GB)</option>
              <option value="en-AU-WilliamNeural">William (EN-AU)</option>
              <option value="ur-PK-AsadNeural">Asad (UR)</option>
              <option value="hi-IN-IN NeerjaNeural">Neerja (HI)</option>
              <option value="ar-SA-HamedNeural">Hamed (AR)</option>
            </select>
          </label>
          <label className="bg-field bg-field-half">
            <span className="bg-label">Speed</span>
            <select value={speed} onChange={(e) => setSpeed(e.target.value)}>
              <option value="-20%">Slow</option>
              <option value="-10%">Slightly Slow</option>
              <option value="+0%">Normal</option>
              <option value="+10%">Slightly Fast</option>
              <option value="+20%">Fast</option>
            </select>
          </label>
        </div>

        <div className="bg-info">
          <span>{lines.length} line{lines.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="bg-actions">
          <button
            type="button"
            className="bg-generate-btn"
            disabled={loading || lines.length === 0}
            onClick={() => void handleGenerate()}
          >
            {loading ? 'Generating…' : 'Generate All'}
          </button>
          <button
            type="button"
            className="bg-zip-btn"
            disabled={results.length === 0}
            onClick={() => void handleDownloadZip()}
          >
            Download ZIP
          </button>
        </div>

        {error && <p className="bg-error">{error}</p>}

        {results.length > 0 && (
          <div className="bg-results">
            <span className="bg-label">{results.length} generated</span>
            <div className="bg-result-list">
              {results.map((r) => (
                <div key={r.index} className="bg-result-row">
                  <span className="bg-result-idx">#{r.index + 1}</span>
                  <span className="bg-result-text" title={r.text}>{r.text}</span>
                  <span className="bg-result-size">{(r.file_size / 1024).toFixed(1)}KB</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
