import { useMemo, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { getAssetFile } from '../media/importer'
import { getFFmpegProvider, type RenderClipInput } from '../services/ffmpeg'
import { projectDuration } from '../editor/ops'
import { captionsRenderPayload } from '../lib/captions'
import './ExportPanel.css'

type FpsOption = 24 | 25 | 30 | 60

interface PlatformPreset {
  id: string
  label: string
  width: number
  height: number
  fps: FpsOption
}

const PLATFORM_PRESETS: PlatformPreset[] = [
  { id: 'youtube-1080', label: 'YouTube (1080p 16:9)', width: 1920, height: 1080, fps: 30 },
  { id: 'youtube-4k', label: 'YouTube (4K 16:9)', width: 3840, height: 2160, fps: 30 },
  { id: 'tiktok-1080', label: 'TikTok (1080×1920 9:16)', width: 1080, height: 1920, fps: 30 },
  { id: 'instagram-reels', label: 'Instagram Reels (1080×1920 9:16)', width: 1080, height: 1920, fps: 30 },
  { id: 'instagram-post', label: 'Instagram Post (1080×1080 1:1)', width: 1080, height: 1080, fps: 30 },
  { id: 'twitter-landscape', label: 'X/Twitter (1280×720 16:9)', width: 1280, height: 720, fps: 30 },
  { id: 'custom', label: 'Custom', width: 1920, height: 1080, fps: 30 },
]

const FPS_OPTIONS: FpsOption[] = [24, 25, 30, 60]

export default function ExportPanel() {
  const assets = useEditorStore((s) => s.assets)
  const clips = useEditorStore((s) => s.clips)
  const captions = useEditorStore((s) => s.captions)
  const [presetId, setPresetId] = useState('youtube-1080')
  const [customWidth, setCustomWidth] = useState(1920)
  const [customHeight, setCustomHeight] = useState(1080)
  const [fps, setFps] = useState<FpsOption>(30)
  const [rendering, setRendering] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [renderUrl, setRenderUrl] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [resultMeta, setResultMeta] = useState<{
    duration: number
    width: number
    height: number
    fps: number
    sizeBytes: number | null
  } | null>(null)

  const sorted = useMemo(() => [...clips].sort((a, b) => a.start - b.start), [clips])
  const videoClips = useMemo(
    () => sorted.filter((c) => {
      const asset = assets.find((a) => a.id === c.assetId)
      return asset && (asset.kind === 'image' || asset.kind === 'video')
    }),
    [sorted, assets],
  )
  const duration = projectDuration(clips)
  const totalSize = useMemo(() => {
    let bytes = 0
    for (const clip of videoClips) {
      const asset = assets.find((a) => a.id === clip.assetId)
      if (asset?.meta.size) bytes += asset.meta.size
    }
    return bytes
  }, [videoClips, assets])

  const activePreset = PLATFORM_PRESETS.find((p) => p.id === presetId) ?? PLATFORM_PRESETS[0]
  const isCustom = presetId === 'custom'
  const outputWidth = isCustom ? customWidth : activePreset.width
  const outputHeight = isCustom ? customHeight : activePreset.height
  const outputFps = isCustom ? fps : activePreset.fps

  const handlePresetChange = (id: string) => {
    setPresetId(id)
    const p = PLATFORM_PRESETS.find((pr) => pr.id === id)
    if (p && p.id !== 'custom') setFps(p.fps)
  }

  const handleRender = async () => {
    setRenderError(null)
    setRenderUrl(null)
    setResultMeta(null)

    const provider = await getFFmpegProvider()
    if (!provider.available) {
      setRenderError(provider.reason ?? 'Sidecar unavailable')
      return
    }

    const renderClips: RenderClipInput[] = []
    const files: File[] = []
    for (const clip of videoClips) {
      const asset = assets.find((a) => a.id === clip.assetId)
      if (!asset) continue
      const file = getAssetFile(asset.id)
      if (!file) {
        setRenderError(`No source file for "${asset.name}". Re-import to export.`)
        return
      }
      files.push(file)
      renderClips.push({
        fileName: file.name,
        start: Math.max(0, Math.floor(clip.start)),
        duration: clip.duration,
      })
    }

    if (renderClips.length === 0) {
      setRenderError('Nothing to render — add image or video clips to the timeline first.')
      return
    }

    setRendering(true)
    setProgress(`Rendering ${renderClips.length} clip${renderClips.length > 1 ? 's' : ''} at ${outputWidth}×${outputHeight} ${outputFps}fps…`)

    try {
      const captionsPayload = captionsRenderPayload(captions)
      const result = await provider.render({
        files,
        clips: renderClips,
        settings: { width: outputWidth, height: outputHeight, fps: outputFps },
        captions: captionsPayload.length > 0 ? captionsPayload : undefined,
      })
      const url = provider.fileUrl(result.jobId)
      setRenderUrl(url)
      setResultMeta({
        duration: result.duration,
        width: result.width,
        height: result.height,
        fps: result.fps,
        sizeBytes: result.sizeBytes,
      })
      setProgress(null)
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Render failed')
      setProgress(null)
    } finally {
      setRendering(false)
    }
  }

  const handleDownload = () => {
    if (!renderUrl) return
    const a = document.createElement('a')
    a.href = renderUrl
    a.download = `lava-export-${Date.now()}.mp4`
    a.click()
  }

  return (
    <section className="export-panel" aria-label="Export">
      <h3>Export</h3>

      <div className="export-summary">
        <div className="export-summary-row">
          <span className="export-label">Clips</span>
          <span className="export-value">{videoClips.length}</span>
        </div>
        <div className="export-summary-row">
          <span className="export-label">Duration</span>
          <span className="export-value">{duration.toFixed(1)}s</span>
        </div>
        {totalSize > 0 && (
          <div className="export-summary-row">
            <span className="export-label">Source size</span>
            <span className="export-value">{(totalSize / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        )}
      </div>

      <div className="export-settings">
        <label className="export-field">
          <span className="export-field-label">Platform preset</span>
          <select
            value={presetId}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            {PLATFORM_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>

        {isCustom && (
          <>
            <label className="export-field">
              <span className="export-field-label">Width</span>
              <input
                type="number"
                value={customWidth}
                min={128}
                max={3840}
                step={2}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
              />
            </label>
            <label className="export-field">
              <span className="export-field-label">Height</span>
              <input
                type="number"
                value={customHeight}
                min={128}
                max={2160}
                step={2}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
              />
            </label>
            <label className="export-field">
              <span className="export-field-label">Frame rate</span>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value) as FpsOption)}
              >
                {FPS_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f} fps</option>
                ))}
              </select>
            </label>
          </>
        )}

        {!isCustom && (
          <div className="export-summary">
            <div className="export-summary-row">
              <span className="export-label">Output</span>
              <span className="export-value">{outputWidth}×{outputHeight} @ {outputFps}fps</span>
            </div>
          </div>
        )}
      </div>

      {videoClips.length === 0 && (
        <p className="export-empty">
          Import media and add clips to the timeline before exporting.
        </p>
      )}

      {renderError && <p className="export-error">{renderError}</p>}
      {progress && <p className="export-progress">{progress}</p>}

      {resultMeta && (
        <div className="export-result">
          <p className="export-success">Render complete!</p>
          <div className="export-summary">
            <div className="export-summary-row">
              <span className="export-label">Output</span>
              <span className="export-value">{resultMeta.width}×{resultMeta.height} @ {resultMeta.fps}fps</span>
            </div>
            <div className="export-summary-row">
              <span className="export-label">Duration</span>
              <span className="export-value">{resultMeta.duration.toFixed(1)}s</span>
            </div>
            {resultMeta.sizeBytes != null && (
              <div className="export-summary-row">
                <span className="export-label">File size</span>
                <span className="export-value">{(resultMeta.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="export-actions">
        {renderUrl ? (
          <>
            <button type="button" className="export-btn export-btn-primary" onClick={handleDownload}>
              Download MP4
            </button>
            <button type="button" className="export-btn" onClick={handleRender}>
              Re-render
            </button>
          </>
        ) : (
          <button
            type="button"
            className="export-btn export-btn-primary"
            onClick={handleRender}
            disabled={rendering || videoClips.length === 0}
          >
            {rendering ? 'Rendering…' : 'Export'}
          </button>
        )}
      </div>
    </section>
  )
}
