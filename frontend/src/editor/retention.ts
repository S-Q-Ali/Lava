import type { Beat } from './beats'
import type { Clip } from './types'

export interface RetentionMetric {
  id: string
  label: string
  value: number
  max: number
  description: string
}

export interface RetentionAnalysis {
  metrics: RetentionMetric[]
  overall: number
  suggestions: string[]
}

const PACING_WINDOW = 3

function clipDurations(clips: Clip[], beatMap: Map<string, Beat>): number[] {
  return clips
    .filter((c) => c.beatId && beatMap.has(c.beatId))
    .sort((a, b) => a.start - b.start)
    .map((c) => c.duration)
}

function pacingVariation(durations: number[]): number {
  if (durations.length < 2) return 0
  const mean = durations.reduce((s, d) => s + d, 0) / durations.length
  if (mean < 0.01) return 0
  const variance = durations.reduce((s, d) => s + (d - mean) ** 2, 0) / durations.length
  const cv = Math.sqrt(variance) / mean
  return Math.min(1, cv * 2)
}

function hookStrength(beats: Beat[]): number {
  if (beats.length === 0) return 0
  const first = beats[0]
  const text = first.text.toLowerCase()
  const hookPatterns = [
    /\b(did you know|imagine|what if|secret|hidden|never|always|every)\b/,
    /\b(stop|listen|watch|look|wait|hold)\b/,
    /\?$/,
    /!$/,
  ]
  let score = 0
  for (const pattern of hookPatterns) {
    if (pattern.test(text)) score += 0.25
  }
  return Math.min(1, score)
}

function pacingScore(durations: number[]): number {
  if (durations.length < PACING_WINDOW) return 0.5
  let changes = 0
  for (let i = 1; i < durations.length; i++) {
    const diff = Math.abs(durations[i] - durations[i - 1])
    if (diff > 0.3) changes++
  }
  const changeRate = changes / (durations.length - 1)
  if (changeRate < 0.15) return 0.3
  if (changeRate > 0.6) return 0.7
  return 0.5 + (changeRate - 0.15) * 0.556
}

function narrativeProgression(beats: Beat[]): number {
  if (beats.length < 3) return 0.3
  const textLen = beats.map((b) => b.text.length)
  const firstHalf = textLen.slice(0, Math.floor(textLen.length / 2))
  const secondHalf = textLen.slice(Math.floor(textLen.length / 2))
  const avgFirst = firstHalf.reduce((s, l) => s + l, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((s, l) => s + l, 0) / secondHalf.length
  if (avgSecond > avgFirst * 1.2) return 0.8
  if (avgSecond < avgFirst * 0.7) return 0.6
  return 0.5
}

export function analyzeRetention(
  beats: Beat[],
  clips: Clip[],
): RetentionAnalysis {
  const beatMap = new Map(beats.map((b) => [b.id, b]))
  const durations = clipDurations(clips, beatMap)

  const hook = hookStrength(beats)
  const pacing = pacingScore(durations)
  const pacingVar = pacingVariation(durations)
  const progression = narrativeProgression(beats)

  const metrics: RetentionMetric[] = [
    {
      id: 'hook',
      label: 'Hook Strength',
      value: hook,
      max: 1,
      description: 'How attention-grabbing the opening beat is',
    },
    {
      id: 'pacing',
      label: 'Pacing Score',
      value: pacing,
      max: 1,
      description: 'Variety of clip durations for rhythm',
    },
    {
      id: 'pacing-var',
      label: 'Duration Variation',
      value: pacingVar,
      max: 1,
      description: 'Coefficient of variation in beat durations',
    },
    {
      id: 'progression',
      label: 'Narrative Progression',
      value: progression,
      max: 1,
      description: 'Whether content builds toward a conclusion',
    },
  ]

  const overall = metrics.reduce((s, m) => s + m.value, 0) / metrics.length

  const suggestions: string[] = []
  if (hook < 0.3) suggestions.push('Consider a stronger opening hook (question, bold statement, or pause).')
  if (pacing < 0.4) suggestions.push('Add more duration variety to create rhythm (mix short and long clips).')
  if (progression < 0.5) suggestions.push('Ensure content builds toward a clear conclusion or payoff.')
  if (durations.length > 0 && durations.every((d) => d > 3)) {
    suggestions.push('Some clips may be too long — shorter clips maintain attention better.')
  }

  return { metrics, overall, suggestions }
}
