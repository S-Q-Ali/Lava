import { create } from 'zustand'
import {
  listStrips,
  uploadStrip,
  uploadPdf,
  getStrip,
  correctStrip,
  redetectStrip,
  deleteStrip,
  type ManhwaStripSummary,
  type ManhwaStripDetail,
  type CorrectionOp,
} from '../services/manhwa'

export type ManhwaStatus =
  | { phase: 'idle' }
  | { phase: 'uploading' }
  | { phase: 'loading' }
  | { phase: 'error'; error: string }

interface ManhwaStore {
  status: ManhwaStatus
  strips: ManhwaStripSummary[]
  currentId: string | null
  detail: ManhwaStripDetail | null
  refresh(): Promise<void>
  select(id: string | null): Promise<void>
  upload(file: File): Promise<void>
  uploadPdf(file: File): Promise<void>
  apply(op: CorrectionOp): Promise<void>
  redetect(): Promise<void>
  remove(id: string): Promise<void>
}

export const useManhwaStore = create<ManhwaStore>()((set, get) => ({
  status: { phase: 'idle' },
  strips: [],
  currentId: null,
  detail: null,

  refresh: async () => {
    set({ status: { phase: 'loading' } })
    try {
      const strips = await listStrips()
      set({ status: { phase: 'idle' }, strips })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load strips.'
      set({ status: { phase: 'error', error: message } })
    }
  },

  select: async (id) => {
    if (id === null) {
      set({ currentId: null, detail: null })
      return
    }
    set({ currentId: id, status: { phase: 'loading' }, detail: null })
    try {
      const detail = await getStrip(id)
      set({ status: { phase: 'idle' }, detail })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load strip detail.'
      set({ status: { phase: 'error', error: message }, detail: null })
    }
  },

  upload: async (file) => {
    set({ status: { phase: 'uploading' } })
    try {
      const detail = await uploadStrip(file)
      const strips = await listStrips()
      set({
        status: { phase: 'idle' },
        strips,
        currentId: detail.sourceId,
        detail,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not upload strip.'
      set({ status: { phase: 'error', error: message } })
    }
  },

  uploadPdf: async (file) => {
    set({ status: { phase: 'uploading' } })
    try {
      const result = await uploadPdf(file)
      const strips = await listStrips()
      const firstStrip = result.strips[0] ?? null
      set({
        status: { phase: 'idle' },
        strips,
        currentId: firstStrip?.sourceId ?? null,
        detail: firstStrip,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not upload PDF.'
      set({ status: { phase: 'error', error: message } })
    }
  },

  apply: async (op) => {
    const currentId = get().currentId
    if (currentId === null) return
    set({ status: { phase: 'loading' } })
    try {
      const detail = await correctStrip(currentId, op)
      const strips = await listStrips()
      set({ status: { phase: 'idle' }, detail, strips })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not apply correction.'
      set({ status: { phase: 'error', error: message } })
    }
  },

  redetect: async () => {
    const currentId = get().currentId
    if (currentId === null) return
    set({ status: { phase: 'loading' } })
    try {
      const detail = await redetectStrip(currentId)
      const strips = await listStrips()
      set({ status: { phase: 'idle' }, detail, strips })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not re-detect.'
      set({ status: { phase: 'error', error: message } })
    }
  },

  remove: async (id) => {
    set({ status: { phase: 'loading' } })
    try {
      await deleteStrip(id)
      const strips = await listStrips()
      const currentId = get().currentId === id ? null : get().currentId
      const detail = get().currentId === id ? null : get().detail
      set({ status: { phase: 'idle' }, strips, currentId, detail })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete strip.'
      set({ status: { phase: 'error', error: message } })
    }
  },
}))