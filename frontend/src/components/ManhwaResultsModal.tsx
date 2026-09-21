import { useEffect, useCallback } from 'react'
import { sourceImageUrl } from '../services/manhwa'
import { useManhwaStore, type PendingPage } from '../store/manhwaStore'
import './ManhwaResultsModal.css'

type ManhwaResultsModalProps = {
  pages: PendingPage[]
  fileName: string
  onClose: () => void
}

export default function ManhwaResultsModal({ pages, fileName, onClose }: ManhwaResultsModalProps) {
  const viewerPageIndex = useManhwaStore((s) => s.viewerPageIndex)
  const nextPage = useManhwaStore((s) => s.nextPage)
  const prevPage = useManhwaStore((s) => s.prevPage)
  const startDetection = useManhwaStore((s) => s.startDetection)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage()
    },
    [onClose, nextPage, prevPage],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="manhwa-results-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Extraction results"
    >
      <div className="manhwa-results-content">
        <div className="manhwa-results-header">
          <div className="manhwa-results-title-area">
            <span className="manhwa-results-title">Extracted Pages</span>
            <span className="manhwa-results-meta">
              {pages.length} pages — {fileName}
            </span>
          </div>
          <button
            type="button"
            className="manhwa-results-close"
            onClick={onClose}
            aria-label="Close results"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="manhwa-results-body">
          <div className="manhwa-results-grid">
            {pages.map((page, index) => (
              <div
                key={page.stripId}
                className={`manhwa-results-thumb${index === viewerPageIndex ? ' active' : ''}`}
                onClick={() => {
                  /* navigate to this page — store already tracks viewerPageIndex */
                  while (useManhwaStore.getState().viewerPageIndex < index) nextPage()
                  while (useManhwaStore.getState().viewerPageIndex > index) prevPage()
                }}
              >
                <img
                  src={sourceImageUrl(page.stripId)}
                  alt={`Page ${index + 1}`}
                  loading={Math.abs(index - viewerPageIndex) <= 3 ? 'eager' : 'lazy'}
                />
                <span className="manhwa-results-thumb-label">{index + 1}</span>
              </div>
            ))}
          </div>

          <div className="manhwa-results-preview">
            <div className="manhwa-results-preview-nav">
              <button type="button" onClick={() => void prevPage()} disabled={viewerPageIndex === 0}>
                ◀ Prev
              </button>
              <span className="manhwa-results-preview-page">
                {viewerPageIndex + 1} / {pages.length}
              </span>
              <button type="button" onClick={() => void nextPage()} disabled={viewerPageIndex === pages.length - 1}>
                Next ▶
              </button>
            </div>
            <div className="manhwa-results-preview-image">
              <img
                src={sourceImageUrl(pages[viewerPageIndex].stripId)}
                alt={`Page ${viewerPageIndex + 1}`}
              />
            </div>
          </div>
        </div>

        <div className="manhwa-results-footer">
          <button type="button" className="manhwa-results-detect-btn" onClick={() => void startDetection()}>
            Start Extraction
          </button>
        </div>
      </div>
    </div>
  )
}
