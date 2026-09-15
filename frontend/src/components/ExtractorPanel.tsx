import { useCallback, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import './ExtractorPanel.css'

type ExtractedPage = {
  id: string
  file: File
  preview: string
  selected: boolean
}

export default function ExtractorPanel() {
  const [pages, setPages] = useState<ExtractedPage[]>([])
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const addAsset = useEditorStore((s) => s.addAsset)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPages: ExtractedPage[] = Array.from(files).map((file) => ({
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
      selected: true,
    }))
    setPages((prev) => [...prev, ...newPages])
  }, [])

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

    for (let i = 0; i < selected.length; i++) {
      const page = selected[i]
      addAsset({
        id: `extracted-${page.id}`,
        kind: 'image',
        name: page.file.name,
        url: page.preview,
        meta: { width: 0, height: 0 },
      })
      setProgress(Math.round(((i + 1) / selected.length) * 100))
      await new Promise((r) => setTimeout(r, 50))
    }

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

  const selectedCount = pages.filter((p) => p.selected).length

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
              >
                All
              </button>
              <button
                type="button"
                className="extractor-toolbar-btn"
                onClick={deselectAll}
              >
                None
              </button>
              <button
                type="button"
                className="extractor-toolbar-btn extractor-toolbar-danger"
                onClick={clearAll}
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
                <div className="extractor-progress-bar">
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
      </div>
    </section>
  )
}
