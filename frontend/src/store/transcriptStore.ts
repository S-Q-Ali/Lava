import { create } from 'zustand'
import { transcribeAsset } from '../services/voice'
import { useEditorStore } from './editorStore'

export type AnalysisStatus =
  | { phase: 'idle' }
  | { phase: 'analyzing' }
  | { phase: 'success' }
  | { phase: 'error'; error: string }

interface TranscriptStore {
  analysis: Record<string, AnalysisStatus>
  analyze(assetId: string, file: File, signal?: AbortSignal): Promise<void>
  clear(assetId: string): void
}

function overwrite(analysis: Record<string, AnalysisStatus>, assetId: string, status: AnalysisStatus) {
  return { ...analysis, [assetId]: status }
}

export const useTranscriptStore = create<TranscriptStore>()((set) => ({
  analysis: {},
  analyze: async (assetId, file, signal) => {
    set((s) => ({ analysis: overwrite(s.analysis, assetId, { phase: 'analyzing' }) }))
    try {
      const transcript = await transcribeAsset(file, undefined, signal)
      useEditorStore.getState().setTranscript(assetId, transcript)
      set((s) => ({ analysis: overwrite(s.analysis, assetId, { phase: 'success' }) }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Narration analysis failed.'
      set((s) => ({ analysis: overwrite(s.analysis, assetId, { phase: 'error', error: message }) }))
    }
  },
  clear: (assetId) =>
    set((s) => {
      const analysis = { ...s.analysis }
      delete analysis[assetId]
      return { analysis }
    }),
}))