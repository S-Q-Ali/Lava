import { afterEach, describe, expect, it, vi } from 'vitest'
import { matchImages, MatchError, parseMatch } from './match'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response
}

const beat = { id: 'b0', text: 'a sunny day', start: 0, end: 2 }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseMatch', () => {
  it('normalizes a match response defensively', () => {
    const parsed = parseMatch({
      beats: [
        {
          beatId: 'b0',
          imageKey: 'asset-1',
          confidence: 0.6,
          start: 0,
          end: 2,
          alternatives: [{ imageKey: 'asset-2', confidence: 0.3 }],
        },
      ],
    })
    expect(parsed.beats[0]).toMatchObject({ beatId: 'b0', imageKey: 'asset-1', confidence: 0.6 })
    expect(parsed.beats[0].alternatives).toHaveLength(1)
  })

  it('throws on a non-beats shape', () => {
    expect(() => parseMatch({ nope: true })).toThrow(MatchError)
  })
})

describe('matchImages', () => {
  it('posts beats as JSON and files named by asset id', async () => {
    const send = vi.fn((_url: string, _init: RequestInit) => jsonResponse({ beats: [] }))
    vi.stubGlobal('fetch', send)

    const file = new File(['x'], 'scene.png', { type: 'image/png' })
    await matchImages({
      beats: [beat],
      images: [{ assetId: 'asset-1', file }],
      baseUrl: 'http://local:7860',
    })

    expect(send).toHaveBeenCalledTimes(1)
    const [url, init] = send.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://local:7860/api/match')
    const form = init.body as FormData
    expect(form.get('beats')).toBe(JSON.stringify([beat]))
    expect((form.get('images') as File).name).toBe('asset-1')
  })

  it('surfaces the backend error message', async () => {
    const res = jsonResponse(
      { error: { code: 'MATCH_FAILED', message: 'none of the images could be analyzed' } },
      false,
      422,
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res))

    await expect(
      matchImages({
        beats: [beat],
        images: [{ assetId: 'a', file: new File(['x'], 'a.png', { type: 'image/png' }) }],
      }),
    ).rejects.toThrow('none of the images could be analyzed')
  })

  it('rejects when no images or beats are given', async () => {
    await expect(matchImages({ beats: [], images: [] })).rejects.toThrow('Add at least one image')
    await expect(
      matchImages({ beats: [], images: [{ assetId: 'a', file: new File([''], 'a.png') }] }),
    ).rejects.toThrow('no matching beats')
  })
})
