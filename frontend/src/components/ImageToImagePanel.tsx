import { useState } from 'react'
import './ImageToImagePanel.css'

export default function ImageToImagePanel() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('comic')
  const [source] = useState<string | null>(null)

  return (
    <div className="image-to-image-panel">
      <div className="i2i-header">
        <span className="i2i-icon">🎨</span>
        <span className="i2i-title">Image to Image</span>
      </div>
      <div className="i2i-body">
        <div className="i2i-drop-zone">
          {source ? (
            <img src={source} alt="Source" className="i2i-preview" />
          ) : (
            <p className="i2i-drop-text">
              Drop an image here or click to upload
            </p>
          )}
        </div>
        <label className="i2i-field">
          <span className="i2i-label">Prompt</span>
          <input
            className="i2i-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the transformation…"
          />
        </label>
        <label className="i2i-field">
          <span className="i2i-label">Style Preset</span>
          <select
            className="i2i-select"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="comic">Comic / Manhwa</option>
            <option value="realistic">Realistic</option>
            <option value="anime">Anime</option>
            <option value="cinematic">Cinematic</option>
          </select>
        </label>
        <button type="button" className="i2i-generate-btn" disabled={!source && !prompt}>
          Generate
        </button>
        <p className="i2i-hint">
          Generates a new image from the source using your prompt and style preset.
        </p>
      </div>
    </div>
  )
}
