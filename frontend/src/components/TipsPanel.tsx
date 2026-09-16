import './TipsPanel.css'

const tips = [
  {
    title: 'Import Media',
    description:
      'Click + to add images, videos, or audio. Drag files directly onto the timeline to place them.',
  },
  {
    title: 'AI Voice Matching',
    description:
      'Load a voice-over and click Analyze. The app generates semantic beats and matches each one to a visual asset from your library.',
  },
  {
    title: 'Manhwa Panels',
    description:
      'Import a long vertical image and click Split. Panels are detected automatically — reorder, merge, or crop them manually.',
  },
  {
    title: 'Auto Captions',
    description:
      'After analyzing a voice-over, captions are generated. Edit text, change styles, and adjust timing before burning.',
  },
]

const shortcuts = [
  { keys: 'Space', action: 'Play / Pause' },
  { keys: '← →', action: 'Step 1 frame' },
  { keys: 'Shift + ← →', action: 'Step 1 second' },
  { keys: 'Ctrl+Z', action: 'Undo' },
  { keys: 'Ctrl+Shift+Z', action: 'Redo' },
  { keys: 'S', action: 'Split selected clip at playhead' },
  { keys: 'Delete', action: 'Delete selected clip' },
  { keys: 'Home', action: 'Go to start' },
  { keys: 'End', action: 'Go to end' },
  { keys: 'Ctrl + Scroll', action: 'Zoom timeline' },
]

export default function TipsPanel() {
  return (
    <div className="tips-panel">
      <div className="tips-header">
        <span className="tips-icon">💡</span>
        <span className="tips-title">Tips</span>
      </div>
      <ul className="tips-list">
        {tips.map((tip) => (
          <li key={tip.title} className="tips-item">
            <strong className="tips-item-title">{tip.title}</strong>
            <span className="tips-item-desc">{tip.description}</span>
          </li>
        ))}
      </ul>
      <div className="tips-header" style={{ marginTop: 12 }}>
        <span className="tips-title">Keyboard Shortcuts</span>
      </div>
      <table className="tips-shortcuts">
        <tbody>
          {shortcuts.map((s) => (
            <tr key={s.keys}>
              <td className="tips-shortcut-keys">{s.keys}</td>
              <td className="tips-shortcut-action">{s.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
