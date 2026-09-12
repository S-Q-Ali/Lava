import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './editorStore'
import type { Asset } from '../editor/types'

const imageA: Asset = { id: 'a', kind: 'image', name: 'sunset.png', url: 'blob:a', meta: {} }
const imageB: Asset = { id: 'b', kind: 'image', name: 'forest.png', url: 'blob:b', meta: {} }

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().addAsset(imageA)
  useEditorStore.getState().addAsset(imageB)
})

function applyVideoClips() {
  useEditorStore.getState().applyMatch(
    [
      { trackId: 'video', assetId: 'a', name: 'a', start: 0, end: 2, confidence: 0.6, beatId: 'b0' },
      { trackId: 'video', assetId: 'a', name: 'a', start: 2, end: 4, confidence: 0.6, beatId: 'b1' },
      { trackId: 'video', assetId: 'b', name: 'b', start: 4.5, end: 6.5, confidence: 0.6, beatId: 'b2' },
    ],
    [],
  )
  return [...useEditorStore.getState().clips].sort((x, y) => x.start - y.start)
}

describe('editorStore transitions state', () => {
  it('starts empty and reset clears transitions', () => {
    expect(useEditorStore.getState().transitions).toEqual([])
    applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    expect(useEditorStore.getState().transitions.length).toBeGreaterThan(0)
    useEditorStore.getState().reset()
    expect(useEditorStore.getState().transitions).toEqual([])
    expect(useEditorStore.getState().selectedTransitionId).toBeNull()
  })

  it('suggests a match cut for same-asset pairs and a dissolve for beat-gap pairs', () => {
    const clips = applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    const transitions = useEditorStore.getState().transitions
    const match = transitions.find((t) => t.kind === 'between' && t.type === 'match')
    const dissolve = transitions.find((t) => t.kind === 'between' && t.type === 'dissolve')
    expect(match?.kind === 'between' && match).toBeTruthy()
    if (match?.kind !== 'between') throw new Error('missing match transition')
    expect(match.clipAId).toBe(clips[0].id)
    expect(match.clipBId).toBe(clips[1].id)
    expect(match.reason).toBe('continuity')
    expect(match.rationale).toContain('Same image continues')
    if (dissolve?.kind !== 'between') throw new Error('missing dissolve transition')
    expect(dissolve.clipAId).toBe(clips[1].id)
    expect(dissolve.clipBId).toBe(clips[2].id)
    expect(dissolve.reason).toBe('passage')
    expect(dissolve.rationale).toContain('passage of time')
  })

  it('overrideTransition flips source to manual and survives re-suggestion', () => {
    const clips = applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    const match = useEditorStore.getState().transitions.find(
      (t) => t.kind === 'between' && t.clipAId === clips[0].id,
    )
    if (!match || match.kind !== 'between') throw new Error('missing track transition')
    useEditorStore.getState().overrideTransition(match.id, 'fade', 1.2)
    const overridden = useEditorStore.getState().transitions.find((t) => t.id === match.id)
    expect(overridden?.source).toBe('manual')
    if (overridden?.kind !== 'between') throw new Error('expected between')
    expect(overridden.type).toBe('fade')
    expect(overridden.duration).toBe(1.2)

    useEditorStore.getState().suggestTransitions()
    const kept = useEditorStore.getState().transitions.find((t) => t.id === match.id)
    expect(kept).toBeTruthy()
    expect(kept?.source).toBe('manual')
  })

  it('removeTransition removes only the targeted transition', () => {
    applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    const ids = useEditorStore.getState().transitions.map((t) => t.id)
    expect(ids.length).toBeGreaterThan(1)
    useEditorStore.getState().removeTransition(ids[0])
    const remaining = useEditorStore.getState().transitions.map((t) => t.id)
    expect(remaining).not.toContain(ids[0])
    expect(remaining).toHaveLength(ids.length - 1)
  })

  it('keeps orphaned transitions after clip removal and resolves exactly the invalid ones', () => {
    const clips = applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    useEditorStore.getState().removeClip(clips[0].id)
    const transitions = useEditorStore.getState().transitions
    expect(transitions.some((t) => 'clipAId' in t && t.clipAId === clips[0].id)).toBe(true)
    useEditorStore.getState().resolveInvalidTransitions()
    const remaining = useEditorStore.getState().transitions
    expect(remaining.some((t) => 'clipAId' in t && t.clipAId === clips[0].id)).toBe(false)
  })

  it('loadProject hydrates transitions and defaults missing transitions to empty', () => {
    const clips = applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    const state = useEditorStore.getState()
    const model = {
      version: 1,
      tracks: state.tracks,
      assets: state.assets,
      clips: state.clips,
      playhead: 0,
      selectedClipId: null,
      transitions: state.transitions,
    }
    useEditorStore.getState().reset()
    useEditorStore.getState().loadProject(model)
    expect(useEditorStore.getState().transitions.map((t) => t.id)).toEqual(
      model.transitions.map((t) => t.id),
    )

    useEditorStore.getState().loadProject({
      version: 1,
      tracks: state.tracks,
      assets: state.assets,
      clips: clips,
      playhead: 0,
      selectedClipId: null,
    })
    expect(useEditorStore.getState().transitions).toEqual([])
  })

  it('setSelectedTransitionId tracks the selected chip', () => {
    useEditorStore.getState().setSelectedTransitionId('t-123')
    expect(useEditorStore.getState().selectedTransitionId).toBe('t-123')
    useEditorStore.getState().setSelectedTransitionId(null)
    expect(useEditorStore.getState().selectedTransitionId).toBeNull()
  })
})