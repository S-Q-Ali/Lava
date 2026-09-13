// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFontStore } from './fontStore'

const arial = {
  id: 'font-aaa',
  family: 'Arial',
  fileName: 'Arial.ttf',
  ext: 'ttf',
  license: { type: 'open', source: null, embeddingAllowed: true },
  addedAt: '2026-09-13T00:00:00Z',
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

beforeEach(() => useFontStore.getState().clear())

afterEach(() => vi.unstubAllGlobals())

describe('useFontStore', () => {
  it('loads fonts from the sidecar and stores them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([arial])))
    await useFontStore.getState().load()
    expect(useFontStore.getState().fonts).toEqual([arial])
    expect(useFontStore.getState().status).toBe('idle')
  })

  it('records an error status on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'nope' } }, false, 500)),
    )
    await useFontStore.getState().load()
    expect(useFontStore.getState().status).toBe('error')
    expect(useFontStore.getState().error).toBe('nope')
  })

  it('imports a font and appends it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(arial))
    vi.stubGlobal('fetch', fetchMock)
    await useFontStore.getState().importFont(new File(['x'], 'Arial.ttf'), {
      type: 'unknown',
      embeddingAllowed: true,
    })
    expect(useFontStore.getState().fonts).toEqual([arial])
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/fonts')
  })

  it('removes a font by id', async () => {
    useFontStore.getState().clear()
    useFontStore.setState({ fonts: [arial] })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response)
    vi.stubGlobal('fetch', fetchMock)
    await useFontStore.getState().removeFont('font-aaa')
    expect(useFontStore.getState().fonts).toEqual([])
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/fonts/font-aaa')
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE')
  })
})