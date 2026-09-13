// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { FontPanel } from './FontPanel'
import { useFontStore } from '../store/fontStore'
import { resetFontFaceRegistrations } from '../editor/fonts'

const arial = {
  id: 'font-aaa',
  family: 'Arial',
  fileName: 'Arial.ttf',
  ext: 'ttf',
  license: { type: 'open', source: 'https://example.com', embeddingAllowed: false },
  addedAt: '2026-09-13T00:00:00Z',
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

function findByText(host: HTMLElement, text: string): HTMLElement | null {
  return (
    Array.from(host.querySelectorAll<HTMLElement>('*')).find(
      (el) => el.textContent?.trim() === text && !el.querySelector('*'),
    ) ?? null
  )
}

function setNativeValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mountPanel() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<FontPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

afterEach(() => {
  unmount()
  vi.unstubAllGlobals()
  useFontStore.getState().clear()
  resetFontFaceRegistrations()
  document.head.querySelectorAll('style[data-font-family]').forEach((el) => el.remove())
})

describe('FontPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([arial])))
  })

  it('loads and lists fonts with license badges', async () => {
    mountPanel()
    await act(async () => {})
    expect(findByText(host, 'Arial')).not.toBeNull()
    expect(findByText(host, 'Arial.ttf')).not.toBeNull()
    expect(findByText(host, 'open')).not.toBeNull()
  })

  it('registers a @font-face for each listed font', async () => {
    mountPanel()
    await act(async () => {})
    const ruleStyle = await vi.waitFor(() =>
      document.head.querySelector('style[data-font-family="Arial"]'),
    )
    const rule = ruleStyle?.textContent ?? ''
    expect(rule).toContain('@font-face')
    expect(rule).toContain('/api/fonts/font-aaa/file')
  })

  it('imports a font with selected license fields', async () => {
    useFontStore.getState().clear()
    vi.unstubAllGlobals()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValue(jsonResponse(arial))
    vi.stubGlobal('fetch', fetchMock)
    mountPanel()
    await act(async () => {})

    const input = host.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'Arial.ttf', { type: 'font/ttf' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    act(() => input.dispatchEvent(new Event('change', { bubbles: true })))

    const source = host.querySelector('input[aria-label="License source"]') as HTMLInputElement
    setNativeValue(source, 'https://example.com')
    const embed = host.querySelector('input[aria-label="Embedding allowed"]') as HTMLInputElement
    act(() => embed.click())

    const importButton = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Import font'),
    )
    act(() => importButton?.click())
    await act(async () => {})
    await act(async () => {})

    expect(useFontStore.getState().fonts).toHaveLength(1)
    const uploadCall = fetchMock.mock.calls.find((c) => String(c[1]?.method) === 'POST')
    expect(uploadCall).toBeDefined()
    const body = uploadCall?.[1]?.body as FormData
    expect(JSON.parse(String(body.get('license')))).toEqual({
      type: 'unknown',
      source: 'https://example.com',
      embeddingAllowed: false,
    })
    expect(body.get('file')).toStrictEqual(file)
  })

  it('removes a font and updates the list', async () => {
    useFontStore.getState().clear()
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'DELETE') return Promise.resolve({ ok: true, status: 204 } as Response)
      return Promise.resolve(jsonResponse([arial]))
    })
    vi.unstubAllGlobals()
    vi.stubGlobal('fetch', fetchMock)
    mountPanel()
    await act(async () => {})
    await vi.waitFor(() => expect(findByText(host, 'Arial')).not.toBeNull())

    const remove = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Remove'),
    )
    act(() => remove?.click())
    await vi.waitFor(() => expect(findByText(host, 'Arial')).toBeNull())
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('/api/fonts/font-aaa')
  })

  it('shows the load error when the sidecar is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ error: { message: 'No sidecar reachable.' } }, false, 0)),
    )
    mountPanel()
    await vi.waitFor(() => expect(findByText(host, 'No sidecar reachable.')).not.toBeNull())
  })
})