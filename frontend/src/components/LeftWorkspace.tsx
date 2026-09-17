import { useState } from 'react'
import MediaPanel from './MediaPanel'
import ManhwaPanel from './ManhwaPanel'
import { CaptionPanel } from './CaptionPanel'
import { PresetPanel } from './PresetPanel'
import ExtractorPanel from './ExtractorPanel'
import ExportPanel from './ExportPanel'
import { useEditorStore } from '../store/editorStore'
import { projectDuration } from '../editor/ops'
import './LeftWorkspace.css'

type LeftWorkspaceProps = {
  activeNav: string
}

function WorkspaceOverview({ title }: { title: 'Home' | 'Projects' }) {
  const assets = useEditorStore((s) => s.assets)
  const clips = useEditorStore((s) => s.clips)
  const duration = projectDuration(clips)
  return (
    <div className="left-workspace-placeholder">
      <h3>{title}</h3>
      {title === 'Home' ? (
        <>
          <p>Start by importing media, then drag assets to the timeline.</p>
          <div className="workspace-overview-stats">
            <span>{assets.length} assets</span>
            <span>{clips.length} clips</span>
            <span>{duration.toFixed(1)}s timeline</span>
          </div>
        </>
      ) : (
        <>
          <p>Projects are saved as local .lava.json files.</p>
          <p className="left-workspace-hint">Use Save and Open in the top bar to manage project files.</p>
        </>
      )}
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
      return <WorkspaceOverview title="Home" />
    case 'projects':
      return <WorkspaceOverview title="Projects" />
    case 'export':
      return (
        <div className="left-workspace-content">
          <ExportPanel />
        </div>
      )
    default:
      return <WorkspaceOverview title="Home" />
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
