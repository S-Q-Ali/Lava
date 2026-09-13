import { useEditorStore } from '../store/editorStore'
import { projectDuration } from '../editor/ops'
import TranscriptPanel from './TranscriptPanel'
import MatchPanel from './MatchPanel'
import TransitionsPanel from './TransitionsPanel'
import MotionPanel from './MotionPanel'
import { CaptionPanel } from './CaptionPanel'
import { FontPanel } from './FontPanel'

export default function InspectorPanel() {
  const clips = useEditorStore((s) => s.clips)
  const playhead = useEditorStore((s) => s.playhead)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const selectedClip = clips.find((c) => c.id === selectedClipId)

  return (
    <section className="panel inspector-panel">
      <h3>Inspector</h3>
      {selectedClip ? (
        <div className="inspector-body">
          <div className="field">
            <span className="label">Clip</span>
            <span className="value">{selectedClip.name}</span>
          </div>
          <div className="field">
            <span className="label">Start</span>
            <span className="value">{selectedClip.start.toFixed(2)}s</span>
          </div>
          <div className="field">
            <span className="label">Duration</span>
            <span className="value">{selectedClip.duration.toFixed(2)}s</span>
          </div>
          <div className="field">
            <span className="label">Track</span>
            <span className="value">{selectedClip.trackId}</span>
          </div>
          <MotionPanel clip={selectedClip} />
        </div>
      ) : (
        <p className="empty">Select a clip to inspect.</p>
      )}
      <div className="inspector-stats">
        <div className="field">
          <span className="label">Total clips</span>
          <span className="value">{clips.length}</span>
        </div>
        <div className="field">
          <span className="label">Playhead</span>
          <span className="value">{playhead.toFixed(2)}s</span>
        </div>
        <div className="field">
          <span className="label">Duration</span>
          <span className="value">{projectDuration(clips).toFixed(2)}s</span>
        </div>
      </div>
      <TranscriptPanel />
      <MatchPanel />
      <TransitionsPanel />
      <CaptionPanel />
      <FontPanel />
    </section>
  )
}