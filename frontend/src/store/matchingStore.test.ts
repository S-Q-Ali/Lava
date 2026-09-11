import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEditorStore } from './editorStore'
import { useMatchingStore } from './matchingStore'
import { registerAssetFile } from '../media/importer'
import type { Asset } from '../editor/types'
import type { Beat } from '../editor/beats'

const imageA: Asset = { id: 'a', kind: 'image', name: 'sunset.png', url: 'blob:a', meta: {} }
const imageB: Asset = { id: 'b', kind: 'image', name: 'forest.png', url: 'blob:b', meta: {} }

const beats: Beat[] = [
  { id: 'b0', text: 'sunset', start: 0, end: 2 },
  { id: 'b1', text: 'forest', start: 2, end: 5 },
]

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response
}

function matchResponse() {
  return {
    beats: [
      { beatId: 'b0', imageKey: 'a', confidence: 0.7, start: 0, end: 2, alternatives: [] },
      { beatId: 'b1', imageKey: 'b', confidence: 0.5, start: 2, end: 5, alternatives: [] },
    ],
  }
}

beforeEach(() => {
  useEditorStore.getState().reset()
  useMatchingStore.getState().clear()
  useEditorStore.getState().addAsset(imageA)
  useEditorStore.getState().addAsset(imageB)
  registerAssetFile('a', new File(['x'], 'sunset.png', { type: 'image/png' }))
  registerAssetFile('b', new File(['x'], 'forest.png', { type: 'image/png' }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useMatchingStore.match', () => {
  it('places one clip per beat on the image track and reports success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(matchResponse())))
    await useMatchingStore.getState().match(['a', 'b'], beats)

    const clips = useEditorStore.getState().clips
    expect(clips).toHaveLength(2)
    expect(clips[0]).toMatchObject({ trackId: 'track-image', assetId: 'a', beatId: 'b0', confidence: 0.7, start: 0, duration: 2 })
    expect(clips[1]).toMatchObject({ assetId: 'b', beatId: 'b1', confidence: 0.5, start: 2, duration: 3 })
    expect(useMatchingStore.getState().status).toEqual({ phase: 'success', count: 2 })
  })

  it('undoes the whole auto-match as a single step', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(matchResponse())))
    await useMatchingStore.getState().match(['a', 'b'], beats)
    expect(useEditorStore.getState().clips).toHaveLength(2)

    useEditorStore.getState().undo()
    expect(useEditorStore.getState().clips).toHaveLength(0)
  })

  it('re-matching replaces the previous auto clips but keeps manual ones', async () => {
    useEditorStore.getState().addClip({
      trackId: 'track-image',
      assetId: 'a',
      name: 'manual.png',
      duration: 9,
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(matchResponse())))

    await useMatchingStore.getState().match(['a', 'b'], beats)
    await useMatchingStore.getState().match(['a', 'b'], beats)

    const clips = useEditorStore.getState().clips
    expect(clips).toHaveLength(3)
    expect(clips.filter((c) => c.beatId)).toHaveLength(2)
    expect(clips.filter((c) => !c.beatId)).toHaveLength(1)
  })

  it('records an error status when the sidecar fails', async () => {
    const res = {
      ok: false,
      status: 422,
      json: async () => ({ error: { code: 'MATCH_FAILED', message: 'could not match' } }),
    } as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res))

    await useMatchingStore.getState().match(['a', 'b'], beats)
    expect(useMatchingStore.getState().status).toEqual({
      phase: 'error',
      error: 'could not match',
    })
    expect(useEditorStore.getState().clips).toHaveLength(0)
  })

  it('errors when no session files are registered', async () => {
    useMatchingStore.getState().clear()
    await useMatchingStore.getState().match(['missing'], beats)
    const status = useMatchingStore.getState().status
    expect(status.phase).toBe('error')
    if (status.phase === 'error') {
      expect(status.error).toMatch(/no image files/i)
    }
  })
})