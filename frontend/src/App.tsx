import { useEditorStore } from './store/editorStore'
import MediaPanel from './components/MediaPanel'
import PreviewPanel from './components/PreviewPanel'
import InspectorPanel from './components/InspectorPanel'
import TimelinePanel from './components/timeline/TimelinePanel'
import { getFFmpegProvider } from './services/ffmpeg'
import './App.css'

function App() {
  const clips = useEditorStore((s) => s.clips)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)

  const handleExport = async () => {
    const provider = await getFFmpegProvider()
    if (!provider.available) {
      window.alert(`${provider.name}: ${provider.reason}`)
      return
    }
    window.alert('Render queued via local FFmpeg sidecar.')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="project-title">Lava — AI Video Studio</div>
        <div className="topbar-actions">
          <span className="clip-count">{clips.length} clips</span>
          <button type="button" onClick={undo} title="Undo">
            ↩
          </button>
          <button type="button" onClick={redo} title="Redo">
            ↪
          </button>
          <button type="button" onClick={handleExport}>
            Export
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside className="left-panel">
          <MediaPanel />
        </aside>
        <main className="center-panel">
          <PreviewPanel />
        </main>
        <aside className="right-panel">
          <InspectorPanel />
        </aside>
      </div>
      <footer className="bottom-panel">
        <TimelinePanel />
      </footer>
    </div>
  )
}

export default App