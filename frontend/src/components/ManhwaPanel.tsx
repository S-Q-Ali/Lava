import { useCallback, useRef, useEffect, useState } from 'react'
import { useManhwaStore } from '../store/manhwaStore'
import { ManhwaResultsModal } from './ManhwaResultsModal'
import './ManhwaResultsModal.css'

export default function ManhwaPanel() {
  const status = useManhwaStore((s) => s.status)
  const groups = useManhwaStore((s) => s.groups)
  const uploadOnly = useManhwaStore((s) => s.uploadOnly)
  const refresh = useManhwaStore((s) => s.refresh)
  const viewGroup = useManhwaStore((s) => s.viewGroup)
  const removeGroup = useManhwaStore((s) => s.removeGroup)
  const resultsModalOpen = useManhwaStore((s) => s.resultsModalOpen)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const dragOver = status.phase === 'uploading'
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Load existing groups on mount
  useEffect(() => {
    if (status.phase === 'idle' && groups.length === 0) {
      void refresh()
    }
  }, [refresh, status.phase, groups.length])

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
    (groupId: string) => {
      viewGroup(groupId)
    },
    [viewGroup],
  )

  const handleDelete = useCallback(
    async (groupId: string) => {
      setConfirmDeleteId(null)
      await removeGroup(groupId)
    },
    [removeGroup],
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
      {groups.length > 0 && !isLoading && (
        <div className="manhwa-recent">
          <h4 className="manhwa-recent-title">Recent Extractions</h4>
          <div className="manhwa-recent-list">
            {groups.map((group) => (
              <div key={group.groupId} className="manhwa-recent-item">
                <div className="manhwa-recent-info">
                  <span className="manhwa-recent-filename">
                    {group.sourceName ?? group.pages[0]?.sourceFile ?? 'Untitled'}
                  </span>
                  <span className="manhwa-recent-meta">
                    {group.pageCount} {group.pageCount === 1 ? 'page' : 'pages'} · {group.totalPanels} {group.totalPanels === 1 ? 'panel' : 'panels'}
                  </span>
                </div>
                <div className="manhwa-recent-actions">
                  <button
                    type="button"
                    className="manhwa-recent-btn manhwa-recent-view"
                    onClick={() => void handleView(group.groupId)}
                  >
                    View
                  </button>
                  {confirmDeleteId === group.groupId ? (
                    <>
                      <span className="manhwa-recent-confirm">Delete?</span>
                      <button
                        type="button"
                        className="manhwa-recent-btn manhwa-recent-remove-confirm"
                        onClick={() => void handleDelete(group.groupId)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="manhwa-recent-btn"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="manhwa-recent-btn manhwa-recent-remove"
                      onClick={() => setConfirmDeleteId(group.groupId)}
                    >
                      Delete
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
