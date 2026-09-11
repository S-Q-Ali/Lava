import type { Asset, Clip, TimelineModel, Track } from './types'
import { TRACK_TYPES } from './types'

export const PROJECT_APP = 'lava-studio'
export const PROJECT_VERSION = 1

export interface ProjectFile {
  app: typeof PROJECT_APP
  projectVersion: typeof PROJECT_VERSION
  savedAt: string
  model: TimelineModel
}

export class ProjectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectError'
  }
}

export function serializeProject(model: TimelineModel): ProjectFile {
  return {
    app: PROJECT_APP,
    projectVersion: PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    model,
  }
}

export function toProjectJson(model: TimelineModel): string {
  return JSON.stringify(serializeProject(model), null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireRecord(value: unknown, what: string): Record<string, unknown> {
  if (!isRecord(value)) throw new ProjectError(`Project ${what} is malformed.`)
  return value
}

function isTrack(value: unknown): value is Track {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    (TRACK_TYPES as readonly string[]).includes(value.type)
  )
}

function isAsset(value: unknown): value is Asset {
  if (!isRecord(value)) return false
  const kind = value.kind
  return (
    typeof value.id === 'string' &&
    (kind === 'image' || kind === 'video' || kind === 'audio') &&
    typeof value.name === 'string' &&
    typeof value.url === 'string' &&
    (value.meta === undefined || isRecord(value.meta))
  )
}

function isClip(value: unknown): value is Clip {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.trackId === 'string' &&
    typeof value.assetId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.start === 'number' &&
    typeof value.duration === 'number'
  )
}

export function parseProjectModel(value: unknown): TimelineModel {
  const raw = requireRecord(value, 'model')
  if (!Array.isArray(raw.tracks)) throw new ProjectError('Project model is missing tracks.')
  const tracks = raw.tracks.map((t) => {
    const track = requireRecord(t, 'track')
    if (!isTrack(track)) throw new ProjectError('Project model contains a malformed track.')
    return track
  })
  if (!Array.isArray(raw.assets)) throw new ProjectError('Project model is missing assets.')
  const assets = raw.assets.map((a) => {
    const asset = requireRecord(a, 'asset')
    if (!isAsset(asset)) throw new ProjectError('Project model contains a malformed asset.')
    return asset
  })
  if (!Array.isArray(raw.clips)) throw new ProjectError('Project model is missing clips.')
  const clips = raw.clips.map((c) => {
    const clip = requireRecord(c, 'clip')
    if (!isClip(clip)) throw new ProjectError('Project model contains a malformed clip (needs id, trackId, assetId, name, start, duration).')
    return clip
  })
  const playhead = typeof raw.playhead === 'number' ? raw.playhead : 0
  const selectedClipId = typeof raw.selectedClipId === 'string' ? raw.selectedClipId : null
  return { tracks, assets, clips, playhead, selectedClipId }
}

export function parseProjectJson(json: string): TimelineModel {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new ProjectError('Project file is not valid JSON.')
  }
  const envelope = requireRecord(data, 'file')
  if (envelope.app !== PROJECT_APP) {
    throw new ProjectError('Not a lava-studio project file.')
  }
  if (envelope.projectVersion !== PROJECT_VERSION) {
    throw new ProjectError(`Unsupported project version ${String(envelope.projectVersion)}.`)
  }
  return parseProjectModel(envelope.model)
}