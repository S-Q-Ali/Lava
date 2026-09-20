const BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:7860'

export interface ScriptGenRequest {
  topic: string
  style?: string
  language?: string
  duration_seconds?: number
  hooks?: boolean
  captions_notes?: string
  extra_instructions?: string
  provider?: string
  api_key?: string
}

export interface ScriptSegment {
  text: string
  duration_hint: number
  visual_note: string
  caption_style: string
}

export interface ScriptResult {
  success: boolean
  title?: string
  hook?: string
  segments?: ScriptSegment[]
  full_text?: string
  estimated_duration?: number
  language?: string
  error?: string
}

export interface ScriptStyle {
  id: string
  name: string
}

export async function generateScript(req: ScriptGenRequest): Promise<ScriptResult> {
  const res = await fetch(`${BASE}/api/scriptwriter/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return res.json()
}

export async function listScriptStyles(): Promise<ScriptStyle[]> {
  const res = await fetch(`${BASE}/api/scriptwriter/styles`)
  return res.json()
}
