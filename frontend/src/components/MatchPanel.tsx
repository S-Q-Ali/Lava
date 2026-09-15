import { segmentBeats } from '../editor/beats'
import { useEditorStore } from '../store/editorStore'
import { useMatchingStore } from '../store/matchingStore'
import { getAssetFile } from '../media/importer'

export default function MatchPanel() {
  const clips = useEditorStore((s) => s.clips)
  const assets = useEditorStore((s) => s.assets)
  const transcripts = useEditorStore((s) => s.transcripts)
  const replaceClipAsset = useEditorStore((s) => s.replaceClipAsset)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const status = useMatchingStore((s) => s.status)
  const results = useMatchingStore((s) => s.results)
  const match = useMatchingStore((s) => s.match)

  const selectedClip = clips.find((c) => c.id === selectedClipId)
  const selectedAsset = assets.find((a) => a.id === selectedClip?.assetId)
  const isVocalAudio = selectedAsset?.kind === 'audio'
  const transcript = selectedAsset && transcripts[selectedAsset.id]

  if (!isVocalAudio || !selectedAsset) return null

  const imageAssets = assets.filter(
    (asset) => asset.kind === 'image' && getAssetFile(asset.id) !== undefined,
  )
  const content = transcript?.segments.length ? transcript : undefined
  const beats = content ? segmentBeats(content) : []
  const busy = status.phase === 'analyzing'
  const canRun = imageAssets.length > 0 && beats.length > 0
  const matchedClips = clips.filter((clip) => clip.beatId !== undefined)
  const horizon =
    typeof selectedAsset.meta.duration === 'number' ? selectedAsset.meta.duration : undefined

  let statusLine: string | null = null
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

      {matchedClips.length > 0 && (
        <div className="match-list">
          {results.map((result) => {
            const clip = matchedClips.find((c) => c.beatId === result.beatId)
            if (!clip) return null
            const current = assets.find((a) => a.id === clip.assetId)
            return (
              <div className="match-row" key={result.beatId}>
                <span className="match-name" title={clip.name}>
                  {current?.name ?? clip.name}
                </span>
                <span className="match-confidence" title={`${result.beatId}`}>
                  {Math.round(Math.min(100, Math.max(0, result.confidence * 100)))}%
                </span>
                <select
                  aria-label={`Replace image for beat ${result.beatId}`}
                  value={clip.assetId}
                  onChange={(event) => replaceClipAsset(clip.id, event.target.value)}
                >
                  <option value={clip.assetId}>{current?.name ?? clip.name}</option>
                  {result.alternatives.map((alternative) => {
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
            )
          })}
        </div>
      )}
    </section>
  )
}