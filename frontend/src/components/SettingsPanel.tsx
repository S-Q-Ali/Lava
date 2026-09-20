import { useState, useEffect, useCallback, useRef } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import { HardwarePanel } from './HardwarePanel'
import './SettingsPanel.css'

interface ModelInfo {
  id: string
  name: string
  description: string
  directory: string
  size_mb: number
  download_source: string
  download_url: string
  download_command: string
  required: boolean
  installed: boolean
  size_on_disk: number
  download_status: string
  download_progress: number
  download_message: string
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}

export function SettingsPanel() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [groqKey, setGroqKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [cerebrasKey, setCerebrasKey] = useState('')
  const [mistralKey, setMistralKey] = useState('')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null)
  const modelsRef = useRef(models)
  modelsRef.current = models

  const fetchModels = useCallback(async () => {
    try {
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/models/status`)
      const body = await res.json()
      setModels(body.models ?? [])
    } catch {
      // Connection failed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load saved API keys
    setGroqKey(localStorage.getItem('groq_api_key') || '')
    setGeminiKey(localStorage.getItem('gemini_api_key') || '')
    setCerebrasKey(localStorage.getItem('cerebras_api_key') || '')
    setMistralKey(localStorage.getItem('mistral_api_key') || '')
  }, [])

  useEffect(() => {
    void fetchModels()
    const interval = setInterval(() => {
      const hasActive = modelsRef.current.some((m) =>
        m.download_status === 'downloading' || m.download_status === 'installing',
      )
      if (hasActive) void fetchModels()
    }, 1000)
    return () => clearInterval(interval)
  }, [fetchModels])

  const handleDownload = async (modelId: string) => {
    try {
      setDownloadMsg(null)
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/models/download/${modelId}`, {
        method: 'POST',
      })
      const body = await res.json()
      if (!body.success) {
        setDownloadMsg(body.error || 'Download failed')
        setTimeout(() => setDownloadMsg(null), 3000)
      }
      void fetchModels()
    } catch {
      setDownloadMsg('Connection failed')
      setTimeout(() => setDownloadMsg(null), 3000)
    }
  }

  const handleDelete = async (modelId: string) => {
    try {
      const baseUrl = backendBaseUrl()
      await fetch(`${baseUrl.replace(/\/$/, '')}/api/models/${modelId}`, {
        method: 'DELETE',
      })
      void fetchModels()
    } catch {
      // Connection failed
    }
  }

  const saveKey = (keyName: string, value: string) => {
    if (value.trim()) {
      localStorage.setItem(keyName, value.trim())
    } else {
      localStorage.removeItem(keyName)
    }
    setSavedMsg(keyName)
    setTimeout(() => setSavedMsg(null), 1500)
  }

  const installedCount = models.filter((m) => m.installed).length
  const totalSize = models.reduce((sum, m) => sum + m.size_mb, 0)

  return (
    <section className="settings-panel" aria-label="Settings">
      <div className="settings-header">
        <span className="settings-icon">⚙️</span>
        <span className="settings-title">Settings</span>
      </div>

      <div className="settings-body">
        {/* Hardware Analysis */}
        <div className="settings-section">
          <h4 className="settings-section-title">Hardware Analysis</h4>
          <HardwarePanel />
        </div>

        {/* API Keys */}
        <div className="settings-section">
          <h4 className="settings-section-title">API Keys</h4>

          <label className="settings-field">
            <span>Groq API Key</span>
            <div className="settings-key-row">
              <input
                type="password"
                placeholder="gsk_... (free at console.groq.com)"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
              />
              <button type="button" className="settings-save-btn" onClick={() => saveKey('groq_api_key', groqKey)}>
                {savedMsg === 'groq_api_key' ? '✓' : 'Save'}
              </button>
            </div>
            <span className="settings-hint">Free tier: 30 RPM. Transcription + Scripts.</span>
          </label>

          <label className="settings-field">
            <span>Google Gemini API Key</span>
            <div className="settings-key-row">
              <input
                type="password"
                placeholder="AIza... (free at aistudio.google.com)"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <button type="button" className="settings-save-btn" onClick={() => saveKey('gemini_api_key', geminiKey)}>
                {savedMsg === 'gemini_api_key' ? '✓' : 'Save'}
              </button>
            </div>
            <span className="settings-hint">Free tier: 1500 req/day. Image generation.</span>
          </label>

          <label className="settings-field">
            <span>Cerebras API Key</span>
            <div className="settings-key-row">
              <input
                type="password"
                placeholder="csk-... (free at cloud.cerebras.ai)"
                value={cerebrasKey}
                onChange={(e) => setCerebrasKey(e.target.value)}
              />
              <button type="button" className="settings-save-btn" onClick={() => saveKey('cerebras_api_key', cerebrasKey)}>
                {savedMsg === 'cerebras_api_key' ? '✓' : 'Save'}
              </button>
            </div>
            <span className="settings-hint">Free tier: Fast inference. Fallback for scripts.</span>
          </label>

          <label className="settings-field">
            <span>Mistral API Key</span>
            <div className="settings-key-row">
              <input
                type="password"
                placeholder="mist-... (free at console.mistral.ai)"
                value={mistralKey}
                onChange={(e) => setMistralKey(e.target.value)}
              />
              <button type="button" className="settings-save-btn" onClick={() => saveKey('mistral_api_key', mistralKey)}>
                {savedMsg === 'mistral_api_key' ? '✓' : 'Save'}
              </button>
            </div>
            <span className="settings-hint">Free tier: Volume. Volume fallback.</span>
          </label>
        </div>

        {/* Models */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h4 className="settings-section-title">AI Models</h4>
            <span className="settings-model-count">
              {installedCount}/{models.length} installed · {formatSize(totalSize * 1024 * 1024)} total
            </span>
          </div>

          {loading ? (
            <p className="settings-hint">Loading models...</p>
          ) : (
            <div className="settings-models">
              {downloadMsg && <p className="settings-download-msg">{downloadMsg}</p>}
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`settings-model-card ${model.installed ? 'installed' : ''} ${model.required ? 'required' : ''}`}
                >
                  <div className="settings-model-info">
                    <div className="settings-model-header">
                      <span className="settings-model-name">{model.name}</span>
                      {model.required && <span className="settings-badge required">Required</span>}
                      {model.installed && <span className="settings-badge installed">Installed</span>}
                    </div>
                    <p className="settings-model-desc">{model.description}</p>
                    <div className="settings-model-meta">
                      <span>{model.size_mb} MB</span>
                      {model.installed && model.size_on_disk > 0 && (
                        <span>· On disk: {formatSize(model.size_on_disk)}</span>
                      )}
                      <span>· {model.download_source}</span>
                    </div>
                  </div>

                  <div className="settings-model-actions">
                    {model.download_status === 'downloading' ? (
                      <div className="settings-progress">
                        <div className="settings-progress-circle">
                          <svg viewBox="0 0 36 36">
                            <circle className="settings-progress-circle-bg" cx="18" cy="18" r="15.9" />
                            <circle
                              className="settings-progress-circle-fill"
                              cx="18" cy="18" r="15.9"
                              strokeDasharray="100"
                              strokeDashoffset={100 - model.download_progress}
                            />
                          </svg>
                          <span className="settings-progress-circle-text">
                            {Math.round(model.download_progress)}%
                          </span>
                        </div>
                        <span className="settings-progress-text">
                          {model.download_message || 'Downloading...'}
                        </span>
                      </div>
                    ) : model.download_status === 'installing' ? (
                      <div className="settings-progress">
                        <div className="settings-progress-circle installing">
                          <svg viewBox="0 0 36 36">
                            <circle className="settings-progress-circle-bg" cx="18" cy="18" r="15.9" />
                            <circle
                              className="settings-progress-circle-fill"
                              cx="18" cy="18" r="15.9"
                              strokeDasharray="100"
                              strokeDashoffset="0"
                            />
                          </svg>
                          <span className="settings-progress-circle-text">✓</span>
                        </div>
                        <span className="settings-progress-text">
                          {model.download_message || 'Verifying installation...'}
                        </span>
                      </div>
                    ) : model.download_status === 'error' ? (
                      <div className="settings-download-error">
                        <span className="settings-error-text">{model.download_message || 'Download failed'}</span>
                        <button
                          type="button"
                          className="settings-download-btn"
                          onClick={() => void handleDownload(model.id)}
                        >
                          Retry
                        </button>
                      </div>
                    ) : model.installed ? (
                      <button
                        type="button"
                        className="settings-delete-btn"
                        onClick={() => void handleDelete(model.id)}
                      >
                        Delete
                      </button>
                    ) : model.download_source === 'pip' ? (
                      <span className="settings-badge auto">Auto-downloads on first use</span>
                    ) : (
                      <button
                        type="button"
                        className="settings-download-btn"
                        onClick={() => void handleDownload(model.id)}
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About */}
        <div className="settings-section">
          <h4 className="settings-section-title">About</h4>
          <div className="settings-about">
            <span className="settings-about-name">Lava Studio</span>
            <span className="settings-about-ver">v1.0.0-beta · M11</span>
            <span className="settings-about-desc">AI Video Studio — Local-first, production-grade NLE</span>
          </div>
        </div>
      </div>
    </section>
  )
}
