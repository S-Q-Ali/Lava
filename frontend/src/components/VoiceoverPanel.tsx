import { useState, useEffect, useCallback } from 'react'
import {
  generateVoiceover,
  listVoices,
  listVoicePresets,
  getVoiceoverDownloadUrl,
  type VoiceInfo,
  type PresetInfo,
} from '../services/voiceover'
import './VoiceoverPanel.css'

type VoiceoverPanelProps = {
  onAddToTimeline?: (audioUrl: string, label: string) => void
}

const QUICK_TEXTS = [
  'Welcome to the video!',
  'Like and subscribe for more.',
  'Let me show you something cool.',
  'This is going to blow your mind.',
  'Comment below what you think.',
]

export default function VoiceoverPanel({ onAddToTimeline }: VoiceoverPanelProps) {
  const [text, setText] = useState('')
  const [voice, setVoice] = useState('en-US-AriaNeural')
  const [rate, setRate] = useState('+0%')
  const [pitch, setPitch] = useState('+0Hz')
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3')
  const [voices, setVoices] = useState<VoiceInfo[]>([])
  const [presets, setPresets] = useState<PresetInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ fileId?: string; error?: string } | null>(null)
  const [langFilter, setLangFilter] = useState('')

  useEffect(() => {
    listVoices().then(setVoices).catch(() => {})
    listVoicePresets().then(setPresets).catch(() => {})
  }, [])

  const filteredVoices = langFilter
    ? voices.filter(v => v.locale.toLowerCase().startsWith(langFilter.toLowerCase()))
    : voices

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await generateVoiceover({ text, voice, rate, pitch, format })
      if (res.success && res.file_id) {
        setResult({ fileId: res.file_id })
      } else {
        setResult({ error: res.error || 'Generation failed' })
      }
    } catch (e) {
      setResult({ error: String(e) })
    } finally {
      setLoading(false)
    }
  }, [text, voice, rate, pitch, format])

  const handleAddToTimeline = () => {
    if (result?.fileId && onAddToTimeline) {
      const url = getVoiceoverDownloadUrl(result.fileId, format)
      onAddToTimeline(url, `Voiceover: ${text.slice(0, 30)}`)
    }
  }

  return (
    <div className="voiceover-panel">
      <h3 className="panel-heading">AI Voiceover</h3>
      <p className="panel-subtext">170+ Microsoft voices — no API key needed</p>

      {/* Text input */}
      <label className="field-label" htmlFor="vo-text">Text</label>
      <textarea
        id="vo-text"
        className="vo-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to convert to speech..."
        rows={4}
      />

      {/* Quick text buttons */}
      <div className="vo-quick-texts">
        {QUICK_TEXTS.map((qt) => (
          <button
            key={qt}
            type="button"
            className="vo-quick-btn"
            onClick={() => setText(qt)}
          >
            {qt}
          </button>
        ))}
      </div>

      {/* Voice selection */}
      <label className="field-label" htmlFor="vo-lang">Language</label>
      <select
        id="vo-lang"
        className="vo-select"
        value={langFilter}
        onChange={(e) => setLangFilter(e.target.value)}
      >
        <option value="">All languages</option>
        <option value="en">English</option>
        <option value="ur">Urdu</option>
        <option value="hi">Hindi</option>
        <option value="ar">Arabic</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="es">Spanish</option>
        <option value="pt">Portuguese</option>
        <option value="ja">Japanese</option>
        <option value="ko">Korean</option>
        <option value="zh">Chinese</option>
      </select>

      <label className="field-label" htmlFor="vo-voice">Voice</label>
      <select
        id="vo-voice"
        className="vo-select"
        value={voice}
        onChange={(e) => setVoice(e.target.value)}
      >
        {filteredVoices.map((v) => (
          <option key={v.name} value={v.name}>
            {v.name} ({v.gender})
          </option>
        ))}
      </select>

      {/* Presets */}
      {presets.length > 0 && (
        <>
          <label className="field-label">Presets</label>
          <div className="vo-presets">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                className={`vo-preset-btn${voice === p.voice ? ' active' : ''}`}
                onClick={() => setVoice(p.voice)}
              >
                {p.name.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Controls */}
      <div className="vo-controls">
        <div className="vo-control">
          <label className="field-label" htmlFor="vo-rate">Rate</label>
          <select id="vo-rate" className="vo-select" value={rate} onChange={(e) => setRate(e.target.value)}>
            <option value="-30%">Slow (-30%)</option>
            <option value="-15%">Slower (-15%)</option>
            <option value="+0%">Normal</option>
            <option value="+15%">Faster (+15%)</option>
            <option value="+30%">Fast (+30%)</option>
            <option value="+50%">Very Fast (+50%)</option>
          </select>
        </div>
        <div className="vo-control">
          <label className="field-label" htmlFor="vo-pitch">Pitch</label>
          <select id="vo-pitch" className="vo-select" value={pitch} onChange={(e) => setPitch(e.target.value)}>
            <option value="-20Hz">Low</option>
            <option value="+0Hz">Normal</option>
            <option value="+20Hz">High</option>
          </select>
        </div>
        <div className="vo-control">
          <label className="field-label" htmlFor="vo-format">Format</label>
          <select id="vo-format" className="vo-select" value={format} onChange={(e) => setFormat(e.target.value as 'mp3' | 'wav')}>
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
          </select>
        </div>
      </div>

      {/* Generate button */}
      <button
        type="button"
        className="vo-generate-btn"
        onClick={handleGenerate}
        disabled={loading || !text.trim()}
      >
        {loading ? 'Generating...' : 'Generate Voiceover'}
      </button>

      {/* Result */}
      {result?.fileId && (
        <div className="vo-result">
          <audio controls src={getVoiceoverDownloadUrl(result.fileId, format)} className="vo-audio" />
          <div className="vo-result-actions">
            <a
              href={getVoiceoverDownloadUrl(result.fileId, format)}
              download
              className="vo-download-btn"
            >
              Download
            </a>
            {onAddToTimeline && (
              <button type="button" className="vo-add-btn" onClick={handleAddToTimeline}>
                Add to Timeline
              </button>
            )}
          </div>
        </div>
      )}

      {result?.error && (
        <div className="vo-error">{result.error}</div>
      )}
    </div>
  )
}
