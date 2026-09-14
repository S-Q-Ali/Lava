import { create } from 'zustand'

interface ProxyState {
  version: number
  bump: () => void
}

/**
 * Transient store that signals the preview panel to re-resolve proxy URLs
 * once a lazily-requested proxy finishes generating. Never persisted.
 */
export const useProxyStore = create<ProxyState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}))