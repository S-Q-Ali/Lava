import { useState } from 'react'
import TranscriptPanel from './TranscriptPanel'
import MatchPanel from './MatchPanel'
import './AIMatchPanel.css'

type AIMatchTab = 'voice-images' | 'settings'

export default function AIMatchPanel({ onClose }: { onClose?: () => void }) {
  const [tab, setTab] = useState<AIMatchTab>('voice-images')

  return (
    <section className="ai-match-panel" aria-label="AI Match">
      <div className="ai-match-header">
        <span className="ai-match-icon">⚡</span>
        <span className="ai-match-title">AI Match</span>
        {onClose && (
          <button type="button" className="ai-match-close" onClick={onClose} title="Close" aria-label="Close AI Match">
            ×
          </button>
        )}
      </div>

      <div className="ai-match-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'voice-images'}
          className={`ai-match-tab${tab === 'voice-images' ? ' active' : ''}`}
          onClick={() => setTab('voice-images')}
        >
          Voice + Images
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'settings'}
          className={`ai-match-tab${tab === 'settings' ? ' active' : ''}`}
          onClick={() => setTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="ai-match-body" role="tabpanel">
        {tab === 'voice-images' ? (
          <div className="ai-match-content">
            <TranscriptPanel />
            <MatchPanel />
          </div>
        ) : (
          <div className="ai-match-content ai-match-settings">
            <p className="ai-match-settings-hint">
              Match settings will be available here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
