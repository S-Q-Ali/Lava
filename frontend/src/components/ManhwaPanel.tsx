import { useEffect, useRef, useState, useCallback } from 'react'
import { useManhwaStore } from '../store/manhwaStore'
import { panelImageUrl, exportUrl, sourceImageUrl, type CorrectionOp } from '../services/manhwa'

export function ManhwaPanel() {
  const status = useManhwaStore((s) => s.status)
  const strips = useManhwaStore((s) => s.strips)
  const currentId = useManhwaStore((s) => s.currentId)
  const detail = useManhwaStore((s) => s.detail)
  const refresh = useManhwaStore((s) => s.refresh)
  const select = useManhwaStore((s) => s.select)
  const upload = useManhwaStore((s) => s.upload)
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
      void upload(file)
    },
    [upload],
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

  const isBusy = status.phase === 'uploading' || status.phase === 'loading'

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
          accept="image/*"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={isBusy}>
          {status.phase === 'uploading' ? 'Uploading…' : 'Drop or pick a long strip'}
        </button>
        <p className="manhwa-drop-hint">PNG, JPG, or WebP. Tall vertical image.</p>
      </div>

      {strips.length > 0 && (
        <div className="manhwa-strip-list">
          <h4>Strips</h4>
          {strips.map((strip) => (
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
}

function ManhwaPanelRow({ panel, nextPanelId, isBusy, onApply }: ManhwaPanelRowProps) {
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustX, setAdjustX] = useState(panel.x)
  const [adjustY, setAdjustY] = useState(panel.y)
  const [adjustW, setAdjustW] = useState(panel.w)
  const [adjustH, setAdjustH] = useState(panel.h)

  const confidencePct = Math.round(panel.confidence * 100)
  const isLowConfidence = panel.confidence < 0.5

  return (
    <div className={`manhwa-panel-row${panel.userCorrected ? ' user-corrected' : ''}`}>
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