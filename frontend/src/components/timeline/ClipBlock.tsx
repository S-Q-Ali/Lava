import { useMemo, useRef, useState } from 'react'
import type { Clip } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { useTimelineZoom } from '../../hooks/useTimelineZoom'
import { resolveProxyUrl } from '../../services/proxy'

const MIN_DURATION = 0.1
const LANE_HEIGHT = 56

type DragMode = 'move' | 'trim-start' | 'trim-end' | null

export default function ClipBlock({
  clip,
  selected,
  maxDuration,
}: {
  clip: Clip
  selected: boolean
  maxDuration?: number
}) {
  const selectClip = useEditorStore((s) => s.selectClip)
  const removeClip = useEditorStore((s) => s.removeClip)
  const splitClip = useEditorStore((s) => s.splitClip)
  const setPlayhead = useEditorStore((s) => s.setPlayhead)
  const moveClipRipple = useEditorStore((s) => s.moveClipRipple)
  const moveClipToTrack = useEditorStore((s) => s.moveClipToTrack)
  const trimClip = useEditorStore((s) => s.trimClip)
  const tracks = useEditorStore((s) => s.tracks)
  const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks])
  const { pps } = useTimelineZoom()

  const gesture = useRef<{
    mode: DragMode
    pointerId: number
    startX: number
    startY: number
    baseStart: number
    baseDuration: number
    baseTrackId: string
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  // Thumbnail / waveform from asset
  const assets = useEditorStore((s) => s.assets)
  const asset = useMemo(
    () => assets.find((a) => a.id === clip.assetId),
    [assets, clip.assetId],
  )
  const proxyUrl = useMemo(
    () => (asset ? resolveProxyUrl(asset) : null),
    [asset],
  )

  const beginGesture = (
    mode: Exclude<DragMode, null>,
    e: React.PointerEvent,
    baseStart: number,
    baseDuration: number,
  ) => {
    const baseTrackId = clip.trackId
    gesture.current = {
      mode,
      pointerId: 0,
      startX: e.clientX,
      startY: e.clientY,
      baseStart,
      baseDuration,
      baseTrackId,
    }
    setDragging(true)
    useEditorStore.temporal.getState().pause()
  }

  const endGesture = () => {
    gesture.current = null
    setDragging(false)
    useEditorStore.temporal.getState().resume()
  }

  const moveTo = (clientX: number, clientY: number) => {
    const g = gesture.current
    if (!g) return
    const deltaSeconds = (clientX - g.startX) / pps
    if (g.mode === 'move') {
      let newStart = Math.max(0, g.baseStart + deltaSeconds)
      // Snapping: find nearest snap point within threshold
      const SNAP_THRESHOLD_PX = 5
      const snapThresholdSec = SNAP_THRESHOLD_PX / pps
      const playhead = useEditorStore.getState().playhead
      const allClips = useEditorStore.getState().clips
      const snapPoints: number[] = [0, playhead]
      for (const c of allClips) {
        if (c.id === clip.id) continue
        if (c.trackId !== clip.trackId) continue
        snapPoints.push(c.start, c.start + c.duration)
      }
      const clipEnd = newStart + clip.duration
      let bestSnapDelta = Infinity
      for (const pt of snapPoints) {
        const dStart = Math.abs(newStart - pt)
        if (dStart < snapThresholdSec && dStart < Math.abs(bestSnapDelta)) {
          bestSnapDelta = pt - newStart
        }
        const dEnd = Math.abs(clipEnd - pt)
        if (dEnd < snapThresholdSec && dEnd < Math.abs(bestSnapDelta)) {
          bestSnapDelta = pt - clipEnd
        }
      }
      if (Math.abs(bestSnapDelta) < snapThresholdSec) {
        newStart = Math.max(0, newStart + bestSnapDelta)
      }
      moveClipRipple(clip.id, newStart)
      // Cross-track drag: vertical delta past one lane height moves the clip
      const laneDelta = Math.round((clientY - g.startY) / LANE_HEIGHT)
      if (laneDelta !== 0) {
        const fromIndex = trackIds.indexOf(g.baseTrackId)
        const toIndex = Math.min(Math.max(0, fromIndex + laneDelta), trackIds.length - 1)
        const targetTrackId = trackIds[toIndex]
        if (targetTrackId && targetTrackId !== clip.trackId) {
          moveClipToTrack(clip.id, targetTrackId)
        }
      }
      return
    }
    if (g.mode === 'trim-end') {
      const ceiling = maxDuration ?? Number.POSITIVE_INFINITY
      const duration = Math.min(
        Math.max(MIN_DURATION, g.baseDuration + deltaSeconds),
        ceiling,
      )
      trimClip(clip.id, { duration })
      return
    }
    if (g.mode === 'trim-start') {
      const endAbs = Math.min(
        g.baseStart + g.baseDuration,
        maxDuration === undefined ? Infinity : g.baseStart + maxDuration,
      )
      const newStart = Math.min(
        Math.max(0, g.baseStart + deltaSeconds),
        endAbs - MIN_DURATION,
      )
      trimClip(clip.id, { start: newStart, duration: endAbs - newStart })
    }
  }

  // Thumbnail tiling for image/video clips
  const thumbnailStyle: React.CSSProperties | undefined = useMemo(() => {
    if (!proxyUrl || !asset || asset.kind === 'audio') return undefined
    return {
      backgroundImage: `url("${proxyUrl}")`,
      backgroundSize: `${Math.max(56, clip.duration * pps * 0.3)}px 100%`,
      backgroundRepeat: 'repeat-x',
    }
  }, [proxyUrl, asset, clip.duration, pps])

  // Waveform style for audio clips
  const waveformStyle: React.CSSProperties | undefined = useMemo(() => {
    if (!asset || asset.kind !== 'audio') return undefined
    return {
      backgroundImage: `repeating-linear-gradient(90deg,
        var(--accent) 0px, var(--accent) 2px,
        transparent 2px, transparent 4px)`,
    }
  }, [asset])

  return (
    <div
      className={`clip-block${selected ? ' selected' : ''}${dragging ? ' dragging' : ''}`}
      style={{
        left: clip.start * pps,
        width: clip.duration * pps,
        ...(thumbnailStyle ?? {}),
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.stopPropagation()
        selectClip(clip.id)
        beginGesture('move', e, clip.start, clip.duration)
        e.currentTarget.setPointerCapture(e.pointerId)
        gesture.current!.pointerId = e.pointerId
      }}
      onPointerMove={(e) => moveTo(e.clientX, e.clientY)}
      onPointerUp={(e) => {
        if (e.pointerId !== gesture.current?.pointerId) return
        moveTo(e.clientX, e.clientY)
        endGesture()
      }}
      onPointerCancel={() => endGesture()}
      title={`${clip.name} · ${clip.start.toFixed(2)}s → ${(clip.start + clip.duration).toFixed(2)}s`}
    >
      {waveformStyle && <div className="clip-waveform" style={waveformStyle} />}
      <span className="clip-title">{clip.name}</span>
      {clip.motion && (
        <span className="clip-motion" title={`Motion: ${clip.motion.type}`}>
          {clip.motion.type}
        </span>
      )}
      {selected && (
        <>
          <div
            className="clip-handle clip-handle-start"
            title="Trim start"
            onPointerDown={(e) => {
              if (e.button !== 0) return
              e.stopPropagation()
              beginGesture('trim-start', e, clip.start, clip.duration)
              e.currentTarget.setPointerCapture(e.pointerId)
              gesture.current!.pointerId = e.pointerId
            }}
            onPointerMove={(e) => moveTo(e.clientX, e.clientY)}
            onPointerUp={(e) => {
              if (e.pointerId !== gesture.current?.pointerId) return
              moveTo(e.clientX, e.clientY)
              endGesture()
            }}
            onPointerCancel={() => endGesture()}
          />
          <div
            className="clip-handle clip-handle-end"
            title="Trim end"
            onPointerDown={(e) => {
              if (e.button !== 0) return
              e.stopPropagation()
              beginGesture('trim-end', e, clip.start, clip.duration)
              e.currentTarget.setPointerCapture(e.pointerId)
              gesture.current!.pointerId = e.pointerId
            }}
            onPointerMove={(e) => moveTo(e.clientX, e.clientY)}
            onPointerUp={(e) => {
              if (e.pointerId !== gesture.current?.pointerId) return
              moveTo(e.clientX, e.clientY)
              endGesture()
            }}
            onPointerCancel={() => endGesture()}
          />
        </>
      )}
      <div className="clip-actions">
        <button
          type="button"
          title="Split at playhead"
          onClick={(e) => {
            e.stopPropagation()
            const playhead = useEditorStore.getState().playhead
            if (playhead > clip.start && playhead < clip.start + clip.duration) {
              splitClip(clip.id, playhead)
            } else {
              setPlayhead(clip.start + clip.duration / 2)
            }
          }}
        >
          ✂
        </button>
        <button
          type="button"
          title="Delete clip"
          onClick={(e) => {
            e.stopPropagation()
            removeClip(clip.id)
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}