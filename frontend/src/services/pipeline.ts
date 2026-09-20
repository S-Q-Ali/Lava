const BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:7860'

export interface PipelineRunRequest {
  input_path: string
  preset?: string
  output_dir?: string
  api_key?: string
  provider?: string
  max_clips?: number
  min_duration?: number
  max_duration?: number
}

export interface PipelineClip {
  id: string
  score: number
  start: number
  end: number
  reason: string
  output_path: string
}

export interface PipelineStage {
  name: string
  status: 'pending' | 'running' | 'done' | 'error'
  progress?: number
  message?: string
}

export interface PipelineJob {
  job_id: string
  status: 'queued' | 'running' | 'done' | 'error'
  stages: PipelineStage[]
  clips?: PipelineClip[]
  error?: string
}

export interface PipelinePreset {
  name: string
  description: string
}

export async function runPipeline(req: PipelineRunRequest): Promise<{ job_id: string }> {
  const res = await fetch(`${BASE}/api/pipeline/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return res.json()
}

export async function getPipelineStatus(jobId: string): Promise<PipelineJob> {
  const res = await fetch(`${BASE}/api/pipeline/status/${jobId}`)
  return res.json()
}

export async function listPipelinePresets(): Promise<PipelinePreset[]> {
  const res = await fetch(`${BASE}/api/pipeline/presets`)
  return res.json()
}

export function getPipelineDownloadUrl(jobId: string, clipId: string): string {
  return `${BASE}/api/pipeline/download/${jobId}/${clipId}`
}
