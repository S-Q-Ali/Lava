import type { Transcript, TranscriptPause, TranscriptWord } from '../editor/types'
import { useEditorStore } from '../store/editorStore'
import { useTranscriptStore } from '../store/transcriptStore'
import { getAssetFile } from '../media/importer'

type Node =
  | {
      type: 'word'
      segment: number
      index: number
      word: TranscriptWord
    }
  | { type: 'gap' }
  | { type: 'break' }

function buildNodes(transcript: Transcript): Node[] {
  const nodes: Node[] = []
  transcript.segments.forEach((segment, segmentIndex) => {
    if (segmentIndex > 0) nodes.push({ type: 'break' })
    segment.words.forEach((word, index) => {
      nodes.push({
        type: 'word',
        segment: segmentIndex,
        index,
        word,
      })
    })
  })
  return nodes
}

function attachPauses(nodes: Node[], pauses: TranscriptPause[]): Node[] {
  if (pauses.length === 0 || nodes.length === 0) return nodes
  const withGaps: Node[] = []
  let pauseIndex = 0
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const node = nodes[i]
    withGaps.push(node)
    const next = nodes[i + 1]
    if (node.type !== 'word' || next.type !== 'word') continue
    const pause = pauses[pauseIndex]
    if (pause && node.word.end <= pause.start + 0.15 && pause.end <= next.word.start + 0.15) {
      withGaps.push({ type: 'gap' })
      pauseIndex += 1
    }
  }
  withGaps.push(nodes[nodes.length - 1])
  return withGaps
}

function lowConfidence(word: TranscriptWord): boolean {
  return typeof word.confidence === 'number' && word.confidence < 0.5
}

function confidenceLabel(segment: Transcript['segments'][number]): string {
  return `${Math.max(0, Math.min(100, Math.round(segment.confidence)))}%`
}

export default function TranscriptPanel() {
  const clips = useEditorStore((s) => s.clips)
  const assets = useEditorStore((s) => s.assets)
  const transcripts = useEditorStore((s) => s.transcripts)
  const setPlayhead = useEditorStore((s) => s.setPlayhead)
  const updateTranscriptWord = useEditorStore((s) => s.updateTranscriptWord)
  const resegmentTranscript = useEditorStore((s) => s.resegmentTranscript)
  const selectedClipId = useEditorStore((s) => s.selectedClipId)
  const analysis = useTranscriptStore((s) => s.analysis)
  const analyze = useTranscriptStore((s) => s.analyze)

  const selectedClip = clips.find((c) => c.id === selectedClipId)
  const selectedAsset = assets.find((a) => a.id === selectedClip?.assetId)
  const isVocalAudio = selectedAsset?.kind === 'audio'
  const transcript = selectedAsset && transcripts[selectedAsset.id]

  if (!isVocalAudio || !selectedAsset) return null

  const file = getAssetFile(selectedAsset.id)
  const status = analysis[selectedAsset.id]
  const busy = status?.phase === 'analyzing'
  const content = transcript?.segments.length ? transcript : undefined
  const nodes = content ? attachPauses(buildNodes(content), content.pauses) : []
  const firstLow = content?.segments.some((segment) => segment.words.some(lowConfidence)) ?? false

  let statusText: string | null = null
  if (!file) statusText = 'Re-import this audio file to re-analyze narration.'
  else if (status?.phase === 'error') statusText = status.error
  else if (!transcript && !busy && file) statusText = 'Not analyzed yet.'

  return (
    <section className="transcript-panel" aria-label="Narration transcript">
      <div className="inspector-stats">
        <h4>Narration analysis</h4>
        {statusText && <p className="transcript-hint">{statusText}</p>}
        {file && !transcript && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void analyze(selectedAsset.id, file)}
          >
            {busy ? 'Analyzing…' : 'Analyze narration'}
          </button>
        )}
      </div>

      {content && (
        <>
          <div className="transcript-meta">
            <span className="field">
              <span className="label">Language</span>
              <span className="value">{content.language}</span>
            </span>
            <span className="field">
              <span className="label">Segments</span>
              <span className="value">{content.segments.length}</span>
            </span>
            <span className="field">
              <span className="label">Pauses</span>
              <span className="value">{content.pauses.length}</span>
            </span>
          </div>
          {firstLow && (
            <p className="transcript-hint">
              Underscored words have low confidence — click a word to correct it.
            </p>
          )}

          <div className="waveform-bar" aria-hidden="true">
            {content.segments.map((segment) => {
              const width = Math.max(8, Math.round(((segment.end - segment.start) / (content.segments[content.segments.length - 1]?.end ?? 1)) * 100))
              const h1 = 30 + (segment.confidence / 100) * 50
              const h2 = 20 + ((segment.end - segment.start) / (content.segments[content.segments.length - 1]?.end ?? 1)) * 60
              return (
                <div
                  key={segment.id}
                  className="waveform-segment"
                  style={{ width: `${width}%` }}
                  title={`S${segment.id}: ${segment.start.toFixed(1)}–${segment.end.toFixed(1)}s`}
                >
                  <div className="waveform-bar-fill" style={{ height: `${h1}%` }} />
                  <div className="waveform-bar-fill secondary" style={{ height: `${h2}%` }} />
                </div>
              )
            })}
          </div>

          <div className="transcript-words">
            {nodes.map((node, index) => {
              if (node.type === 'break') return <br key={index} className="transcript-break" />
              if (node.type === 'gap')
                return (
                  <span key={index} className="transcript-gap" title="detected pause">
                    ⏸
                  </span>
                )
              const segment = content.segments[node.segment]
              return (
                <input
                  key={`${node.segment}-${node.index}`}
                  className={`word-input${lowConfidence(node.word) ? ' low' : ''}`}
                  aria-label={`word ${node.index + 1} of segment ${segment.id}`}
                  value={node.word.word}
                  maxLength={64}
                  onChange={(event) =>
                    updateTranscriptWord(
                      selectedAsset.id,
                      segment.id,
                      node.index,
                      event.target.value,
                    )
                  }
                  onClick={() => setPlayhead((selectedClip?.start ?? 0) + node.word.start)}
                />
              )
            })}
          </div>
          <div className="transcript-segments">
            {content.segments.map((segment) => (
              <div className="field" key={segment.id}>
                <span className="label">S{segment.id}</span>
                <span className="value">{confidenceLabel(segment)}</span>
                <span className="value">
                  {segment.start.toFixed(2)}–{segment.end.toFixed(2)}s
                </span>
              </div>
            ))}
          </div>
          <div className="transcript-actions">
            <button
              type="button"
              className="resegment-btn"
              onClick={() => resegmentTranscript(selectedAsset.id)}
            >
              Re-segment Beats
            </button>
            <p className="transcript-hint">
              Re-run beat segmentation after editing words. Beat timings update on matched clips.
            </p>
          </div>
        </>
      )}
    </section>
  )
}
