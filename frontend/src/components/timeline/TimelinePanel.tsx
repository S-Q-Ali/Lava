import { useRef } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { projectDuration } from '../../editor/ops'
import TrackRow from './TrackRow'
import { useTimelineZoom } from '../../hooks/useTimelineZoom'

export default function TimelinePanel() {
  const tracks = useEditorStore((s) => s.tracks)
  const clips = useEditorStore((s) => s.clips)
  const assets = useEditorStore((s) => s.assets)
  const playhead = useEditorStore((s) => s.playhead)
  const captions = useEditorStore((s) => s.captions)
  const duration = Math.max(projectDuration(clips), playhead, 10)
  const { pps, zoomIn, zoomOut, zoomToFit, handleWheel } = useTimelineZoom()
  const lanesRef = useRef<HTMLDivElement>(null)

  const durationByAsset: Record<string, number | undefined> = {}
  for (const asset of assets) {
    durationByAsset[asset.id] = asset.meta.duration
  }

  const ticks = []
  const tickStep = pps >= 64 ? 0.5 : pps >= 16 ? 1 : 2
  for (let t = 0; t <= duration; t += tickStep) {
    ticks.push(t)
  }

  return (
    <section className="panel timeline-panel" aria-label="Timeline">
      <div className="timeline-toolbar">
        <button type="button" onClick={() => zoomOut()} title="Zoom out (Ctrl+-)">−</button>
        <span className="zoom-label">{Math.round(pps)} px/s</span>
        <button type="button" onClick={() => zoomIn()} title="Zoom in (Ctrl++)">+</button>
        <button type="button" onClick={() => zoomToFit(duration, (lanesRef.current?.clientWidth ?? 800))} title="Fit to timeline">⊞</button>
      </div>
      <div className="timeline-ruler">
        <div className="track-label-header" />
        <div className="ruler-scale">
          {ticks.map((t) => (
            <span key={t} className="ruler-tick" style={{ left: t * pps }}>
              {tickStep >= 1 ? `${t}s` : `${t.toFixed(1)}`}
            </span>
          ))}
        </div>
      </div>
      <div className="timeline-body">
        <div className="track-labels">
          {tracks.map((t) => (
            <div key={t.id} className="track-label">
              {t.name}
            </div>
          ))}
        </div>
        <div className="timeline-lanes" ref={lanesRef} onWheel={handleWheel}>
          {tracks.map((t) => (
            <TrackRow
              key={t.id}
              track={t}
              clips={tracks.length ? clips.filter((c) => c.trackId === t.id) : []}
              durationByAsset={durationByAsset}
              captions={t.id === 'track-captions' ? captions : []}
            />
          ))}
          <div
            className="playhead"
            style={{ left: playhead * pps }}
          />
        </div>
      </div>
    </section>
  )
}
