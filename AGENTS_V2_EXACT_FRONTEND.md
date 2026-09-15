# AGENTS.md — AI Video Studio

## HIGHEST PRIORITY: EXACT FRONTEND
The supplied AI Studio screenshot is the canonical frontend reference.

Reproduce its:
- top bar
- left navigation
- left presentation/image extractor
- center preview
- center multi-track timeline
- right AI Match
- right Auto Captions
- bottom Project Assets / Recent / Image-to-Image / Tips
- dark visual system
- amber primary actions
- teal/green status accents
- typography hierarchy
- information density

Do not redesign it into a generic dashboard. Responsive resizing is allowed; changing the composition is not.

## Product
Build the local-first AI Video Studio described in AI_VIDEO_STUDIO_MASTER_SPEC_V2_EXACT_FRONTEND.md.

## Mandatory workflows
Use Graphify + relevant Addy Osmani Agent Skills + relevant Anthropic Skills through OpenCode.

Before substantial implementation:
inspect → Graphify → discover skills → load skills → plan → implement incrementally → test → review → update docs/graph → report.

## Voice/image
Full automation + confidence + manual override. Mixed language and pause detection. Semantic visual beats. Example jungle/castle sentence should normally produce two visual beats.

## Transitions
Automatic contextual selection. Optimize clarity, rhythm, continuity, emotional/contextual fit and retention-oriented heuristics. Clean cuts are default. Never promise virality. Every AI transition is editable.

## Manhwa
Long vertical Webtoon/Manhwa input. Hybrid CV detection. Handle gutters, borderless/connected-looking panels and false boundaries. Top-to-bottom order. Provide Split, Merge, Crop, Delete, Add, Reorder, Re-detect. Preserve original resolution.

## Captions/templates/fonts
All requested caption modes. Built-in original presets + user import. Caption-only and complete video presets. Licensed/open fonts + user .ttf/.otf import.

## Editor
Video, Images, Voiceover, Captions, Music, SFX and Text/Overlay support.

## Hardware
HP Pavilion 15 / i7 10th Gen / 16 GB / MX250 2 GB baseline. CPU fallback and proxy preview required.

## Definition of done
No feature is done until implementation, working UI, error states, tests, verification, documentation and regression checks are complete.
