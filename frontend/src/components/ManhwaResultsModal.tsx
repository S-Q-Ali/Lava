import { useEffect, useCallback, useMemo, useState } from 'react'
import {
  sourceImageUrl,
  panelImageUrl,
  correctStrip,
  redetectStrip,
  type CorrectionOp,
} from '../services/manhwa'
import { useManhwaStore } from '../store/manhwaStore'
import './ManhwaResultsModal.css'

export function ManhwaResultsModal() {
  const status = useManhwaStore((s) => s.status)
  const strips = useManhwaStore((s) => s.strips)
  const detail = useManhwaStore((s) => s.detail)
  const currentId = useManhwaStore((s) => s.currentId)
  const viewerPageIndex = useManhwaStore((s) => s.viewerPageIndex)
  const detectionProgress = useManhwaStore((s) => s.detectionProgress)
  const pendingPages = useManhwaStore((s) => s.pendingPages)
  const resultsModalOpen = useManhwaStore((s) => s.resultsModalOpen)
  const closeResults = useManhwaStore((s) => s.closeResults)
  const nextPage = useManhwaStore((s) => s.nextPage)
  const prevPage = useManhwaStore((s) => s.prevPage)
  const startDetection = useManhwaStore((s) => s.startDetection)
  const select = useManhwaStore((s) => s.select)

  const [expandedPanelId, setExpandedPanelId] = useState<string | null>(null)
  const [adjustBounds, setAdjustBounds] = useState<{
    panelId: string
    x: number
    y: number
    w: number
    h: number
  } | null>(null)
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png')

  const isDetecting = status.phase === 'detecting'
  const isIdle = status.phase === 'idle'
  const isUploaded = status.phase === 'uploaded'

  const panels = useMemo(() => detail?.panels ?? [], [detail])

  // Pages to show in uploaded phase — from status.pages (set by uploadOnly)
  const uploadPages = useMemo(
    () => (isUploaded ? status.pages : []),
    [isUploaded, status],
  )

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!resultsModalOpen) {
      setExpandedPanelId(null)
      setAdjustBounds(null)
    }
  }, [resultsModalOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!resultsModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeResults()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [resultsModalOpen, closeResults])

  // Sync when currentId changes
  useEffect(() => {
    setExpandedPanelId(null)
    setAdjustBounds(null)
  }, [currentId])

  const handleApply = useCallback(
    async (stripSourceId: string, op: CorrectionOp) => {
      try {
        await correctStrip(stripSourceId, op)
        await select(stripSourceId)
      } catch {
        // error handled by store
      }
    },
    [select],
  )

  const handleRedetect = useCallback(async () => {
    if (!currentId) return
    try {
      await redetectStrip(currentId)
      await select(currentId)
    } catch {
      // error handled by store
    }
  }, [currentId, select])

  const handleExportAll = useCallback(async () => {
    if (!currentId || panels.length === 0) return
    for (const panel of panels) {
      const url = panelImageUrl(panel.sourceId, panel.id)
      const ext = exportFormat === 'jpg' ? 'jpg' : 'png'
      const link = document.createElement('a')
      link.href = url
      link.download = `panel-${panel.order}.${ext}`
      link.click()
      await new Promise((r) => setTimeout(r, 100))
    }
  }, [currentId, panels, exportFormat])

  const handleExportPanel = useCallback(
    (panelId: string, order: number) => {
      if (!currentId) return
      const panel = panels.find((p) => p.id === panelId)
      if (!panel) return
      const url = panelImageUrl(panel.sourceId, panel.id)
      const ext = exportFormat === 'jpg' ? 'jpg' : 'png'
      const link = document.createElement('a')
      link.href = url
      link.download = `panel-${order}.${ext}`
      link.click()
    },
    [currentId, panels, exportFormat],
  )

  if (!resultsModalOpen) return null

  // --- Title / Meta ---
  const title = isDetecting
    ? 'Detecting Panels'
    : isUploaded
      ? 'Extracted Pages'
      : isIdle && panels.length > 0
        ? 'Extracted Panels'
        : 'Manhwa Workspace'

  const meta = isDetecting
    ? `${detectionProgress?.current ?? 0} / ${detectionProgress?.total ?? pendingPages.length} pages`
    : isUploaded
      ? `${uploadPages.length} pages — source`
      : isIdle && panels.length > 0
        ? `${panels.length} panels across ${strips.length} ${strips.length === 1 ? 'page' : 'pages'}`
        : ''

  return (
    <div
      className="manhwa-results-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeResults()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Manhwa workspace"
    >
      <div className="manhwa-results-content">
        {/* Header */}
        <div className="manhwa-results-header">
          <div className="manhwa-results-title-area">
            <span className="manhwa-results-title">{title}</span>
            {meta && <span className="manhwa-results-meta">{meta}</span>}
          </div>
          <button
            type="button"
            className="manhwa-results-close"
            onClick={closeResults}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="manhwa-results-body">
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
                Detecting panels... {detectionProgress?.current ?? 0} /{' '}
                {detectionProgress?.total ?? pendingPages.length}
              </span>
            </div>
          )}

          {/* Uploaded phase — pages grid + preview */}
          {isUploaded && (
            <div className="manhwa-results-upload-layout">
              <div className="manhwa-results-grid">
                {uploadPages.map((page, index) => (
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
                    Prev
                  </button>
                  <span className="manhwa-results-preview-page">
                    {viewerPageIndex + 1} / {uploadPages.length}
                  </span>
                  <button type="button" onClick={() => void nextPage()} disabled={viewerPageIndex === uploadPages.length - 1}>
                    Next
                  </button>
                </div>
                <div className="manhwa-results-preview-image">
                  {uploadPages[viewerPageIndex] && (
                    <img
                      src={sourceImageUrl(uploadPages[viewerPageIndex].stripId)}
                      alt={`Page ${viewerPageIndex + 1}`}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Idle phase — scrollable vertical panels list */}
          {isIdle && panels.length > 0 && (
            <div className="manhwa-results-panels-layout">
              {/* Toolbar */}
              <div className="manhwa-results-toolbar">
                <button
                  type="button"
                  className="manhwa-results-action-btn"
                  onClick={() => void handleRedetect()}
                >
                  Re-detect
                </button>
                <div className="manhwa-results-toolbar-spacer" />
                <div className="manhwa-results-export-group">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpg')}
                    className="manhwa-results-format-select"
                  >
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                  </select>
                  <button
                    type="button"
                    className="manhwa-results-action-btn"
                    onClick={() => void handleExportAll()}
                  >
                    Export All
                  </button>
                </div>
              </div>

              {/* Scrollable panels */}
              <div className="manhwa-results-panels-scroll">
                {panels.map((panel) => {
                  const isExpanded = expandedPanelId === panel.id
                  return (
                    <div
                      key={panel.id}
                      className={`manhwa-results-panel-card${isExpanded ? ' expanded' : ''}`}
                    >
                      {/* Panel thumbnail */}
                      <div
                        className="manhwa-results-panel-image"
                        onClick={() => setExpandedPanelId(isExpanded ? null : panel.id)}
                      >
                        <img
                          src={panelImageUrl(panel.sourceId, panel.id)}
                          alt={`Panel ${panel.order}`}
                          loading="lazy"
                        />
                      </div>

                      {/* Panel info + actions */}
                      <div className="manhwa-results-panel-info">
                        <div className="manhwa-results-panel-info-header">
                          <span className="manhwa-results-panel-order">
                            Panel {panel.order} / {panels.length}
                          </span>
                          <span className="manhwa-results-panel-confidence">
                            {Math.round(panel.confidence * 100)}%
                          </span>
                        </div>
                        <div className="manhwa-results-panel-dims">
                          {panel.w} x {panel.h}
                        </div>
                        <div className="manhwa-results-panel-actions">
                          <button
                            type="button"
                            className="manhwa-results-panel-action-btn"
                            onClick={() => setExpandedPanelId(isExpanded ? null : panel.id)}
                          >
                            {isExpanded ? 'Close' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            className="manhwa-results-panel-action-btn"
                            onClick={() => void handleExportPanel(panel.id, panel.order)}
                          >
                            Export
                          </button>
                          <button
                            type="button"
                            className="manhwa-results-panel-action-btn"
                            onClick={() => {
                              const ids = panels.map((p) => p.id)
                              const idx = ids.indexOf(panel.id)
                              if (idx > 0) {
                                ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
                                void handleApply(panel.sourceId, { op: 'reorder', ids })
                              }
                            }}
                            disabled={panel.order === 1}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="manhwa-results-panel-action-btn"
                            onClick={() => {
                              const ids = panels.map((p) => p.id)
                              const idx = ids.indexOf(panel.id)
                              if (idx < ids.length - 1) {
                                ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
                                void handleApply(panel.sourceId, { op: 'reorder', ids })
                              }
                            }}
                            disabled={panel.order === panels.length}
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="manhwa-results-panel-action-btn manhwa-results-panel-danger"
                            onClick={() => void handleApply(panel.sourceId, { op: 'delete', panelId: panel.id })}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Expanded editor */}
                      {isExpanded && (
                        <div className="manhwa-results-panel-editor">
                          <div className="manhwa-results-panel-editor-row">
                            <button
                              type="button"
                              className="manhwa-results-action-btn"
                              onClick={() => void handleApply(panel.sourceId, { op: 'split', panelId: panel.id, y: Math.round(panel.y + panel.h / 2) })}
                            >
                              Split
                            </button>
                            <button
                              type="button"
                              className="manhwa-results-action-btn"
                              onClick={() => {
                                const nextPanel = panels.find(
                                  (p) => p.sourceId === panel.sourceId && p.order === panel.order + 1,
                                )
                                if (nextPanel) {
                                  void handleApply(panel.sourceId, { op: 'merge', ids: [panel.id, nextPanel.id] })
                                }
                              }}
                              disabled={panel.order === panels.length}
                            >
                              Merge Down
                            </button>
                            <button
                              type="button"
                              className="manhwa-results-action-btn"
                              onClick={() =>
                                setAdjustBounds(
                                  adjustBounds?.panelId === panel.id
                                    ? null
                                    : {
                                        panelId: panel.id,
                                        x: panel.x,
                                        y: panel.y,
                                        w: panel.w,
                                        h: panel.h,
                                      },
                                )
                              }
                            >
                              {adjustBounds?.panelId === panel.id ? 'Cancel' : 'Adjust Bounds'}
                            </button>
                          </div>

                          {adjustBounds?.panelId === panel.id && (
                            <div className="manhwa-results-panel-editor-row">
                              <div className="manhwa-results-adjust">
                                <label>
                                  X
                                  <input
                                    type="number"
                                    value={adjustBounds.x}
                                    onChange={(e) =>
                                      setAdjustBounds({ ...adjustBounds, x: Number(e.target.value) })
                                    }
                                  />
                                </label>
                                <label>
                                  Y
                                  <input
                                    type="number"
                                    value={adjustBounds.y}
                                    onChange={(e) =>
                                      setAdjustBounds({ ...adjustBounds, y: Number(e.target.value) })
                                    }
                                  />
                                </label>
                                <label>
                                  W
                                  <input
                                    type="number"
                                    value={adjustBounds.w}
                                    onChange={(e) =>
                                      setAdjustBounds({ ...adjustBounds, w: Number(e.target.value) })
                                    }
                                  />
                                </label>
                                <label>
                                  H
                                  <input
                                    type="number"
                                    value={adjustBounds.h}
                                    onChange={(e) =>
                                      setAdjustBounds({ ...adjustBounds, h: Number(e.target.value) })
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="manhwa-results-action-btn"
                                  onClick={() =>
                                    void handleApply(panel.sourceId, {
                                      op: 'adjust',
                                      panelId: panel.id,
                                      x: adjustBounds.x,
                                      y: adjustBounds.y,
                                      w: adjustBounds.w,
                                      h: adjustBounds.h,
                                    })
                                  }
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Idle but no panels */}
          {isIdle && panels.length === 0 && (
            <div className="manhwa-results-empty">
              <span>No panels detected</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="manhwa-results-footer">
          {isUploaded && (
            <button
              type="button"
              className="manhwa-results-detect-btn"
              onClick={() => void startDetection()}
            >
              Start Extraction
            </button>
          )}
          {isIdle && (
            <button
              type="button"
              className="manhwa-results-done-btn"
              onClick={closeResults}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
