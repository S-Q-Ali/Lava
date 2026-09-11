import type { Asset, AssetKind, AssetMeta } from '../editor/types'
import { newId } from '../editor/ops'

const assetFiles = new Map<string, File>()

export function registerAssetFile(id: string, file: File): void {
  assetFiles.set(id, file)
}

export function getAssetFile(id: string): File | undefined {
  return assetFiles.get(id)
}

function readImageMeta(url: string): Promise<AssetMeta> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    img.onerror = () => resolve({})
    img.src = url
  })
}

function readMediaMeta(url: string): Promise<AssetMeta> {
  return new Promise((resolve) => {
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.onloadedmetadata = () => resolve({ duration: el.duration })
    el.onerror = () => resolve({})
    el.src = url
  })
}

function kindOf(mimeType: string): AssetKind {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'audio'
}

export async function importFiles(files: File[]): Promise<Asset[]> {
  const assets: Asset[] = []
  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      continue
    }
    const url = URL.createObjectURL(file)
    const kind = kindOf(file.type)
    const meta: AssetMeta = {
      mimeType: file.type,
      size: file.size,
      ...(kind === 'image' ? await readImageMeta(url) : await readMediaMeta(url)),
    }
    assets.push({
      id: newId('asset'),
      kind,
      name: file.name,
      url,
      meta,
    })
    registerAssetFile(assets[assets.length - 1].id, file)
  }
  return assets
}