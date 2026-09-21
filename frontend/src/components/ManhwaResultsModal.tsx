import { useEffect, useCallback, useMemo } from 'react'
import { sourceImageUrl, panelImageUrl } from '../services/manhwa'
import { useManhwaStore, type PendingPage } from '../store/manhwaStore'
import './ManhwaResultsModal.css'

type ManhwaResultsModalProps = {
  pages: PendingPage[]
  fileName: string
  onClose: () => void
}

export default function ManhwaResultsModal({ pages, fileName, onClose }: ManhwaResultsModalProps) {
  const status = useManhwaStore((s) => s.status)
  const viewerPageIndex = useManhwaStore((s) => s.viewerPageIndex)
  const detectionProgress = useManhwaStore((s) => s.detectionProgress)
  const detail = useManhwaStore((s) => s.detail)
  const strips = useManhwaStore((s) => s.strips)
  const pendingPages = useManhwaStore((s) => s.pendingPages)
  const nextPage = useManhwaStore((s) => s.nextPage)
  const prevPage = useManhwaStore((s) => s.prevPage)
  const startDetection = useManhwaStore((s) => s.startDetection)

  const isDetecting = status.phase === 'detecting'
  const isDone = status.phase === 'idle' && strips.length > 0

  const activePages = isDetecting || isDone ? pendingPages : pages

  const panels = useMemo(() => detail?.panels ?? [], [detail])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (!isDetecting) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage()
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage()
      }
    },
    [onClose, nextPage, prevPage, isDetecting],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const title = isDetecting
    ? 'Detecting Panels'
    : isDone
      ? 'Extracted Panels'
      : 'Extracted Pages'

  const meta = isDetecting
    ? `${detectionProgress?.current ?? 0} / ${detectionProgress?.total ?? activePages.length} pages`
    : isDone
      ? `${panels.length} panels detected across ${strips.length} pages`
      : `${activePages.length} pages — ${fileName}`

  const maxIndex = isDone ? panels.length - 1 : activePages.length - 1

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
            <span className="manhwa-results-title">{title}</span>
            <span className="manhwa-results-meta">{meta}</span>
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
          {/* Pages view */}
          {!isDetecting && !isDone && (
            <>
              <div className="manhwa-results-grid">
                {activePages.map((page, index) => (
                  <div
                    key={page.stripId}
                    className={`manhwa-results-thumb${index === viewerPageIndex ? ' active' : ''}`}
                    onClick={() => {
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
                    {viewerPageIndex + 1} / {activePages.length}
                  </span>
                  <button type="button" onClick={() => void nextPage()} disabled={viewerPageIndex === activePages.length - 1}>
                    Next ▶
                  </button>
                </div>
                <div className="manhwa-results-preview-image">
                  <img
                    src={sourceImageUrl(activePages[viewerPageIndex].stripId)}
                    alt={`Page ${viewerPageIndex + 1}`}
                  />
                </div>
              </div>
            </>
          )}

          {/* Progress view */}
          {isDetecting && (
            <div className="manhwa-results-progress">
              <div className="manhwa-results-progress-spinner" />
              <div className="manhwa-results-progress-bar">
                <div
                  className="manhwa-results-progress-fill"
                  style={{
                    width: detectionProgress
                      ? `${(detectionProgress.current / detectionProgress.total) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="manhwa-results-progress-text">
                Detecting panels... {detectionProgress?.current ?? 0} / {detectionProgress?.total ?? activePages.length}
              </span>
            </div>
          )}

          {/* Panels view */}
          {isDone && panels.length > 0 && (
            <>
              <div className="manhwa-results-grid">
                {panels.map((panel, index) => (
                  <div
                    key={panel.id}
                    className={`manhwa-results-thumb manhwa-results-panel-thumb${index === viewerPageIndex ? ' active' : ''}`}
                    onClick={() => {
                      while (useManhwaStore.getState().viewerPageIndex < index) nextPage()
                      while (useManhwaStore.getState().viewerPageIndex > index) prevPage()
                    }}
                  >
                    <img
                      src={panelImageUrl(panel.sourceId, panel.id)}
                      alt={`Panel ${panel.order}`}
                      loading={Math.abs(index - viewerPageIndex) <= 3 ? 'eager' : 'lazy'}
                    />
                    <span className="manhwa-results-thumb-label">
                      {panel.order}
                      <span className="manhwa-results-confidence">
                        {Math.round(panel.confidence * 100)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="manhwa-results-preview">
                <div className="manhwa-results-preview-nav">
                  <button type="button" onClick={() => void prevPage()} disabled={viewerPageIndex === 0}>
                    ◀ Prev
                  </button>
                  <span className="manhwa-results-preview-page">
                    {viewerPageIndex + 1} / {panels.length}
                  </span>
                  <button type="button" onClick={() => void nextPage()} disabled={viewerPageIndex === panels.length - 1}>
                    Next ▶
                  </button>
                </div>
                {panels[viewerPageIndex] && (
                  <div className="manhwa-results-preview-image">
                    <img
                      src={panelImageUrl(panels[viewerPageIndex].sourceId, panels[viewerPageIndex].id)}
                      alt={`Panel ${panels[viewerPageIndex].order}`}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Detecting but no panels yet */}
          {isDone && panels.length === 0 && (
            <div className="manhwa-results-progress">
              <span className="manhwa-results-progress-text">Loading panels...</span>
            </div>
          )}
        </div>

        <div className="manhwa-results-footer">
          {!isDetecting && !isDone && (
            <button type="button" className="manhwa-results-detect-btn" onClick={() => void startDetection()}>
              Start Extraction
            </button>
          )}
          {isDone && panels.length > 0 && (
            <button type="button" className="manhwa-results-done-btn" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
