export type NavItem = {
  id: string
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'media', label: 'Media', icon: '🖼' },
  { id: 'ai-tools', label: 'AI Tools', icon: '⚡' },
  { id: 'captions', label: 'Captions', icon: '💬' },
  { id: 'templates', label: 'Templates', icon: '📝' },
  { id: 'export', label: 'Export', icon: '📤' },
]
