import { create } from 'zustand'
import { temporal } from 'zundo'
import type { Asset, Clip, TimelineModel, Track } from '../editor/types'
import { DEFAULT_TRACKS } from '../editor/types'
import * as ops from '../editor/ops'

interface EditorBase {
  tracks: Track[]
  assets: Asset[]
  clips: Clip[]
  playhead: number
  selectedClipId: string | null
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
  }
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
        }),
      }
    },
    {
      limit: 100,
      partialize: (s) => ({
        tracks: s.tracks,
        assets: s.assets,
        clips: s.clips,
      }),
      equality: (prev, next) =>
        prev.tracks === next.tracks &&
        prev.assets === next.assets &&
        prev.clips === next.clips,
    },
  ),
)