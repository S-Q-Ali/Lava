import { create } from 'zustand'
import {
  listStrips,
  uploadStrip,
  uploadPdf,
  uploadStripOnly,
  uploadPdfOnly,
  detectStrip,
  getStrip,
  correctStrip,
  redetectStrip,
  deleteStrip,
  deleteAllStrips,
  fetchGroups,
  deleteGroup,
  type ManhwaPanel,
  type ManhwaStripSummary,
  type ManhwaStripDetail,
  type ManhwaGroup,
  type CorrectionOp,
} from '../services/manhwa'

export type PendingPage = { stripId: string; fileName: string }

export type ManhwaStatus =
  | { phase: 'idle' }
  | { phase: 'uploading'; progress: number }
  | { phase: 'processing' }
  | { phase: 'uploaded'; pages: PendingPage[]; fileName: string }
  | { phase: 'detecting' }
  | { phase: 'loading' }
  | { phase: 'error'; error: string }

interface ManhwaStore {
  status: ManhwaStatus
  strips: ManhwaStripSummary[]
  groups: ManhwaGroup[]
  currentId: string | null
  detail: ManhwaStripDetail | null
  viewerPageIndex: number
  resultsModalOpen: boolean
  detectionProgress: { current: number; total: number } | null
  pendingPages: PendingPage[]
  refresh(): Promise<void>
  select(id: string | null): Promise<void>
  upload(file: File): Promise<void>
  uploadPdf(file: File): Promise<void>
  uploadOnly(file: File): Promise<void>
  openResults(): void
  closeResults(): void
  nextPage(): void
  prevPage(): void
  startDetection(): Promise<void>
  apply(op: CorrectionOp): Promise<void>
  redetect(): Promise<void>
  remove(id: string): Promise<void>
  removeGroup(groupId: string): Promise<void>
  clearAll(): Promise<void>
}

export const useManhwaStore = create<ManhwaStore>()((set, get) => ({
  status: { phase: 'idle' },
  strips: [],
  groups: [],
  currentId: null,
  detail: null,
  viewerPageIndex: 0,
  resultsModalOpen: false,
  detectionProgress: null,
  pendingPages: [],

  refresh: async () => {
    set({ status: { phase: 'loading' } })
    try {
      const [strips, groups] = await Promise.all([listStrips(), fetchGroups()])
      set({ status: { phase: 'idle' }, strips, groups })
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
    set({ status: { phase: 'uploading', progress: 0 } })
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
    set({ status: { phase: 'uploading', progress: 0 } })
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

  uploadOnly: async (file) => {
    set({ status: { phase: 'uploading', progress: 0 } })
    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const onProgress = (progress: number) => {
        if (progress >= 100) {
          set({ status: { phase: 'processing' } })
        } else {
          set({ status: { phase: 'uploading', progress } })
        }
      }
      if (isPdf) {
        const result = await uploadPdfOnly(file, onProgress)
        set({ status: { phase: 'uploaded', pages: result.pages, fileName: result.fileName }, viewerPageIndex: 0, resultsModalOpen: true })
      } else {
        const result = await uploadStripOnly(file, onProgress)
        set({ status: { phase: 'uploaded', pages: [result], fileName: result.fileName }, viewerPageIndex: 0, resultsModalOpen: true })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not upload file.'
      set({ status: { phase: 'error', error: message } })
    }
  },

  openResults: () => set({ resultsModalOpen: true }),
  closeResults: () => set({ resultsModalOpen: false, detectionProgress: null }),

  nextPage: () => {
    const { status, viewerPageIndex, strips } = get()
    const maxIndex = status.phase === 'uploaded' ? status.pages.length - 1 : strips.length - 1
    if (viewerPageIndex < maxIndex) {
      const next = viewerPageIndex + 1
      set({ viewerPageIndex: next })
      if (status.phase === 'idle' && strips[next]) {
        void get().select(strips[next].sourceId)
      }
    }
  },

  prevPage: () => {
    const { viewerPageIndex, status, strips } = get()
    if (viewerPageIndex > 0) {
      const prev = viewerPageIndex - 1
      set({ viewerPageIndex: prev })
      if (status.phase === 'idle' && strips[prev]) {
        void get().select(strips[prev].sourceId)
      }
    }
  },

  startDetection: async () => {
    const { status } = get()
    if (status.phase !== 'uploaded') return
    const pages = status.pages
    set({ status: { phase: 'detecting' }, detectionProgress: { current: 0, total: pages.length }, pendingPages: pages })
    try {
      for (let i = 0; i < pages.length; i++) {
        try {
          await detectStrip(pages[i].stripId)
        } catch {
          // Skip failed pages — continue with the rest
        }
        set({ detectionProgress: { current: i + 1, total: pages.length } })
      }
      // Fetch all strips and aggregate their panels into one detail
      const strips = await listStrips()
      let allPanels: ManhwaPanel[] = []
      let firstDetail: ManhwaStripDetail | null = null
      for (const strip of strips) {
        try {
          const detail = await getStrip(strip.sourceId)
          if (!firstDetail) firstDetail = detail
          allPanels = allPanels.concat(detail.panels)
        } catch {
          // Skip strips that fail to load
        }
      }
      const aggregatedDetail: ManhwaStripDetail | null = firstDetail
        ? { ...firstDetail, panels: allPanels }
        : null
      set({
        status: { phase: 'idle' },
        strips,
        currentId: strips.length > 0 ? strips[0].sourceId : null,
        detail: aggregatedDetail,
        viewerPageIndex: 0,
        detectionProgress: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not detect panels.'
      set({ status: { phase: 'error', error: message }, detectionProgress: null })
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
      const [strips, groups] = await Promise.all([listStrips(), fetchGroups()])
      const currentId = get().currentId === id ? null : get().currentId
      const detail = get().currentId === id ? null : get().detail
      set({ status: { phase: 'idle' }, strips, groups, currentId, detail })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete strip.'
      set({ status: { phase: 'error', error: message } })
    }
  },

  removeGroup: async (groupId) => {
    set({ status: { phase: 'loading' } })
    try {
      await deleteGroup(groupId)
      const [strips, groups] = await Promise.all([listStrips(), fetchGroups()])
      set({ status: { phase: 'idle' }, strips, groups })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete group.'
      set({ status: { phase: 'error', error: message } })
    }
  },

  clearAll: async () => {
    set({ status: { phase: 'loading' } })
    try {
      await deleteAllStrips()
      set({
        status: { phase: 'idle' },
        strips: [],
        groups: [],
        currentId: null,
        detail: null,
        viewerPageIndex: 0,
        resultsModalOpen: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not clear results.'
      set({ status: { phase: 'error', error: message } })
    }
  },
}))
