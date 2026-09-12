import { useEditorStore } from '../../store/editorStore'
import { projectDuration } from '../../editor/ops'
import { PX_PER_SECOND } from './scale'
import TrackRow from './TrackRow'

export default function TimelinePanel() {
  const tracks = useEditorStore((s) => s.tracks)
  const clips = useEditorStore((s) => s.clips)
  const assets = useEditorStore((s) => s.assets)
  const playhead = useEditorStore((s) => s.playhead)
  const captions = useEditorStore((s) => s.captions)
  const duration = Math.max(projectDuration(clips), playhead, 10)

  const durationByAsset: Record<string, number | undefined> = {}
  for (const asset of assets) {
    durationByAsset[asset.id] = asset.meta.duration
  }

  const ticks = []
  for (let t = 0; t <= duration; t += 1) {
    ticks.push(t)
  }

  return (
    <section className="panel timeline-panel">
      <div className="timeline-ruler">
        <div className="track-label-header" />
        <div className="ruler-scale">
          {ticks.map((t) => (
            <span key={t} className="ruler-tick" style={{ left: t * PX_PER_SECOND }}>
              {t}s
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
        <div className="timeline-lanes">
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
            style={{ left: playhead * PX_PER_SECOND }}
          />
        </div>
      </div>
    </section>
  )
}