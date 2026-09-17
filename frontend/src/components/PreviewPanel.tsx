import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { clipsAtTime, projectDuration } from '../editor/ops'
import { getAssetFile } from '../media/importer'
import { getFFmpegProvider, type RenderClipInput } from '../services/ffmpeg'
import { resolveProxyUrl } from '../services/proxy'
import { useProxyStore } from '../store/proxyStore'
import { captionsRenderPayload } from '../lib/captions'
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

type DisplayMode = 'fit' | 'fill' | '50' | '100'

const DISPLAY_MODES: { id: DisplayMode; label: string }[] = [
  { id: 'fit', label: 'Fit' },
  { id: 'fill', label: 'Fill' },
  { id: '50', label: '50%' },
  { id: '100', label: '100%' },
]

const MediaElement = memo(function MediaElement({
  src,
  asset,
  videoRef,
  audioRef,
  displayMode,
}: {
  src: string
  asset: Asset
  videoRef: React.RefObject<HTMLVideoElement | null>
  audioRef: React.RefObject<HTMLAudioElement | null>
  displayMode: DisplayMode
}) {
  const objectFit = displayMode === 'fill' ? 'cover' : 'contain'
  const scale = displayMode === '50' ? 0.5 : displayMode === '100' ? 1 : undefined

  const style: React.CSSProperties = scale !== undefined
    ? { transform: `scale(${scale})`, transformOrigin: 'center', objectFit }
    : { objectFit }

  if (asset.kind === 'image') {
    return <img src={src} alt={asset.name} loading="lazy" decoding="async" style={style} />
  }
  if (asset.kind === 'audio') {
    return <audio ref={audioRef} src={src} preload="metadata" />
  }
  return <video ref={videoRef} src={src} preload="metadata" style={style} />
})

export default function PreviewPanel() {
  const assets = useEditorStore((s) => s.assets)
  const clips = useEditorStore((s) => s.clips)
  const playhead = useEditorStore((s) => s.playhead)
  const playing = useEditorStore((s) => s.playing)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const setPlayhead = useEditorStore((s) => s.setPlayhead)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [rendering, setRendering] = useState(false)
  const [renderUrl, setRenderUrl] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('fit')
  const [duration, setDuration] = useState(0)

  const activeClip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) ?? clipsAtTime(clips, playhead)[0],
    [clips, selectedClipId, playhead],
  )
  const activeAsset = useMemo(
    () => {
      const playheadClip = clipsAtTime(clips, playhead)[0]
      const clip = playheadClip ?? (selectedClipId ? clips.find((c) => c.id === selectedClipId) : undefined)
      return clip ? assets.find((a) => a.id === clip.assetId) : undefined
    },
    [assets, clips, playhead, selectedClipId],
  )

  useProxyStore((s) => s.version)
  const previewSrc = activeAsset ? resolveProxyUrl(activeAsset) : null

  const totalDuration = useMemo(() => projectDuration(clips), [clips])

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

  // Sync play state with the video element
  useEffect(() => {
    const v = videoRef.current ?? audioRef.current
    if (!v) return
    if (playing) {
      v.play().catch(() => {
        useEditorStore.setState({ playing: false })
      })
    } else {
      v.pause()
    }
  }, [playing])

  // Sync video currentTime with playhead on seek
  useEffect(() => {
    const v = videoRef.current ?? audioRef.current
    if (!v || playing) return
    const clipStart = activeClip?.start ?? 0
    const localTime = Math.max(0, playhead - clipStart)
    if (Math.abs(v.currentTime - localTime) > 0.05) {
      v.currentTime = localTime
    }
  }, [activeClip?.start, playhead, playing])

  useEffect(() => {
    const media = videoRef.current ?? audioRef.current
    if (!media || !activeClip) return
    media.currentTime = Math.max(0, playhead - activeClip.start)
  }, [activeAsset?.id, activeClip, playhead])

  // Sync playhead from video timeupdate when playing
  useEffect(() => {
    const v = videoRef.current ?? audioRef.current
    if (!v) return
    const onTimeUpdate = () => {
      if (!useEditorStore.getState().playing) return
      const clipEnd = activeClip ? activeClip.start + activeClip.duration : totalDuration
      if (activeClip && v.currentTime >= activeClip.duration) {
        v.pause()
        useEditorStore.setState({ playing: false, playhead: clipEnd })
        v.currentTime = 0
        return
      }
      setPlayhead((activeClip?.start ?? 0) + v.currentTime)
    }
    const onLoadedMetadata = () => setDuration(v.duration)
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [activeClip, setPlayhead, totalDuration])

  useEffect(() => {
    if (!playing || activeAsset?.kind === 'video' || activeAsset?.kind === 'audio') return
    const timer = window.setInterval(() => {
      const state = useEditorStore.getState()
      const next = state.playhead + 0.1
      const end = projectDuration(state.clips)
      if (next >= end) {
        state.setPlayhead(end)
        useEditorStore.setState({ playing: false })
      } else {
        state.setPlayhead(next)
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [activeAsset?.kind, playing])

  // Sync volume
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = volume
    v.muted = muted
  }, [volume, muted])

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setPlayhead(val)
  }

  const cycleDisplayMode = () => {
    const idx = DISPLAY_MODES.findIndex((d) => d.id === displayMode)
    setDisplayMode(DISPLAY_MODES[(idx + 1) % DISPLAY_MODES.length].id)
  }

  const handleFullscreen = () => {
    if (stageRef.current) {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {
          setRenderError('Could not exit fullscreen mode.')
        })
      } else {
        void stageRef.current.requestFullscreen().catch(() => {
          setRenderError('Fullscreen is not available in this window.')
        })
      }
    }
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

  const mediaDuration = duration || totalDuration

  return (
    <section className="panel preview-panel" aria-label="Preview">
      <div className="preview-stage" ref={stageRef}>
        {renderUrl ? (
          <video src={renderUrl} controls />
        ) : activeAsset && previewSrc ? (
          <MediaElement
            src={previewSrc}
            asset={activeAsset}
            videoRef={videoRef}
            audioRef={audioRef}
            displayMode={displayMode}
          />
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
      <div className="preview-scrub">
        <input
          type="range"
          className="preview-scrub-input"
          min={0}
          max={mediaDuration || 1}
          step={0.01}
          value={playhead}
          onChange={handleScrub}
          aria-label="Seek"
        />
      </div>
      <div className="preview-transport">
        <button type="button" onClick={() => useEditorStore.setState({ playing: !playing })} title={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸' : '▶'}
        </button>
        <button type="button" onClick={() => setPlayhead(0)} title="Go to start">
          ⏮
        </button>
        <button type="button" onClick={() => {
          const step = 1 / 30
          setPlayhead(Math.max(0, playhead - step))
        }} title="Previous frame (←)">
          ◀
        </button>
        <button type="button" onClick={() => {
          const step = 1 / 30
          setPlayhead(Math.min(totalDuration, playhead + step))
        }} title="Next frame (→)">
          ▶
        </button>
        <span className="timecode">{formatTime(playhead)} / {formatTime(mediaDuration)}</span>
        <div className="preview-volume">
          <button type="button" onClick={() => setMuted(!muted)} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔇'}
          </button>
          <input
            type="range"
            className="preview-volume-input"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false) }}
            aria-label="Volume"
          />
        </div>
        <button type="button" onClick={cycleDisplayMode} title={`Display: ${displayMode}`} className="preview-display-mode">
          {DISPLAY_MODES.find((d) => d.id === displayMode)?.label}
        </button>
        <button type="button" onClick={handleFullscreen} title="Fullscreen">
          ⛶
        </button>
        <div className="preview-transport-spacer" />
        <button type="button" onClick={handleRender} disabled={rendering}>
          {rendering ? 'Rendering…' : 'Render'}
        </button>
      </div>
    </section>
  )
}
