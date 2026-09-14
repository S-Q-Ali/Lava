import type { Asset } from '../editor/types'
import { getAssetFile } from '../media/importer'
import { useProxyStore } from '../store/proxyStore'
import { backendBaseUrl, getFFmpegProvider } from './ffmpeg'

const proxyCache = new Map<string, string>()
const pending = new Set<string>()

export async function requestProxy(file: File): Promise<string | null> {
  const provider = await getFFmpegProvider()
  if (!provider.available) return null
  try {
    const baseUrl = backendBaseUrl()
    const form = new FormData()
    form.append('file', file, file.name)
    const res = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) return null
    const body = (await res.json().catch(() => null)) as { proxyId?: string } | null
    if (!body?.proxyId) return null
    return `${baseUrl}/api/proxy/${body.proxyId}`
  } catch {
    return null
  }
}

/**
 * Lazy preview-only proxy resolution. PreviewPanel calls this every render:
 * - proxy already cached  → returns the proxy URL
 * - request in flight     → returns the original URL
 * - nothing started       → fires the request (once) and returns the original
 *                           URL; when the proxy lands, the cache updates and
 *                           the proxy store version bump triggers a re-render.
 * Failures (sidecar offline, non-image/video asset) return the original URL.
 */
export function resolveProxyUrl(asset: Asset): string {
  const cached = proxyCache.get(asset.url)
  if (cached) return cached
  if (asset.kind !== 'image' && asset.kind !== 'video') return asset.url

  const file = getAssetFile(asset.id)
  if (!file || pending.has(asset.url)) return asset.url

  pending.add(asset.url)
  void requestProxy(file).then((url) => {
    pending.delete(asset.url)
    if (url) {
      proxyCache.set(asset.url, url)
      useProxyStore.getState().bump()
    }
  })
  return asset.url
}

export function resetProxyCache(): void {
  proxyCache.clear()
  pending.clear()
}

export function getProxyCache(): Map<string, string> {
  return proxyCache
}