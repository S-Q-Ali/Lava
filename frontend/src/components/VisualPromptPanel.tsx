import { useState } from 'react'
import { generateVisualPrompts, type VisualStyle } from '../services/voice'
import './VisualPromptPanel.css'

interface StyleOption {
  id: VisualStyle
  label: string
  icon: string
}

const STYLES: StyleOption[] = [
  { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { id: 'anime', label: 'Anime', icon: '🎌' },
  { id: 'realistic', label: 'Realistic', icon: '📷' },
  { id: 'watercolor', label: 'Watercolor', icon: '🎨' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌆' },
  { id: 'fantasy', label: 'Fantasy', icon: '🧙' },
  { id: 'minimalist', label: 'Minimalist', icon: '◻️' },
  { id: 'comic', label: 'Comic', icon: '💥' },
  { id: 'vintage', label: 'Vintage', icon: '📽️' },
  { id: 'dark_moody', label: 'Dark Moody', icon: '🌑' },
  { id: 'bright_vivid', label: 'Bright Vivid', icon: '🌈' },
]

export function VisualPromptPanel() {
  const [text, setText] = useState('')
  const [style, setStyle] = useState<VisualStyle>('cinematic')
  const [count, setCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [prompts, setPrompts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await generateVisualPrompts({ text, style, count })
      if (result.success) {
        setPrompts(result.prompts)
      } else {
        setError(result.error ?? 'Generation failed')
      }
    } catch {
      setError('Connection failed. Start the backend.')
    } finally {
      setLoading(false)
    }
  }

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
  }

  return (
    <section className="visual-prompt-panel" aria-label="Visual Prompt Generator">
      <div className="vp-header">
        <span className="vp-icon">🎨</span>
        <span className="vp-title">Visual Prompts</span>
      </div>

      <div className="vp-body">
        <label className="vp-field">
          <span className="vp-label">Scene Description</span>
          <textarea
            className="vp-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe the scene from your narration..."
            rows={4}
          />
        </label>

        <label className="vp-field">
          <span className="vp-label">Art Style</span>
          <div className="vp-style-grid">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`vp-style-btn${style === s.id ? ' active' : ''}`}
                onClick={() => setStyle(s.id)}
                title={s.label}
              >
                <span className="vp-style-icon">{s.icon}</span>
                <span className="vp-style-label">{s.label}</span>
              </button>
            ))}
          </div>
        </label>

        <label className="vp-field vp-field-row">
          <span className="vp-label">Variations</span>
          <div className="vp-count-buttons">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`vp-count-btn${count === n ? ' active' : ''}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </label>

        <button
          type="button"
          className="vp-generate-btn"
          disabled={loading || !text.trim()}
          onClick={() => void handleGenerate()}
        >
          {loading ? 'Generating…' : 'Generate Prompts'}
        </button>

        {error && <p className="vp-error">{error}</p>}

        {prompts.length > 0 && (
          <div className="vp-results">
            <span className="vp-label">Generated Prompts</span>
            {prompts.map((prompt, i) => (
              <div key={i} className="vp-prompt-card">
                <p className="vp-prompt-text">{prompt}</p>
                <button
                  type="button"
                  className="vp-copy-btn"
                  onClick={() => copyPrompt(prompt)}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
