import { create } from 'zustand'
import { temporal } from 'zundo'
import type { Asset, Clip, TimelineModel, Transcript, Track } from '../editor/types'
import { DEFAULT_TRACKS } from '../editor/types'
import * as ops from '../editor/ops'

export interface MatchClipInput {
  trackId: string
  assetId: string
  name: string
  start: number
  end: number
  confidence: number
  beatId: string
}

interface EditorBase {
  tracks: Track[]
  assets: Asset[]
  clips: Clip[]
  playhead: number
  selectedClipId: string | null
  transcripts: Record<string, Transcript>
}

interface EditorActions {
  addAsset(asset: Asset): void
  removeAsset(id: string): void
  addClip(input: ops.ClipInput): void
  removeClip(id: string): void
  moveClip(id: string, start: number): void
  trimClip(id: string, patch: { start?: number; duration?: number }): void
  splitClip(id: string, at: number): void
  duplicateClip(id: string): void
  replaceClipAsset(id: string, assetId: string): void
  setTranscript(assetId: string, transcript: Transcript): void
  applyMatch(inputs: MatchClipInput[], removeIds: string[]): void
  updateTranscriptWord(assetId: string, segmentId: number, wordIndex: number, text: string): void
  setPlayhead(t: number): void
  selectClip(id: string | null): void
  undo(): void
  redo(): void
  reset(): void
  loadProject(model: TimelineModel): void
}

export type EditorState = EditorBase & EditorActions

function initialState(): EditorBase {
  return {
    tracks: DEFAULT_TRACKS,
    assets: [],
    clips: [],
    playhead: 0,
    selectedClipId: null,
    transcripts: {},
  }
}

function transcriptWordText(segments: Transcript['segments']): string {
  return segments.map((segment) => segment.words.map((word) => word.word).join(' ')).join('\n')
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set) => {
      const install = (state: EditorBase) => {
        const temporalStore = useEditorStore.temporal.getState()
        temporalStore.clear()
        temporalStore.pause()
        set(state)
        temporalStore.resume()
      }
      return {
        ...initialState(),
        addAsset: (asset) => set((s) => ({ assets: [...s.assets, asset] })),
      removeAsset: (id) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
          clips: s.clips.filter((c) => c.assetId !== id),
          selectedClipId:
            s.clips.some((c) => c.id === s.selectedClipId && c.assetId === id)
              ? null
              : s.selectedClipId,
        })),
      addClip: (input) =>
        set((s) => ({ clips: ops.addClip(s.clips, input) })),
      removeClip: (id) =>
        set((s) => ({
          clips: ops.removeClip(s.clips, id),
          selectedClipId: s.selectedClipId === id ? null : s.selectedClipId,
        })),
      moveClip: (id, start) =>
        set((s) => ({ clips: ops.moveClip(s.clips, id, start) })),
      trimClip: (id, patch) =>
        set((s) => ({ clips: ops.trimClip(s.clips, id, patch) })),
      splitClip: (id, at) =>
        set((s) => ({ clips: ops.splitClip(s.clips, id, at) })),
      duplicateClip: (id) =>
        set((s) => ({ clips: ops.duplicateClip(s.clips, id) })),
      replaceClipAsset: (id, assetId) =>
        set((s) => ({ clips: ops.replaceClipAsset(s.clips, id, assetId) })),
      setPlayhead: (t) => set({ playhead: t }),
      selectClip: (id) => set({ selectedClipId: id }),
      setTranscript: (assetId, transcript) =>
        set((s) => ({ transcripts: { ...s.transcripts, [assetId]: transcript } })),
      updateTranscriptWord: (assetId, segmentId, wordIndex, text) =>
        set((s) => {
          const existing = s.transcripts[assetId]
          if (!existing) return s
          const segments = existing.segments.map((segment) => {
            if (segment.id !== segmentId) return segment
            const words = segment.words.map((word, index) =>
              index === wordIndex ? { ...word, word: text } : word,
            )
            return { ...segment, words, text: words.map((word) => word.word).join(' ') }
          })
          return {
            transcripts: {
              ...s.transcripts,
              [assetId]: { ...existing, segments, text: transcriptWordText(segments) },
            },
          }
        }),
      applyMatch: (inputs, removeIds) =>
        set((s) => ({
          clips: ops.replaceClips(
            s.clips,
            removeIds,
            inputs.map((input) => ({
              trackId: input.trackId,
              assetId: input.assetId,
              name: input.name,
              start: input.start,
              duration: Math.max(0.001, input.end - input.start),
              confidence: input.confidence,
              beatId: input.beatId,
            })),
          ),
        })),
      undo: (): void => useEditorStore.temporal.getState().undo(),
      redo: (): void => useEditorStore.temporal.getState().redo(),
      reset: () => install(initialState()),
      loadProject: (model) =>
        install({
          tracks: model.tracks,
          assets: model.assets,
          clips: model.clips,
          playhead: model.playhead,
          selectedClipId: model.selectedClipId,
          transcripts: model.transcripts ?? {},
        }),
      }
    },
    {
      limit: 100,
      partialize: (s) => ({
        tracks: s.tracks,
        assets: s.assets,
        clips: s.clips,
        transcripts: s.transcripts,
      }),
      equality: (prev, next) =>
        prev.tracks === next.tracks &&
        prev.assets === next.assets &&
        prev.clips === next.clips &&
        prev.transcripts === next.transcripts,
    },
  ),
)