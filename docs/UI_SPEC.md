# AI Video Studio — UI Specification

> **How to read this doc** — WHAT: layout and UI/UX rules the editor must follow. WHY: a professional editor (four-zone layout, dense timeline) is itself the product differentiator — "editor that happens to have excellent AI automation" — and generic AI-slop patterns undermine trust and density. HOW: apply the Avoid/Prefer lists (§2–§3) to every surface; state requirements (§7) apply to every feature.

## 1. Direction

The UI must feel like a real professional editor, not an AI landing page. Do not optimize for “AI-looking”; optimize for “editor that happens to have excellent AI automation”.

## 2. Avoid

- Excessive purple/blue gradients.
- Glassmorphism everywhere.
- Every component as a floating rounded card.
- Giant “AI MAGIC” labels.
- Meaningless animated glow.
- Decorative UI that steals timeline space.
- Generic dashboard cards.

## 3. Prefer

- Strong editor hierarchy.
- Dense but readable timeline.
- Clear preview.
- Inspector/tool panels.
- Functional icons.
- Restrained motion.
- Explicit states.
- Visible manual controls.
- Confidence indicators.
- Useful empty/error/loading states.
- Keyboard shortcuts.
- Reversible actions.

## 4. Primary Layout

```
┌───────────────────────┬───────────────────────┬───────────────────────┐
│ Left                  │ Center               │ Right                 │
│ project / media /     │ preview              │ inspector / AI tools  │
│ navigation            │                      │                       │
├───────────────────────┴───────────────────────┴───────────────────────┤
│ Bottom: timeline                                                      │
│ tracks: Video · Image · Voice · Music · SFX · Captions · Text/Overlay │
└───────────────────────────────────────────────────────────────────────┘
```

Additional panel/drawer: extracted Manhwa panels, caption presets and asset browser as needed.

## 5. Manhwa Correction View

Present detection results visually, not with computer-vision terminology.

For each uncertain panel show:
- Panel number
- Confidence
- Preview

Actions (visual and labeled in plain language):
- Split panel
- Merge with next
- Merge with previous
- Crop/adjust bounds
- Delete false detection
- Add panel manually
- Move/reorder (drag-and-drop)
- Re-detect
- Reset detection

## 6. Voice-over → Timeline View

- Result timeline is fully editable: replace image, trim, reorder, re-time, override transitions.
- Low-confidence matches are visually flagged with a confidence indicator and a suggested action.
- Transcript is editable; re-segmentation reflects edits.

## 7. State Requirements

Every feature surface requires useful states:
- Loading (pipeline running, progress/indeterminate).
- Empty (no media yet, guided first steps).
- Error (recoverable, actionable, non-technical copy).
- Confidence/warning (AI uncertain, user override available).
- Success (rendered/exported, path shown).

## 8. Transitions UI (M4 `transitions-ui`)

- **Timeline chips**: between chips centred on the cut boundary; width ∝ transition duration (clamped 36–64px); edge chips at the first/last clip of a track; click-to-select. Selected chip gets a visible outline.
- **Inspector pane**: lists every transition with its human rationale, a type `<select>` (between only) and duration input; manual edits flip the transition to `manual` and are preserved on re-suggest. Remove deletes exactly the targeted transition.
- **Invalid banner**: orphaned or otherwise invalid transitions stay in the list and surface a visible banner; the user resolves them explicitly — there is no silent auto-deletion.
- **No manual "add" button**: creation stays suggestion-only to preserve the clean-cut bias. Manual energy goes into editing or removing what the tool suggested.