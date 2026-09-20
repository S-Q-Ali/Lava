import { useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import { saveProjectToFile, readProjectFromFile } from '../services/projectIO'
import './TopBar.css'

type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3'

const ASPECT_RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3']

type TopBarProps = {
  onNavigate?: (id: string) => void
  onPreview?: () => void
  onOpenSettings?: () => void
}

export default function TopBar({ onNavigate, onPreview, onOpenSettings }: TopBarProps) {
  const openProjectInputRef = useRef<HTMLInputElement>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [saved, setSaved] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)

  const model = useEditorStore(
    useShallow((s) => ({
      tracks: s.tracks,
      assets: s.assets,
      clips: s.clips,
      playhead: s.playhead,
      selectedClipId: s.selectedClipId,
      undo: s.undo,
      redo: s.redo,
      loadProject: s.loadProject,
    })),
  )

  const handleSave = () => {
    saveProjectToFile(model)
    setSaved(true)
  }

  const handleOpenProject = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    try {
      const loaded = await readProjectFromFile(file)
      model.loadProject(loaded)
      setSaved(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error.'
      window.alert(`Could not open project: ${message}`)
    }
  }

  const handleExport = () => {
    onNavigate?.('export')
  }

  const startEditTitle = () => {
    setEditTitle('Untitled Project')
    setIsEditingTitle(true)
  }

  const commitTitle = () => {
    setIsEditingTitle(false)
    setSaved(false)
  }

  return (
    <header className="topbar-v2">
      <div className="topbar-v2-left">
        <div className="topbar-v2-brand">
          <span className="topbar-v2-logo" aria-hidden="true">⚡</span>
          <div className="topbar-v2-brand-text">
            <span className="topbar-v2-title">AI Studio</span>
            <span className="topbar-v2-subtitle">Create · Edit · Inspire</span>
          </div>
        </div>
      </div>

      <div className="topbar-v2-center">
        <div className="topbar-v2-project">
          {isEditingTitle ? (
            <input
              className="topbar-v2-title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle()
                if (e.key === 'Escape') setIsEditingTitle(false)
              }}
              autoFocus
              aria-label="Project name"
            />
          ) : (
            <button
              type="button"
              className="topbar-v2-project-name"
              onClick={startEditTitle}
              title="Click to edit project name"
            >
              Untitled Project
              <span className="topbar-v2-edit-icon">✏️</span>
            </button>
          )}
        </div>
      </div>

      <div className="topbar-v2-right">
        <div className="topbar-v2-actions">
          <button type="button" className="topbar-v2-btn-icon" onClick={model.undo} title="Undo" aria-label="Undo">
            ↩
          </button>
          <button type="button" className="topbar-v2-btn-icon" onClick={model.redo} title="Redo" aria-label="Redo">
            ↪
          </button>
          <span className={`topbar-v2-saved${saved ? ' is-saved' : ''}`} role="status" aria-live="polite">
            {saved ? '✓ Saved' : '● Unsaved'}
          </span>
        </div>

        <div className="topbar-v2-actions">
          <select
            className="topbar-v2-ratio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            title="Aspect ratio"
            aria-label="Aspect ratio"
          >
            {ASPECT_RATIOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button type="button" className="topbar-v2-btn" onClick={onPreview}>
            Preview
          </button>
          <button type="button" className="topbar-v2-btn topbar-v2-btn-primary" onClick={handleExport}>
            Export
          </button>

          <input
            ref={openProjectInputRef}
            type="file"
            accept=".lava.json,application/json"
            hidden
            onChange={(e) => handleOpenProject(e.target.files)}
          />
          <button
            type="button"
            className="topbar-v2-btn-icon"
            onClick={() => openProjectInputRef.current?.click()}
            title="Open project"
            aria-label="Open project"
          >
            📂
          </button>
          <button type="button" className="topbar-v2-btn-icon" onClick={handleSave} title="Save project" aria-label="Save project">
            💾
          </button>
        </div>

        <div className="topbar-v2-actions">
          <div className="topbar-v2-dropdown-wrap">
            <button
              type="button"
              className="topbar-v2-btn-icon"
              onClick={() => {
                setProfileOpen(!profileOpen)
              }}
              title="Profile"
            >
              👤
            </button>
            {profileOpen && (
              <div className="topbar-v2-dropdown">
                <div className="topbar-v2-dropdown-item">Profile</div>
                <div className="topbar-v2-dropdown-item">Account</div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="topbar-v2-btn-icon"
            onClick={onOpenSettings}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </div>
    </header>
  )
}
