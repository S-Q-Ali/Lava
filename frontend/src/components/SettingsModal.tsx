import { useEffect, useCallback } from 'react'
import { SettingsPanel } from './SettingsPanel'
import './SettingsModal.css'

type SettingsModalProps = {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="settings-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="settings-modal-content">
        <div className="settings-modal-header">
          <span className="settings-modal-title">Settings</span>
          <button
            type="button"
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Close settings"
            title="Close"
          >
            ×
          </button>
        </div>
        <div className="settings-modal-body">
          <SettingsPanel />
        </div>
      </div>
    </div>
  )
}
