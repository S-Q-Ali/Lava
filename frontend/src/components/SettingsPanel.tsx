import { useState, useEffect, useCallback } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
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
  const [groqKeySaved, setGroqKeySaved] = useState(false)

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
    void fetchModels()
    // Poll progress every 2s for active downloads
    const interval = setInterval(() => {
      const hasActive = models.some((m) => m.download_status === 'downloading')
      if (hasActive) void fetchModels()
    }, 2000)
    return () => clearInterval(interval)
  }, [fetchModels, models])

  const handleDownload = async (modelId: string) => {
    try {
      const baseUrl = backendBaseUrl()
      await fetch(`${baseUrl.replace(/\/$/, '')}/api/models/download/${modelId}`, {
        method: 'POST',
      })
      // Refresh immediately
      void fetchModels()
    } catch {
      // Connection failed
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

  const saveGroqKey = () => {
    if (groqKey.trim()) {
      localStorage.setItem('groq_api_key', groqKey.trim())
      setGroqKeySaved(true)
      setTimeout(() => setGroqKeySaved(false), 2000)
    }
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
              <button
                type="button"
                className="settings-save-btn"
                onClick={saveGroqKey}
              >
                {groqKeySaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <span className="settings-hint">
              Free tier: 30 RPM, 14,400 req/day. Get key at{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                console.groq.com
              </a>
            </span>
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
                        <div className="settings-progress-bar">
                          <div
                            className="settings-progress-fill"
                            style={{ width: `${model.download_progress}%` }}
                          />
                        </div>
                        <span className="settings-progress-text">
                          {model.download_message || 'Downloading...'}
                        </span>
                      </div>
                    ) : model.installed ? (
                      <button
                        type="button"
                        className="settings-delete-btn"
                        onClick={() => void handleDelete(model.id)}
                      >
                        Delete
                      </button>
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
      </div>
    </section>
  )
}
