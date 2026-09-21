import { useCallback, useRef } from 'react'
import { useManhwaStore } from '../store/manhwaStore'
import { ManhwaResultsModal } from './ManhwaResultsModal'
import './ManhwaResultsModal.css'

export default function ManhwaPanel() {
  const status = useManhwaStore((s) => s.status)
  const strips = useManhwaStore((s) => s.strips)
  const uploadOnly = useManhwaStore((s) => s.uploadOnly)
  const refresh = useManhwaStore((s) => s.refresh)
  const openResults = useManhwaStore((s) => s.openResults)
  const resultsModalOpen = useManhwaStore((s) => s.resultsModalOpen)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const dragOver = status.phase === 'uploading'

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

  const hasResults = strips.length > 0 && status.phase === 'idle'
  const totalPanels = strips.reduce((sum, s) => sum + (s.panelCount ?? 0), 0)

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

      {hasResults && (
        <>
          <button
            className="manhwa-see-results-btn"
            onClick={openResults}
            type="button"
          >
            View Results
          </button>
          <div className="manhwa-stats">
            {strips.length} {strips.length === 1 ? 'page' : 'pages'} · {totalPanels}{' '}
            {totalPanels === 1 ? 'panel' : 'panels'}
          </div>
        </>
      )}

      <ManhwaResultsModal />
    </section>
  )
}
