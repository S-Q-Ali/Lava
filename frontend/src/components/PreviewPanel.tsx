import { memo, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { clipsAtTime } from '../editor/ops'
import { getAssetFile } from '../media/importer'
import { getFFmpegProvider, type RenderClipInput } from '../services/ffmpeg'
import { resolveProxyUrl } from '../services/proxy'
import { useProxyStore } from '../store/proxyStore'
import { captionsRenderPayload } from './CaptionPanel'
import { usePresetStore } from '../store/presetStore'
import { resolveCaptionStyle } from '../editor/templateEditor'
import type { Asset } from '../editor/types'

function formatTime(t: number): string {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  const ms = Math.floor((t % 1) * 1000)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms
    .toString()
    .padStart(3, '0')}`
}

const MediaElement = memo(function MediaElement({
  src,
  asset,
}: {
  src: string
  asset: Asset
}) {
  if (asset.kind === 'image') {
    return <img src={src} alt={asset.name} loading="lazy" decoding="async" />
  }
  return <video src={src} controls preload="metadata" />
})

export default function PreviewPanel() {
  const assets = useEditorStore((s) => s.assets)
  const clips = useEditorStore((s) => s.clips)
  const playhead = useEditorStore((s) => s.playhead)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const setPlayhead = useEditorStore((s) => s.setPlayhead)
  const playingRef = useRef(false)
  const [rendering, setRendering] = useState(false)
  const [renderUrl, setRenderUrl] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  const activeClip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) ?? clipsAtTime(clips, playhead)[0],
    [clips, selectedClipId, playhead],
  )
  const activeAsset = useMemo(
    () => (activeClip ? assets.find((a) => a.id === activeClip.assetId) : undefined),
    [assets, activeClip],
  )

  // Proxy-aware preview: use the low-res proxy when available (lazy resolve),
  // otherwise fall back to the original blob URL. Render always uses originals.
  // The subscription re-renders this panel when a lazy proxy lands in the cache.
  useProxyStore((s) => s.version)
  const previewSrc = activeAsset ? resolveProxyUrl(activeAsset) : null

  // Caption live preview
  const allCaptions = useEditorStore((s) => s.captions)
  const presets = usePresetStore((s) => s.presets)
  const currentCaption = useMemo(
    () => allCaptions.find((c) => playhead >= c.start && playhead < c.start + c.duration),
    [allCaptions, playhead],
  )
  const captionStyle = useMemo(
    () => (currentCaption ? resolveCaptionStyle(currentCaption.styleId, presets) : null),
    [currentCaption, presets],
  )
  const captionText = useMemo(
    () =>
      currentCaption
        ? captionStyle?.uppercase
          ? currentCaption.text.toUpperCase()
          : currentCaption.text
        : null,
    [currentCaption, captionStyle],
  )

  const togglePlay = () => {
    playingRef.current = !playingRef.current
    if (!playingRef.current) return
    const step = () => {
      if (!playingRef.current) return
      const next = useEditorStore.getState().playhead + 0.1
      const end = useEditorStore.getState().clips.reduce(
        (m, c) => Math.max(m, c.start + c.duration),
        0,
      )
      setPlayhead(next >= end ? 0 : next)
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  const handleRender = async () => {
    setRenderError(null)
    setRenderUrl(null)

    const provider = await getFFmpegProvider()
    if (!provider.available) {
      setRenderError(provider.reason ?? 'Sidecar unavailable')
      return
    }

    const ordered = [...clips].sort((a, b) => a.start - b.start).slice(0, 12)
    const renderClips: RenderClipInput[] = []
    const files: File[] = []
    for (const clip of ordered) {
      const asset = assets.find((a) => a.id === clip.assetId)
      if (!asset || (asset.kind !== 'image' && asset.kind !== 'video')) continue
      const file = getAssetFile(asset.id)
      if (!file) {
        setRenderError(`No source file available for "${asset.name}".`)
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
      setRenderError('Nothing to render — add image or video clips first.')
      return
    }

    const first = assets.find((a) => a.id === ordered[0]?.assetId)
    const width = first?.meta.width ?? 1280
    const height = first?.meta.height ?? 720

    setRendering(true)
    try {
      const captions = captionsRenderPayload(useEditorStore.getState().captions)
      const result = await provider.render({
        files,
        clips: renderClips,
        settings: { width: Math.min(width, 1920), height: Math.min(height, 1080), fps: 30 },
        captions,
      })
      setRenderUrl(provider.fileUrl(result.jobId))
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Render failed')
    } finally {
      setRendering(false)
    }
  }

  return (
    <section className="panel preview-panel" aria-label="Preview">
      <div className="preview-stage">
        {renderUrl ? (
          <video src={renderUrl} controls />
        ) : activeAsset?.kind === 'audio' ? (
          <div className="audio-placeholder">{activeAsset.name}</div>
        ) : activeAsset && previewSrc ? (
          <MediaElement src={previewSrc} asset={activeAsset} />
        ) : (
          <p className="empty">No media at playhead. Import assets to start.</p>
        )}
        {captionText && captionStyle && (
          <div
            className="caption-overlay"
            style={{
              color: captionStyle.primaryColor,
              fontSize: `${captionStyle.fontSize}px`,
              fontFamily: captionStyle.fontFamily,
              textShadow: captionStyle.outlineWidth > 0
                ? `0 0 ${captionStyle.outlineWidth}px ${captionStyle.outlineColor}`
                : 'none',
              fontWeight: captionStyle.bold ? 'bold' : 'normal',
              textAlign: captionStyle.alignment === 'top' ? 'left' : captionStyle.alignment === 'bottom' ? 'right' : 'center',
            }}
          >
            {captionText}
          </div>
        )}
      </div>
      {renderError && <p className="render-error">{renderError}</p>}
      <div className="preview-transport">
        <button type="button" onClick={togglePlay}>
          Play
        </button>
        <button type="button" onClick={() => setPlayhead(0)}>
          Rewind
        </button>
        <span className="timecode">{formatTime(playhead)}</span>
        <button type="button" onClick={handleRender} disabled={rendering}>
          {rendering ? 'Rendering…' : 'Render'}
        </button>
      </div>
    </section>
  )
}