import MediaPanel from './MediaPanel'
import ManhwaPanel from './ManhwaPanel'
import { CaptionPanel } from './CaptionPanel'
import { PresetPanel } from './PresetPanel'
import ExtractorPanel from './ExtractorPanel'
import './LeftWorkspace.css'

type LeftWorkspaceProps = {
  activeNav: string
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="left-workspace-placeholder">
      <p>{title}</p>
      <p className="left-workspace-hint">Coming soon</p>
    </div>
  )
}

export default function LeftWorkspace({ activeNav }: LeftWorkspaceProps) {
  switch (activeNav) {
    case 'media':
      return (
        <div className="left-workspace-content">
          <MediaPanel />
        </div>
      )
    case 'ai-tools':
      return (
        <div className="left-workspace-content">
          <ManhwaPanel />
        </div>
      )
    case 'captions':
      return (
        <div className="left-workspace-content">
          <CaptionPanel />
        </div>
      )
    case 'templates':
      return (
        <div className="left-workspace-content">
          <PresetPanel />
        </div>
      )
    case 'home':
      return <Placeholder title="Home" />
    case 'projects':
      return (
        <div className="left-workspace-content">
          <ExtractorPanel />
        </div>
      )
    case 'export':
      return <Placeholder title="Export" />
    default:
      return <Placeholder title={activeNav} />
  }
}
