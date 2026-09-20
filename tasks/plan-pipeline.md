# Implementation Plan: End-to-End Render Pipeline (M12)

## Overview
One-click pipeline: Script → Voiceover → Images → Timeline → Render → Video Output.
User pastes script, clicks "Run Pipeline", gets a complete video with voiceover, images, and captions.

## Architecture Decisions
- **Orchestrator pattern** — single `POST /api/pipeline/run` endpoint coordinates all stages
- **Stage-by-stage streaming** — SSE for real-time progress (which stage, % complete)
- **Existing endpoints reused** — calls Groq transcription, edge-tts, Gemini image gen, timeline sync, FFmpeg render
- **Fail gracefully** — if one stage fails (e.g., no Gemini key), skip and use placeholder, don't abort entire pipeline
- **Local-first** — all processing local, API keys optional per stage

## Pipeline Flow
```
[Script Text]
    │
    ▼ (1) Script Splitter — split into scenes/beats
    │
    ▼ (2) TTS Generator — edge-tts per scene
    │
    ▼ (3) Image Generator — Gemini/custom per scene prompt
    │
    ▼ (4) Timeline Sync — align images to audio timestamps
    │
    ▼ (5) Caption Generator — auto-captions from audio
    │
    ▼ (6) FFmpeg Render — compose final video
    │
    ▼ [Output Video]
```

## Task List

### Phase 1: Backend Orchestrator
- [ ] Task 1.1: Pipeline orchestrator engine (`pipeline_engine.py`)
  - Script splitter (scene detection)
  - Stage runner with progress tracking
  - Error recovery per stage
- [ ] Task 1.2: Pipeline API endpoint (`POST /api/pipeline/run`, SSE progress)
- [ ] Task 1.3: Pipeline status endpoint (`GET /api/pipeline/status`)

### Phase 2: Frontend Pipeline Panel
- [ ] Task 2.1: PipelinePanel — script input, stage toggles, run button
- [ ] Task 2.2: Progress display — real-time stage progress via SSE
- [ ] Task 2.3: Output preview — video player + download

### Phase 3: Integration + Testing
- [ ] Task 3.1: Wire existing services (groq_transcribe, voiceover, image_gen, timeline_sync)
- [ ] Task 3.2: End-to-end test with sample script
- [ ] Task 3.3: Error state handling (missing API keys, failed stages)

## Files to Create/Modify
- `backend/src/lava_backend/pipeline_engine.py` (NEW)
- `backend/src/lava_backend/pipeline_api.py` (already exists, update)
- `frontend/src/components/PipelinePanel.tsx` (exists, major update)
- `frontend/src/components/PipelinePanel.css` (exists, update)
- `frontend/src/services/pipeline.ts` (exists, update)
- `backend/src/lava_backend/main.py` (register new router)

## Verification
- [ ] Pipeline runs with sample 3-scene script
- [ ] Each stage shows progress
- [ ] Output video is valid MP4
- [ ] Missing API key = graceful fallback, not crash
- [ ] All 378 existing tests still pass
