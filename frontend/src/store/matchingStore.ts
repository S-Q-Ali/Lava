import { create } from 'zustand'
import type { Beat } from '../editor/beats'
import { hasTimingOverride, pacedEnd } from '../editor/timing'
import { matchImages, MatchError, type MatchBeatResult } from '../services/match'
import { getAssetFile } from '../media/importer'
import { useEditorStore, type MatchClipInput } from './editorStore'

export type MatchStatus =
  | { phase: 'idle' }
  | { phase: 'analyzing' }
  | { phase: 'success'; count: number; kept: number }
  | { phase: 'error'; error: string }

interface MatchingStore {
  status: MatchStatus
  lastMatchClipIds: string[]
  results: MatchBeatResult[]
  match(assetIds: string[], beats: Beat[], opts?: { horizon?: number }): Promise<void>
  clear(): void
}

export function imageTrackId(): string | undefined {
  return useEditorStore.getState().tracks.find((t) => t.type === 'image')?.id
}

function inputsFrom(
  response: Awaited<ReturnType<typeof matchImages>>,
  track: string,
  assetIds: string[],
  overrides: ReadonlyMap<string, { start: number; duration: number }>,
  horizon?: number,
): MatchClipInput[] {
  const files = new Map(
    assetIds.flatMap((assetId) => {
      const file = getAssetFile(assetId)
      return file ? [[assetId, file.name] as const] : []
    }),
  )
  const regionEnd = response.beats.reduce((max, result) => Math.max(max, result.end), 0)
  return response.beats.flatMap((result) => {
    if (!files.has(result.imageKey)) return []
    const override = overrides.get(result.beatId)
    const start = override ? override.start : result.start
    const end = override
      ? start + override.duration
      : pacedEnd(
          { start: result.start, end: result.end },
          {
            isFinal: result.end >= regionEnd - 1e-9,
            horizon: horizon ?? result.end,
          },
        )
    return [
      {
        trackId: track,
        assetId: result.imageKey,
        name: files.get(result.imageKey) ?? result.imageKey,
        start,
        end,
        confidence: result.confidence,
        beatId: result.beatId,
      },
    ]
  })
}

export const useMatchingStore = create<MatchingStore>()((set, get) => ({
  status: { phase: 'idle' },
  lastMatchClipIds: [],
  results: [],
  match: async (assetIds, beats, opts) => {
    if (get().status.phase === 'analyzing') return
    const track = imageTrackId()
    if (!track) {
      set({ status: { phase: 'error', error: 'The project has no image track.' } })
      return
    }
    const images = assetIds.flatMap((assetId) => {
      const file = getAssetFile(assetId)
      return file ? [{ assetId, file }] : []
    })
    if (images.length === 0) {
      set({ status: { phase: 'error', error: 'No image files are loaded for this session.' } })
      return
    }

    set({ status: { phase: 'analyzing' } })
    try {
      const response = await matchImages({ beats, images })

      const previous = get().results
      const priorIds = get().lastMatchClipIds
      const store = useEditorStore.getState()
      const overrides = new Map<string, { start: number; duration: number }>()
      for (const clipId of priorIds) {
        const clip = store.clips.find((c) => c.id === clipId)
        if (!clip?.beatId) continue
        const recorded = previous.find((r) => r.beatId === clip.beatId)
        if (!recorded) continue
        if (hasTimingOverride(clip, recorded)) {
          overrides.set(clip.beatId, { start: clip.start, duration: clip.duration })
        }
      }

      const inputs = inputsFrom(response, track, assetIds, overrides, opts?.horizon)
      if (inputs.length === 0) {
        throw new MatchError('The sidecar returned images not present in this session.')
      }

      store.applyMatch(inputs, priorIds)
      const kept = inputs.filter((input) => input.beatId !== undefined && overrides.has(input.beatId)).length
      const running = new Set(inputs.map((input) => input.beatId))
      const nextIds = useEditorStore
        .getState()
        .clips.filter((clip) => clip.beatId !== undefined && running.has(clip.beatId))
        .map((clip) => clip.id)
      set({
        status: { phase: 'success', count: inputs.length, kept },
        lastMatchClipIds: nextIds,
        results: response.beats,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image matching failed.'
      set({ status: { phase: 'error', error: message } })
    }
  },
  clear: () => set({ status: { phase: 'idle' } }),
}))