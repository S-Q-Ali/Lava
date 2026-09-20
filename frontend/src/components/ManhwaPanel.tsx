import { useEffect, useRef, useState, useCallback } from 'react'
import { useManhwaStore } from '../store/manhwaStore'
import { panelImageUrl, exportUrl, sourceImageUrl, type CorrectionOp } from '../services/manhwa'

export function ManhwaPanel() {
  const status = useManhwaStore((s) => s.status)
  const strips = useManhwaStore((s) => s.strips)
  const currentId = useManhwaStore((s) => s.currentId)
  const detail = useManhwaStore((s) => s.detail)
  const viewerPageIndex = useManhwaStore((s) => s.viewerPageIndex)
  const refresh = useManhwaStore((s) => s.refresh)
  const select = useManhwaStore((s) => s.select)
  const uploadOnly = useManhwaStore((s) => s.uploadOnly)
  const nextPage = useManhwaStore((s) => s.nextPage)
  const prevPage = useManhwaStore((s) => s.prevPage)
  const startDetection = useManhwaStore((s) => s.startDetection)
  const apply = useManhwaStore((s) => s.apply)
  const redetect = useManhwaStore((s) => s.redetect)
  const remove = useManhwaStore((s) => s.remove)

  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png')
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      void uploadOnly(file)
    },
    [uploadOnly],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleExport = useCallback(() => {
    if (!currentId) return
    setExportSuccess(null)
    const url = exportUrl(currentId, exportFormat)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentId}-panels.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setExportSuccess(`Exported ${detail?.panels.length ?? 0} panels as ${exportFormat.toUpperCase()}.`)
  }, [currentId, exportFormat, detail])

  const isBusy = status.phase === 'uploading' || status.phase === 'loading' || status.phase === 'detecting'

  return (
    <section className="panel manhwa-panel" aria-label="Manhwa">
      <h3>Manhwa</h3>

      {status.phase === 'error' && <p className="manhwa-error">{status.error}</p>}

      <div
        className={`manhwa-dropzone${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={isBusy}>
          {status.phase === 'uploading' ? 'Uploading…' : status.phase === 'detecting' ? 'Detecting…' : 'Drop or pick a strip / PDF'}
        </button>
        <p className="manhwa-drop-hint">PNG, JPG, WebP, or PDF. Tall vertical strip or chapter PDF.</p>
      </div>

      {status.phase === 'uploading' && (
        <div className="manhwa-progress">
          <div className="manhwa-progress-bar" role="progressbar" aria-valuenow={status.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="manhwa-progress-fill" style={{ width: `${status.progress}%` }} />
          </div>
          <span className="manhwa-progress-text">Uploading… {status.progress}%</span>
        </div>
      )}

      {status.phase === 'uploaded' && (
        <div className="manhwa-viewer">
          <div className="manhwa-viewer-header">
            <span className="manhwa-viewer-filename" title={status.fileName}>{status.fileName}</span>
            <span className="manhwa-viewer-count">{status.pages.length} pages</span>
          </div>
          <div className="manhwa-viewer-nav">
            <button type="button" onClick={() => void prevPage()} disabled={viewerPageIndex === 0}>
              ◀ Prev
            </button>
            <span className="manhwa-viewer-page">{viewerPageIndex + 1} / {status.pages.length}</span>
            <button type="button" onClick={() => void nextPage()} disabled={viewerPageIndex === status.pages.length - 1}>
              Next ▶
            </button>
          </div>
          <div className="manhwa-viewer-image">
            <img
              src={sourceImageUrl(status.pages[viewerPageIndex].stripId)}
              alt={`Page ${viewerPageIndex + 1}`}
            />
          </div>
          <button type="button" className="manhwa-detect-btn" onClick={() => void startDetection()}>
            Start Extraction
          </button>
        </div>
      )}

      {status.phase === 'detecting' && (
        <div className="manhwa-detecting">
          <span className="manhwa-spinner" />
          <span>Detecting panels…</span>
        </div>
      )}

      {status.phase === 'idle' && strips.length > 1 && (
        <div className="manhwa-viewer">
          <div className="manhwa-viewer-header">
            <span className="manhwa-viewer-filename" title={strips[viewerPageIndex]?.sourceFile}>
              {strips[viewerPageIndex]?.sourceFile}
            </span>
            <span className="manhwa-viewer-count">{strips.length} pages</span>
          </div>
          <div className="manhwa-viewer-nav">
            <button type="button" onClick={() => void prevPage()} disabled={viewerPageIndex === 0}>
              ◀ Prev
            </button>
            <span className="manhwa-viewer-page">{viewerPageIndex + 1} / {strips.length}</span>
            <button type="button" onClick={() => void nextPage()} disabled={viewerPageIndex === strips.length - 1}>
              Next ▶
            </button>
          </div>
          <div className="manhwa-viewer-image">
            <img
              src={sourceImageUrl(strips[viewerPageIndex].sourceId)}
              alt={`Page ${viewerPageIndex + 1}`}
            />
          </div>
          <div className="manhwa-viewer-meta">
            <span>{strips[viewerPageIndex]?.panelCount} panels detected</span>
          </div>
        </div>
      )}

      {status.phase === 'idle' && strips.length === 1 && !currentId && (
        <div className="manhwa-strip-list">
          <h4>Strips</h4>
          {strips.map((strip, index) => (
            <div
              key={strip.sourceId}
              className={`manhwa-strip-row${strip.sourceId === currentId ? ' selected' : ''}`}
              onClick={() => void select(strip.sourceId)}
            >
              <div className="manhwa-strip-info">
                <span className="manhwa-strip-name" title={strip.sourceFile}>
                  {strip.sourceFile}
                </span>
                <span className="manhwa-strip-meta">
                  {strip.panelCount} panels
                  {strip.correctedCount > 0 && ` · ${strip.correctedCount} corrected`}
                </span>
              </div>
              <button
                type="button"
                className="manhwa-strip-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  void remove(strip.sourceId)
                }}
                aria-label={`Remove ${strip.sourceFile}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {currentId && detail && (
        <div className="manhwa-detail">
          <div className="manhwa-detail-head">
            <h4>Panels</h4>
            <div className="manhwa-detail-actions">
              <button type="button" onClick={() => void redetect()} disabled={isBusy} title="Re-run panel detection">
                Re-detect
              </button>
              <button type="button" onClick={() => void apply({ op: 'reset' })} disabled={isBusy} title="Clear all panels">
                Reset
              </button>
            </div>
          </div>

          <div className="manhwa-source-preview">
            <img src={sourceImageUrl(currentId)} alt="Source strip" />
          </div>

          <div className="manhwa-panel-rows">
            {detail.panels.map((panel, index) => (
              <ManhwaPanelRow
                key={panel.id}
                panel={panel}
                nextPanelId={index < detail.panels.length - 1 ? detail.panels[index + 1].id : undefined}
                isBusy={isBusy}
                onApply={apply}
                dragIndex={index}
                totalCount={detail.panels.length}
                onReorder={(fromIndex, toIndex) => {
                  const ids = detail.panels.map((p) => p.id)
                  const [moved] = ids.splice(fromIndex, 1)
                  ids.splice(toIndex, 0, moved)
                  void apply({ op: 'reorder', ids })
                }}
              />
            ))}
          </div>

          <div className="manhwa-export">
            <label>
              Format
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpg')}
                aria-label="Export format"
              >
                <option value="png">PNG (lossless)</option>
                <option value="jpg">JPG</option>
              </select>
            </label>
            <button type="button" onClick={handleExport} disabled={isBusy}>
              Export
            </button>
          </div>
          {exportSuccess && <p className="manhwa-export-success">{exportSuccess}</p>}
        </div>
      )}

      {strips.length === 0 && status.phase !== 'error' && status.phase !== 'loading' && (
        <p className="manhwa-empty">No strips yet. Drop a long vertical image to begin.</p>
      )}
    </section>
  )
}

interface ManhwaPanelRowProps {
  panel: { id: string; sourceId: string; x: number; y: number; w: number; h: number; confidence: number; order: number; userCorrected: boolean }
  nextPanelId: string | undefined
  isBusy: boolean
  onApply: (op: CorrectionOp) => Promise<void>
  dragIndex: number
  totalCount: number
  onReorder: (fromIndex: number, toIndex: number) => void
}

function ManhwaPanelRow({ panel, nextPanelId, isBusy, onApply, dragIndex, onReorder }: ManhwaPanelRowProps) {
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustX, setAdjustX] = useState(panel.x)
  const [adjustY, setAdjustY] = useState(panel.y)
  const [adjustW, setAdjustW] = useState(panel.w)
  const [adjustH, setAdjustH] = useState(panel.h)
  const [dropTarget, setDropTarget] = useState(false)

  const confidencePct = Math.round(panel.confidence * 100)
  const isLowConfidence = panel.confidence < 0.5

  return (
    <div
      className={`manhwa-panel-row${panel.userCorrected ? ' user-corrected' : ''}${dropTarget ? ' drop-target' : ''}`}
      draggable={!isBusy}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/manhwa-panel-index', String(dragIndex))
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDropTarget(true)
      }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDropTarget(false)
        const from = Number(e.dataTransfer.getData('text/manhwa-panel-index'))
        if (!Number.isNaN(from) && from !== dragIndex) {
          onReorder(from, dragIndex)
        }
      }}
    >
      <div className="manhwa-panel-thumb">
        <img src={panelImageUrl(panel.sourceId, panel.id)} alt={`Panel ${panel.order}`} />
      </div>
      <div className="manhwa-panel-info">
        <div className="manhwa-panel-head">
          <span className="manhwa-panel-number">{panel.order}</span>
          <span className={`manhwa-panel-confidence${isLowConfidence ? ' low' : ''}`}>{confidencePct}%</span>
          {panel.userCorrected && <span className="manhwa-panel-badge">corrected</span>}
        </div>
        <div className="manhwa-panel-actions">
          <button
            type="button"
            onClick={() => void onApply({ op: 'split', panelId: panel.id, y: Math.round(panel.y + panel.h / 2) })}
            disabled={isBusy}
            title="Split this panel horizontally"
          >
            Split
          </button>
          {nextPanelId && (
            <button
              type="button"
              onClick={() => void onApply({ op: 'merge', ids: [panel.id, nextPanelId] })}
              disabled={isBusy}
              title="Merge with next panel"
            >
              Merge ↓
            </button>
          )}
          <button type="button" onClick={() => setShowAdjust(!showAdjust)} disabled={isBusy} title="Adjust bounds">
            Adjust
          </button>
          <button
            type="button"
            onClick={() => void onApply({ op: 'delete', panelId: panel.id })}
            disabled={isBusy}
            title="Delete this panel"
          >
            Delete
          </button>
        </div>
        {showAdjust && (
          <div className="manhwa-adjust-inputs">
            <label>
              X
              <input type="number" value={adjustX} onChange={(e) => setAdjustX(Number(e.target.value))} />
            </label>
            <label>
              Y
              <input type="number" value={adjustY} onChange={(e) => setAdjustY(Number(e.target.value))} />
            </label>
            <label>
              W
              <input type="number" value={adjustW} onChange={(e) => setAdjustW(Number(e.target.value))} />
            </label>
            <label>
              H
              <input type="number" value={adjustH} onChange={(e) => setAdjustH(Number(e.target.value))} />
            </label>
            <button
              type="button"
              onClick={() => {
                void onApply({ op: 'adjust', panelId: panel.id, x: adjustX, y: adjustY, w: adjustW, h: adjustH })
                setShowAdjust(false)
              }}
              disabled={isBusy}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManhwaPanel