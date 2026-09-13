import { useEditorStore } from './store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import MediaPanel from './components/MediaPanel'
import ManhwaPanel from './components/ManhwaPanel'
import PreviewPanel from './components/PreviewPanel'
import InspectorPanel from './components/InspectorPanel'
import TimelinePanel from './components/timeline/TimelinePanel'
import { getFFmpegProvider } from './services/ffmpeg'
import { saveProjectToFile, readProjectFromFile } from './services/projectIO'
import { useRef, useState } from 'react'
import './App.css'

type LeftTab = 'media' | 'manhwa'

function App() {
  const clips = useEditorStore((s) => s.clips)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const loadProject = useEditorStore((s) => s.loadProject)
  const openProjectInputRef = useRef<HTMLInputElement>(null)
  const [leftTab, setLeftTab] = useState<LeftTab>('media')

  const handleExport = async () => {
    const provider = await getFFmpegProvider()
    if (!provider.available) {
      window.alert(`${provider.name}: ${provider.reason}`)
      return
    }
    window.alert('Render queued via local FFmpeg sidecar.')
  }

  const handleOpenProject = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    try {
      const model = await readProjectFromFile(file)
      loadProject(model)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error.'
      window.alert(`Could not open project: ${message}`)
    }
  }

  const model = useEditorStore(
    useShallow((s) => ({
      tracks: s.tracks,
      assets: s.assets,
      clips: s.clips,
      playhead: s.playhead,
      selectedClipId: s.selectedClipId,
    })),
  )
  const handleSave = () => saveProjectToFile(model)

  return (
    <div className="app">
      <header className="topbar">
        <div className="project-title">Lava — AI Video Studio</div>
        <div className="topbar-actions">
          <span className="clip-count">{clips.length} clips</span>
          <input
            ref={openProjectInputRef}
            type="file"
            accept=".lava.json,application/json"
            hidden
            onChange={(e) => handleOpenProject(e.target.files)}
          />
          <button type="button" onClick={() => openProjectInputRef.current?.click()}>
            Open
          </button>
          <button type="button" onClick={handleSave}>
            Save
          </button>
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
          <div className="left-tabs">
            <button
              type="button"
              className={`left-tab${leftTab === 'media' ? ' active' : ''}`}
              onClick={() => setLeftTab('media')}
            >
              Media
            </button>
            <button
              type="button"
              className={`left-tab${leftTab === 'manhwa' ? ' active' : ''}`}
              onClick={() => setLeftTab('manhwa')}
            >
              Manhwa
            </button>
          </div>
          {leftTab === 'media' ? <MediaPanel /> : <ManhwaPanel />}
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