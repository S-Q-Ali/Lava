import { useEffect, useState } from 'react'
import TranscriptPanel from './TranscriptPanel'
import MatchPanel from './MatchPanel'
import { backendBaseUrl } from '../services/ffmpeg'
import './AIMatchPanel.css'

type AIMatchTab = 'voice-images' | 'settings'

export default function AIMatchPanel() {
  const [tab, setTab] = useState<AIMatchTab>('voice-images')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ready' | 'unavailable'>('checking')
  const [backendMessage, setBackendMessage] = useState('Checking local sidecar…')

  const checkBackend = async () => {
    setBackendStatus('checking')
    setBackendMessage('Checking local sidecar…')
    try {
      const response = await fetch(`${backendBaseUrl()}/api/health`)
      if (!response.ok) throw new Error('The sidecar health check failed.')
      const payload = await response.json() as { ffmpegVersion?: string }
      setBackendStatus('ready')
      setBackendMessage(payload.ffmpegVersion ? `FFmpeg ${payload.ffmpegVersion}` : 'Sidecar ready')
    } catch (error) {
      setBackendStatus('unavailable')
      setBackendMessage(error instanceof Error ? error.message : 'Sidecar unavailable.')
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void checkBackend(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <section className="ai-match-panel" aria-label="AI Match">
      <div className="ai-match-header">
        <span className="ai-match-icon">⚡</span>
        <span className="ai-match-title">AI Match</span>
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
            <div className="ai-match-setting-row">
              <span>Local sidecar</span>
              <strong className={`ai-match-status ai-match-status-${backendStatus}`}>
                {backendStatus === 'checking' ? 'Checking' : backendStatus === 'ready' ? 'Ready' : 'Unavailable'}
              </strong>
            </div>
            <p className="ai-match-settings-hint">{backendMessage}</p>
            <button type="button" onClick={() => void checkBackend()} disabled={backendStatus === 'checking'}>
              Check connection
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
