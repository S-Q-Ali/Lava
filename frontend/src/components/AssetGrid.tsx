import { useMemo } from 'react'
import { useEditorStore } from '../store/editorStore'
import type { Asset, AssetKind } from '../editor/types'

export type AssetCategory = 'all' | 'recent' | AssetKind

function sortRecent(a: Asset, b: Asset) {
  const aMtime = (a.meta as Record<string, unknown>)._mtime ?? 0
  const bMtime = (b.meta as Record<string, unknown>)._mtime ?? 0
  return (bMtime as number) - (aMtime as number)
}

export function AssetGrid({ category }: { category: AssetCategory }) {
  const assets = useEditorStore((s) => s.assets)

  const filtered = useMemo(() => {
    if (category === 'recent') return [...assets].sort(sortRecent).slice(0, 24)
    if (category === 'all') return assets
    return assets.filter((a) => a.kind === category)
  }, [assets, category])

  if (filtered.length === 0) {
    return (
      <div className="asset-grid-empty">
        <p className="asset-grid-empty-text">
          {category === 'recent'
            ? 'Import media to start building your project.'
            : `No ${category} assets yet.`}
        </p>
      </div>
    )
  }

  return (
    <div className="asset-grid">
      {filtered.map((asset) => (
        <AssetThumb key={asset.id} asset={asset} />
      ))}
    </div>
  )
}

function AssetThumb({ asset }: { asset: Asset }) {
  const proxy = asset.proxyUrl || asset.url
  const isAudio = asset.kind === 'audio'
  return (
    <div className="asset-thumb" draggable title={asset.name}>
      {isAudio ? (
        <div className="asset-thumb-icon">🔊</div>
      ) : (
        <img
          className="asset-thumb-img"
          src={proxy}
          alt={asset.name}
          draggable={false}
        />
      )}
      <div className="asset-thumb-name" title={asset.name}>
        {asset.name}
      </div>
    </div>
  )
}
