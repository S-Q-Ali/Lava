import { backendBaseUrl } from './ffmpeg'
import { parseFontMetadata, type FontMetadata, type FontLicense } from '../editor/fonts'

export class FontError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FontError'
  }
}

async function failHttp(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null
  const message =
    body?.error?.message ??
    (res.status === 0
      ? 'No sidecar reachable. Start the local media service.'
      : `Font request failed (HTTP ${res.status})`)
  throw new FontError(message)
}

export async function listFonts(baseUrl = backendBaseUrl()): Promise<FontMetadata[]> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/fonts`)
  if (!res.ok) await failHttp(res)
  const body = (await res.json()) as unknown
  if (!Array.isArray(body)) throw new FontError('The sidecar returned an unexpected font list.')
  return body.map((entry) => parseFontMetadata(entry))
}

export async function uploadFont(
  file: File,
  license: FontLicense,
  baseUrl = backendBaseUrl(),
): Promise<FontMetadata> {
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('license', JSON.stringify(license))
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/fonts`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) await failHttp(res)
  return parseFontMetadata(await res.json())
}

export async function deleteFont(id: string, baseUrl = backendBaseUrl()): Promise<void> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/fonts/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 204) await failHttp(res)
}

export function fontPreviewUrl(id: string, baseUrl = backendBaseUrl()): string {
  return `${baseUrl.replace(/\/$/, '')}/api/fonts/${id}/file`
}