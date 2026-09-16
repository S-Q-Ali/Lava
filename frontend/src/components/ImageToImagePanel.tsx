import { useCallback, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import './ImageToImagePanel.css'

export default function ImageToImagePanel() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('comic')
  const [source, setSource] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addAsset = useEditorStore((s) => s.addAsset)
  const addClip = useEditorStore((s) => s.addClip)
  const tracks = useEditorStore((s) => s.tracks)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setSourceFile(file)
    setSource(URL.createObjectURL(file))
    setResult(null)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!sourceFile) return
    setGenerating(true)
    // Simulate generation delay (would connect to backend)
    await new Promise((r) => setTimeout(r, 1500))
    // Create a result preview from the source (placeholder — real impl would call backend)
    const canvas = document.createElement('canvas')
    const img = new Image()
    await new Promise<void>((resolve) => {
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          // Apply a tint based on style (visual placeholder)
          ctx.fillStyle = style === 'comic' ? 'rgba(255,200,0,0.15)'
            : style === 'anime' ? 'rgba(200,100,255,0.15)'
            : style === 'cinematic' ? 'rgba(0,100,200,0.15)'
            : 'rgba(0,0,0,0.05)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        resolve()
      }
      img.src = source!
    })
    const resultUrl = canvas.toDataURL('image/png')
    setResult(resultUrl)
    setGenerating(false)
  }, [source, sourceFile, style])

  const handleApplyStyle = useCallback(() => {
    if (!result) return
    // Convert data URL to blob and add as asset
    fetch(result)
      .then((r) => r.blob())
      .then((blob) => {
        const fileName = `i2i-${Date.now()}.png`
        const url = URL.createObjectURL(blob)
        const imageTrack = tracks.find((t) => t.type === 'image')
        addAsset({
          id: `i2i-asset-${Date.now()}`,
          kind: 'image',
          name: fileName,
          url,
          meta: { width: 0, height: 0 },
        })
        if (imageTrack) {
          addClip({
            trackId: imageTrack.id,
            assetId: `i2i-asset-${Date.now()}`,
            name: fileName,
            start: 0,
            duration: 5,
          })
        }
      })
  }, [result, tracks, addAsset, addClip])

  return (
    <div className="image-to-image-panel">
      <div className="i2i-header">
        <span className="i2i-icon">🎨</span>
        <span className="i2i-title">Image to Image</span>
      </div>
      <div className="i2i-body">
        <div
          className="i2i-drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
        >
          {source ? (
            <img src={source} alt="Source" className="i2i-preview" />
          ) : (
            <p className="i2i-drop-text">
              Drop an image here or click to upload
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="i2i-file-input"
            onChange={handleFileChange}
          />
        </div>

        {source && (
          <div className="i2i-layout">
            <div className="i2i-source-col">
              <span className="i2i-col-label">Source</span>
              <img src={source} alt="Source" className="i2i-side-img" />
            </div>
            <div className="i2i-result-col">
              <span className="i2i-col-label">Result</span>
              {result ? (
                <img src={result} alt="Result" className="i2i-side-img" />
              ) : (
                <div className="i2i-placeholder">Generate to see result</div>
              )}
            </div>
          </div>
        )}

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

        <button
          type="button"
          className="i2i-generate-btn"
          disabled={!source || generating}
          onClick={() => void handleGenerate()}
        >
          {generating ? 'Generating…' : 'Generate'}
        </button>

        {result && (
          <button
            type="button"
            className="i2i-apply-btn"
            onClick={handleApplyStyle}
          >
            Apply Style → Timeline
          </button>
        )}

        <p className="i2i-hint">
          Generates a new image from the source using your prompt and style preset.
        </p>
      </div>
    </div>
  )
}
