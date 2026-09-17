import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './editorStore'

function addTestClip(start = 0, duration = 4) {
  const store = useEditorStore.getState()
  store.addAsset({
    id: 'asset-test',
    kind: 'image',
    name: 'test.png',
    url: 'blob:test',
    meta: { width: 100, height: 100 },
  })
  store.addClip({
    trackId: 'track-image',
    assetId: 'asset-test',
    name: 'test.png',
    start,
    duration,
  })
  return useEditorStore.getState().clips.at(-1)!
}

describe('editor timeline actions', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
  })

  it('splits a selected clip at the playhead and preserves undo', () => {
    const clip = addTestClip()
    useEditorStore.getState().selectClip(clip.id)
    useEditorStore.getState().setPlayhead(1.5)
    useEditorStore.getState().splitClip(clip.id, 1.5)

    expect(useEditorStore.getState().clips.map((item) => item.duration)).toEqual([1.5, 2.5])
    useEditorStore.getState().undo()
    expect(useEditorStore.getState().clips).toHaveLength(1)
    expect(useEditorStore.getState().clips[0].duration).toBe(4)
  })

  it('moves a clip across tracks and trims it without negative values', () => {
    const clip = addTestClip(2, 5)
    useEditorStore.getState().moveClipToTrack(clip.id, 'track-video')
    useEditorStore.getState().trimClip(clip.id, { start: -4, duration: 0 })

    const updated = useEditorStore.getState().clips[0]
    expect(updated.trackId).toBe('track-video')
    expect(updated.start).toBe(0)
    expect(updated.duration).toBeGreaterThan(0)
  })

  it('ripples following clips when a clip moves over them', () => {
    const first = addTestClip(0, 2)
    const second = addTestClip(2, 3)
    useEditorStore.getState().moveClipRipple(first.id, 4)

    const moved = useEditorStore.getState().clips.find((clip) => clip.id === first.id)
    const following = useEditorStore.getState().clips.find((clip) => clip.id === second.id)
    expect(moved?.start).toBe(4)
    expect(following?.start).toBe(6)
  })
})
