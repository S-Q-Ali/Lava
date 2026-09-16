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

  const handlePreview = () => {
    const { playing } = useEditorStore.getState()
    useEditorStore.setState({ playing: !playing })
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <TopBar onNavigate={setActiveNav} onPreview={handlePreview} />
        <div className="workspace">
          <NavRail active={activeNav} onSelect={setActiveNav} />
          <aside className="left-panel-v2">
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
          <aside className="right-panel">
            <RightPanel />
          </aside>
        </div>
        <section className="bottom-bar">
          <AssetsPanel />
        </section>
      </div>
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App
