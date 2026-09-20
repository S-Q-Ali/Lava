import MediaPanel from './MediaPanel'
import ManhwaPanel from './ManhwaPanel'
import { CaptionPanel } from './CaptionPanel'
import ExportPanel from './ExportPanel'
import VoiceoverPanel from './VoiceoverPanel'
import ScriptWriterPanel from './ScriptWriterPanel'
import PipelinePanel from './PipelinePanel'
import { SettingsPanel } from './SettingsPanel'
import { ImageGenPanel } from './ImageGenPanel'
import { PodcastMakerPanel } from './PodcastMakerPanel'
import { VoiceLibraryPanel } from './VoiceLibraryPanel'
import { SoundFXPanel } from './SoundFXPanel'
import { BulkGenerationPanel } from './BulkGenerationPanel'
import { SyncPanel } from './SyncPanel'
import { ClipperPanel } from './ClipperPanel'
import { ScriptTemplatesPanel } from './ScriptTemplatesPanel'
import { MyGenerationsPanel } from './MyGenerationsPanel'
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
      return (
        <div className="left-workspace-content">
          <ManhwaPanel />
        </div>
      )
    case 'voiceover':
      return (
        <div className="left-workspace-content">
          <VoiceoverPanel />
        </div>
      )
    case 'scriptwriter':
      return (
        <div className="left-workspace-content">
          <ScriptWriterPanel />
        </div>
      )
    case 'pipeline':
      return (
        <div className="left-workspace-content">
          <PipelinePanel />
        </div>
      )
    case 'imagegen':
      return (
        <div className="left-workspace-content">
          <ImageGenPanel />
        </div>
      )
    case 'podcast':
      return (
        <div className="left-workspace-content">
          <PodcastMakerPanel />
        </div>
      )
    case 'voices':
      return (
        <div className="left-workspace-content">
          <VoiceLibraryPanel />
        </div>
      )
    case 'sfx':
      return (
        <div className="left-workspace-content">
          <SoundFXPanel />
        </div>
      )
    case 'bulkgen':
      return (
        <div className="left-workspace-content">
          <BulkGenerationPanel />
        </div>
      )
    case 'sync':
      return (
        <div className="left-workspace-content">
          <SyncPanel />
        </div>
      )
    case 'clipper':
      return (
        <div className="left-workspace-content">
          <ClipperPanel />
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
          <ScriptTemplatesPanel />
        </div>
      )
    case 'mygenerations':
      return (
        <div className="left-workspace-content">
          <MyGenerationsPanel />
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
    case 'settings':
      return (
        <div className="left-workspace-content">
          <SettingsPanel />
        </div>
      )
    default:
      return <WorkspaceOverview title="Home" />
  }
}
