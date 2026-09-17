import AIMatchPanel from './AIMatchPanel'
import { AutoCaptionsPanel } from './AutoCaptionsPanel'
import InspectorPanel from './InspectorPanel'
import './RightPanel.css'

export default function RightPanel() {
  return (
    <div className="right-panel-v2">
      <div className="right-panel-scroll">
        <AIMatchPanel />
        <div className="right-panel-divider" />
        <AutoCaptionsPanel />
        <div className="right-panel-divider" />
        <InspectorPanel />
      </div>
    </div>
  )
}
