import { create } from 'zustand'
import type { Beat } from '../editor/beats'
import { matchImages, MatchError } from '../services/match'
import { getAssetFile } from '../media/importer'
import { useEditorStore, type MatchClipInput } from './editorStore'

export type MatchStatus =
  | { phase: 'idle' }
  | { phase: 'analyzing' }
  | { phase: 'success'; count: number }
  | { phase: 'error'; error: string }

interface MatchingStore {
  status: MatchStatus
  lastMatchClipIds: string[]
  match(assetIds: string[], beats: Beat[]): Promise<void>
  clear(): void
}

export function imageTrackId(): string | undefined {
  return useEditorStore.getState().tracks.find((t) => t.type === 'image')?.id
}

function inputsFrom(
  response: Awaited<ReturnType<typeof matchImages>>,
  track: string,
  assetIds: string[],
): MatchClipInput[] {
  const files = new Map(
    assetIds.flatMap((assetId) => {
      const file = getAssetFile(assetId)
      return file ? [[assetId, file.name] as const] : []
    }),
  )
  return response.beats.flatMap((result) => {
    if (!files.has(result.imageKey)) return []
    return [
      {
        trackId: track,
        assetId: result.imageKey,
        name: files.get(result.imageKey) ?? result.imageKey,
        start: result.start,
        end: result.end,
        confidence: result.confidence,
        beatId: result.beatId,
      },
    ]
  })
}

export const useMatchingStore = create<MatchingStore>()((set, get) => ({
  status: { phase: 'idle' },
  lastMatchClipIds: [],
  match: async (assetIds, beats) => {
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
      const inputs = inputsFrom(response, track, assetIds)
      if (inputs.length === 0) {
        throw new MatchError('The sidecar returned images not present in this session.')
      }

      const store = useEditorStore.getState()
      store.applyMatch(inputs, get().lastMatchClipIds)
      const running = new Set(inputs.map((input) => input.beatId))
      const nextIds = useEditorStore
        .getState()
        .clips.filter((clip) => clip.beatId !== undefined && running.has(clip.beatId))
        .map((clip) => clip.id)
      set({ status: { phase: 'success', count: inputs.length }, lastMatchClipIds: nextIds })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image matching failed.'
      set({ status: { phase: 'error', error: message } })
    }
  },
  clear: () => set({ status: { phase: 'idle' } }),
}))