import { describe, expect, it, beforeEach } from 'vitest'
import { useEditorStore } from './editorStore'
import type { Asset, TimelineModel, Transcript } from '../editor/types'
import { DEFAULT_TRACKS } from '../editor/types'

const transcript: Transcript = {
  text: 'Ali jungle mein gaya.\nWahan sher tha.',
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
        { word: 'mein', start: 2, end: 2.5, confidence: 0.8 },
        { word: 'gaya.', start: 2.5, end: 3, confidence: 0.8 },
      ],
    },
    {
      id: 1,
      text: 'Wahan sher tha.',
      start: 3,
      end: 5,
      avgLogprob: -0.3,
      confidence: 70,
      words: [{ word: 'Wahan', start: 3, end: 3.5, confidence: 0.7 }],
    },
  ],
  pauses: [{ start: 1, end: 1.5, gap: 0.5 }],
}

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

describe('editorStore transcripts', () => {
  it('sets a transcript for an asset', () => {
    useEditorStore.getState().setTranscript(audioAsset.id, transcript)
    const t = useEditorStore.getState().transcripts[audioAsset.id]
    expect(t?.segments).toHaveLength(2)
    expect(t?.pauses[0]?.gap).toBe(0.5)
  })

  it('recomputes segment and overall text after a word edit', () => {
    const s = useEditorStore.getState()
    s.setTranscript(audioAsset.id, transcript)
    useEditorStore.getState().updateTranscriptWord(audioAsset.id, 1, 0, 'Idhar')

    const t = useEditorStore.getState().transcripts[audioAsset.id]
    expect(t?.segments[1]?.words[0]?.word).toBe('Idhar')
    expect(t?.segments[1]?.text).toBe('Idhar')
    expect(t?.text).toBe('Ali jungle mein gaya.\nIdhar')
  })

  it('ignores word edits with no transcript present', () => {
    useEditorStore.getState().updateTranscriptWord(audioAsset.id, 0, 0, 'x')
    expect(useEditorStore.getState().transcripts).toEqual({})
  })

  it('hydrates transcripts on loadProject', () => {
    useEditorStore.getState().loadProject({
      tracks: DEFAULT_TRACKS,
      assets: [audioAsset],
      clips: [],
      playhead: 0,
      selectedClipId: null,
      transcripts: { [audioAsset.id]: transcript },
    })
    expect(useEditorStore.getState().transcripts[audioAsset.id]?.language).toBe('ur')
  })

  it('treats a missing transcripts key as an empty map', () => {
    useEditorStore.getState().loadProject({
      tracks: DEFAULT_TRACKS,
      assets: [],
      clips: [],
      playhead: 0,
      selectedClipId: null,
    })
    expect(useEditorStore.getState().transcripts).toEqual({})
  })

  it('makes word edits undoable', () => {
    const s = useEditorStore.getState()
    s.setTranscript(audioAsset.id, transcript)
    useEditorStore.getState().updateTranscriptWord(audioAsset.id, 0, 0, 'Ali Baba')

    let t = useEditorStore.getState().transcripts[audioAsset.id]
    expect(t?.segments[0]?.words[0]?.word).toBe('Ali Baba')

    useEditorStore.getState().undo()
    t = useEditorStore.getState().transcripts[audioAsset.id]
    expect(t?.segments[0]?.words[0]?.word).toBe('Ali')

    useEditorStore.getState().redo()
    t = useEditorStore.getState().transcripts[audioAsset.id]
    expect(t?.segments[0]?.words[0]?.word).toBe('Ali Baba')
  })
})