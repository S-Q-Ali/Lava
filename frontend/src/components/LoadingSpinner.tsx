import './LoadingSpinner.css'

export default function LoadingSpinner({
  size = 24,
  label = 'Loading…',
}: {
  size?: number
  label?: string
}) {
  return (
    <div className="loading-spinner-wrap" role="status" aria-label={label}>
      <div
        className="loading-spinner"
        style={{ width: size, height: size }}
      />
      <span className="loading-spinner-label">{label}</span>
    </div>
  )
}
