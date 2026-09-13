# Spec: M6 — Template/Font System

## Objective

Build a professional template and font system that extends the existing caption engine (M5) with:
1. **Font management** — user font import with license metadata tracking
2. **Preset registry** — built-in original preset library across 13 categories
3. **Custom preset import** — user-importable caption-only and complete video-treatment presets
4. **Template editor** — visual editor for creating/editing presets
5. **Animated caption treatments** — kinetic/manga/meme/cinematic/storytelling animations (upgrading M5 static styles)

**User:** Video creator who wants consistent, professional styling across projects without manual reconfiguration.

**Success looks like:** User can import a font, create a template using it, apply the template to a project, and export a video with animated captions — all while license metadata is tracked.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript ~6, Vite 8, Zustand 5 |
| Backend | Python 3.12, FastAPI, pytest |
| State | Zustand + Zundo (temporal undo/redo) |
| Caption rendering | libass (via FFmpeg `ass=` filter) |
| Font handling | System fonts + user-imported `.ttf`/`.otf` in `fonts/` |
| Persistence | Versioned `lava-studio` JSON (project version stays 1) |

## Commands

```bash
# Frontend
cd frontend && npm run dev      # Start dev server
cd frontend && npm run build    # Type-check + build
cd frontend && npm run lint     # oxlint
cd frontend && npx vitest run   # Run tests

# Backend
cd backend && uv run pytest     # Run tests
cd backend && ./scripts/sidecar.sh  # Start sidecar
```

## Project Structure

```
frontend/src/
├── editor/
│   ├── fonts.ts              # Font model, validation, license metadata
│   ├── presets.ts            # Preset model, categories, validation
│   └── templateEditor.ts     # Template editor state + operations
├── store/
│   └── fontStore.ts          # Font registry state + actions
├── components/
│   ├── FontPanel.tsx         # Font import + management UI
│   ├── PresetPanel.tsx       # Preset browser + import UI
│   └── TemplateEditor.tsx    # Template editor panel
└── services/
    └── fonts.ts              # Font API client

backend/src/lava_backend/
├── fonts.py                  # Font validation, metadata extraction
└── presets.py                # Preset validation, import/export

fonts/                        # User-imported fonts (gitignored)
├── .gitkeep
└── licenses.json             # Font license metadata registry

presets/                      # User presets (gitignored)
├── .gitkeep
└── custom/                   # User-imported presets
```

## Code Style

Follow existing patterns from M5 caption engine:

```typescript
// Model types — frozen dataclass-like interfaces
export interface FontMetadata {
  id: string;           // 'font-' + uuid
  family: string;       // Display name
  fileName: string;     // Original file name
  path: string;         // Relative path in fonts/
  license: FontLicense; // 'open' | 'commercial' | 'personal' | 'unknown'
  licenseSource?: string; // URL or reference
  embeddingAllowed: boolean;
  addedAt: string;      // ISO timestamp
}

// Pure operations — no side effects
export function validateFont(file: File): FontValidationResult { ... }
export function parseLicenseMetadata(json: unknown): FontLicense { ... }

// Store actions — temporal (undoable) where user edits
fontStore.importFont(file: File): Promise<FontMetadata>;
fontStore.removeFont(id: string): void;
```

## Testing Strategy

| Level | Framework | Location | Coverage |
|-------|-----------|----------|----------|
| Unit (pure) | vitest | `frontend/src/editor/fonts.test.ts` | Font validation, preset parsing, license metadata |
| Unit (store) | vitest | `src/store/fontStore.test.ts` | Import/remove/undo actions |
| Component | vitest + jsdom | `src/components/FontPanel.test.tsx` | Import flow, license display, error states |
| Integration | pytest | `backend/tests/test_fonts.py` | Font file validation, metadata extraction |
| E2e | Manual | — | Import font → create preset → render video |

**Coverage expectations:**
- Pure logic: 100% branch coverage
- Store actions: All actions + undo/redo paths
- Components: All user flows + error states

## Boundaries

**Always do:**
- Run tests before commits
- Follow existing naming conventions (kebab-case modules, camelCase functions)
- Validate all user inputs (font files, preset JSON)
- Track license metadata for every imported font
- Use project-local directories (fonts/, presets/)
- Document decisions in DECISIONS.md

**Ask first:**
- Adding new dependencies (e.g., font parsing libraries)
- Changing the project file format version
- Modifying existing caption rendering pipeline
- Bundling third-party fonts with the app

**Never do:**
- Commit font binary files (gitignore fonts/)
- Remove failing tests without approval
- Silently overwrite user presets
- Make viral/trending claims
- Use unlicensed fonts in built-in presets

## Success Criteria

### Font System
- [ ] User can import `.ttf`/`.otf` files via drag-drop or file picker
- [ ] Font family name is extracted and displayed
- [ ] License metadata is captured (type, source, embedding permissions)
- [ ] Fonts are stored in project-local `fonts/` directory
- [ ] Font registry persists across project save/load
- [ ] User can remove imported fonts
- [ ] Missing fonts fall back gracefully (libass fallback)

### Preset Registry
- [ ] 13 built-in categories exist (Trending, New, Shorts, Reels, YouTube, Anime, Manhwa, Storytelling, Cinematic, Motivation, Meme, Documentary, Custom)
- [ ] Each preset defines: caption style, font, position, color rules, animation
- [ ] Presets are browsable by category
- [ ] Presets are applicable to current project

### Preset Import
- [ ] User can import preset via JSON file
- [ ] Imported presets are validated against schema
- [ ] Invalid presets show actionable error messages
- [ ] Imported presets appear in "Custom" category
- [ ] Caption-only and complete video presets both supported

### Template Editor
- [ ] Visual editor for preset properties
- [ ] Live preview of caption style
- [ ] Font selection from registry
- [ ] Position, color, animation controls
- [ ] Save as new preset or overwrite existing

### Animated Captions
- [ ] Kinetic typography animation (word-by-word reveal)
- [ ] Manga/anime style (speed lines, impact frames)
- [ ] Cinematic (fade, scale, letterbox)
- [ ] Meme style (impact font, shake)
- [ ] Storytelling (gentle fade, emphasis)
- [ ] All animations render via libass tags

## Open Questions

1. **Font extraction:** Should we use a library (e.g., `fontkit`) to extract font names from files, or rely on filename?
2. **Preset schema:** Should presets be a subset of the project format, or a separate schema?
3. **Animation complexity:** Should animations be preset-only, or allow per-word timing control?
4. **Font bundling:** Should we bundle any open-source fonts with the app, or start empty?
5. **Trending updates:** How should "Trending" category be updated — manual, or fetch from a URL?

## Module Breakdown

### Module 1: font-system
- Font file validation (.ttf/.otf only)
- Font metadata extraction (family name, license)
- Font registry (import, remove, list)
- License metadata persistence
- Integration with libass renderer

### Module 2: preset-registry
- Preset data model (extends caption styles)
- 13 category definitions
- Built-in preset library (original presets)
- Preset application to project

### Module 3: preset-import
- Preset JSON schema validation
- Import flow (file picker → validate → store)
- Export flow (preset → JSON file)
- Custom category management

### Module 4: template-editor
- Editor UI (inspector panel)
- Live preview canvas
- Property controls (font, position, color, animation)
- Save/load preset

### Module 5: animated-captions
- Animation definitions (kinetic, manga, cinematic, meme, storytelling)
- ASS tag generation (`{\t}`, `{\move}`, `{\fad}`, etc.)
- Integration with existing caption renderer
- Preview in timeline

## Build Order

```
font-system ──┬── template-editor ── animated-captions
preset-registry ─┬── preset-import ── template-editor
```

Phase 1: font-system + preset-registry (parallel)
Phase 2: preset-import (depends on preset-registry)
Phase 3: template-editor (depends on font-system + preset-registry)
Phase 4: animated-captions (depends on template-editor)