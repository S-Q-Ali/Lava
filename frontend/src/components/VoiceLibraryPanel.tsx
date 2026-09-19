import { useState, useEffect, useCallback } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './VoiceLibraryPanel.css'

interface VoiceInfo {
  id: string
  name: string
  locale: string
  gender: string
  language: string
}

export function VoiceLibraryPanel() {
  const [voices, setVoices] = useState<VoiceInfo[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [filterLang, setFilterLang] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lava_voice_favorites')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const [loading, setLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const loadVoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterLang) params.set('language', filterLang)
      if (filterGender) params.set('gender', filterGender)
      if (search) params.set('search', search)

      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/voices?${params}`)
      const body = await res.json()
      setVoices(body.voices || [])
      setLanguages(body.languages || [])
    } catch {
      setVoices([])
    } finally {
      setLoading(false)
    }
  }, [filterLang, filterGender, search])

  useEffect(() => { void loadVoices() }, [loadVoices])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('lava_voice_favorites', JSON.stringify([...next]))
      return next
    })
  }

  const previewVoice = async (voiceId: string) => {
    setPlayingId(voiceId)
    try {
      const baseUrl = backendBaseUrl()
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/voices/preview/${voiceId}?text=Hello%20this%20is%20a%20preview.`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => { setPlayingId(null); URL.revokeObjectURL(url) }
      await audio.play()
    } catch {
      setPlayingId(null)
    }
  }

  return (
    <section className="voicelib-panel" aria-label="Voice Library">
      <div className="vl-header">
        <span className="vl-icon">🔊</span>
        <span className="vl-title">Voice Library</span>
        <span className="vl-count">{voices.length}</span>
      </div>

      <div className="vl-body">
        <div className="vl-toolbar">
          <input
            type="text"
            className="vl-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search voices…"
          />
          <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)}>
            <option value="">All Languages</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="vl-list">
          {loading && <p className="vl-loading">Loading voices…</p>}
          {!loading && voices.map((v) => (
            <div key={v.id} className="vl-voice-row">
              <button
                type="button"
                className={`vl-fav-btn${favorites.has(v.id) ? ' active' : ''}`}
                onClick={() => toggleFavorite(v.id)}
              >
                {favorites.has(v.id) ? '★' : '☆'}
              </button>
              <div className="vl-voice-info">
                <span className="vl-voice-name">{v.name}</span>
                <span className="vl-voice-meta">{v.locale} · {v.gender}</span>
              </div>
              <button
                type="button"
                className="vl-preview-btn"
                disabled={playingId === v.id}
                onClick={() => void previewVoice(v.id)}
              >
                {playingId === v.id ? '▶…' : '▶'}
              </button>
            </div>
          ))}
          {!loading && voices.length === 0 && (
            <p className="vl-empty">No voices found. Try a different filter.</p>
          )}
        </div>
      </div>
    </section>
  )
}
