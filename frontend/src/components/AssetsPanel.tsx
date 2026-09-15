import { useState } from 'react'
import { AssetGrid, type AssetCategory } from './AssetGrid'
import ImageToImagePanel from './ImageToImagePanel'
import TipsPanel from './TipsPanel'
import './AssetsPanel.css'

type BottomTab = 'recent' | 'all' | 'images' | 'videos' | 'audio' | 'i2i' | 'tips'

const tabDefs: { id: BottomTab; label: string; icon: string }[] = [
  { id: 'recent', label: 'Recent', icon: '🕐' },
  { id: 'all', label: 'All', icon: '📁' },
  { id: 'images', label: 'Images', icon: '🖼' },
  { id: 'videos', label: 'Videos', icon: '🎬' },
  { id: 'audio', label: 'Audio', icon: '🔊' },
  { id: 'i2i', label: 'Image to Image', icon: '🎨' },
  { id: 'tips', label: 'Tips', icon: '💡' },
]

function tabToCategory(tab: BottomTab): AssetCategory {
  if (tab === 'images') return 'image'
  if (tab === 'videos') return 'video'
  if (tab === 'audio') return 'audio'
  if (tab === 'all') return 'all'
  if (tab === 'recent') return 'recent'
  return 'all'
}

export default function AssetsPanel() {
  const [activeTab, setActiveTab] = useState<BottomTab>('recent')

  return (
    <section className="assets-panel" aria-label="Assets Panel">
      <nav className="assets-tabs" role="tablist" aria-label="Asset categories">
        {tabDefs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`assets-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="assets-tab-icon">{tab.icon}</span>
            <span className="assets-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="assets-body" role="tabpanel">
        {activeTab === 'i2i' ? (
          <ImageToImagePanel />
        ) : activeTab === 'tips' ? (
          <TipsPanel />
        ) : (
          <AssetGrid category={tabToCategory(activeTab)} />
        )}
      </div>
    </section>
  )
}
