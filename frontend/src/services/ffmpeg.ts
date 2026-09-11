export interface FFmpegProbe {
  format?: {
    duration?: number
    size?: number
  }
  streams?: Array<{
    codec_type: 'video' | 'audio'
    width?: number
    height?: number
  }>
}

export interface FFmpegProvider {
  readonly name: string
  readonly available: boolean
  readonly reason?: string
  version(): Promise<string | null>
  probe(source: string): Promise<FFmpegProbe | null>
  render(job: unknown): Promise<{ outputPath: string }>
}

class UnavailableFFmpegProvider implements FFmpegProvider {
  readonly name = 'unavailable'
  readonly available = false
  readonly reason =
    'No FFmpeg runtime in the browser. A local Tauri/sidecar provider is required for encoding, probing and rendering.'

  async version(): Promise<string | null> {
    return null
  }

  async probe(): Promise<FFmpegProbe | null> {
    return null
  }

  async render(): Promise<{ outputPath: string }> {
    throw new Error('FFmpeg render unavailable: no local runtime.')
  }
}

const local: FFmpegProvider = new UnavailableFFmpegProvider()

export const ffmpegService: FFmpegProvider = local