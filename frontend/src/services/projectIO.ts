import type { TimelineModel } from '../editor/types'
import { toProjectJson, parseProjectJson, ProjectError } from '../editor/project'

export function saveProjectToFile(model: TimelineModel): void {
  const json = toProjectJson(model)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  anchor.href = url
  anchor.download = `lava-project-${stamp}.lava.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function readProjectFromFile(file: File): Promise<TimelineModel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new ProjectError('Could not read the project file.'))
    reader.onload = () => {
      try {
        resolve(parseProjectJson(String(reader.result)))
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  })
}