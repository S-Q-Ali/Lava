import { useRef, useState } from 'react'
import type { Clip } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { PX_PER_SECOND } from './scale'

const MIN_DURATION = 0.1

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
  const trimClip = useEditorStore((s) => s.trimClip)

  const gesture = useRef<{
    mode: DragMode
    pointerId: number
    startX: number
    baseStart: number
    baseDuration: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  const beginGesture = (
    mode: Exclude<DragMode, null>,
    startX: number,
    baseStart: number,
    baseDuration: number,
  ) => {
    gesture.current = { mode, pointerId: 0, startX, baseStart, baseDuration }
    setDragging(true)
    useEditorStore.temporal.getState().pause()
  }

  const endGesture = () => {
    gesture.current = null
    setDragging(false)
    useEditorStore.temporal.getState().resume()
  }

  const moveTo = (clientX: number) => {
    const g = gesture.current
    if (!g) return
    const deltaSeconds = (clientX - g.startX) / PX_PER_SECOND
    if (g.mode === 'move') {
      moveClipRipple(clip.id, Math.max(0, g.baseStart + deltaSeconds))
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

  return (
    <div
      className={`clip-block${selected ? ' selected' : ''}${dragging ? ' dragging' : ''}`}
      style={{
        left: clip.start * PX_PER_SECOND,
        width: clip.duration * PX_PER_SECOND,
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.stopPropagation()
        selectClip(clip.id)
        beginGesture('move', e.clientX, clip.start, clip.duration)
        e.currentTarget.setPointerCapture(e.pointerId)
        gesture.current!.pointerId = e.pointerId
      }}
      onPointerMove={(e) => moveTo(e.clientX)}
      onPointerUp={(e) => {
        if (e.pointerId !== gesture.current?.pointerId) return
        moveTo(e.clientX)
        endGesture()
      }}
      onPointerCancel={() => endGesture()}
      title={`${clip.name} · ${clip.start.toFixed(2)}s → ${(clip.start + clip.duration).toFixed(2)}s`}
    >
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
              beginGesture('trim-start', e.clientX, clip.start, clip.duration)
              e.currentTarget.setPointerCapture(e.pointerId)
              gesture.current!.pointerId = e.pointerId
            }}
            onPointerMove={(e) => moveTo(e.clientX)}
            onPointerUp={(e) => {
              if (e.pointerId !== gesture.current?.pointerId) return
              moveTo(e.clientX)
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
              beginGesture('trim-end', e.clientX, clip.start, clip.duration)
              e.currentTarget.setPointerCapture(e.pointerId)
              gesture.current!.pointerId = e.pointerId
            }}
            onPointerMove={(e) => moveTo(e.clientX)}
            onPointerUp={(e) => {
              if (e.pointerId !== gesture.current?.pointerId) return
              moveTo(e.clientX)
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