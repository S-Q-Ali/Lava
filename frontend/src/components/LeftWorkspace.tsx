import { useState } from 'react'
import MediaPanel from './MediaPanel'
import ManhwaPanel from './ManhwaPanel'
import { CaptionPanel } from './CaptionPanel'
import { PresetPanel } from './PresetPanel'
import ExtractorPanel from './ExtractorPanel'
import ExportPanel from './ExportPanel'
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
      return <AiToolsWorkspace />
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
      return <Placeholder title="Projects" />
    case 'export':
      return (
        <div className="left-workspace-content">
          <ExportPanel />
        </div>
      )
    default:
      return <Placeholder title={activeNav} />
  }
}

type AiTab = 'extractor' | 'manhwa'

function AiToolsWorkspace() {
  const [tab, setTab] = useState<AiTab>('extractor')

  return (
    <div className="left-workspace-content">
      <div className="ai-tools-tabs">
        <button
          type="button"
          className={`ai-tools-tab${tab === 'extractor' ? ' active' : ''}`}
          onClick={() => setTab('extractor')}
        >
          Presentation
        </button>
        <button
          type="button"
          className={`ai-tools-tab${tab === 'manhwa' ? ' active' : ''}`}
          onClick={() => setTab('manhwa')}
        >
          Manhwa
        </button>
      </div>
      {tab === 'extractor' ? <ExtractorPanel /> : <ManhwaPanel />}
    </div>
  )
}
