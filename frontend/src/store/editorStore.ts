import { create } from 'zustand'
import { temporal } from 'zundo'
import type { Asset, Clip, MotionSpec, TimelineModel, Transcript, Track } from '../editor/types'
import { DEFAULT_TRACKS } from '../editor/types'
import * as ops from '../editor/ops'
import {
  evaluateTransitions,
  overrideTransition as patchTransition,
  removeTransition as omitTransition,
  validateTransitions,
  clampTransitionDuration,
} from '../editor/transitions'
import type { Transition, TransitionType } from '../editor/transitions'
import {
  segmentCaptions,
  updateCaptionText as patchCaptionText,
  updateCaptionTiming as patchCaptionTiming,
  removeCaption as omitCaption,
} from '../editor/captions'
import type { CaptionItem } from '../editor/captions'
import { segmentBeats } from '../editor/beats'

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
  selectedTransitionId: string | null
  transitions: Transition[]
  transcripts: Record<string, Transcript>
  captions: CaptionItem[]
}

interface EditorActions {
  addAsset(asset: Asset): void
  removeAsset(id: string): void
  addClip(input: ops.ClipInput): void
  removeClip(id: string): void
  moveClip(id: string, start: number): void
  moveClipRipple(id: string, start: number): void
  moveClipToTrack(id: string, trackId: string): void
  trimClip(id: string, patch: { start?: number; duration?: number }): void
  splitClip(id: string, at: number): void
  duplicateClip(id: string): void
  replaceClipAsset(id: string, assetId: string): void
  setTranscript(assetId: string, transcript: Transcript): void
  applyMatch(inputs: MatchClipInput[], removeIds: string[]): void
  updateTranscriptWord(assetId: string, segmentId: number, wordIndex: number, text: string): void
  setPlayhead(t: number): void
  selectClip(id: string | null): void
  setClipMotion(id: string, motion?: MotionSpec): void
  setSelectedTransitionId(id: string | null): void
  suggestTransitions(): void
  overrideTransition(id: string, type: TransitionType, duration?: number): void
  removeTransition(id: string): void
  resolveInvalidTransitions(): void
  generateCaptions(assetId: string): void
  updateCaptionText(id: string, text: string): void
  updateCaptionTiming(id: string, patch: { start?: number; duration?: number }): void
  setCaptionStyle(id: string, styleId: string): void
  applyPresetStyle(styleId: string, captionIds?: string[]): void
  removeCaption(id: string): void
  resegmentTranscript(assetId: string): void
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
    selectedTransitionId: null,
    transitions: [],
    transcripts: {},
    captions: [],
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
      moveClipRipple: (id, start) =>
        set((s) => ({ clips: ops.moveClipRipple(s.clips, id, start) })),
      moveClipToTrack: (id, trackId) =>
        set((s) => ({ clips: ops.moveClipToTrack(s.clips, id, trackId) })),
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
      setClipMotion: (id, motion) =>
        set((s) => ({
          clips: s.clips.map((c) =>
            c.id === id ? { ...c, motion: motion } : c,
          ),
        })),
      setSelectedTransitionId: (id) => set({ selectedTransitionId: id }),
      suggestTransitions: () =>
        set((s) => {
          const manual = s.transitions.filter((t) => t.source === 'manual')
          const manualPairs = new Set(
            manual
              .filter((t) => t.kind === 'between')
              .map((t) => (t.kind === 'between' ? `${t.clipAId}→${t.clipBId}` : '')),
          )
          const fresh = evaluateTransitions(s.clips).filter(
            (t) => !manualPairs.has(`${t.clipAId}→${t.clipBId}`),
          )
          return { transitions: [...manual, ...fresh] }
        }),
      overrideTransition: (id, type, duration) =>
        set((s) => ({
          transitions: s.transitions.map((t) => {
            if (t.id !== id) return t
            if (t.kind === 'between') return patchTransition(t, type, duration)
            return {
              ...t,
              duration: clampTransitionDuration(duration ?? t.duration),
              source: 'manual' as const,
            }
          }),
        })),
      removeTransition: (id) =>
        set((s) => ({ transitions: omitTransition(s.transitions, id) })),
      resolveInvalidTransitions: () =>
        set((s) => {
          const invalid = new Set(
            s.transitions
              .filter((t) => validateTransitions(s.clips, [t]).length > 0)
              .map((t) => t.id),
          )
          return { transitions: s.transitions.filter((t) => !invalid.has(t.id)) }
        }),
      generateCaptions: (assetId) =>
        set((s) => {
          const transcript = s.transcripts[assetId]
          if (!transcript) return s
          const fresh = segmentCaptions(transcript)
          const manual = s.captions.filter((c) => c.source === 'manual')
          return { captions: [...manual, ...fresh] }
        }),
      updateCaptionText: (id, text) =>
        set((s) => ({
          captions: s.captions.map((c) => (c.id === id ? patchCaptionText(c, text) : c)),
        })),
      updateCaptionTiming: (id, patch) =>
        set((s) => ({
          captions: s.captions.map((c) => (c.id === id ? patchCaptionTiming(c, patch) : c)),
        })),
      setCaptionStyle: (id, styleId) =>
        set((s) => ({
          captions: s.captions.map((c) =>
            c.id === id ? { ...c, styleId, source: 'manual' as const } : c,
          ),
        })),
      applyPresetStyle: (styleId, captionIds) =>
        set((s) => {
          const ids = captionIds && captionIds.length > 0 ? new Set(captionIds) : null
          return {
            captions: s.captions.map((c) =>
              ids ? (ids.has(c.id) ? { ...c, styleId, source: 'manual' as const } : c) : { ...c, styleId, source: 'manual' as const },
            ),
          }
        }),
      removeCaption: (id) =>
        set((s) => ({ captions: omitCaption(s.captions, id) })),
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
      resegmentTranscript: (assetId) =>
        set((s) => {
          const transcript = s.transcripts[assetId]
          if (!transcript) return s
          const newBeats = segmentBeats(transcript)
          const clipsWithBeat = s.clips
            .map((clip, idx) => ({ clip, idx }))
            .filter(({ clip }) => clip.beatId !== undefined)
          const clips = [...s.clips]
          for (const { clip, idx } of clipsWithBeat) {
            const matchIdx = newBeats.findIndex((b) => b.id === clip.beatId)
            if (matchIdx >= 0) {
              const beat = newBeats[matchIdx]
              clips[idx] = {
                ...clip,
                start: beat.start,
                duration: Math.max(0.001, beat.end - beat.start),
              }
            }
          }
          return { clips }
        }),
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
          selectedTransitionId: null,
          transitions: model.transitions ?? [],
          transcripts: model.transcripts ?? {},
          captions: model.captions ?? [],
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
        transitions: s.transitions,
        captions: s.captions,
      }),
      equality: (prev, next) =>
        prev.tracks === next.tracks &&
        prev.assets === next.assets &&
        prev.clips === next.clips &&
        prev.transcripts === next.transcripts &&
        prev.transitions === next.transitions &&
        prev.captions === next.captions,
    },
  ),
)
export interface SaveProjectModel {
  tracks: Track[]
  assets: Asset[]
  clips: Clip[]
  playhead: number
  selectedClipId: string | null
}
