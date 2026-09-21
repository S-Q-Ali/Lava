import { useEffect, useCallback, useMemo, useState } from 'react'
import {
  sourceImageUrl,
  panelImageUrl,
  correctStrip,
  redetectStrip,
  type CorrectionOp,
} from '../services/manhwa'
import { useManhwaStore, type PendingPage } from '../store/manhwaStore'
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

  const [selectedPanelIdx, setSelectedPanelIdx] = useState<number | null>(null)
  const [adjustBounds, setAdjustBounds] = useState<{
    idx: number
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

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!resultsModalOpen) {
      setSelectedPanelIdx(null)
      setAdjustBounds(null)
    }
  }, [resultsModalOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!resultsModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeResults()
      if (isIdle && panels.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedPanelIdx((prev) =>
            prev === null ? 0 : Math.min(prev + 1, panels.length - 1),
          )
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedPanelIdx((prev) =>
            prev === null ? 0 : Math.max(prev - 1, 0),
          )
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [resultsModalOpen, closeResults, isIdle, panels.length])

  // Sync selectedPanelIdx when currentId/detail changes
  useEffect(() => {
    setSelectedPanelIdx(null)
    setAdjustBounds(null)
  }, [currentId])

  const handleApply = useCallback(
    async (op: CorrectionOp) => {
      if (!currentId) return
      try {
        await correctStrip(currentId, op)
        await select(currentId)
      } catch {
        // error handled by store
      }
    },
    [currentId, select],
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

  const handleExport = useCallback(async () => {
    if (!currentId || selectedPanelIdx === null || !panels[selectedPanelIdx]) return
    const panel = panels[selectedPanelIdx]
    const url = panelImageUrl(panel.sourceId, panel.id)
    const ext = exportFormat === 'jpg' ? 'jpg' : 'png'
    const link = document.createElement('a')
    link.href = url
    link.download = `panel-${panel.order}.${ext}`
    link.click()
  }, [currentId, selectedPanelIdx, panels, exportFormat])

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

  if (!resultsModalOpen) return null

  const selectedPanel = selectedPanelIdx !== null ? panels[selectedPanelIdx] : null

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
      ? `${pendingPages.length} pages — source`
      : isIdle && panels.length > 0
        ? `${panels.length} panels across ${strips.length} ${strips.length === 1 ? 'page' : 'pages'}`
        : ''

  // --- Grid items ---
  const gridItems = isUploaded
    ? pendingPages.map((p, i) => ({
        key: p.stripId,
        src: sourceImageUrl(p.stripId),
        label: `${i + 1}`,
        active: i === viewerPageIndex,
        onClick: () => {
          while (useManhwaStore.getState().viewerPageIndex < i) nextPage()
          while (useManhwaStore.getState().viewerPageIndex > i) prevPage()
        },
      }))
    : isIdle && panels.length > 0
      ? panels.map((p, i) => ({
          key: p.id,
          src: panelImageUrl(p.sourceId, p.id),
          label: `${p.order}`,
          badge: `${Math.round(p.confidence * 100)}%`,
          active: i === selectedPanelIdx,
          onClick: () => {
            setSelectedPanelIdx(i)
            setAdjustBounds(null)
          },
        }))
      : []

  // --- Preview image ---
  let previewSrc = ''
  let previewAlt = ''
  if (isUploaded && pendingPages[viewerPageIndex]) {
    previewSrc = sourceImageUrl(pendingPages[viewerPageIndex].stripId)
    previewAlt = `Page ${viewerPageIndex + 1}`
  } else if (selectedPanel) {
    previewSrc = panelImageUrl(selectedPanel.sourceId, selectedPanel.id)
    previewAlt = `Panel ${selectedPanel.order}`
  } else if (isIdle && panels.length > 0 && panels[0]) {
    previewSrc = panelImageUrl(panels[0].sourceId, panels[0].id)
    previewAlt = `Panel ${panels[0].order}`
  }

  // --- Preview navigation ---
  const previewTotal = isUploaded ? pendingPages.length : panels.length
  const previewIndex = isUploaded ? viewerPageIndex : (selectedPanelIdx ?? 0)

  const previewPrev = () => {
    if (isUploaded) prevPage()
    else setSelectedPanelIdx((p) => (p === null ? 0 : Math.max(p - 1, 0)))
  }
  const previewNext = () => {
    if (isUploaded) nextPage()
    else setSelectedPanelIdx((p) => (p === null ? 0 : Math.min(p + 1, panels.length - 1)))
  }

  // --- Editor controls visibility ---
  const showEditor = isIdle && selectedPanel !== null
  const canExport = isIdle && panels.length > 0

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

          {/* Pages / Panels grid + preview */}
          {!isDetecting && (
            <>
              {/* Left sidebar — thumbnails */}
              <div className="manhwa-results-grid">
                {gridItems.map((item) => (
                  <div
                    key={item.key}
                    className={`manhwa-results-thumb${item.active ? ' active' : ''}`}
                    onClick={item.onClick}
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      loading="lazy"
                    />
                    <span className="manhwa-results-thumb-label">
                      {item.label}
                      {'badge' in item && item.badge && (
                        <span className="manhwa-results-confidence">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {gridItems.length === 0 && isIdle && (
                  <div className="manhwa-results-empty">
                    No panels detected
                  </div>
                )}
              </div>

              {/* Main preview + editor */}
              <div className="manhwa-results-main">
                {/* Preview navigation */}
                <div className="manhwa-results-preview-nav">
                  <button type="button" onClick={previewPrev} disabled={previewIndex === 0}>
                    ◀ Prev
                  </button>
                  <span className="manhwa-results-preview-page">
                    {previewIndex + 1} / {previewTotal || 1}
                  </span>
                  <button type="button" onClick={previewNext} disabled={previewIndex >= previewTotal - 1}>
                    Next ▶
                  </button>
                </div>

                {/* Preview image */}
                <div className="manhwa-results-preview-image">
                  {previewSrc ? (
                    <img src={previewSrc} alt={previewAlt} />
                  ) : (
                    <div className="manhwa-results-preview-empty">
                      Select a panel to preview
                    </div>
                  )}
                </div>

                {/* Editor controls — shown when a panel is selected */}
                {showEditor && selectedPanel && (
                  <div className="manhwa-results-editor">
                    <div className="manhwa-results-editor-header">
                      <span className="manhwa-results-editor-title">
                        Panel #{selectedPanel.order} ·{' '}
                        {Math.round(selectedPanel.confidence * 100)}% confidence
                      </span>
                    </div>

                    <div className="manhwa-results-editor-actions">
                      <button
                        type="button"
                        className="manhwa-results-action-btn"
                        onClick={() => void handleApply({ type: 'split', panelId: selectedPanel.id })}
                      >
                        Split
                      </button>
                      <button
                        type="button"
                        className="manhwa-results-action-btn"
                        onClick={() => void handleApply({ type: 'merge_down', panelId: selectedPanel.id })}
                        disabled={selectedPanelIdx === panels.length - 1}
                      >
                        Merge ↓
                      </button>
                      <button
                        type="button"
                        className="manhwa-results-action-btn"
                        onClick={() =>
                          setAdjustBounds(
                            adjustBounds
                              ? null
                              : {
                                  idx: selectedPanelIdx!,
                                  x: selectedPanel.bounds.x,
                                  y: selectedPanel.bounds.y,
                                  w: selectedPanel.bounds.width,
                                  h: selectedPanel.bounds.height,
                                },
                          )
                        }
                      >
                        {adjustBounds ? 'Cancel' : 'Adjust'}
                      </button>
                      <button
                        type="button"
                        className="manhwa-results-action-btn manhwa-results-action-danger"
                        onClick={() => void handleApply({ type: 'delete', panelId: selectedPanel.id })}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="manhwa-results-action-btn"
                        onClick={() => void handleApply({ type: 'reorder', panelId: selectedPanel.id, newOrder: selectedPanel.order - 1 })}
                        disabled={selectedPanelIdx === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="manhwa-results-action-btn"
                        onClick={() => void handleApply({ type: 'reorder', panelId: selectedPanel.id, newOrder: selectedPanel.order + 1 })}
                        disabled={selectedPanelIdx === panels.length - 1}
                      >
                        ↓
                      </button>
                    </div>

                    {/* Adjust bounds form */}
                    {adjustBounds && adjustBounds.idx === selectedPanelIdx && (
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
                            void handleApply({
                              type: 'adjust_bounds',
                              panelId: selectedPanel.id,
                              bounds: {
                                x: adjustBounds.x,
                                y: adjustBounds.y,
                                width: adjustBounds.w,
                                height: adjustBounds.h,
                              },
                            })
                          }
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Toolbar — visible when idle with panels */}
                {isIdle && panels.length > 0 && (
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
                        onClick={() => void handleExport()}
                        disabled={selectedPanelIdx === null}
                      >
                        Export Selected
                      </button>
                      <button
                        type="button"
                        className="manhwa-results-action-btn"
                        onClick={() => void handleExportAll()}
                      >
                        Export All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
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
