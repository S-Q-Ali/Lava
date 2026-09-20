import { useState, useEffect } from 'react'
import './MyGenerationsPanel.css'

interface Generation {
  id: string
  filename: string
  text: string
  voice: string
  duration: string
  date: string
  file_size: number
}

export function MyGenerationsPanel() {
  const [generations, setGenerations] = useState<Generation[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lava_my_generations')
      if (saved) setGenerations(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const removeGeneration = (id: string) => {
    setGenerations((prev) => {
      const next = prev.filter((g) => g.id !== id)
      localStorage.setItem('lava_my_generations', JSON.stringify(next))
      return next
    })
  }

  const clearAll = () => {
    setGenerations([])
    localStorage.removeItem('lava_my_generations')
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1048576) return `${(bytes / 1048576).toFixed(1)}MB`
    if (bytes > 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${bytes}B`
  }

  return (
    <section className="mygen-panel" aria-label="My Generations">
      <div className="mg-header">
        <span className="mg-icon">📂</span>
        <span className="mg-title">My Generations</span>
        <span className="mg-count">{generations.length}</span>
        {generations.length > 0 && (
          <button type="button" className="mg-clear-btn" onClick={clearAll}>Clear</button>
        )}
      </div>

      <div className="mg-body">
        {generations.length === 0 ? (
          <div className="mg-empty">
            <p>No generations yet.</p>
            <p>Generated audio files will appear here.</p>
          </div>
        ) : (
          <div className="mg-list">
            {generations.map((g) => (
              <div key={g.id} className="mg-row">
                <div className="mg-info">
                  <span className="mg-filename">{g.filename}</span>
                  <span className="mg-meta">
                    {g.voice} · {g.duration} · {formatSize(g.file_size)}
                  </span>
                  <span className="mg-date">{g.date}</span>
                </div>
                <div className="mg-actions">
                  <button type="button" className="mg-action-btn" title="Use in Voice Studio">
                    ▶
                  </button>
                  <button type="button" className="mg-action-btn mg-delete" title="Delete" onClick={() => removeGeneration(g.id)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
