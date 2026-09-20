# AI Video Studio — Product Specification

> **How to read this doc** — WHAT: the product and its locked, non-negotiable behavior (this is the source of truth; the master spec at the repo root is the original). WHY: the product principle is "a real editor that happens to have excellent AI automation" — local-first, confidence-exposed, always user-overridable — so users never lose control and the studio works even without AI. HOW: the pipelines (§5–§10) and rules operationalize that principle; UI details live in [UI_SPEC.md](UI_SPEC.md).

## 1. Mission

Build a local-first professional AI Video Studio inspired by the workflow density of modern editors, but with an authored product identity rather than generic AI-generated UI.

Primary differentiators:

1. Voice-over → semantic image matching → automatic timing/sync → transitions → editable timeline.
2. Long vertical Manhwa/Webtoon panel extraction → detection → ordering → individual image assets → manual correction → export.

The application must be useful as a real editor even when AI features are unavailable. AI accelerates decisions; it does not remove user control.

## 2. Non-Negotiable Build Rules

- Big Pickle is the primary coding/building agent.
- OpenCode is the execution environment.
- Graphify is the codebase knowledge/architecture graph.
- Addy Osmani Agent Skills are the engineering workflow reference.
- Anthropic Skills are specialized workflow/reference material.
- The project gets its own AGENTS.md; do not blindly copy another repository's AGENTS.md.
- Before substantial implementation: inspect repository, inspect Graphify state, discover relevant skills, load relevant skills, write/verify a plan, implement incrementally, test, review, and update documentation.
- Never claim a feature is complete without acceptance tests.
- AI predictions must expose confidence or be reversible where errors are possible.
- Manual override is mandatory for creative/vision decisions.
- Prefer local processing for the finished studio; online services are optional rather than core.
- Keep Python environments, Node dependencies, model files, caches, FFmpeg binaries and project data inside the project directory wherever technically possible.
- Do not promise that Windows/NVIDIA system drivers can be kept off the system drive.
- Core video work uses FFmpeg for media encoding/muxing and OpenCV for computer vision/image processing.
- Do not describe OpenCV as an AI model.
- Do not copy proprietary templates or fonts. Use original presets and appropriately licensed fonts.

## 3. Development Intelligence Stack

| Layer | Purpose | Project integration |
| --- | --- | --- |
| Graphify | Map and query the evolving codebase so the coding agent can reason about architecture and dependencies. | Project-scoped Graphify installation and generated graph artifacts. |
| Addy Osmani Agent Skills | Disciplined engineering workflows: specification, planning/task breakdown, incremental implementation, testing, code review. | Load as needed per task. |
| Anthropic Skills | Specialized workflow patterns. | Use selectively where relevant; do not load every skill for every task. |
| Big Pickle | Primary implementation agent. | Uses the skill system and repository knowledge rather than one giant prompt. |
| OpenCode | Orchestrates the agent, skills, tools, repository operations and verification. | Execution environment. |

## 4. Locked Product Behavior

### Voice-over / image sync

- Full automatic mode is required.
- Automatic matching must provide confidence information and remain manually editable.
- Semantic meaning + visual quality + composition + continuity are preferred over filename matching.
- A sentence may split into multiple visual segments when it contains multiple concrete visual ideas.
  - Example: “Ali jungle mein gaya, wahan usne ek purana castle dekha.” should normally produce two visual segments: jungle and castle.
- Voice pauses should influence timing.
- Mixed-language voice-over is required.

### Transitions

- Automatic transitions are required.
- The system should choose transitions based on context, pacing, visual continuity and narrative/emotional intent.
- Default behavior must favor clean cuts and restrained transitions; effects must not be inserted merely because they exist.
- Retention optimization is a heuristic, not a promise of virality. Optimize for clarity, novelty/rhythm, narrative progression, audiovisual coordination and controlled pacing.
- Transition decisions must be explainable, editable and user-overridable.

## 5. Voice-over → Images Pipeline

Input:
- Voice-over audio
- User-provided image pool

Pipeline:
1. Decode/analyze audio.
2. Speech-to-text with word/sentence timestamps.
3. Detect pauses and meaningful timing boundaries.
4. Segment narration into semantic visual beats.
5. Analyze images for visual semantics, composition and usable subject matter.
6. Generate semantic embeddings/features.
7. Match each visual beat to candidate images.
8. Score candidates using semantic relevance, visual quality, continuity, repetition penalty and timing fit.
9. Choose the best candidate or flag low-confidence decisions.
10. Determine image duration from narration timing and pacing rules.
11. Generate transitions/animation suggestions.
12. Build an editable timeline.
13. Preview.
14. Allow manual replacement, trimming, reordering and transition override.
15. Render using FFmpeg.

Example:
- Narration: “Ali jungle mein gaya, wahan usne ek purana castle dekha.”
- Expected segmentation:
  - Segment A: Ali/jungle
  - Segment B: old castle
- The system must not mechanically enforce one sentence = one image.

## 6. Retention-Oriented Editing Engine

The engine must NOT claim that a transition makes a video viral. It optimizes measurable editing heuristics instead.

Priority order:
1. Narrative clarity
2. Audio/visual synchronization
3. Appropriate visual change/rhythm
4. Continuity
5. Emotional/contextual fit
6. Novelty without distraction
7. Controlled pacing
8. Transition polish

Default transition policy:
- Hard/clean cut: default for ordinary visual change.
- Match/continuity cut: when composition or subject carries across shots.
- Short dissolve: passage of time, softer emotional movement.
- Fade: beginning/end or deliberate temporal/emotional break.
- Wipe/graphic transition: only for a clearly justified stylistic/template context.
- Zoom/whip/glitch/etc.: only when a template or narrative beat explicitly benefits from it.

Avoid transition spam. A transition should have a reason.

Allow future A/B experiments using retention metrics from user-provided analytics, but do not fake an evidence-based “viral score”.

## 7. Manhwa / Webtoon Long-Strip Extractor

Goal: drop one very tall Manhwa/Webtoon image and automatically detect its visual panels, preserving original resolution.

Input class: long vertical-scroll webtoon/manhwa layouts where panels can vary greatly in height, gutters can create pacing, and panels may be borderless or visually connected.

Pipeline:
1. Load original at full resolution.
2. Create analysis-scale representation for speed.
3. Detect likely gutters/whitespace/structural boundaries.
4. Detect candidate panel regions using multiple signals, not one contour threshold.
5. Evaluate border, color, texture, edge and region continuity.
6. Handle borderless candidates.
7. Detect likely connected/combined panel candidates.
8. Apply merge/split reasoning.
9. Filter false positives such as speech bubbles, text blocks, characters, decorative lines and empty regions.
10. Sort panels in natural top-to-bottom reading order.
11. Map analysis coordinates back to original resolution.
12. Export individual crops without unnecessary resampling.
13. Display confidence and allow manual correction.

## 8. Manhwa Correction UI

The phrase “combined panels” must be implemented visually rather than exposing confusing terminology.

If detection is uncertain, show:
- Panel number
- Confidence
- Preview

Actions:
- Split panel
- Merge with next
- Merge with previous
- Crop/adjust bounds
- Delete false detection
- Add panel manually
- Move/reorder
- Re-detect
- Reset detection

Do not require the user to understand computer-vision terminology.

## 9. Manhwa Output

- Keep the original long image in the project/editor.
- Create a panel asset collection: `panel_001.png`, `panel_002.png`, `panel_003.png`, ...
- Default reading/order: top → bottom.
- Allow drag-and-drop reorder.
- Store metadata: panel id, source image id, x/y/width/height, confidence, order, optional user-corrected flag.
- Support JPG export, with PNG as the lossless/default option.

## 10. Captions System

Supported modes:
- Normal subtitles
- Word-by-word highlighting
- Karaoke
- Kinetic typography
- Important-word pop
- Auto punctuation
- Hook text
- Manga/anime captions
- Cinematic captions
- Meme captions
- Storytelling captions
- Urdu captions
- Roman Urdu captions
- English captions
- Mixed-language captions
- Auto emoji as an optional style, never mandatory

Caption generation: ASR → timestamps → sentence/phrase segmentation → word timestamps where supported → style renderer → editable caption track.

Every caption must remain editable after AI generation.

## 11. Templates / Styles / Fonts

The system must support BOTH:
1. A built-in original template/preset library.
2. User-importable custom templates/presets.

Template types:
- Caption-only presets
- Complete video-treatment presets

A complete preset may define:
- Aspect ratio
- Caption style
- Font
- Font weight
- Position
- Word highlight behavior
- Image animation
- Transition strategy
- Timing strategy
- Text animation
- Color rules
- Safe areas

Suggested library categories: Trending, New, Shorts, Reels, YouTube, Anime, Manhwa, Storytelling, Cinematic, Motivation, Meme, Documentary, Custom.

“Trending” must be updateable. Do not hard-code a permanent claim that a style is trending.

Fonts:
- Include appropriately licensed/open fonts.
- Allow user `.ttf`/`.otf` import.
- Track font license/source metadata.
- Prioritize readability at mobile sizes.
- Support multilingual/Urdu-compatible fonts where licensing permits.

## 12. Editor / Timeline

The editor must provide a professional timeline rather than a card dashboard.

Core tracks:
- Video
- Image
- Voice
- Music
- SFX
- Captions
- Text/Overlay

Additional tracks may be added only when they provide real workflow value.

Required operations:
- Split
- Trim
- Move
- Delete
- Duplicate
- Replace asset
- Re-time
- Reorder
- Transition edit
- Caption edit
- Undo/redo
- Preview
- Export

AI-generated edits must remain editable on the timeline.

## 13. AI Control Philosophy

- Maximum automation for repetitive work.
- Human control for important creative decisions.

Default behavior: AI does the first pass quickly. User can inspect and override. The editor preserves user changes.

Never silently rewrite user edits during background AI processing.

## 14. UI / UX Direction

The UI must feel like a real professional editor, not an AI landing page.

Avoid:
- excessive purple/blue gradients
- glassmorphism everywhere
- every component as a floating rounded card
- giant “AI MAGIC” labels
- meaningless animated glow
- decorative UI that steals timeline space
- generic dashboard cards

Prefer:
- strong editor hierarchy
- dense but readable timeline
- clear preview
- inspector/tool panels
- functional icons
- restrained motion
- explicit states
- visible manual controls
- confidence indicators
- useful empty/error/loading states
- keyboard shortcuts
- reversible actions

Primary layout:
- Left: project/media/navigation
- Center: preview
- Bottom: timeline
- Right: inspector/AI tools
- Additional panel/drawer: extracted Manhwa panels, caption presets and asset browser as needed.

## 15. Runtime / Hardware Strategy

Baseline target hardware:
- HP Pavilion 15
- Intel Core i7 10th Gen
- 16 GB RAM
- NVIDIA MX250 2 GB VRAM
- Intel integrated graphics

Design constraints:
- CPU fallback is mandatory.
- Avoid requiring large GPU-only models.
- Prefer lightweight models and optional model packs.
- Do not assume 4K real-time AI processing is practical.
- Preview can use proxies/lower resolution.
- Render can use full-resolution assets offline.

Local-first directories must be configurable: `.venv/`, `node_modules/`, `models/`, `cache/`, `temp/`, `projects/`, `tools/ffmpeg/`, etc.

Provide configuration so caches and model downloads can be redirected into the project folder.

## 16. Key Product Principle

Do not optimize for “AI-looking”.
Optimize for “editor that happens to have excellent AI automation”.

The user should be able to understand what happened, change it, undo it, and continue editing manually.

The system should feel authored, fast and trustworthy.

## 12. M11/M12 Features (AutoCut Studio PRO + Clabeo Parity)

### Voice & TTS
- **Groq Whisper** — cloud transcription (6 models, 25 languages)
- **Edge-TTS** — 322+ voices, bulk generation, ZIP download
- **Voice Blending** — FFmpeg amix, 2+ voices with volume ratios
- **Voice Cloning** — XTTS-v2, 6-second reference sample (manual download)

### Captions
- **25 languages** — Urdu, Arabic, Hindi, Chinese, Japanese, Korean, Thai, Hebrew, Bengali, etc.
- **8 new styles** — RTL/CJK support (Arabic, Hindi, Chinese, Japanese, Korean, Thai, Hebrew, Bengali)
- **SRT/VTT export** — POST /api/captions/export

### Image Generation
- **Gemini Imagen 3** — batch generation from prompts, 11 art styles
- **Custom upload** — upload images for timeline
- **Visual Prompts** — LLM-powered prompt generation

### Audio Features
- **Podcast Maker** — multi-turn dialogue from topic (LLM + edge-tts)
- **Sound FX** — ZzFX procedural + Wikimedia/Internet Archive search
- **Bulk TTS** — TXT import, batch generation, ZIP download

### Video Features
- **Timeline Sync** — auto-sync images to voiceover by timecodes
- **Video Clipper** — 9:16 vertical clips, scene detection, 4 crop modes

### Pipeline
- **End-to-End** — Script → TTS → Images → Sync → Captions → Render → Video
- **Progress tracking** — real-time stage progress via polling
- **Video preview** — HTML5 player in pipeline output

### Tools
- **Hardware Analyzer** — pre-download system assessment (Easy/Medium/Hard/Insufficient)
- **Script Templates** — 9 pre-built templates, one-click load
- **My Generations** — history of generated audio, re-download
- **Auto-Update** — GitHub releases checker
- **Settings Panel** — Groq/Gemini/Cerebras/Mistral API keys, model manager

## Reference repositories

- https://github.com/Graphify-Labs/graphify.git
- https://github.com/addyosmani/agent-skills.git
- https://github.com/anthropics/skills.git