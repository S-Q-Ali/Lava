# AI VIDEO STUDIO — MASTER BUILD SPEC V2

## Mission
Build a local-first professional AI Video Studio using the exact frontend reference supplied by the project owner.

Core AI:
1. Voice-over → semantic image matching → timing/sync → contextual automatic transitions → editable timeline.
2. Long vertical Manhwa/Webtoon image → panel detection → ordered panel assets → manual correction → export.
3. Full captions.
4. Original template/style library + user import.
5. Font library + user font import.
6. Professional multi-track editor.

## Agent stack
Big Pickle = primary coding/build agent.
OpenCode = execution/orchestration.
Graphify = codebase knowledge graph.
Addy Osmani Agent Skills = engineering workflow.
Anthropic Skills = specialized workflow/reference.
Project AGENTS.md = mandatory operating rules.

## Locked user decisions
- Voice/image: full automation + confidence + strong manual override.
- Automatic transitions required; optimize clarity, pacing, continuity and retention-oriented heuristics, never promise virality.
- Example “Ali jungle mein gaya, wahan usne ek purana castle dekha.” normally becomes two visual beats: jungle + old castle.
- Matching: meaning + visual quality + composition + continuity.
- Mixed-language voice required.
- Pause detection required.
- Manhwa: maximum practical accuracy + manual correction.
- Original long image stays available.
- Default panel order: top → bottom.
- All requested caption modes.
- Templates: library + import.
- Fonts: licensed/open built-ins + .ttf/.otf import.
- Templates: caption-only + complete video presets.
- Tracks: Video, Images, Voiceover, Captions, Music, plus SFX and Text/Overlay.
- AI: maximum automation for repetitive work + human control for important creative decisions.
- Runtime: mostly offline/local-first, optional online features.
- Product: local web app first, eventual desktop wrapper.
- Baseline: HP Pavilion 15, i7 10th Gen, 16 GB RAM, MX250 2 GB.

## Voice/image pipeline
Audio → ASR timestamps → pauses → semantic visual beats → image analysis → semantic matching → quality/continuity scoring → duration → contextual transitions → editable timeline → preview → FFmpeg render.

## Manhwa pipeline
Full-resolution input → analysis-scale preprocessing → gutter/whitespace + edge/region signals → candidate panels → merge/split reasoning → false-positive filtering → top-to-bottom ordering → original-resolution crops → confidence → manual correction → export.

Do not rely on one contour threshold.

## Captions
Support normal subtitles, word highlight, karaoke, kinetic typography, important-word pop, punctuation, hooks, manga/anime, cinematic, meme, storytelling, Urdu, Roman Urdu, English, mixed-language and optional emoji styles.

## Templates/fonts
Original preset library + import. Caption-only + complete video presets. Trending metadata must be updateable, not a permanent hard-coded claim. Fonts must have license/source metadata.

## Local-first
Keep venv, node modules, models, caches, temp, project data and FFmpeg inside project directory where practical. CPU fallback is mandatory. Use proxy preview for constrained hardware.

## Testing
Use unit, integration, real fixture and edge-case tests. Test voice pauses, mixed language, multiple visual ideas, irrelevant/duplicate images and difficult Manhwa layouts. Validate on baseline hardware.

# FRONTEND REFERENCE — MANDATORY EXACT DESIGN

The supplied AI Studio screenshot is the authoritative frontend visual reference.

This is NOT merely an inspiration. Big Pickle must reproduce the same overall UI composition, information architecture, visual hierarchy, panel placement, controls, spacing language, dark theme, typography hierarchy, icon treatment, timeline density, and interaction model.

Responsive resizing is allowed, but the relative composition and hierarchy must remain the same. Do not redesign it into a generic dashboard.

## Canonical layout

TOP BAR:
- AI Studio brand mark and title
- Create · Edit · Inspire subtitle
- project title + edit icon
- undo / redo
- Saved status
- 16:9 selector
- Preview
- Export
- profile
- settings

LEFT NAVIGATION:
Home → Projects → Media → AI Tools → Captions → Templates → Export.
AI Tools is the selected state in the reference.

LEFT WORKSPACE:
- Import Presentation
- Choose File
- PPT/PPTX/PDF support
- Image Extractor
- imported presentation card
- slide thumbnails/numbers
- Extract Images
- Extracted Images grid
- filename + dimensions
- Export JPG / Export PNG / more

CENTER:
- large video preview
- title/subtitle overlay in sample
- playback controls
- time / duration
- volume, fit/display and fullscreen
- scrub bar

TIMELINE:
- real editor timeline, not a mockup
- ruler/timecodes
- playhead
- selectable clips
- thumbnails
- waveforms
- snapping
- trim/split/move/reorder
- undo/redo
- horizontal scrolling
- reference tracks: Video, Images, Voiceover, Captions, Music
- additionally support SFX and Text/Overlay without changing the visual hierarchy

RIGHT AI MATCH:
- header with lightning icon, AI Match, close
- tabs: Voice + Images, Settings
- Voiceover Analysis waveform
- timestamped semantic segments
- matched image IDs
- Auto Match
- matched count/status
- Matched Images strip
- View All

RIGHT AUTO CAPTIONS:
- toggle
- language
- style
- Customize
- Transcript Preview + timestamps
- Caption Timing: Auto / Manual
- Generate Captions

BOTTOM:
- Project Assets: Media, Images, Audio, Videos, Documents
- Recent assets grid + View All
- Image-to-Image (AI): source → generated result → Apply Style
- Tips panel

VISUAL SYSTEM:
- dark professional editor
- near-black/navy surfaces
- amber/orange primary actions
- restrained teal/green status accents
- subtle borders
- compact professional typography
- moderate corner radii
- high information density
- NO generic purple AI gradients
- NO excessive glassmorphism
- NO card soup
- NO decorative glow
- NO meaningless animation

MANHWA:
Use the same editor shell and visual language. Add a Manhwa/Panel Extractor workflow under AI Tools/Media showing:
original long vertical image, detected panel previews, panel numbers, confidence, Split, Merge with next/previous, Crop/adjust, Delete, Add, Reorder, Re-detect, Export PNG/JPG.

FRONTEND ACCEPTANCE:
Before declaring frontend complete, compare the implementation with the supplied reference screenshot. Verify top bar, left nav, extraction workspace, center preview, timeline, AI Match, Auto Captions, bottom assets/AI/tips, colors, density and hierarchy. If a major panel is missing or moved without a documented technical reason, frontend is NOT DONE.

# BIG PICKLE OPERATING WORKFLOW

For every substantial task:
1. Inspect repository and existing architecture.
2. Query/use Graphify.
3. Discover applicable skills.
4. Load relevant skills.
5. Make/verify a concrete plan.
6. Implement incrementally.
7. Run tests and checks.
8. Review the diff for regressions.
9. Update docs/Graphify when architecture changes.
10. Report files changed, tests, failures, limitations and next task.

Never mark unfinished work complete.
Never replace the canonical frontend with a generic redesign.
Never silently overwrite user edits.
Never use fake placeholder buttons as completed functionality.

Engineering:
- FFmpeg for media decode/encode/muxing.
- OpenCV for computer vision/image processing.
- Lightweight local models with CPU fallback.
