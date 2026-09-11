import { describe, expect, it } from 'vitest'
import type { Asset, Clip, TimelineModel, Track } from './types'
import { DEFAULT_TRACKS } from './types'
import {
  parseProjectJson,
  serializeProject,
  toProjectJson,
  ProjectError,
} from './project'

const tracks: Track[] = DEFAULT_TRACKS

const assets: Asset[] = [
  { id: 'asset-1', kind: 'image', name: 'scene.png', url: 'blob:1', meta: { width: 800, height: 1200 } },
  { id: 'asset-2', kind: 'audio', name: 'narration.mp3', url: 'blob:2', meta: { duration: 12 } },
]

const clips: Clip[] = [
  { id: 'clip-1', trackId: 'track-image', assetId: 'asset-1', name: 'scene.png', start: 0, duration: 6, confidence: 0.9, beatId: 'b0' },
  { id: 'clip-2', trackId: 'track-voice', assetId: 'asset-2', name: 'narration.mp3', start: 1, duration: 12 },
]

const model: TimelineModel = {
  tracks,
  assets,
  clips,
  playhead: 4,
  selectedClipId: 'clip-1',
}

describe('serializeProject / toProjectJson', () => {
  it('wraps the model in a versioned, typed envelope', () => {
    const file = serializeProject(model)
    expect(file.app).toBe('lava-studio')
    expect(file.projectVersion).toBe(1)
    expect(typeof file.savedAt).toBe('string')
    expect(file.model).toBe(model)
  })

  it('serializes to indented JSON preserving data', () => {
    const json = toProjectJson(model)
    const parsed = JSON.parse(json)
    expect(parsed.projectVersion).toBe(1)
    expect(parsed.model.clips).toHaveLength(2)
    expect(parsed.model.clips[0]).toMatchObject({ id: 'clip-1', start: 0, duration: 6 })
  })
})

describe('parseProjectJson', () => {
  it('round-trips a full project', () => {
    const restored = parseProjectJson(toProjectJson(model))
    expect(restored).toEqual(model)
    expect(restored.clips[0]).toMatchObject({ confidence: 0.9, beatId: 'b0' })
  })

  it('round-trips an empty project', () => {
    const empty: TimelineModel = { tracks, assets: [], clips: [], playhead: 0, selectedClipId: null }
    expect(parseProjectJson(toProjectJson(empty))).toEqual(empty)
  })

  it('rejects invalid JSON with a clear message', () => {
    expect(() => parseProjectJson('{not json')).toThrow(ProjectError)
    expect(() => parseProjectJson('{not json')).toThrow(/valid JSON/i)
  })

  it('rejects a non-project envelope', () => {
    expect(() => parseProjectJson(JSON.stringify({ hello: 'world' }))).toThrow(ProjectError)
    expect(() => parseProjectJson(JSON.stringify({ hello: 'world' }))).toThrow(/lava-studio/i)
  })

  it('rejects unsupported project versions', () => {
    const { projectVersion: _ignored, ...rest } = serializeProject(model)
    void _ignored
    const bad = { ...rest, projectVersion: 2 }
    expect(() => parseProjectJson(JSON.stringify(bad))).toThrow(/version/i)
  })

  it('rejects projects with malformed clips', () => {
    const file = serializeProject(model)
    file.model.clips = [{ id: 'clip-x' }] as unknown as Clip[]
    expect(() => parseProjectJson(JSON.stringify(file))).toThrow(/clip|trackId|duration/i)
  })

  it('rejects projects with malformed assets', () => {
    const file = serializeProject(model)
    file.model.assets = [{ nope: true }] as unknown as Asset[]
    expect(() => parseProjectJson(JSON.stringify(file))).toThrow(/asset|kind|name/i)
  })

  it('round-trips transcripts attached to the model', () => {
    const cleanModel: TimelineModel = {
      tracks,
      assets: [{ id: 'asset-2', kind: 'audio', name: 'narration.mp3', url: 'blob:2', meta: { duration: 12 } }],
      clips: [],
      playhead: 0,
      selectedClipId: null,
    }
    const withTranscripts: TimelineModel = {
      ...cleanModel,
      transcripts: {
        'asset-2': {
          text: 'Ali jungle mein gaya.',
          language: 'ur',
          segments: [
            {
              id: 0,
              text: 'Ali jungle mein gaya.',
              start: 0,
              end: 3,
              avgLogprob: -0.4,
              confidence: 67,
              words: [
                { word: 'Ali', start: 0, end: 1, confidence: 0.9 },
                { word: 'jungle', start: 1, end: 2, confidence: 0.8 },
              ],
            },
          ],
          pauses: [{ start: 1, end: 1.8, gap: 0.8 }],
        },
      },
    }
    const restored = parseProjectJson(toProjectJson(withTranscripts))
    expect(restored.transcripts?.['asset-2']?.segments[0]?.words[1]?.word).toBe('jungle')
    expect(restored.transcripts?.['asset-2']?.pauses).toHaveLength(1)
  })

  it('round-trips a project with no transcripts', () => {
    const cleanModel: TimelineModel = {
      tracks,
      assets: [{ id: 'asset-2', kind: 'audio', name: 'narration.mp3', url: 'blob:2', meta: { duration: 12 } }],
      clips: [],
      playhead: 0,
      selectedClipId: null,
    }
    expect(parseProjectJson(toProjectJson(cleanModel)).transcripts).toBeUndefined()
  })

  it('rejects a project with malformed transcripts', () => {
    const file = serializeProject({
      tracks,
      assets: [{ id: 'asset-2', kind: 'audio', name: 'narration.mp3', url: 'blob:2', meta: { duration: 12 } }],
      clips: [],
      playhead: 0,
      selectedClipId: null,
    })
    file.model.transcripts = { 'asset-2': { text: 'broken' } } as unknown as TimelineModel['transcripts']
    expect(() => parseProjectJson(JSON.stringify(file))).toThrow(/transcript/i)
  })
})