import { create } from 'zustand'
import type { FontMetadata, FontLicense } from '../editor/fonts'
import { deleteFont, listFonts, uploadFont } from '../services/fonts'

interface FontState {
  fonts: FontMetadata[]
  status: 'idle' | 'loading' | 'error'
  error?: string
  load: () => Promise<void>
  importFont: (file: File, license: FontLicense) => Promise<FontMetadata>
  removeFont: (id: string) => Promise<void>
  clear: () => void
}

export const useFontStore = create<FontState>((set, get) => ({
  fonts: [],
  status: 'idle',
  load: async () => {
    set({ status: 'loading', error: undefined })
    try {
      const fonts = await listFonts()
      set({ fonts, status: 'idle' })
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'Could not load fonts.' })
    }
  },
  importFont: async (file, license) => {
    const font = await uploadFont(file, license)
    set({ fonts: [...get().fonts, font], status: 'idle' })
    return font
  },
  removeFont: async (id) => {
    await deleteFont(id)
    set({ fonts: get().fonts.filter((f) => f.id !== id) })
  },
  clear: () => set({ fonts: [], status: 'idle', error: undefined }),
}))