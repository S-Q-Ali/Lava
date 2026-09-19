# Implementation Plan: AutoCut Studio PRO + Clabeo Feature Parity

## Overview
Add all 8 AutoCut Studio PRO V3.0 tools + 7 Clabeo-unique features to Lava Studio. Current state: 5/8 AutoCut features partially built, 0/7 Clabeo features. Total: 19 new capabilities across 8 phases, 33 tasks, ~48 files.

## Architecture Decisions
- **Groq for transcription/scripts** — free tier (30 RPM), fast, Llama 3.3 70B + Whisper Large v3
- **Coqui XTTS-v2 for voice cloning** — local GPU/CPU, 6-sec minimum reference, user downloads model manually to `models/xtts-v2/`
- **FFmpeg amix for voice blending** — simple, proven, no extra deps
- **Google Gemini for image generation** — free tier available, API key required
- **edge-tts stays as primary TTS** — 170+ free voices, no GPU needed
- **Hybrid SFX approach** — bundled CC0 library + ZzFX procedural + Wikimedia/Internet Archive (no key) + Freesound (optional key)

## Color Theme (Non-AI-Slop)
- Background: `#10131a`, Surface: `#171b24`, Raised: `#1e2330`, Floating: `#262c3a`
- Text: `#e2e6ed` (primary), `#8b92a3` (secondary), `#555d73` (tertiary)
- Borders: `#1c2030` (subtle), `#2a3040` (visible)
- Accent: `#4a8eff` (single accent only)
- No gradients, no glow, no glassmorphism

## Capability Map

| Module ID | Responsibility | Depends On | Est. Tasks |
|---|---|---|---|
| `groq-transcription` | Whisper Large v3 via Groq API | — | 3 |
| `enhanced-captions` | 18+ lang, .VTT export | captions (exists) | 3 |
| `script-writer-v2` | 9 templates, hook/body/CTA | scriptwriter (exists) | 2 |
| `visual-prompts` | 11 styles, timestamp gen | groq-transcription | 2 |
| `voice-blending` | Mix voices + 15-sec clone | voiceover (exists) | 4 |
| `bulk-image-gen` | Google Gemini batch + custom upload | visual-prompts | 3 |
| `clabeo-features` | Podcast, SFX, Voice Lib, Bulk TTS, Templates, History, Auto-Update | — | 7 |
| `timeline-sync` | Auto timecode sync | voiceover (exists) | 2 |
| `video-clipper` | 9:16 face-tracking | groq-transcription, pipeline | 2 |
| `settings-ui` | API keys panel, theme update | — | 4 |

Build order: groq-transcription -> enhanced-captions + script-writer-v2 + clabeo-features (parallel) -> visual-prompts -> voice-blending -> bulk-image-gen -> timeline-sync -> video-clipper -> settings-ui

---

## Phase 1: Groq Whisper Transcription (Foundation)

### Task 1.1: Groq Transcription Backend
**Description:** Add Groq Whisper Large v3 API transcription as new transcriber alongside existing local faster-whisper.
**Acceptance criteria:**
- [ ] `backend/src/lava_backend/groq_transcribe.py` module created
- [ ] `POST /api/transcribe-groq` endpoint accepts audio file + API key
- [ ] Returns word-level timestamps, speaker diarization
- [ ] Supports MP3/MP4 up to 2GB
- [ ] Falls back to local whisper if no Groq key
- [ ] API key stored frontend localStorage only, never persisted to disk
**Verify:** `uv run pytest backend/tests/test_groq_transcribe.py`
**Files:** `groq_transcribe.py`, `main.py`, `tests/test_groq_transcribe.py`
**Scope:** M (3-5 files)

### Task 1.2: Groq Transcription Frontend
**Description:** Add Groq transcription option to TranscriptPanel. Settings panel for API key input. Toggle between local and Groq transcription.
**Acceptance criteria:**
- [ ] Settings modal with Groq API key input (localStorage)
- [ ] TranscriptPanel shows "Local" vs "Groq" toggle
- [ ] Groq transcription triggers /api/transcribe-groq
- [ ] Progress indicator during transcription
- [ ] Word-level transcript renders same as local
**Verify:** Manual transcribe with Groq, verify word timestamps
**Files:** `TranscriptPanel.tsx`, `voice.ts`, new Settings component
**Scope:** M (3-5 files)

### Task 1.3: Groq Transcription Tests
**Description:** Unit tests for Groq transcription backend module.
**Acceptance criteria:**
- [ ] Tests for API call mocking
- [ ] Tests for response parsing
- [ ] Tests for fallback to local whisper
- [ ] Tests for error handling (invalid key, network failure)
**Verify:** `uv run pytest backend/tests/test_groq_transcribe.py`
**Files:** `tests/test_groq_transcribe.py`
**Scope:** S (1-2 files)

---

## Phase 2: Enhanced Captions + Script Writer v2 (Parallel)

### Task 2.1: 18+ Language Auto-Detect Captions
**Description:** Extend caption system for auto language detection + 18+ languages including Urdu, Arabic, Hindi, RTL support.
**Acceptance criteria:**
- [ ] Language auto-detect from transcription result
- [ ] 18+ language codes: Urdu, Roman Urdu, English, Hindi, Arabic, Punjabi, Bengali, Pashto, Sindhi, Gujarati, Tamil, Telugu, Marathi, Kannada, Malayalam, Thai, Vietnamese, Turkish
- [ ] RTL rendering for Urdu, Arabic, Punjabi, Bengali
- [ ] Language selector dropdown in AutoCaptionsPanel
- [ ] Existing 15 presets work with all languages
**Verify:** Manual test with Urdu, Arabic, English audio; `uv run pytest backend/tests/test_captions.py`
**Files:** `captions_engine/styles.py`, `AutoCaptionsPanel.tsx`, `captions.py`
**Scope:** M (3-5 files)

### Task 2.2: .VTT Export + Enhanced SRT
**Description:** Add VTT subtitle export alongside existing SRT. Enhance SRT output with compact mode.
**Acceptance criteria:**
- [ ] `POST /api/captions/export` endpoint with `format` param (vtt|srt|ass)
- [ ] VTT output includes WEBVTT header, cue identifiers
- [ ] Frontend download buttons for all 3 formats (.srt, .vtt, .ass)
- [ ] SRT compact mode (remove blank lines)
**Verify:** Export caption file in each format, validate with subtitle validator
**Files:** `captions.py`, `CaptionPanel.tsx`
**Scope:** S (1-2 files)

### Task 2.3: Script Writer v2 — Enhanced Templates
**Description:** Upgrade script writer with 9 viral templates, structured prompt engineering, word count control.
**Acceptance criteria:**
- [ ] 9 templates: shorts, storytelling, educational, entertainment, podcast_clip, urdu_narration, investigative, history, true_crime
- [ ] Per-template system prompt with hook/body/CTA structure
- [ ] Word count target parameter
- [ ] Temperature=0 for deterministic output
- [ ] Script preview panel with word count display
**Verify:** Generate script in each template, verify structure and word count
**Files:** `scriptwriter_api.py`, `scriptwriter/__init__.py`, `ScriptWriterPanel.tsx`
**Scope:** M (3-5 files)

---

## Phase 3: Visual Prompt Generator

### Task 3.1: Visual Prompt Backend
**Description:** Build visual prompt generator that converts script text to scene-by-scene image prompts with timestamps.
**Acceptance criteria:**
- [ ] `POST /api/visual-prompts` endpoint
- [ ] Input: script text, style (11 options), timestamp format
- [ ] Output: array of {timestamp, prompt, style} objects
- [ ] 11 master styles: 3D Pixar, Anime Shonen, Studio Ghibli, Flat 2D Vector, Oil Painting, Watercolor, Cyberpunk, Realistic, Sketch, Pop Art, Dark Fantasy
- [ ] Custom style import from .txt/.md files
**Verify:** Generate prompts from sample script, verify timestamp alignment
**Files:** `visual_prompts.py`, `visual_prompts_api.py`
**Scope:** M (3-5 files)

### Task 3.2: Visual Prompt Frontend
**Description:** Visual Prompt Generator panel with style selector, prompt preview, 1-click export.
**Acceptance criteria:**
- [ ] VisualPromptPanel in LeftWorkspace (new nav item "Prompts")
- [ ] Style grid showing 11 preset styles with preview cards
- [ ] Script input textarea (paste or load from ScriptWriter)
- [ ] Generated prompts list with timestamps
- [ ] "Copy All" and "Export as .txt" buttons
- [ ] "Send to Image Generator" button
**Verify:** Generate prompts, copy to clipboard
**Files:** `VisualPromptPanel.tsx`, `LeftWorkspace.tsx`, `navItems.ts`
**Scope:** M (3-5 files)

---

## Phase 4: Voice Blending & Cloning

### Task 4.1: Voice Blending Backend
**Description:** Implement voice blending (mix 2+ voices) using FFmpeg amix.
**Acceptance criteria:**
- [ ] `POST /api/voiceover/blend` endpoint
- [ ] Input: 2+ voice IDs, blend ratios (e.g. 60% voice A + 40% voice B)
- [ ] Implementation: Generate with each voice via edge-tts, FFmpeg amix with volume weights
- [ ] Output: blended audio file
**Verify:** Blend 2 voices, verify output sounds mixed
**Files:** `voiceover/blend.py`, `voiceover_api.py`
**Scope:** M (3-5 files)

### Task 4.2: Voice Cloning Backend
**Description:** Implement 15-sec voice cloning using Coqui XTTS-v2.
**Acceptance criteria:**
- [ ] `POST /api/voiceover/clone` endpoint
- [ ] Input: 15-sec audio sample + text
- [ ] Coqui XTTS-v2 for cloning (models/xtts-v2/ path)
- [ ] Output: cloned audio file
- [ ] Graceful error if model not found (instructions to download)
**Verify:** Clone from 15-sec sample
**Files:** `voiceover/clone.py`, `voiceover_api.py`
**Scope:** M (3-5 files)

### Task 4.3: Voice Blending/Cloning Frontend
**Description:** Voice blender and cloner UI in VoiceoverPanel.
**Acceptance criteria:**
- [ ] Voice blender section: select 2+ voices, ratio sliders per voice
- [ ] Voice clone section: upload 15s audio sample + type text
- [ ] Preview before generating
- [ ] Save blended/cloned voice as custom preset
- [ ] Progress indicator during generation
**Verify:** Blend voices, clone from sample
**Files:** `VoiceoverPanel.tsx`, `voiceover.ts`
**Scope:** M (3-5 files)

### Task 4.4: Voice Blending Tests
**Description:** Unit tests for voice blending and cloning.
**Acceptance criteria:**
- [ ] Tests for FFmpeg amix blending logic
- [ ] Tests for ratio validation
- [ ] Tests for error handling
**Verify:** `uv run pytest backend/tests/test_voice_blend.py`
**Files:** `tests/test_voice_blend.py`
**Scope:** S (1-2 files)

---

## Phase 5: Bulk Image Generation

### Task 5.1: Gemini Image Generation Backend
**Description:** Google Gemini API integration for batch image generation.
**Acceptance criteria:**
- [ ] `POST /api/image-gen/batch` endpoint
- [ ] Input: array of prompts, style, count per prompt
- [ ] Google Gemini API integration (API key from settings)
- [ ] Batch processing with progress tracking (SSE or polling)
- [ ] Rate limiting + retry logic
**Verify:** Generate batch of 10 images from prompts
**Files:** `image_gen.py`, `image_gen_api.py`
**Scope:** L (5-8 files)

### Task 5.2: Custom Image Upload
**Description:** Allow user to upload their own images alongside generated ones.
**Acceptance criteria:**
- [ ] `POST /api/image-gen/upload` endpoint
- [ ] Accept PNG/JPG/WebP files
- [ ] Store in project assets folder
- [ ] Return image metadata for timeline placement
**Verify:** Upload image, verify it appears in assets
**Files:** `image_gen_api.py`
**Scope:** S (1-2 files)

### Task 5.3: Bulk Image Generator Frontend
**Description:** ImageGenPanel with prompt loading, style selector, batch progress, image grid.
**Acceptance criteria:**
- [ ] ImageGenPanel in LeftWorkspace (nav item "Images")
- [ ] Load prompts from Visual Prompt Generator
- [ ] Style selector (inherits from visual prompts)
- [ ] Batch progress bar with image thumbnails
- [ ] Generated images grid with select/download
- [ ] "Upload Custom" button alongside "Generate"
- [ ] "Send to Timeline" button
**Verify:** Generate batch, upload custom, add to timeline
**Files:** `ImageGenPanel.tsx`, `LeftWorkspace.tsx`
**Scope:** L (5-8 files)

---

## Phase 6: Clabeo-Unique Features

### Task 6.1: Podcast Maker
**Description:** Multi-line script editor with per-line voice/speed/pitch, FFmpeg concat.
**Acceptance criteria:**
- [ ] PodcastMakerPanel in LeftWorkspace (nav item "Podcast")
- [ ] Multi-line script editor (add/remove/reorder lines)
- [ ] Per-line: voice selector, speed slider, pitch slider
- [ ] "Generate All" button (batch generate)
- [ ] "Generate Podcast" button (FFmpeg concat)
- [ ] Preview individual lines before concat
- [ ] Download final podcast as MP3
**Verify:** Create 5-line podcast, generate, concat, download
**Files:** `PodcastMakerPanel.tsx`, `podcast_maker.py`
**Scope:** L (5-8 files)

### Task 6.2: Voice Library
**Description:** Voice browsing with favorites and search.
**Acceptance criteria:**
- [ ] VoiceLibraryPanel: browse all 322+ voices
- [ ] Filter by language, gender
- [ ] Search by name
- [ ] Favorite toggle (localStorage)
- [ ] Preview play button per voice
- [ ] "Use in Voiceover" button
**Verify:** Browse voices, favorite some, search
**Files:** `VoiceLibraryPanel.tsx`
**Scope:** M (3-5 files)

### Task 6.3: Sound FX (Open Source, No API Key)
**Description:** Hybrid SFX system: bundled library + procedural + web search. No API key required for core functionality.
**Acceptance criteria:**
- [ ] Built-in SFX library: 200+ curated sounds in `tools/sfx-library/` (CC0 licensed)
- [ ] ZzFX procedural generator: generate sounds from parameters
- [ ] Wikimedia Commons search: free text search, no API key
- [ ] Internet Archive search: free text search, no API key
- [ ] Freesound integration: optional API key, unlocks 500k+ sounds
- [ ] SoundFXPanel UI: search bar, category filter, preview play, download, "Add to Timeline"
- [ ] Categories: Whoosh, Impact, UI, Nature, Music, Voice, Sci-Fi, Horror
- [ ] Without any API key: bundled + procedural + web search fully functional
**Verify:** Search SFX, preview, add to timeline without any API key
**Files:** `sfx/__init__.py`, `sfx/builtin.py`, `sfx/zzfx.py`, `sfx/wikimedia.py`, `sfx_api.py`, `SoundFXPanel.tsx`, `tools/sfx-library/`
**Scope:** L (5-8 files)

### Task 6.4: Bulk TTS Generation
**Description:** TXT import, batch TTS, ZIP download.
**Acceptance criteria:**
- [ ] BulkGenerationPanel: TXT file import (one script per line)
- [ ] Per-line voice/speed/pitch settings
- [ ] "Generate All" with progress bar
- [ ] "Download All as ZIP"
- [ ] Individual re-download from history
**Verify:** Import 10 lines, generate all, download ZIP
**Files:** `BulkGenerationPanel.tsx`, `bulk_tts.py`
**Scope:** M (3-5 files)

### Task 6.5: Script Templates
**Description:** Pre-built script templates for quick start.
**Acceptance criteria:**
- [ ] ScriptTemplatesPanel: grid of template cards
- [ ] Templates: Sales Pitch, Hindi Story, Podcast Clip, Educational, etc.
- [ ] Click template -> loads into ScriptWriter
- [ ] User can save custom templates
**Verify:** Click template, verify it loads
**Files:** `ScriptTemplatesPanel.tsx`
**Scope:** S (1-2 files)

### Task 6.6: My Generations (History)
**Description:** History of all generated audio with re-download.
**Acceptance criteria:**
- [ ] MyGenerationsPanel: list of generated audio files
- [ ] Each entry: filename, date, voice, duration
- [ ] Re-download / delete per entry
- [ ] "Use in Voice Studio" button
**Verify:** Generate several files, check history, re-download
**Files:** `MyGenerationsPanel.tsx`, `generations_store.ts`
**Scope:** S (1-2 files)

### Task 6.7: Auto-Update System
**Description:** GitHub releases-based auto-updater.
**Acceptance criteria:**
- [ ] `auto_updater.py` module
- [ ] Check GitHub releases API for new version
- [ ] Download and extract update
- [ ] UI notification: "Update available"
- [ ] "Restart & Update" button
**Verify:** Simulate version mismatch, verify update flow
**Files:** `auto_updater.py`, `SettingsPanel.tsx`
**Scope:** S (1-2 files)

---

## Phase 7: Timeline Sync + Video Clipper

### Task 7.1: Timeline Auto-Sync
**Description:** Auto-sync timecoded images to voiceover audio.
**Acceptance criteria:**
- [ ] `POST /api/timeline-sync` endpoint
- [ ] Input: voiceover audio + image files (named 0-00.png, 0-03.png)
- [ ] Auto-detect timecodes from filenames
- [ ] Output: timeline plan with clip positions
- [ ] Frontend: SyncPanel with drag-drop, preview, "Send to Timeline"
**Verify:** Upload voiceover + images, sync, verify timeline
**Files:** `timeline_sync.py`, `SyncPanel.tsx`
**Scope:** M (3-5 files)

### Task 7.2: Auto Video Clipper (9:16)
**Description:** Extract vertical clips from long videos with face-tracking.
**Acceptance criteria:**
- [ ] `POST /api/clipper` endpoint
- [ ] Input: long video, clip duration (30s/60s/90s/custom), clip count
- [ ] MediaPipe face-tracking for 9:16 crop
- [ ] Auto silence removal
- [ ] Moment scoring
- [ ] Output: multiple 9:16 vertical clips
**Verify:** Process 10-min video, extract 5 x 60s clips
**Files:** `clipper.py`, `clipper_api.py`
**Scope:** L (5-8 files)

---

## Phase 8: Settings + Polish

### Task 8.1: Settings Panel
**Description:** Centralized settings for all API keys and preferences.
**Acceptance criteria:**
- [ ] SettingsPanel component (gear icon in TopBar)
- [ ] API key inputs: Groq, Gemini, Cerebras, Mistral, Freesound
- [ ] All keys stored in localStorage only
- [ ] "Test Connection" button per key
- [ ] Status indicators (green/red)
- [ ] XTTS-v2 model path status
**Verify:** Enter keys, test connection
**Files:** `SettingsPanel.tsx`, `TopBar.tsx`
**Scope:** M (3-5 files)

### Task 8.2: Navigation Update
**Description:** Add all new nav items and update LeftWorkspace routing.
**Acceptance criteria:**
- [ ] NavRail items: Home, Projects, Media, AI Tools, Voiceover, Scripts, Prompts, Images, Pipeline, Captions, Templates, Export, Podcast, Voice Library, Sound FX, Bulk Gen, Clipper, Settings
- [ ] Icons for each new item
- [ ] LeftWorkspace routes to correct panel
**Verify:** Click each nav item
**Files:** `navItems.ts`, `LeftWorkspace.tsx`, `NavRail.tsx`
**Scope:** S (1-2 files)

### Task 8.3: Color Theme Update
**Description:** Update CSS to professional dark theme (non-AI-slop).
**Acceptance criteria:**
- [ ] Background: #10131a, Surface: #171b24, Raised: #1e2330, Floating: #262c3a
- [ ] Text: #e2e6ed, #8b92a3, #555d73
- [ ] Borders: #1c2030, #2a3040
- [ ] Accent: #4a8eff
- [ ] No gradients, no glow, no glassmorphism
- [ ] All components readable and functional
**Verify:** Visual check, verify contrast
**Files:** `index.css`, `App.css`, component CSS files
**Scope:** M (3-5 files)

### Task 8.4: Final Integration Tests
**Description:** End-to-end verification.
**Acceptance criteria:**
- [ ] All 457+ backend tests pass
- [ ] All 297+ frontend tests pass
- [ ] Frontend builds clean (0 type errors, 0 lint errors)
- [ ] Manual E2E: Voiceover -> Transcribe -> Captions -> Export
- [ ] Manual E2E: Script -> Prompts -> Images -> Timeline
**Verify:** Full test suite, manual E2E
**Files:** N/A
**Scope:** S

---

## Checkpoints

| After Phase | Verification |
|---|---|
| Phase 1 | Groq transcription works; all tests pass |
| Phase 2 | 18+ languages work; .VTT export works; 9 templates generate |
| Phase 3 | Visual prompts generated; 11 styles render |
| Phase 4 | Voice blending produces mixed audio; 15-sec clone works |
| Phase 5 | Bulk images generated; custom upload works |
| Phase 6 | Podcast maker works; SFX search works without API key; history works |
| Phase 7 | Timeline sync places images; clipper produces 9:16 clips |
| Phase 8 | All features accessible; settings panel works; theme updated |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Groq API rate limits | Medium | Retry + queue + fallback to local whisper |
| Gemini API costs | Medium | Per-image cost display, batch limits |
| XTTS-v2 VRAM (4GB+) | High | CPU fallback, model download only when enabled |
| Coqui TTS install complexity | Medium | PyInstaller bundle, lazy import |
| 2GB file upload limit | Low | Chunked upload |

## Open Questions (Resolved)
1. Gemini API: Free tier + option to add own images -> User approved
2. XTTS-v2 model: User downloads manually to `models/xtts-v2/`
3. Freesound API: Optional, bundled + Wikimedia + ZzFX work without key
4. Desktop packaging: After features stable
5. Priority: Phase 1-3 first -> User approved

## XTTS-v2 Model Setup (User Manual Install)
```
Model: Coqui XTTS-v2
Size: ~2GB
Path: E:\Web App\Lava\models\xtts-v2\
Download: https://huggingface.co/coqui/XTTS-v2
Files: config.json, model.pth, vocab.json, speaker_embeddings/
```

## Freesound API Setup (Optional)
```
1. https://freesound.org/apiv2/apply/
2. Register free account
3. Create API application
4. Get API key (free: 100 req/min)
5. Enter in Lava Studio Settings
6. Without key: bundled + Wikimedia + ZzFX still work
```

## File Count Estimate

| Phase | New Files | Modified Files | Total |
|---|---|---|---|
| Phase 1 | 3 | 2 | 5 |
| Phase 2 | 1 | 3 | 4 |
| Phase 3 | 3 | 2 | 5 |
| Phase 4 | 4 | 2 | 6 |
| Phase 5 | 3 | 2 | 5 |
| Phase 6 | 8 | 1 | 9 |
| Phase 7 | 3 | 1 | 4 |
| Phase 8 | 1 | 4 | 5 |
| **Total** | **26** | **17** | **43** |
