import { useCallback, useRef, useEffect, useState } from 'react'
import { useManhwaStore } from '../store/manhwaStore'
import { ManhwaResultsModal } from './ManhwaResultsModal'
import './ManhwaResultsModal.css'

export default function ManhwaPanel() {
  const status = useManhwaStore((s) => s.status)
  const strips = useManhwaStore((s) => s.strips)
  const uploadOnly = useManhwaStore((s) => s.uploadOnly)
  const refresh = useManhwaStore((s) => s.refresh)
  const openResults = useManhwaStore((s) => s.openResults)
  const select = useManhwaStore((s) => s.select)
  const remove = useManhwaStore((s) => s.remove)
  const resultsModalOpen = useManhwaStore((s) => s.resultsModalOpen)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const dragOver = status.phase === 'uploading'
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  // Load existing strips on mount
  useEffect(() => {
    if (status.phase === 'idle' && strips.length === 0) {
      void refresh()
    }
  }, [refresh, status.phase, strips.length])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      void uploadOnly(files[0])
    },
    [uploadOnly],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleView = useCallback(
    async (sourceId: string) => {
      await select(sourceId)
      openResults()
    },
    [select, openResults],
  )

  const handleRemove = useCallback(
    async (sourceId: string) => {
      setConfirmRemoveId(null)
      await remove(sourceId)
    },
    [remove],
  )

  const isLoading = status.phase === 'loading' || status.phase === 'uploading' || status.phase === 'processing'

  return (
    <section className="manhwa-tab-section">
      {status.phase === 'error' && (
        <div className="manhwa-error">{status.error}</div>
      )}

      <div
        className={`manhwa-dropzone${dragOver ? ' manhwa-dropzone-active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.cbz,.pdf,.jpg,.jpeg,.png,.webp"
          className="manhwa-file-input"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="manhwa-dropzone-label">
          {status.phase === 'uploading'
            ? `Uploading… ${Math.round(status.progress)}%`
            : status.phase === 'processing'
              ? 'Processing PDF…'
              : 'Drop or pick a strip / PDF'}
        </span>
      </div>

      {status.phase === 'uploading' && (
        <div className="manhwa-progress">
          <div
            className="manhwa-progress-bar"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      )}

      {status.phase === 'processing' && (
        <div className="manhwa-processing">
          <div className="manhwa-spinner" />
          <span className="manhwa-processing-text">Extracting pages…</span>
        </div>
      )}

      {/* Recent Extractions */}
      {(strips?.length ?? 0) > 0 && !isLoading && (
        <div className="manhwa-recent">
          <h4 className="manhwa-recent-title">Recent Extractions</h4>
          <div className="manhwa-recent-list">
            {strips.map((strip) => (
              <div key={strip.sourceId} className="manhwa-recent-item">
                <div className="manhwa-recent-info">
                  <span className="manhwa-recent-filename">{strip.sourceFile}</span>
                  <span className="manhwa-recent-meta">
                    {strip.panelCount} {strip.panelCount === 1 ? 'panel' : 'panels'} · {strip.width}x{strip.height}
                  </span>
                </div>
                <div className="manhwa-recent-actions">
                  <button
                    type="button"
                    className="manhwa-recent-btn manhwa-recent-view"
                    onClick={() => void handleView(strip.sourceId)}
                  >
                    View
                  </button>
                  {confirmRemoveId === strip.sourceId ? (
                    <>
                      <span className="manhwa-recent-confirm">Remove?</span>
                      <button
                        type="button"
                        className="manhwa-recent-btn manhwa-recent-remove-confirm"
                        onClick={() => void handleRemove(strip.sourceId)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="manhwa-recent-btn"
                        onClick={() => setConfirmRemoveId(null)}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="manhwa-recent-btn manhwa-recent-remove"
                      onClick={() => setConfirmRemoveId(strip.sourceId)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ManhwaResultsModal />
    </section>
  )
}
