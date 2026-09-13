import { create } from 'zustand'
import type { Preset } from '../editor/presets'
import { deletePreset as deletePresetRequest, importPreset as importPresetRequest, listPresets } from '../services/presets'
import { useEditorStore } from './editorStore'

interface PresetState {
  presets: Preset[]
  status: 'idle' | 'loading' | 'error'
  error?: string
  selectedCategory: string
  load: () => Promise<void>
  setCategory: (category: string) => void
  byCategory: (category: string) => Preset[]
  getPreset: (id: string) => Preset | undefined
  applyPreset: (id: string, captionIds?: string[]) => void
  importPreset: (payload: unknown) => Promise<Preset>
  removePreset: (id: string) => Promise<void>
  clear: () => void
}

export const usePresetStore = create<PresetState>((set, get) => ({
  presets: [],
  status: 'idle',
  selectedCategory: 'All',
  load: async () => {
    set({ status: 'loading', error: undefined })
    try {
      const presets = await listPresets()
      set({ presets, status: 'idle' })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Could not load presets.',
      })
    }
  },
  setCategory: (category) => set({ selectedCategory: category }),
  byCategory: (category) => {
    const presets = get().presets
    if (!category || category === 'All') return presets
    return presets.filter((p) => p.category === category)
  },
  getPreset: (id) => get().presets.find((p) => p.id === id),
  applyPreset: (id, captionIds) => {
    const preset = get().getPreset(id)
    if (!preset) return
    useEditorStore.getState().applyPresetStyle(preset.id, captionIds)
  },
  importPreset: async (payload) => {
    set({ status: 'loading', error: undefined })
    try {
      const imported = await importPresetRequest(payload)
      set((state) => ({
        presets: state.presets.some((p) => p.id === imported.id)
          ? state.presets.map((p) => (p.id === imported.id ? imported : p))
          : [...state.presets, imported],
        status: 'idle',
      }))
      return imported
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not import the preset.'
      set({ status: 'error', error: message })
      throw err
    }
  },
  removePreset: async (id) => {
    set({ status: 'loading', error: undefined })
    try {
      await deletePresetRequest(id)
      set((state) => ({ presets: state.presets.filter((p) => p.id !== id), status: 'idle' }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete the preset.'
      set({ status: 'error', error: message })
      throw err
    }
  },
  clear: () => set({ presets: [], status: 'idle', error: undefined }),
}))