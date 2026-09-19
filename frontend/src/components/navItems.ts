export type NavItem = {
  id: string
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'projects', label: 'Projects', icon: '⊞' },
  { id: 'media', label: 'Media', icon: '◎' },
  { id: 'ai-tools', label: 'AI Tools', icon: '⚡' },
  { id: 'voiceover', label: 'Voiceover', icon: '♪' },
  { id: 'scriptwriter', label: 'Scripts', icon: '✎' },
  { id: 'pipeline', label: 'Pipeline', icon: '▶' },
  { id: 'imagegen', label: 'Image Gen', icon: '🖼' },
  { id: 'captions', label: 'Captions', icon: 'Cc' },
  { id: 'podcast', label: 'Podcast', icon: '🎙' },
  { id: 'voices', label: 'Voices', icon: '🔊' },
  { id: 'sfx', label: 'Sound FX', icon: '🎵' },
  { id: 'bulkgen', label: 'Bulk TTS', icon: '📦' },
  { id: 'templates', label: 'Templates', icon: '□' },
  { id: 'export', label: 'Export', icon: '↗' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]
