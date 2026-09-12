import { describe, expect, it, beforeEach } from 'vitest'
import type { Clip, TimelineModel } from '../editor/types'
import { useEditorStore } from './editorStore'

function createClip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: 'clip-1',
    trackId: 'track-video',
    assetId: 'asset-1',
    name: 'img.png',
    start: 0,
    duration: 2,
    ...overrides,
  }
}

const baseModel: TimelineModel = {
  tracks: [],
  assets: [],
  clips: [createClip()],
  playhead: 0,
  selectedClipId: null,
  transcripts: {},
}

describe('EditorStore motion actions', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
    useEditorStore.getState().loadProject(baseModel)
  })

  it('sets and clears motion on a clip', () => {
    const { setClipMotion, clips } = useEditorStore.getState()
    expect(clips[0].motion).toBeUndefined()

    setClipMotion('clip-1', { type: 'zoom-in', strength: 0.8 })
    let updated = useEditorStore.getState().clips
    expect(updated[0].motion).toEqual({ type: 'zoom-in', strength: 0.8 })

    setClipMotion('clip-1')
    updated = useEditorStore.getState().clips
    expect(updated[0].motion).toBeUndefined()
  })

  it('does not affect other clips', () => {
    useEditorStore.setState({
      clips: [createClip({ id: 'clip-1' }), createClip({ id: 'clip-2' })],
    })
    useEditorStore.getState().setClipMotion('clip-1', { type: 'pan-left', strength: 1 })
    const updated = useEditorStore.getState().clips
    expect(updated[0].motion).toEqual({ type: 'pan-left', strength: 1 })
    expect(updated[1].motion).toBeUndefined()
  })

  it('round-trips motion through loadProject/saveProject', async () => {
    const { setClipMotion } = useEditorStore.getState()
    setClipMotion('clip-1', { type: 'zoom-out', strength: 0.5 })

    const { toProjectJson, parseProjectJson } = await import('../editor/project')
    const json = toProjectJson(useEditorStore.getState())
    const model = parseProjectJson(json)

    expect(model.clips[0].motion).toEqual({ type: 'zoom-out', strength: 0.5 })
  })
})
