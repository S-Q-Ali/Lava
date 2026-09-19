import { useState, useCallback } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './ImageGenPanel.css'

interface GeneratedImage {
  id: string
  prompt: string
  file_path: string
  file_size: number
  width: number
  height: number
}

export function ImageGenPanel() {
  const [prompts, setPrompts] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    const lines = prompts.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('prompts', JSON.stringify(lines))
      form.append('style', style)
      form.append('aspect_ratio', aspectRatio)

      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/image-gen/batch`, {
        method: 'POST',
        body: form,
      })
      const body = await res.json()
      if (body.success) {
        setImages((prev) => [...prev, ...body.images])
      } else {
        setError(body.error ?? 'Generation failed')
      }
    } catch {
      setError('Connection failed. Check GEMINI_API_KEY.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('prompt', file.name)

        const baseUrl = backendBaseUrl()
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/image-gen/upload`, {
          method: 'POST',
          body: form,
        })
        const body = await res.json()
        if (body.success) {
          setImages((prev) => [...prev, {
            id: body.id,
            prompt: body.prompt || body.filename,
            file_path: body.file_path,
            file_size: body.file_size,
            width: 0,
            height: 0,
          }])
        }
      } catch {
        // Skip failed uploads
      }
    }
  }, [])

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const imageUrl = (id: string) => `${backendBaseUrl()}/api/image-gen/download/${id}`

  return (
    <section className="imagegen-panel" aria-label="Bulk Image Generator">
      <div className="ig-header">
        <span className="ig-icon">🖼️</span>
        <span className="ig-title">Image Generator</span>
      </div>

      <div className="ig-body">
        <label className="ig-field">
          <span className="ig-label">Prompts (one per line)</span>
          <textarea
            className="ig-textarea"
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
            placeholder={"A dark forest at midnight\nA futuristic city skyline\nA serene beach at sunset"}
            rows={5}
          />
        </label>

        <div className="ig-row">
          <label className="ig-field ig-field-half">
            <span className="ig-label">Style</span>
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="cinematic">Cinematic</option>
              <option value="anime">Anime</option>
              <option value="realistic">Realistic</option>
              <option value="watercolor">Watercolor</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="fantasy">Fantasy</option>
              <option value="minimalist">Minimalist</option>
              <option value="comic">Comic</option>
              <option value="vintage">Vintage</option>
              <option value="dark_moody">Dark Moody</option>
              <option value="bright_vivid">Bright Vivid</option>
            </select>
          </label>

          <label className="ig-field ig-field-half">
            <span className="ig-label">Aspect Ratio</span>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              <option value="9:16">9:16 (Vertical)</option>
              <option value="16:9">16:9 (Horizontal)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
            </select>
          </label>
        </div>

        <div className="ig-actions">
          <button
            type="button"
            className="ig-generate-btn"
            disabled={loading || !prompts.trim()}
            onClick={() => void handleGenerate()}
          >
            {loading ? 'Generating…' : 'Generate Images'}
          </button>

          <label className="ig-upload-btn">
            Upload Custom
            <input
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => void handleUpload(e.target.files)}
            />
          </label>
        </div>

        {error && <p className="ig-error">{error}</p>}

        {images.length > 0 && (
          <div className="ig-results">
            <span className="ig-label">{images.length} image{images.length > 1 ? 's' : ''}</span>
            <div className="ig-grid">
              {images.map((img) => (
                <div key={img.id} className="ig-card">
                  <img
                    src={imageUrl(img.id)}
                    alt={img.prompt}
                    className="ig-thumb"
                    loading="lazy"
                  />
                  <p className="ig-prompt-text" title={img.prompt}>{img.prompt}</p>
                  <button
                    type="button"
                    className="ig-remove-btn"
                    onClick={() => removeImage(img.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
