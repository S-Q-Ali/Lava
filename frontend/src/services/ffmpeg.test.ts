import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  HttpFFmpegProvider,
  detectProvider,
  resetFFmpegProvider,
  type RenderInput,
} from './ffmpeg'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const renderInput: RenderInput = {
  files: [new File(['a'], 'a.png', { type: 'image/png' })],
  clips: [{ fileName: 'a.png', start: 0, duration: 2 }],
  settings: { width: 64, height: 48, fps: 10 },
}

afterEach(() => {
  resetFFmpegProvider()
  vi.unstubAllGlobals()
})

describe('HttpFFmpegProvider.version', () => {
  it('returns the ffmpeg version when the sidecar is healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ ok: true, ffmpegVersion: '9.0.1', ffprobeVersion: '9.0.1' }),
      ),
    )
    const provider = new HttpFFmpegProvider('http://127.0.0.1:7860')
    await expect(provider.version()).resolves.toBe('9.0.1')
  })

  it('returns null when the sidecar is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: 'FFMPEG_UNAVAILABLE', message: 'ffmpeg not found' } }, 503),
      ),
    )
    const provider = new HttpFFmpegProvider('http://127.0.0.1:7860')
    await expect(provider.version()).resolves.toBeNull()
  })
})

describe('HttpFFmpegProvider.render', () => {
  it('posts clips, settings and files as multipart and returns the result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        jobId: 'a'.repeat(32),
        outputPath: '/cache/backend/renders/aaaa.mp4',
        duration: 2,
        width: 64,
        height: 48,
        fps: 10,
        sizeBytes: 1234,
      }, 201),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new HttpFFmpegProvider('http://127.0.0.1:7860')
    const result = await provider.render(renderInput)

    expect(result.jobId).toBe('a'.repeat(32))
    expect(result.duration).toBe(2)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://127.0.0.1:7860/api/render')
    const form = init.body as FormData
    const entries = Object.fromEntries(form.entries())
    expect(JSON.parse(String(entries.clips))).toEqual([
      { fileName: 'a.png', start: 0, duration: 2 },
    ])
    expect(JSON.parse(String(entries.settings))).toEqual({ width: 64, height: 48, fps: 10 })
    const uploaded = entries.files as File
    expect(uploaded.name).toBe('a.png')
  })

  it('throws with the sidecar message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: 'RENDER_FAILED', message: 'ffmpeg exploded' } }, 500),
      ),
    )
    const provider = new HttpFFmpegProvider('http://127.0.0.1:7860')
    await expect(provider.render(renderInput)).rejects.toThrow('ffmpeg exploded')
  })

  it('rejects a render with no clips', async () => {
    const provider = new HttpFFmpegProvider('http://127.0.0.1:7860')
    await expect(
      provider.render({ ...renderInput, clips: [] }),
    ).rejects.toThrow('at least one clip')
  })
})

describe('detectProvider', () => {
  it('uses the HTTP provider when health reports an ffmpeg version', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ ok: true, ffmpegVersion: '9.0.1' })),
    )
    const provider = await detectProvider()
    expect(provider.available).toBe(true)
    expect(provider.name).toBe('http-sidecar')
  })

  it('falls back to the unavailable provider when health fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const provider = await detectProvider()
    expect(provider.available).toBe(false)
    expect(provider.reason).toContain('No sidecar reachable')
    await expect(provider.render(renderInput)).rejects.toThrow()
  })
})