import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetFFmpegProvider } from './ffmpeg'
import { requestProxy, resolveProxyUrl, resetProxyCache, getProxyCache } from './proxy'
import { useProxyStore } from '../store/proxyStore'
import { registerAssetFile } from '../media/importer'
import type { Asset } from '../editor/types'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const PROXY_ID = 'abcd1234ef567890'

function proxyFetchMock() {
  return vi.fn((url: string) => {
    if (String(url).endsWith('/api/health')) {
      return Promise.resolve(jsonResponse({ ok: true, ffmpegVersion: '9.0.1' }))
    }
    return Promise.resolve(jsonResponse({ proxyId: PROXY_ID }))
  })
}

function makeAsset(overrides?: Partial<Asset>): Asset {
  return {
    id: 'a1',
    kind: 'image',
    name: 'sunset.png',
    url: 'blob:photo',
    meta: {},
    ...overrides,
  }
}

afterEach(() => {
  resetFFmpegProvider()
  resetProxyCache()
  vi.unstubAllGlobals()
})

describe('requestProxy', () => {
  it('posts the file and returns the proxy URL on success', async () => {
    const fetchMock = proxyFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['x'], 'sunset.png', { type: 'image/png' })
    const url = await requestProxy(file)
    expect(url).toBe(`http://127.0.0.1:7860/api/proxy/${PROXY_ID}`)
    // Exactly one call to /api/proxy (health probe via provider detection)
    const proxyCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/api/proxy'))
    expect(proxyCalls).toHaveLength(1)
  })

  it('returns null when the sidecar is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await expect(requestProxy(file)).resolves.toBeNull()
  })

  it('returns null when the proxy endpoint fails', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (String(url).endsWith('/api/health')) {
        return Promise.resolve(jsonResponse({ ok: true, ffmpegVersion: '9.0.1' }))
      }
      return Promise.resolve(jsonResponse({ error: { code: 'PROXY_FAILED', message: 'nope' } }, 422))
    })
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await expect(requestProxy(file)).resolves.toBeNull()
  })
})

describe('resolveProxyUrl', () => {
  it('returns the original URL immediately and caches the proxy once resolved', async () => {
    vi.stubGlobal('fetch', proxyFetchMock())
    const asset = makeAsset()
    registerAssetFile(asset.id, new File(['x'], 'sunset.png', { type: 'image/png' }))

    expect(resolveProxyUrl(asset)).toBe('blob:photo')
    expect(getProxyCache().size).toBe(0)

    // Flush the async request
    await vi.waitFor(() => expect(getProxyCache().get('blob:photo')).toBeTruthy())

    expect(resolveProxyUrl(asset)).toBe(`http://127.0.0.1:7860/api/proxy/${PROXY_ID}`)
  })

  it('bumps the proxy store version when a proxy resolves', async () => {
    vi.stubGlobal('fetch', proxyFetchMock())
    const asset = makeAsset()
    registerAssetFile(asset.id, new File(['x'], 'sunset.png', { type: 'image/png' }))
    const before = useProxyStore.getState().version
    expect(resolveProxyUrl(asset)).toBe('blob:photo')
    await vi.waitFor(() => expect(getProxyCache().get('blob:photo')).toBeTruthy())
    expect(useProxyStore.getState().version).toBe(before + 1)
  })

  it('returns cached proxy URL without re-requesting', async () => {
    vi.stubGlobal('fetch', proxyFetchMock())
    const asset = makeAsset()
    registerAssetFile(asset.id, new File(['x'], 'sunset.png', { type: 'image/png' }))
    resolveProxyUrl(asset)
    await vi.waitFor(() => expect(getProxyCache().get('blob:photo')).toBeTruthy())

    resolveProxyUrl(asset)
    const fetchMock = vi.mocked(fetch)
    const proxyCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/api/proxy'))
    expect(proxyCalls).toHaveLength(1)
  })

  it('never asks for a proxy for audio assets', async () => {
    vi.stubGlobal('fetch', proxyFetchMock())
    const asset = makeAsset({ kind: 'audio', name: 'vo.m4a' })
    registerAssetFile(asset.id, new File(['x'], 'vo.m4a', { type: 'audio/mp4' }))
    expect(resolveProxyUrl(asset)).toBe('blob:photo')
    await new Promise((r) => setTimeout(r, 10))
    expect(getProxyCache().size).toBe(0)
    const fetchMock = vi.mocked(fetch)
    const proxyCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/api/proxy'))
    expect(proxyCalls).toHaveLength(0)
  })

  it('does not over-fetch when called concurrently', async () => {
    vi.stubGlobal('fetch', proxyFetchMock())
    const asset = makeAsset()
    registerAssetFile(asset.id, new File(['x'], 'sunset.png', { type: 'image/png' }))
    resolveProxyUrl(asset)
    resolveProxyUrl(asset)
    await vi.waitFor(() => expect(getProxyCache().get('blob:photo')).toBeTruthy())
    const fetchMock = vi.mocked(fetch)
    const proxyCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/api/proxy'))
    expect(proxyCalls).toHaveLength(1)
  })
})