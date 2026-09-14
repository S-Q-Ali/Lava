export interface RenderClipInput {
  fileName: string
  start: number
  duration: number
}

export interface RenderSettings {
  width: number
  height: number
  fps: number
}

export interface FontRenderInfo {
  family: string
  fontId: string
  license: {
    type: 'open' | 'commercial' | 'personal' | 'unknown'
    source: string | null
    embeddingAllowed: boolean
  }
}

export interface RenderResult {
  jobId: string
  outputPath: string
  duration: number
  width: number
  height: number
  fps: number
  sizeBytes: number | null
  fonts?: FontRenderInfo[]
}

export interface RenderCaptionStyle {
  fontFamily: string
  fontSize: number
  primaryColor: string
  highlightColor: string
  outlineColor: string
  outlineWidth: number
  bold: boolean
  uppercase: boolean
  alignment: 'bottom' | 'middle' | 'top'
  rtl?: boolean
  karaoke?: boolean
  animation?: 'none' | 'kinetic' | 'manga' | 'cinematic' | 'meme' | 'storytelling'
}

export interface RenderCaption {
  start: number
  duration: number
  text: string
  style: RenderCaptionStyle
  words?: Array<{ word: string; start: number; end: number }>
}

export interface RenderInput {
  files: File[]
  clips: RenderClipInput[]
  settings: RenderSettings
  captions?: RenderCaption[]
}

export interface FFmpegProvider {
  readonly name: string
  readonly available: boolean
  readonly reason?: string
  version(): Promise<string | null>
  render(input: RenderInput): Promise<RenderResult>
  fileUrl(jobId: string): string | null
}

export const DEFAULT_BASE_URL = 'http://127.0.0.1:7860'

// Matches the sidecar default `render.timeoutSeconds` (studio.config.json).
// The client must not abort a long render before the server's own timeout.
export const RENDER_TIMEOUT_MS = 600_000

export function backendBaseUrl(): string {
  const configured = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim()
  return configured || DEFAULT_BASE_URL
}

class UnavailableFFmpegProvider implements FFmpegProvider {
  readonly name = 'unavailable'
  readonly available = false
  readonly reason: string

  constructor(reason?: string) {
    this.reason =
      reason ??
      'No FFmpeg sidecar reachable. Start the local media service (backend/) to enable probing and rendering.'
  }

  async version(): Promise<string | null> {
    return null
  }

  async render(): Promise<RenderResult> {
    throw new Error(this.reason)
  }

  fileUrl(): string | null {
    return null
  }
}

export class HttpFFmpegProvider implements FFmpegProvider {
  readonly name = 'http-sidecar'
  readonly available = true
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async version(): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(2000),
      })
      if (!res.ok) return null
      const body = (await res.json()) as { ffmpegVersion?: string }
      return body.ffmpegVersion ?? null
    } catch {
      return null
    }
  }

  async render(input: RenderInput): Promise<RenderResult> {
    if (input.clips.length === 0) {
      throw new Error('Render requires at least one clip')
    }
    const form = new FormData()
    for (const file of input.files) {
      form.append('files', file, file.name)
    }
    form.append(
      'clips',
      JSON.stringify(
        input.clips.map((c) => ({ fileName: c.fileName, start: c.start, duration: c.duration })),
      ),
    )
    form.append(
      'settings',
      JSON.stringify({ width: input.settings.width, height: input.settings.height, fps: input.settings.fps }),
    )
    if (input.captions && input.captions.length > 0) {
      form.append('captions', JSON.stringify(input.captions))
    }

    const res = await fetch(`${this.baseUrl}/api/render`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(RENDER_TIMEOUT_MS),
    })
    const body = (await res.json().catch(() => null)) as
      | (RenderResult & { error?: { code?: string; message?: string } })
      | null

    if (!res.ok || !body) {
      const message = body?.error?.message ?? `Sidecar render failed (HTTP ${res.status})`
      throw new Error(message)
    }
    return body
  }

  fileUrl(jobId: string): string | null {
    if (!/^[a-f0-9]{32}$/.test(jobId) && !/^[a-zA-Z0-9_-]+$/.test(jobId)) return null
    return `${this.baseUrl}/api/files/${jobId}`
  }
}

let providerPromise: Promise<FFmpegProvider> | null = null

export function getFFmpegProvider(): Promise<FFmpegProvider> {
  providerPromise ??= detectProvider()
  return providerPromise
}

export async function detectProvider(): Promise<FFmpegProvider> {
  const baseUrl = backendBaseUrl()
  const trial = new HttpFFmpegProvider(baseUrl)
  try {
    const version = await trial.version()
    return version ? trial : new UnavailableFFmpegProvider(`No sidecar reachable at ${baseUrl}`)
  } catch {
    return new UnavailableFFmpegProvider(`No sidecar reachable at ${baseUrl}`)
  }
}

export function resetFFmpegProvider(): void {
  providerPromise = null
}