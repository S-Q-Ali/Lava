# Spec: M12 Remaining Work — Quality Bar + Deferred Features + Pipeline Polish

## Objective
Complete the remaining gaps in Lava Studio to reach production-ready quality:
1. Enforce quality bar (constraints, coverage, lint gates)
2. Ship 3 deferred features (Script Templates, My Generations, Auto-Update)
3. Polish pipeline (error states, preview, captions)

## Success Criteria
- [ ] CONSTRAINTS.md enforced: 0 type errors, 0 lint errors, 0 test failures
- [ ] Script Templates panel: 9+ pre-built templates, one-click load into ScriptWriter
- [ ] My Generations panel: list of generated audio, re-download, delete
- [ ] Auto-Update: check GitHub releases, notify user, download update
- [ ] Pipeline: graceful error handling for missing API keys
- [ ] Pipeline: video preview player in output
- [ ] All existing 378 frontend tests still pass
- [ ] Backend tests still pass
- [ ] Documentation updated (PRODUCT_SPEC, ARCHITECTURE, DECISIONS)

## Boundaries
- **Always:** Run tsc/oxlint/pytest before commits, follow existing code style
- **Ask first:** Adding new npm packages, changing CI config, modifying CONSTRAINTS.md
- **Never:** Commit secrets, skip tests, weaken CONSTRAINTS.md

## Tech Stack
- Frontend: React 19 + TypeScript + Vite
- Backend: Python FastAPI + uv
- Testing: Vitest (frontend), pytest (backend)
- Linting: oxlint (frontend), ruff (backend)

## Modules

### Module 1: Script Templates (deferred-features)
**Acceptance:**
- ScriptTemplatesPanel with 9 template cards
- Templates: Sales Pitch, Hindi Story, Podcast Clip, Educational, Investigative, History, True Crime, Urdu Narration, News
- Click template → loads into ScriptWriter textarea
- User can save custom templates (localStorage)

### Module 2: My Generations (deferred-features)
**Acceptance:**
- MyGenerationsPanel listing all generated audio files
- Each entry: filename, date, voice, duration
- Re-download button per entry
- Delete button per entry
- "Use in Voice Studio" button

### Module 3: Auto-Update (deferred-features)
**Acceptance:**
- auto_updater.py checks GitHub releases API
- Compare current version vs latest release
- UI notification: "Update available"
- "Download & Restart" button

### Module 4: Pipeline Polish (pipeline-polish)
**Acceptance:**
- Missing API key → graceful fallback with clear message
- Failed stage → continue with placeholders, show warning
- Video preview player in pipeline output section
- Caption overlay preview on timeline

### Module 5: Documentation (spec-docs)
**Acceptance:**
- PRODUCT_SPEC.md updated with M11/M12 features
- ARCHITECTURE.md updated with new modules
- DECISIONS.md entries for key choices
