import { useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { importFiles } from '../media/importer'
import { projectDuration } from '../editor/ops'

function kindOf(mimeType: string): 'image' | 'video' | 'audio' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'image'
}

export default function MediaPanel() {
  const assets = useEditorStore((s) => s.assets)
  const clips = useEditorStore((s) => s.clips)
  const addAsset = useEditorStore((s) => s.addAsset)
  const addClip = useEditorStore((s) => s.addClip)
  const removeAsset = useEditorStore((s) => s.removeAsset)
  const inputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const onPick = async (files: FileList | null) => {
    if (!files) return
    setImportError(null)
    const selected = Array.from(files)
    const supported = selected.filter((file) =>
      file.type.startsWith('image/') ||
      file.type.startsWith('video/') ||
      file.type.startsWith('audio/'),
    )
    if (supported.length !== selected.length) {
      setImportError('Some files were skipped. Choose image, video or audio files.')
    }
    if (supported.length === 0) return
    setImporting(true)
    try {
      const imported = await importFiles(supported)
      for (const asset of imported) addAsset(asset)
      if (imported.length === 0) {
        setImportError('The selected media could not be read. Try another file.')
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Media import failed.')
    } finally {
      setImporting(false)
    }
  }

  const addToTimeline = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) return
    const duration = asset.meta.duration ?? 5
    const trackId = `track-${kindOf(asset.meta.mimeType ?? 'image')}`
    const start = projectDuration(clips)
    addClip({ trackId, assetId, name: asset.name, start, duration })
  }

  const handleRemove = (assetId: string) => {
    const asset = assets.find((item) => item.id === assetId)
    if (asset?.url.startsWith('blob:')) URL.revokeObjectURL(asset.url)
    removeAsset(assetId)
  }

  return (
    <section className="panel media-panel">
      <h3>Media</h3>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        hidden
        onChange={(e) => onPick(e.target.files)}
      />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={importing}>
        {importing ? 'Reading media…' : 'Import media'}
      </button>
      {importError && <p className="panel-error" role="alert">{importError}</p>}
      <ul className="asset-list">
        {assets.length === 0 && <li className="empty">No media imported.</li>}
        {assets.map((a) => (
          <li key={a.id} className="asset-item">
            <div className="asset-thumb">
              {a.kind === 'image' ? (
                <img src={a.url} alt="" />
              ) : (
                <span>{a.kind === 'audio' ? '♪' : '▶'}</span>
              )}
            </div>
            <div className="asset-meta">
              <span className="asset-name" title={a.name}>
                {a.name}
              </span>
              <span className="asset-dims">
                {a.meta.duration
                  ? `${a.meta.duration.toFixed(1)}s`
                  : a.meta.width && a.meta.height
                    ? `${a.meta.width}×${a.meta.height}`
                    : ''}
              </span>
            </div>
            <div className="asset-actions">
              <button type="button" onClick={() => addToTimeline(a.id)}>
                +
              </button>
              <button type="button" onClick={() => handleRemove(a.id)}>
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}