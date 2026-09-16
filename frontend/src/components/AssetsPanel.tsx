import { useState } from 'react'
import { AssetGrid, type AssetCategory } from './AssetGrid'
import ImageToImagePanel from './ImageToImagePanel'
import TipsPanel from './TipsPanel'
import './AssetsPanel.css'

type BottomTab = 'media' | 'images' | 'audio' | 'videos' | 'documents'

const tabDefs: { id: BottomTab; label: string; icon: string }[] = [
  { id: 'media', label: 'Media', icon: '📁' },
  { id: 'images', label: 'Images', icon: '🖼' },
  { id: 'audio', label: 'Audio', icon: '🔊' },
  { id: 'videos', label: 'Videos', icon: '🎬' },
  { id: 'documents', label: 'Documents', icon: '📄' },
]

function tabToCategory(tab: BottomTab): AssetCategory {
  if (tab === 'images') return 'image'
  if (tab === 'videos') return 'video'
  if (tab === 'audio') return 'audio'
  return 'all'
}

export default function AssetsPanel() {
  const [activeTab, setActiveTab] = useState<BottomTab>('media')

  return (
    <section className="assets-panel-v2" aria-label="Assets Panel">
      <div className="assets-sidebar">
        <h3 className="assets-sidebar-title">Project Assets</h3>
        <nav className="assets-sidebar-tabs" role="tablist" aria-label="Asset categories">
          {tabDefs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`assets-sidebar-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="assets-sidebar-tab-icon">{tab.icon}</span>
              <span className="assets-sidebar-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="assets-recent" role="tabpanel">
        <div className="assets-recent-header">
          <span className="assets-recent-title">Recent</span>
          <button type="button" className="assets-view-all">View All</button>
        </div>
        <AssetGrid category={tabToCategory(activeTab)} />
      </div>

      <div className="assets-side-panels">
        <div className="assets-i2i-section">
          <ImageToImagePanel />
        </div>
        <div className="assets-tips-section">
          <TipsPanel />
        </div>
      </div>
    </section>
  )
}
