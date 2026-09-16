import { useMemo, useState } from 'react'
import { segmentBeats } from '../editor/beats'
import { useEditorStore } from '../store/editorStore'
import { useMatchingStore } from '../store/matchingStore'
import { getAssetFile } from '../media/importer'
import { resolveProxyUrl } from '../services/proxy'

export default function MatchPanel() {
  const clips = useEditorStore((s) => s.clips)
  const assets = useEditorStore((s) => s.assets)
  const transcripts = useEditorStore((s) => s.transcripts)
  const replaceClipAsset = useEditorStore((s) => s.replaceClipAsset)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const status = useMatchingStore((s) => s.status)
  const results = useMatchingStore((s) => s.results)
  const match = useMatchingStore((s) => s.match)
  const [viewAll, setViewAll] = useState(false)

  const selectedClip = clips.find((c) => c.id === selectedClipId)
  const selectedAsset = assets.find((a) => a.id === selectedClip?.assetId)
  const isVocalAudio = selectedAsset?.kind === 'audio'
  const transcript = selectedAsset && transcripts[selectedAsset.id]

  const imageAssets = useMemo(
    () => assets.filter((asset) => asset.kind === 'image' && getAssetFile(asset.id) !== undefined),
    [assets],
  )
  const content = useMemo(() => transcript?.segments.length ? transcript : undefined, [transcript])
  const beats = useMemo(() => content ? segmentBeats(content) : [], [content])
  const busy = status.phase === 'analyzing'
  const canRun = imageAssets.length > 0 && beats.length > 0
  const matchedClips = useMemo(() => clips.filter((clip) => clip.beatId !== undefined), [clips])
  const horizon =
    typeof selectedAsset?.meta.duration === 'number' ? selectedAsset.meta.duration : undefined

  // Build matched results with thumbnails
  const matchedResults = useMemo(() => {
    if (!isVocalAudio || !selectedAsset) return []
    return results
      .map((result) => {
        const clip = matchedClips.find((c) => c.beatId === result.beatId)
        if (!clip) return null
        const current = assets.find((a) => a.id === clip.assetId)
        const thumbnailUrl = current ? resolveProxyUrl(current) : null
        return {
          beatId: result.beatId,
          clip,
          current,
          thumbnailUrl,
          confidence: result.confidence,
          alternatives: result.alternatives,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [results, matchedClips, assets, isVocalAudio, selectedAsset])

  let statusLine: string | null = null
  if (!isVocalAudio || !selectedAsset) return null
  if (status.phase === 'error') statusLine = status.error
  else if (!content) statusLine = 'Analyze the narration first.'
  else if (imageAssets.length === 0) statusLine = 'Re-import image files to run image matching.'
  else if (!canRun) statusLine = 'The narration has no beats to match yet.'
  else if (status.phase === 'success')
    statusLine =
      `${status.count} beat${status.count === 1 ? '' : 's'} matched` +
      (status.kept > 0
        ? ` · ${status.kept} timing override${status.kept === 1 ? '' : 's'} kept`
        : '') +
      ' — undo anytime.'

  return (
    <section className="transcript-panel" aria-label="Image matching">
      <div className="inspector-stats">
        <h4>Image matching</h4>
        {statusLine && <p className="transcript-hint">{statusLine}</p>}
        {content && canRun && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void match(
                imageAssets.map((asset) => asset.id),
                beats,
                { horizon },
              )
            }
          >
            {busy ? 'Matching…' : 'Auto-match'}
          </button>
        )}
      </div>

      {matchedResults.length > 0 && (
        <>
          <div className="match-strip-header">
            <span className="match-strip-label">
              Matched ({matchedResults.length})
            </span>
            <button
              type="button"
              className="match-view-all-btn"
              onClick={() => setViewAll(!viewAll)}
            >
              {viewAll ? 'Strip' : 'View All'}
            </button>
          </div>

          <div className={`match-strip${viewAll ? ' match-grid' : ''}`}>
            {matchedResults.map((r) => (
              <div
                key={r.beatId}
                className="match-thumb"
                title={`${r.current?.name ?? r.clip.name}\nConfidence: ${Math.round(Math.min(100, Math.max(0, r.confidence * 100)))}%`}
              >
                {r.thumbnailUrl ? (
                  <img
                    src={r.thumbnailUrl}
                    alt={r.current?.name ?? r.clip.name}
                    className="match-thumb-img"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="match-thumb-placeholder">?</div>
                )}
                <span className="match-thumb-label">
                  {Math.round(Math.min(100, Math.max(0, r.confidence * 100)))}%
                </span>
              </div>
            ))}
          </div>

          <div className="match-list">
            {matchedResults.map((r) => (
              <div className="match-row" key={r.beatId}>
                <span className="match-name" title={r.clip.name}>
                  {r.current?.name ?? r.clip.name}
                </span>
                <span className="match-confidence" title={`${r.beatId}`}>
                  {Math.round(Math.min(100, Math.max(0, r.confidence * 100)))}%
                </span>
                <select
                  aria-label={`Replace image for beat ${r.beatId}`}
                  value={r.clip.assetId}
                  onChange={(event) => replaceClipAsset(r.clip.id, event.target.value)}
                >
                  <option value={r.clip.assetId}>{r.current?.name ?? r.clip.name}</option>
                  {r.alternatives.map((alternative) => {
                    const altAsset = assets.find((a) => a.id === alternative.imageKey)
                    return (
                      <option key={alternative.imageKey} value={alternative.imageKey}>
                        {altAsset?.name ?? alternative.imageKey} (
                        {Math.round(alternative.confidence * 100)}%)
                      </option>
                    )
                  })}
                </select>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
