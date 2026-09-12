import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from './editorStore'
import type { Transcript } from '../editor/types'

const transcript: Transcript = {
  text: 'Warm sunsets feel rare. Green forests sound calm.',
  language: 'en',
  segments: [
    {
      id: 0,
      text: 'Warm sunsets feel rare.',
      start: 0,
      end: 2,
      avgLogprob: -0.2,
      confidence: 0.9,
      words: [
        { word: 'Warm', start: 0, end: 0.5, confidence: 0.9 },
        { word: 'sunsets', start: 0.5, end: 1, confidence: 0.9 },
        { word: 'feel', start: 1, end: 1.5, confidence: 0.9 },
        { word: 'rare.', start: 1.5, end: 2, confidence: 0.9 },
      ],
    },
    {
      id: 1,
      text: 'Green forests sound calm.',
      start: 2.4,
      end: 4.4,
      avgLogprob: -0.2,
      confidence: 0.9,
      words: [
        { word: 'Green', start: 2.4, end: 2.9, confidence: 0.9 },
        { word: 'forests', start: 2.9, end: 3.4, confidence: 0.9 },
        { word: 'sound', start: 3.4, end: 3.9, confidence: 0.9 },
        { word: 'calm.', start: 3.9, end: 4.4, confidence: 0.9 },
      ],
    },
  ],
  pauses: [{ start: 2, end: 2.4, gap: 0.4 }],
}

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().setTranscript('asset-voice', transcript)
})

describe('generateCaptions', () => {
  it('creates auto captions from the transcript', () => {
    useEditorStore.getState().generateCaptions('asset-voice')
    const captions = useEditorStore.getState().captions
    expect(captions).toHaveLength(2)
    expect(captions[0]).toMatchObject({
      trackId: 'track-captions',
      source: 'auto',
      styleId: 'normal',
      text: 'Warm sunsets feel rare.',
    })
    expect(captions[0].words).toHaveLength(4)
  })

  it('is one undo step', () => {
    useEditorStore.getState().generateCaptions('asset-voice')
    expect(useEditorStore.getState().captions).toHaveLength(2)
    useEditorStore.getState().undo()
    expect(useEditorStore.getState().captions).toHaveLength(0)
  })

  it('re-generation replaces auto captions but keeps manual ones', () => {
    useEditorStore.getState().generateCaptions('asset-voice')
    const first = useEditorStore.getState().captions[0]
    useEditorStore.getState().updateCaptionText(first.id, 'edited by hand')
    expect(useEditorStore.getState().captions[0].source).toBe('manual')

    useEditorStore.getState().generateCaptions('asset-voice')
    const captions = useEditorStore.getState().captions
    expect(captions).toHaveLength(3)
    expect(captions.find((c) => c.id === first.id)?.text).toBe('edited by hand')
    expect(captions.filter((c) => c.source === 'manual')).toHaveLength(1)
  })

  it('does nothing without a transcript', () => {
    useEditorStore.getState().generateCaptions('missing-asset')
    expect(useEditorStore.getState().captions).toHaveLength(0)
  })
})

describe('caption edit actions', () => {
  beforeEach(() => {
    useEditorStore.getState().generateCaptions('asset-voice')
  })

  it('updateCaptionText edits text in place', () => {
    const id = useEditorStore.getState().captions[1].id
    useEditorStore.getState().updateCaptionText(id, 'changed')
    const caption = useEditorStore.getState().captions.find((c) => c.id === id)
    expect(caption?.text).toBe('changed')
    expect(caption?.words).toBeUndefined()
  })

  it('updateCaptionTiming clamps and marks manual', () => {
    const id = useEditorStore.getState().captions[0].id
    useEditorStore.getState().updateCaptionTiming(id, { duration: 0.01 })
    const caption = useEditorStore.getState().captions.find((c) => c.id === id)
    expect(caption?.duration).toBeGreaterThan(0.19)
    expect(caption?.source).toBe('manual')
  })

  it('removeCaption deletes the caption', () => {
    const before = useEditorStore.getState().captions.length
    const id = useEditorStore.getState().captions[0].id
    useEditorStore.getState().removeCaption(id)
    expect(useEditorStore.getState().captions).toHaveLength(before - 1)
  })
})

describe('loadProject hydrates captions', () => {
  it('restores captions from a loaded model', () => {
    useEditorStore.getState().generateCaptions('asset-voice')
    const captions = useEditorStore.getState().captions
    const model = {
      tracks: useEditorStore.getState().tracks,
      assets: [],
      clips: [],
      playhead: 0,
      selectedClipId: null,
      captions,
    }
    useEditorStore.getState().reset()
    expect(useEditorStore.getState().captions).toHaveLength(0)
    useEditorStore.getState().loadProject(model)
    expect(useEditorStore.getState().captions).toEqual(captions)
  })
})