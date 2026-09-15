import { useState } from 'react'
import TopBar from './components/TopBar'
import NavRail from './components/NavRail'
import LeftWorkspace from './components/LeftWorkspace'
import PreviewPanel from './components/PreviewPanel'
import InspectorPanel from './components/InspectorPanel'
import TimelinePanel from './components/timeline/TimelinePanel'
import './App.css'

function App() {
  const [activeNav, setActiveNav] = useState('ai-tools')

  return (
    <div className="app">
      <TopBar />
      <div className="workspace">
        <NavRail active={activeNav} onSelect={setActiveNav} />
        <aside className="left-panel-v2">
          <LeftWorkspace activeNav={activeNav} />
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
