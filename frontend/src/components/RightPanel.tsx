import { useState } from 'react'
import AIMatchPanel from './AIMatchPanel'
import { AutoCaptionsPanel } from './AutoCaptionsPanel'
import InspectorPanel from './InspectorPanel'
import './RightPanel.css'

type RightPanelView = 'ai-match' | 'auto-captions' | 'inspector'

export default function RightPanel() {
  const [view, setView] = useState<RightPanelView>('ai-match')

  return (
    <div className="right-panel-v2">
      <div className="right-panel-switcher">
        <button
          type="button"
          className={`right-panel-switcher-btn${view === 'ai-match' ? ' active' : ''}`}
          onClick={() => setView('ai-match')}
          title="AI Match"
        >
          ⚡
        </button>
        <button
          type="button"
          className={`right-panel-switcher-btn${view === 'auto-captions' ? ' active' : ''}`}
          onClick={() => setView('auto-captions')}
          title="Auto Captions"
        >
          💬
        </button>
        <button
          type="button"
          className={`right-panel-switcher-btn${view === 'inspector' ? ' active' : ''}`}
          onClick={() => setView('inspector')}
          title="Inspector"
        >
          🔍
        </button>
      </div>

      <div className="right-panel-content">
        {view === 'ai-match' && <AIMatchPanel />}
        {view === 'auto-captions' && <AutoCaptionsPanel />}
        {view === 'inspector' && <InspectorPanel />}
      </div>
    </div>
  )
}
