import { useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return

      const ctrl = e.metaKey || e.ctrlKey

      if (e.code === 'Space') {
        e.preventDefault()
        const { playing } = useEditorStore.getState()
        useEditorStore.setState({ playing: !playing })
        return
      }

      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 1 / 30
        const { playhead } = useEditorStore.getState()
        useEditorStore.setState({ playhead: Math.max(0, playhead - step) })
        return
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 1 / 30
        const { playhead, clips } = useEditorStore.getState()
        const end = clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0)
        useEditorStore.setState({ playhead: Math.min(end, playhead + step) })
        return
      }

      if (ctrl && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault()
        useEditorStore.getState().undo()
        return
      }

      if (ctrl && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
        e.preventDefault()
        useEditorStore.getState().redo()
        return
      }

      if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault()
        const { selectedClipId } = useEditorStore.getState()
        if (selectedClipId) useEditorStore.getState().removeClip(selectedClipId)
        return
      }

      if (e.code === 'KeyS' && !ctrl) {
        e.preventDefault()
        const { selectedClipId, playhead } = useEditorStore.getState()
        if (selectedClipId) useEditorStore.getState().splitClip(selectedClipId, playhead)
        return
      }

      if (e.code === 'Home') {
        e.preventDefault()
        useEditorStore.setState({ playhead: 0 })
        return
      }

      if (e.code === 'End') {
        e.preventDefault()
        const { clips } = useEditorStore.getState()
        const end = clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0)
        useEditorStore.setState({ playhead: end })
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
