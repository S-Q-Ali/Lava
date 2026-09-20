import { useState, useEffect } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import './HardwarePanel.css'

interface HardwareSpecs {
  ram_total_mb: number
  ram_available_mb: number
  vram_total_mb: number
  vram_available_mb: number
  cpu_cores: number
  cpu_name: string
  disk_free_mb: number
  disk_total_mb: number
  platform: string
  has_gpu: boolean
  gpu_name: string
}

interface ModelAssessment {
  model_id: string
  model_name: string
  scenario: 'easy' | 'medium' | 'hard' | 'insufficient'
  ram_ok: boolean
  vram_ok: boolean
  disk_ok: boolean
  cpu_ok: boolean
  bottleneck: string
  detail: string
}

interface HardwareAnalysis {
  specs: HardwareSpecs
  assessments: ModelAssessment[]
  overall_rating: 'capable' | 'adequate' | 'limited'
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

const SCENARIO_META = {
  easy: { label: 'Easy', color: '#2ecc71', icon: '✓', bg: 'rgba(46,204,113,0.08)' },
  medium: { label: 'Medium', color: '#f39c12', icon: '~', bg: 'rgba(243,156,18,0.08)' },
  hard: { label: 'Hard', color: '#e67e22', icon: '!', bg: 'rgba(230,126,34,0.08)' },
  insufficient: { label: 'Insufficient', color: '#e74c3c', icon: '✗', bg: 'rgba(231,76,60,0.08)' },
}

export function HardwarePanel() {
  const [data, setData] = useState<HardwareAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard' | 'insufficient'>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const baseUrl = backendBaseUrl()
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/hardware/analyze`)
        const body = await res.json()
        setData(body)
      } catch {
        setError('Failed to connect to backend')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="hw-panel">
        <div className="hw-loading">Analyzing hardware…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="hw-panel">
        <div className="hw-error">{error || 'No data'}</div>
      </div>
    )
  }

  const { specs, assessments } = data
  const filtered = filter === 'all' ? assessments : assessments.filter((a) => a.scenario === filter)

  const counts = {
    easy: assessments.filter((a) => a.scenario === 'easy').length,
    medium: assessments.filter((a) => a.scenario === 'medium').length,
    hard: assessments.filter((a) => a.scenario === 'hard').length,
    insufficient: assessments.filter((a) => a.scenario === 'insufficient').length,
  }

  return (
    <div className="hw-panel">
      {/* System Specs */}
      <div className="hw-specs">
        <div className="hw-spec-row">
          <span className="hw-spec-label">RAM</span>
          <span className="hw-spec-value">{formatMB(specs.ram_total_mb)}</span>
          <span className="hw-spec-dim">{formatMB(specs.ram_available_mb)} free</span>
        </div>
        <div className="hw-spec-row">
          <span className="hw-spec-label">GPU</span>
          <span className="hw-spec-value">
            {specs.has_gpu ? formatMB(specs.vram_total_mb) : 'None'}
          </span>
          <span className="hw-spec-dim">{specs.has_gpu ? specs.gpu_name.split(' ').slice(-2).join(' ') : 'CPU only'}</span>
        </div>
        <div className="hw-spec-row">
          <span className="hw-spec-label">CPU</span>
          <span className="hw-spec-value">{specs.cpu_cores} cores</span>
          <span className="hw-spec-dim">{specs.platform}</span>
        </div>
        <div className="hw-spec-row">
          <span className="hw-spec-label">Disk</span>
          <span className="hw-spec-value">{formatMB(specs.disk_free_mb)} free</span>
          <span className="hw-spec-dim">of {formatMB(specs.disk_total_mb)}</span>
        </div>
      </div>

      {/* Overall Rating */}
      <div className={`hw-rating hw-rating-${data.overall_rating}`}>
        <span className="hw-rating-label">System Rating:</span>
        <span className="hw-rating-value">
          {data.overall_rating === 'capable' && '✓ Capable — Most models will run well'}
          {data.overall_rating === 'adequate' && '~ Adequate — Some models may be heavy'}
          {data.overall_rating === 'limited' && '⚠ Limited — Use cloud APIs for heavy models'}
        </span>
      </div>

      {/* Scenario Filters */}
      <div className="hw-filters">
        <button type="button" className={`hw-filter${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All ({assessments.length})
        </button>
        <button type="button" className={`hw-filter hw-filter-easy${filter === 'easy' ? ' active' : ''}`} onClick={() => setFilter('easy')}>
          ✓ {counts.easy}
        </button>
        <button type="button" className={`hw-filter hw-filter-medium${filter === 'medium' ? ' active' : ''}`} onClick={() => setFilter('medium')}>
          ~ {counts.medium}
        </button>
        <button type="button" className={`hw-filter hw-filter-hard${filter === 'hard' ? ' active' : ''}`} onClick={() => setFilter('hard')}>
          ! {counts.hard}
        </button>
        <button type="button" className={`hw-filter hw-filter-insufficient${filter === 'insufficient' ? ' active' : ''}`} onClick={() => setFilter('insufficient')}>
          ✗ {counts.insufficient}
        </button>
      </div>

      {/* Model Assessments */}
      <div className="hw-list">
        {filtered.map((a) => {
          const meta = SCENARIO_META[a.scenario]
          return (
            <div key={a.model_id} className="hw-card" style={{ borderLeftColor: meta.color }}>
              <div className="hw-card-header">
                <span className="hw-card-name">{a.model_name}</span>
                <span className="hw-badge" style={{ background: meta.bg, color: meta.color }}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              <p className="hw-card-detail">{a.detail}</p>
              <div className="hw-card-checks">
                <span className={`hw-check ${a.ram_ok ? 'ok' : 'fail'}`}>RAM</span>
                {a.vram_ok !== undefined && (
                  <span className={`hw-check ${a.vram_ok ? 'ok' : 'fail'}`}>VRAM</span>
                )}
                <span className={`hw-check ${a.cpu_ok ? 'ok' : 'fail'}`}>CPU</span>
                <span className={`hw-check ${a.disk_ok ? 'ok' : 'fail'}`}>Disk</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
