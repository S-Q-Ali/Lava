# Capability Map: M4 — Transition / Animation Engine

Per spec-driven development Phase 0: M4 bundles independently testable capabilities, so module
boundaries + build order get reviewed before any module spec is written.

| Module id | Responsibility | Depends on |
|---|---|---|
| `transitions-core` | Transition data model (type, duration, direction, rationale), project persistence, pure suggestion heuristics (default = clean cut), explainable rationale, editable/overridable policy | — |
| `transitions-render` | FFmpeg `xfade`/`dissolve`/`fade` in the backend render pipeline (transition-aware clip offsets), render tests, validators for unsupported combos | `transitions-core` |
| `transitions-ui` | Timeline transition chips + select/override/remove/explain (note under selected transition), respects clean-cut default, undoable edits | `transitions-core` |
| `image-motion` | Ken Burns / zoom-pan animation on still-image clips (model + render filter + UI control), proxy-friendly | `transitions-render` |

## Build order

`transitions-core` → `transitions-render` → `transitions-ui`; `image-motion` after (shares the render
changes and clips render as video only then).

## Dependency direction notes

- `transitions-render` reads the data contract from `transitions-core` (no reverse dependency).
- `transitions-ui` talks only to `transitions-core` (persistence + suggestions), never to the encoder.
- `image-motion` depends on `transitions-render` for the same encode path but has its own model/UI scope.

## Per-module gating

Each module runs Specify → Plan → Tasks → Implement → Verify → Docs, independently, in this order.
Human reviews the module spec before code. `transitions-core` is scoped to *suggestions + persistence*
only; it never touches ffmpeg or the timeline DOM.

## Boundaries

- Default policy hard-coded per PRODUCT_SPEC §Transitions: clean cut default; dissolve for passage of
  time; match cut on continuity; fade at begin/end of reels; wipe/zoom/whip only with explicit
  template/narrative justification. No "viral score" claims anywhere.
- Every suggestion is explainable (rationale string) and user-overridable; overrides persist.
- Project file keeps `version: 1` (optional fields only, D-009/D-011/D-013 pattern).
- Ask first: project schema changes beyond optional fields, new runtime deps (ffmpeg already local),
  UI layout changes that fight UI_SPEC §2.
- Never: fake evidence-based retention claims; un-editable automatic transitions.

## Open questions

- Transition anchors: point-in-time (at boundary between consecutive clips) vs interval (cover overlap
  window). Default assumption: interval with explicit `duration`, clipped to the shorter of the two clips.
- Do audio tracks (voice/music) get crossfades too? Default assumption: video/images only in M4;
  audio crossfade is a separate future capability.
- Image motion default strength/direction: pan-right + subtle zoom-in on landscape, none on near-square
  (avoids AI-slop feel). Confirm at `image-motion` spec time.