import { useCallback, useSyncExternalStore } from 'react'

const MIN_PPS = 4
const MAX_PPS = 256
const DEFAULT_PPS = 32

let pps = DEFAULT_PPS

const listeners = new Set<() => void>()
function emit() { for (const l of listeners) l() }

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb) } }
function getSnapshot() { return pps }

function clamp(v: number) { return Math.max(MIN_PPS, Math.min(MAX_PPS, v)) }

export function setPps(v: number) {
  const next = clamp(Math.round(v))
  if (next !== pps) { pps = next; emit() }
}

export function getPps() { return pps }

export function useTimelineZoom() {
  const ppsVal = useSyncExternalStore(subscribe, getSnapshot)

  const zoomIn = useCallback(() => setPps(pps * 1.25), [])
  const zoomOut = useCallback(() => setPps(pps / 1.25), [])
  const zoomToFit = useCallback((durationSec: number, containerWidth: number) => {
    if (durationSec <= 0 || containerWidth <= 0) return
    setPps(Math.max(MIN_PPS, Math.min(MAX_PPS, containerWidth / durationSec)))
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15
    setPps(pps * factor)
  }, [])

  return { pps: ppsVal, zoomIn, zoomOut, zoomToFit, handleWheel, MIN_PPS, MAX_PPS }
}
