import { useCallback, useMemo, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import './ExtractorPanel.css'

type ExtractedPage = {
  id: string
  file: File
  preview: string
  selected: boolean
  index: number
}

type ExtractedImage = {
  id: string
  name: string
  preview: string
  width: number
  height: number
}

function getExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : '?'
}

async function loadImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = src
  })
}

async function downloadAs(src: string, format: 'jpg' | 'png', fileName: string) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (format === 'jpg') {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0)
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, 0.92))
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const base = fileName.replace(/\.[^.]+$/, '')
  a.download = `${base}.${format}`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExtractorPanel() {
  const [pages, setPages] = useState<ExtractedPage[]>([])
  const [extracted, setExtracted] = useState<ExtractedImage[]>([])
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const addAsset = useEditorStore((s) => s.addAsset)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const startIdx = pages.length
    const newPages: ExtractedPage[] = Array.from(files).map((file, i) => ({
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      selected: true,
      index: startIdx + i + 1,
    }))
    setPages((prev) => [...prev, ...newPages])
  }, [pages.length])

  const togglePage = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)),
    )
  }, [])

  const selectAll = useCallback(() => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: true })))
  }, [])

  const deselectAll = useCallback(() => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })))
  }, [])

  const extractSelected = useCallback(async () => {
    const selected = pages.filter((p) => p.selected)
    if (selected.length === 0) return

    setExtracting(true)
    setProgress(0)

    const newExtracted: ExtractedImage[] = []
    for (let i = 0; i < selected.length; i++) {
      const page = selected[i]
      const { width, height } = await loadImage(page.preview)
      addAsset({
        id: `extracted-${page.id}`,
        kind: 'image',
        name: page.file.name,
        url: page.preview,
        meta: { width, height },
      })
      newExtracted.push({
        id: page.id,
        name: page.file.name,
        preview: page.preview,
        width,
        height,
      })
      setProgress(Math.round(((i + 1) / selected.length) * 100))
      await new Promise((r) => setTimeout(r, 50))
    }

    setExtracted((prev) => [...prev, ...newExtracted])
    setExtracting(false)
    setProgress(0)
    setPages([])
  }, [pages, addAsset])

  const removePage = useCallback((id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setPages([])
  }, [])

  const removeExtracted = useCallback((id: string) => {
    setExtracted((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const selectedCount = pages.filter((p) => p.selected).length

  // File metadata card
  const fileMeta = useMemo(() => {
    if (pages.length === 0) return null
    const names = pages.map((p) => p.file.name)
    const ext = getExt(names[0])
    const allSame = new Set(names.map(getExt)).size === 1
    return {
      fileName: allSame ? names[0] : `${pages.length} files`,
      pageCount: pages.length,
      fileType: allSame ? ext : `Mixed`,
    }
  }, [pages])

  return (
    <section className="extractor-panel" aria-label="Presentation Extractor">
      <div className="extractor-header">
        <span className="extractor-icon">📄</span>
        <span className="extractor-title">Extractor</span>
      </div>
      <div className="extractor-body">
        <div className="extractor-upload">
          <label className="extractor-upload-zone">
            <input
              type="file"
              className="extractor-upload-input"
              accept=".pdf,.ppt,.pptx,.key,.odp"
              multiple
              onChange={handleFileChange}
            />
            <span className="extractor-upload-icon">📎</span>
            <span className="extractor-upload-text">
              Drop presentation files or click to browse
            </span>
            <span className="extractor-upload-formats">
              PDF, PPT, PPTX, KEY, ODP
            </span>
          </label>
        </div>

        {fileMeta && (
          <div className="extractor-meta-card">
            <span className="extractor-meta-icon">📋</span>
            <div className="extractor-meta-info">
              <span className="extractor-meta-name" title={fileMeta.fileName}>
                {fileMeta.fileName}
              </span>
              <span className="extractor-meta-detail">
                {fileMeta.pageCount} {fileMeta.pageCount === 1 ? 'page' : 'pages'} · {fileMeta.fileType}
              </span>
            </div>
          </div>
        )}

        {pages.length > 0 && (
          <>
            <div className="extractor-toolbar">
              <span className="extractor-count">
                {selectedCount}/{pages.length} selected
              </span>
              <button
                type="button"
                className="extractor-toolbar-btn"
                onClick={selectAll}
                aria-label="Select all pages"
              >
                All
              </button>
              <button
                type="button"
                className="extractor-toolbar-btn"
                onClick={deselectAll}
                aria-label="Deselect all pages"
              >
                None
              </button>
              <button
                type="button"
                className="extractor-toolbar-btn extractor-toolbar-danger"
                onClick={clearAll}
                aria-label="Clear all pages"
              >
                Clear
              </button>
            </div>

            <div className="extractor-pages">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className={`extractor-page${page.selected ? ' selected' : ''}`}
                >
                  <span className="extractor-page-number">{page.index}</span>
                  <button
                    type="button"
                    className="extractor-page-check"
                    onClick={() => togglePage(page.id)}
                    aria-label={page.selected ? 'Deselect page' : 'Select page'}
                  >
                    {page.selected ? '☑' : '☐'}
                  </button>
                  <img
                    className="extractor-page-img"
                    src={page.preview}
                    alt={page.file.name}
                  />
                  <div className="extractor-page-name" title={page.file.name}>
                    {page.file.name}
                  </div>
                  <button
                    type="button"
                    className="extractor-page-remove"
                    onClick={() => removePage(page.id)}
                    aria-label="Remove page"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {extracting ? (
              <div className="extractor-progress">
                <div className="extractor-progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Extraction progress">
                  <div
                    className="extractor-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="extractor-progress-text">
                  Extracting… {progress}%
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="extractor-extract-btn"
                disabled={selectedCount === 0}
                onClick={extractSelected}
              >
                Extract {selectedCount} {selectedCount === 1 ? 'page' : 'pages'}
              </button>
            )}
          </>
        )}

        {extracted.length > 0 && (
          <div className="extracted-section">
            <div className="extracted-header">
              <span className="extracted-label">Extracted ({extracted.length})</span>
            </div>
            <div className="extracted-grid">
              {extracted.map((img) => (
                <div key={img.id} className="extracted-card">
                  <img
                    className="extracted-card-img"
                    src={img.preview}
                    alt={img.name}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="extracted-card-info">
                    <span className="extracted-card-name" title={img.name}>{img.name}</span>
                    <span className="extracted-card-dims">
                      {img.width && img.height ? `${img.width}×${img.height}` : '—'}
                    </span>
                  </div>
                  <div className="extracted-card-actions">
                    <button
                      type="button"
                      className="extracted-export-btn"
                      onClick={() => void downloadAs(img.preview, 'jpg', img.name)}
                      title="Export as JPG"
                    >
                      JPG
                    </button>
                    <button
                      type="button"
                      className="extracted-export-btn"
                      onClick={() => void downloadAs(img.preview, 'png', img.name)}
                      title="Export as PNG"
                    >
                      PNG
                    </button>
                    <button
                      type="button"
                      className="extracted-export-btn extracted-export-remove"
                      onClick={() => removeExtracted(img.id)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
