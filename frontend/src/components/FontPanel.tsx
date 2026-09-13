import { useEffect, useRef, useState } from 'react'
import { backendBaseUrl } from '../services/ffmpeg'
import { fontPreviewUrl } from '../services/fonts'
import { ensureFontFace, type FontLicense } from '../editor/fonts'
import { useFontStore } from '../store/fontStore'

const LICENSE_TYPES: Array<FontLicense['type']> = ['unknown', 'open', 'commercial', 'personal']
export const FONT_EXTENSIONS = ['.ttf', '.otf']

export function FontPanel() {
  const fonts = useFontStore((s) => s.fonts)
  const status = useFontStore((s) => s.status)
  const error = useFontStore((s) => s.error)
  const load = useFontStore((s) => s.load)
  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    for (const font of fonts) ensureFontFace(font, backendBaseUrl())
  }, [fonts])

  const fileRef = useRef<HTMLInputElement>(null)
  const [licenseType, setLicenseType] = useState<FontLicense['type']>('unknown')
  const [source, setSource] = useState('')
  const [embedding, setEmbedding] = useState(true)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | undefined>()

  async function handleImport() {
    const input = fileRef.current
    const file = input?.files?.[0]
    if (!file) {
      setLocalError('Choose a .ttf or .otf file first.')
      return
    }
    const lower = file.name.toLowerCase()
    if (!FONT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setLocalError('Only .ttf and .otf fonts can be imported.')
      return
    }
    setBusy(true)
    setLocalError(undefined)
    try {
      const license: FontLicense = {
        type: licenseType,
        source: source.trim() || null,
        embeddingAllowed: embedding,
      }
      await useFontStore.getState().importFont(file, license)
      if (input) input.value = ''
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not import the font.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(fontId: string, family: string) {
    setLocalError(undefined)
    try {
      await useFontStore.getState().removeFont(fontId)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : `Could not remove ${family}.`)
    }
  }

  return (
    <section className="font-panel" aria-label="Fonts">
      <h3>Fonts</h3>

      {status === 'error' && <p className="font-error">{error}</p>}
      {localError && <p className="font-error">{localError}</p>}

      <div className="font-import">
        <input
          ref={fileRef}
          type="file"
          accept={FONT_EXTENSIONS.join(',')}
          aria-label="Font file"
        />
        <label>
          License
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value as FontLicense['type'])}
            aria-label="License type"
          >
            {LICENSE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          License source
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="URL or note (optional)"
            aria-label="License source"
          />
        </label>
        <label className="font-embed">
          <input
            type="checkbox"
            checked={embedding}
            onChange={(e) => setEmbedding(e.target.checked)}
            aria-label="Embedding allowed"
          />
          Embedding allowed
        </label>
        <button type="button" onClick={() => void handleImport()} disabled={busy}>
          Import font
        </button>
      </div>

      {fonts.length === 0 && status !== 'loading' ? (
        <p className="font-empty">
          No fonts imported. Upload a .ttf/.otf with its license metadata so captions can burn it
          in at render time.
        </p>
      ) : (
        <ul className="font-list">
          {fonts.map((font) => (
            <li key={font.id} className="font-item">
              <span className="font-family">{font.family}</span>
              <span className="font-file">{font.fileName}</span>
              <span className="font-license">{font.license.type}</span>
              <a
                className="font-preview"
                href={fontPreviewUrl(font.id)}
                target="_blank"
                rel="noreferrer"
              >
                preview
              </a>
              <button
                type="button"
                onClick={() => void handleRemove(font.id, font.family)}
                aria-label={`Remove ${font.family}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}