import { useState } from 'react'
import TopBar from './components/TopBar'
import NavRail from './components/NavRail'
import LeftWorkspace from './components/LeftWorkspace'
import PreviewPanel from './components/PreviewPanel'
import RightPanel from './components/RightPanel'
import TimelinePanel from './components/timeline/TimelinePanel'
import AssetsPanel from './components/AssetsPanel'
import { ErrorBoundary } from './components/ErrorBoundary'
import ToastContainer from './components/ToastContainer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useEditorStore } from './store/editorStore'
import './App.css'

function App() {
  useKeyboardShortcuts()
  const [activeNav, setActiveNav] = useState('ai-tools')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  const handlePreview = () => {
    const { playing } = useEditorStore.getState()
    useEditorStore.setState({ playing: !playing })
  }

  return (
    <ErrorBoundary>
      <div className={`app${leftPanelOpen ? '' : ' left-panel-collapsed'}${rightPanelOpen ? '' : ' right-panel-collapsed'}`}>
        <TopBar onNavigate={setActiveNav} onPreview={handlePreview} />
        <div className="workspace">
          <NavRail
            active={activeNav}
            onSelect={(id) => {
              setActiveNav(id)
              setLeftPanelOpen(true)
            }}
          />
          <aside className="left-panel-v2" aria-label="Workspace panel">
            <button
              type="button"
              className="panel-collapse-button"
              onClick={() => setLeftPanelOpen(false)}
              aria-label="Collapse workspace panel"
              title="Collapse workspace panel"
            >
              ‹
            </button>
            <LeftWorkspace activeNav={activeNav} />
          </aside>
          <div className="center-column">
            <main className="center-preview">
              <PreviewPanel />
            </main>
            <footer className="center-timeline">
              <TimelinePanel />
            </footer>
          </div>
          <aside className="right-panel" aria-label="Inspector and AI tools">
            <button
              type="button"
              className="panel-collapse-button panel-collapse-right"
              onClick={() => setRightPanelOpen(false)}
              aria-label="Collapse inspector panel"
              title="Collapse inspector panel"
            >
              ›
            </button>
            <RightPanel />
          </aside>
        </div>
        <section className="bottom-bar">
          <AssetsPanel />
        </section>
        <div className="collapsed-panel-actions" aria-label="Show editor panels">
          {!leftPanelOpen && (
            <button type="button" onClick={() => setLeftPanelOpen(true)}>
              Show workspace
            </button>
          )}
          {!rightPanelOpen && (
            <button type="button" onClick={() => setRightPanelOpen(true)}>
              Show inspector
            </button>
          )}
        </div>
      </div>
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App
