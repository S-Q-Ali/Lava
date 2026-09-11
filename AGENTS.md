# AGENTS.md — AI Video Studio

## Mission
You are Big Pickle operating through OpenCode. Build and maintain a local-first professional AI Video Studio.

## Mandatory workflow
Before substantial implementation:
1. Inspect repository and current architecture.
2. Query/use Graphify to understand affected code.
3. Discover applicable skills.
4. Load the relevant skill(s).
5. Produce/verify a plan.
6. Implement incrementally.
7. Run tests and verification.
8. Review the diff for regressions.
9. Update documentation and Graphify context when architecture changes.
10. Report exactly what changed and what remains.

Do not skip this workflow for large feature work.

## Documentation index
Canonical specs live in `docs/`; read the relevant one before designing:
- `docs/PRODUCT_SPEC.md` — mission, rules, locked behavior, pipelines.
- `docs/ARCHITECTURE.md` — repository layout and system boundaries.
- `docs/FEATURES.md` — full feature inventory.
- `docs/UI_SPEC.md` — editor layout and UI/UX rules.
- `docs/TEST_PLAN.md` — testing strategy and fixture sets.
- `docs/ROADMAP.md` — milestone plan (0–10).
- `docs/SESSION_LOG.md` — append-only record of every session (WHAT/HOW/WHY + next step). THE cross-session continuity file.
- `docs/DECISIONS.md` — architecture decision log (WHAT/WHY/HOW/Alternatives/Status).
Original full specs stay at the repo root: `AI_VIDEO_STUDIO_MASTER_SPEC.md` and `AI_VIDEO_STUDIO_MASTER_DOCUMENTATION.docx`.
When a feature or architecture changes, update the matching `docs/` file.

## Agent skills (OpenCode)
Skills live in `.opencode/skills/<skill-name>/SKILL.md`; shared checklists in `.opencode/references/`. Source copies of the packs are in `tools/agent-skills/` and `tools/anthropic-skills/`.
If a task matches a skill, load it with the `skill` tool before acting and follow it strictly.

Intent to skill:
- Feature / new functionality → `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` + `test-driven-development`
- Bug / unexpected behavior → `debugging-and-error-recovery`
- API / interface design → `api-and-interface-design`
- UI work → `frontend-ui-engineering`
- Review before merge → `code-review-and-quality`
- Refactoring → `code-simplification`
- Commit discipline → `git-workflow-and-versioning`
- Architecture decisions / docs → `documentation-and-adrs`
- Quality bar / constraints → `constraint-driven-development`

## Core product
Two differentiators are mandatory:
1. Voice-over → semantic image matching → automatic timing/sync → contextual transitions → editable timeline.
2. Long vertical Manhwa/Webtoon image → panel detection → ordered panel assets → manual correction → PNG/JPG export.

## Voice/image rules
- Mixed-language narration is supported.
- Detect pauses.
- Split narration into semantic visual beats; one sentence may produce multiple images.
- Match using semantic meaning + visual quality + composition + continuity.
- Provide confidence.
- Allow manual replacement, trim, reorder and timing changes.
- Do not silently overwrite user edits.

## Transition rules
- Optimize for clarity, audiovisual coordination, narrative progression, continuity and controlled pacing.
- Clean cuts are the default.
- Use other transitions only when context justifies them.
- Never promise virality.
- Every automatic transition must be editable.

## Manhwa rules
- Preserve original source image.
- Detect panels using a hybrid CV pipeline; do not rely on one contour threshold.
- Handle gutters, borderless panels, irregular/connected-looking panels and false boundaries.
- Sort top-to-bottom by default.
- If uncertain, expose confidence.
- Provide Split, Merge, Crop, Delete, Add and Reorder operations.
- Export original-resolution crops.

## Captions
Support:
normal subtitles, word highlight, karaoke, kinetic typography, important-word pop, punctuation, hooks, manga/anime, cinematic, meme, storytelling, Urdu, Roman Urdu, English, mixed-language and optional emoji styles.

## Templates/fonts
- Built-in original presets.
- User import.
- Caption-only and complete video presets.
- Fonts must be appropriately licensed or user-provided.
- Track font source/license metadata.
- Trending must be updateable; do not hard-code claims.

## Editor
Core tracks:
Video, Image, Voice, Music, SFX, Captions, Text/Overlay.

AI edits must remain editable.

## Hardware
Baseline:
HP Pavilion 15, Intel i7 10th Gen, 16 GB RAM, NVIDIA MX250 2 GB.

Design for CPU fallback and lightweight models. Use proxy previews where necessary.

## Local-first
Keep project environments, dependencies, models, caches, FFmpeg and temp data inside the project folder wherever practical. Do not claim that Windows/NVIDIA system drivers can be isolated from the OS drive.

## UI
Avoid generic AI-slop patterns: excessive gradients, glassmorphism, card soup, fake AI labels, decorative glow and meaningless animation.

Build a real editor:
left media/navigation, center preview, bottom timeline, right inspector/AI tools.

## Definition of done
No feature is complete until implementation, UI where applicable, error states, tests, verification, documentation and regression checks are complete.

## Reporting
At the end of each substantial task report:
- files changed
- behavior implemented
- tests run
- tests passed/failed
- limitations
- next step

Never report unfinished work as complete.

## Session continuity
Sessions are compacted and context is lost. Written files are the only source of continuity:
- At the end of every substantial task/session, APPEND a WHAT/HOW/WHY entry to `docs/SESSION_LOG.md` and update `docs/DECISIONS.md`/`docs/ROADMAP.md` when decisions or status change. Do not skip this.
- Commit often in small atomic commits so every increment survives session boundaries.
- Graphify tracks codebase state, NOT session intent or history — the session log is the record of the latter.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
