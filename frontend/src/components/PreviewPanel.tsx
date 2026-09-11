import { useRef } from 'react'
import { useEditorStore } from '../store/editorStore'
import { clipsAtTime } from '../editor/ops'

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

  return (
    <section className="panel preview-panel">
      <div className="preview-stage">
        {activeAsset?.kind === 'image' ? (
          <img src={activeAsset.url} alt={activeAsset.name} />
        ) : activeAsset?.kind === 'video' ? (
          <video src={activeAsset.url} controls />
        ) : activeAsset?.kind === 'audio' ? (
          <div className="audio-placeholder">{activeAsset.name}</div>
        ) : (
          <p className="empty">No media at playhead. Import assets to start.</p>
        )}
      </div>
      <div className="preview-transport">
        <button type="button" onClick={togglePlay}>
          Play
        </button>
        <button type="button" onClick={() => setPlayhead(0)}>
          Rewind
        </button>
        <span className="timecode">{formatTime(playhead)}</span>
      </div>
    </section>
  )
}