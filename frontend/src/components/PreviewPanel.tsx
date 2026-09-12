import { useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { clipsAtTime } from '../editor/ops'
import { getAssetFile } from '../media/importer'
import { getFFmpegProvider, type RenderClipInput } from '../services/ffmpeg'
import { captionsRenderPayload } from './CaptionPanel'

function formatTime(t: number): string {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  const ms = Math.floor((t % 1) * 1000)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms
    .toString()
    .padStart(3, '0')}`
}

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

  const activeClip =
    clips.find((c) => c.id === selectedClipId) ?? clipsAtTime(clips, playhead)[0]
  const activeAsset = activeClip
    ? assets.find((a) => a.id === activeClip.assetId)
    : undefined

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
    <section className="panel preview-panel">
      <div className="preview-stage">
        {renderUrl ? (
          <video src={renderUrl} controls />
        ) : activeAsset?.kind === 'image' ? (
          <img src={activeAsset.url} alt={activeAsset.name} />
        ) : activeAsset?.kind === 'video' ? (
          <video src={activeAsset.url} controls />
        ) : activeAsset?.kind === 'audio' ? (
          <div className="audio-placeholder">{activeAsset.name}</div>
        ) : (
          <p className="empty">No media at playhead. Import assets to start.</p>
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