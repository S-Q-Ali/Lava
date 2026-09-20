import './SettingsSkeleton.css'

function Bone({ className = '' }: { className?: string }) {
  return <div className={`skeleton-bone ${className}`} />
}

export default function SettingsSkeleton() {
  return (
    <div className="settings-skeleton" aria-busy="true" aria-label="Loading settings">
      {/* Hardware section */}
      <div className="settings-section">
        <Bone className="skeleton-section-title" />
        <div className="skeleton-hardware">
          <Bone className="skeleton-hw-card" />
          <div className="skeleton-hw-stats">
            <Bone className="skeleton-hw-stat" />
            <Bone className="skeleton-hw-stat" />
            <Bone className="skeleton-hw-stat" />
            <Bone className="skeleton-hw-stat" />
          </div>
        </div>
      </div>

      {/* API Keys section */}
      <div className="settings-section">
        <Bone className="skeleton-section-title" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-field">
            <Bone className="skeleton-label" />
            <div className="skeleton-key-row">
              <Bone className="skeleton-input" />
              <Bone className="skeleton-save-btn" />
            </div>
            <Bone className="skeleton-hint" />
          </div>
        ))}
      </div>

      {/* Models section */}
      <div className="settings-section">
        <div className="skeleton-section-header">
          <Bone className="skeleton-section-title" />
          <Bone className="skeleton-model-count" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-model-card">
            <div className="skeleton-model-info">
              <div className="skeleton-model-header">
                <Bone className="skeleton-model-name" />
                <Bone className="skeleton-badge" />
              </div>
              <Bone className="skeleton-model-desc" />
              <Bone className="skeleton-model-meta" />
            </div>
            <Bone className="skeleton-download-btn" />
          </div>
        ))}
      </div>

      {/* About section */}
      <div className="settings-section">
        <Bone className="skeleton-section-title" />
        <div className="skeleton-about">
          <Bone className="skeleton-about-name" />
          <Bone className="skeleton-about-ver" />
          <Bone className="skeleton-about-desc" />
        </div>
      </div>
    </div>
  )
}
