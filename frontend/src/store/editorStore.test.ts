import { describe, expect, it, beforeEach } from 'vitest'
import { useEditorStore } from './editorStore'
import type { Asset, TimelineModel } from '../editor/types'
import { DEFAULT_TRACKS } from '../editor/types'

const imageAsset: Asset = {
  id: 'asset-img',
  kind: 'image',
  name: 'scene.png',
  url: 'blob:scene',
  meta: { width: 800, height: 1200 },
}

const audioAsset: Asset = {
  id: 'asset-voice',
  kind: 'audio',
  name: 'narration.mp3',
  url: 'blob:voice',
  meta: { duration: 12 },
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

describe('editorStore timeline actions', () => {
  it('adds assets and clips', () => {
    const s = useEditorStore.getState()
    s.addAsset(imageAsset)
    s.addAsset(audioAsset)

    const withAssets = useEditorStore.getState()
    expect(withAssets.assets).toHaveLength(2)

    withAssets.addClip({
      trackId: 'track-image',
      assetId: imageAsset.id,
      name: imageAsset.name,
      duration: 6,
    })
    const withClip = useEditorStore.getState()
    expect(withClip.clips).toHaveLength(1)
    expect(withClip.clips[0]).toMatchObject({
      trackId: 'track-image',
      assetId: 'asset-img',
      duration: 6,
    })
  })

  it('splits a clip at the playhead', () => {
    const s = useEditorStore.getState()
    s.addAsset(imageAsset)
    s.addClip({
      trackId: 'track-image',
      assetId: imageAsset.id,
      name: imageAsset.name,
      duration: 10,
    })
    const clipId = useEditorStore.getState().clips[0].id

    useEditorStore.getState().setPlayhead(4)
    useEditorStore.getState().splitClip(clipId, useEditorStore.getState().playhead)

    const clips = useEditorStore.getState().clips
    expect(clips).toHaveLength(2)
    expect(clips.map((c) => c.start)).toEqual([0, 4])
  })

  it('removing an asset removes its clips', () => {
    const s = useEditorStore.getState()
    s.addAsset(imageAsset)
    s.addClip({
      trackId: 'track-image',
      assetId: imageAsset.id,
      name: imageAsset.name,
      duration: 6,
    })
    const withClip = useEditorStore.getState()
    expect(withClip.clips).toHaveLength(1)

    useEditorStore.getState().removeAsset(imageAsset.id)
    expect(useEditorStore.getState().clips).toHaveLength(0)
    expect(useEditorStore.getState().assets).toHaveLength(0)
  })
})

describe('editorStore loadProject', () => {
  it('hydrates state and drops previous content', () => {
    const s = useEditorStore.getState()
    s.addAsset(imageAsset)
    s.addClip({
      trackId: 'track-image',
      assetId: imageAsset.id,
      name: imageAsset.name,
      duration: 6,
    })

    const loaded: TimelineModel = {
      tracks: [{ id: 'track-video', type: 'video', name: 'video' }],
      assets: [imageAsset],
      clips: [
        { id: 'clip-a', trackId: 'track-video', assetId: imageAsset.id, name: 'scene.png', start: 2, duration: 4 },
      ],
      playhead: 3,
      selectedClipId: 'clip-a',
    }

    useEditorStore.getState().loadProject(loaded)

    const st = useEditorStore.getState()
    expect(st.tracks).toEqual(loaded.tracks)
    expect(st.assets).toEqual([imageAsset])
    expect(st.clips).toEqual(loaded.clips)
    expect(st.playhead).toBe(3)
    expect(st.selectedClipId).toBe('clip-a')
  })

  it('clears undo history so undo after load does nothing', () => {
    const s = useEditorStore.getState()
    s.addAsset(imageAsset)
    useEditorStore.getState().loadProject({
      tracks: DEFAULT_TRACKS,
      assets: [],
      clips: [],
      playhead: 0,
      selectedClipId: null,
    })
    useEditorStore.getState().undo()
    expect(useEditorStore.getState().assets).toHaveLength(0)
  })
})

describe('editorStore undo/redo (zundo)', () => {
  it('undoes and redoes clip edits without reverting playhead/selection', () => {
    const s = useEditorStore.getState()
    s.addAsset(imageAsset)
    s.addClip({
      trackId: 'track-image',
      assetId: imageAsset.id,
      name: imageAsset.name,
      duration: 6,
    })
    const clipId = useEditorStore.getState().clips[0].id

    useEditorStore.getState().setPlayhead(2)
    useEditorStore.getState().moveClip(clipId, 5)
    useEditorStore.getState().selectClip(clipId)

    let st = useEditorStore.getState()
    expect(st.clips[0].start).toBe(5)
    expect(st.playhead).toBe(2)
    expect(st.selectedClipId).toBe(clipId)

    st.undo()
    st = useEditorStore.getState()
    expect(st.clips[0].start).toBe(0)
    expect(st.playhead).toBe(2)

    st.redo()
    st = useEditorStore.getState()
    expect(st.clips[0].start).toBe(5)
    expect(st.selectedClipId).toBe(clipId)
  })

  it('supports undo across separate edits', () => {
    const s = useEditorStore.getState()
    s.addAsset(imageAsset)
    s.addAsset(audioAsset)
    s.addClip({
      trackId: 'track-image',
      assetId: imageAsset.id,
      name: imageAsset.name,
      duration: 6,
    })

    let st = useEditorStore.getState()
    st.addClip({
      trackId: 'track-voice',
      assetId: audioAsset.id,
      name: audioAsset.name,
      duration: 12,
      start: 6,
    })
    st = useEditorStore.getState()
    expect(st.clips).toHaveLength(2)

    st.undo()
    st = useEditorStore.getState()
    expect(st.clips).toHaveLength(1)

    st.undo()
    st = useEditorStore.getState()
    expect(st.clips).toHaveLength(0)
    expect(st.assets).toHaveLength(2)
  })
})