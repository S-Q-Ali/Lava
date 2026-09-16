# V2 Frontend Gap Fixes — Plan

## Overview

Audit identified **35 matched / 13 partial / 13 missing / 3 wrong** items against the `AI_VIDEO_STUDIO_MASTER_SPEC_V2_EXACT_FRONTEND.md` reference. This plan closes all gaps to achieve full spec compliance.

## Capability Map

| Module ID | Responsibility | Depends On |
|-----------|---------------|------------|
| `gap-quick-fixes` | Text/naming corrections, button wiring, close button | — |
| `gap-preview-controls` | Scrub bar, volume, fit/display, fullscreen, duration | — |
| `gap-timeline-visuals` | Thumbnails on clips, audio waveforms | — |
| `gap-ai-match-visual` | Matched Images strip, View All, waveform viz | — |
| `gap-extractor-fixes` | Presentation card, slide numbers, extracted grid, export JPG/PNG | — |
| `gap-image-to-image` | Result display, Apply Style, source state fix | — |
| `gap-auto-captions` | Transcript timestamps, caption timing wiring | — |

**Build order:** `gap-quick-fixes` (parallel) → `gap-preview-controls` + `gap-timeline-visuals` + `gap-ai-match-visual` (parallel) → `gap-extractor-fixes` + `gap-image-to-image` + `gap-auto-captions` (parallel)

---

## Phase 1: Quick Fixes (5 tasks, ~2 files each)

### Task 1.1: Fix track display names
- **Acceptance:** Default tracks show `Video`, `Images`, `Voiceover`, `Music`, `Captions` (capitalized, spec-compliant names)
- **Files:** `editor/types.ts` (DEFAULT_TRACKS), verify TimelinePanel renders correctly
- **Verify:** tsc + vitest pass

### Task 1.2: Fix Assets panel tab labels
- **Acceptance:** Tabs show `Media`, `Images`, `Audio`, `Videos`, `Documents` per spec (remove `Recent`, `All`, `Image to Image`, `Tips` from tab bar; Image-to-Image and Tips stay as sub-panels)
- **Files:** `AssetsPanel.tsx`, `AssetGrid.tsx` (category type)
- **Verify:** tsc + vitest pass

### Task 1.3: Fix Preview button behavior
- **Acceptance:** Preview button triggers play/pause in the preview panel (not navigate to export)
- **Files:** `TopBar.tsx` (Preview button onClick), `App.tsx` (pass play handler)
- **Verify:** tsc + vitest pass, manual click test

### Task 1.4: Add close button to AI Match panel
- **Acceptance:** AI Match header has a close (×) button that collapses the panel
- **Files:** `AIMatchPanel.tsx`, `RightPanel.tsx` (state for panel visibility)
- **Verify:** tsc + vitest pass

### Task 1.5: Wire Customize button in Auto Captions
- **Acceptance:** Customize button navigates to CaptionPanel/Inspector for style editing
- **Files:** `AutoCaptionsPanel.tsx` (onClick handler)
- **Verify:** tsc + vitest pass

### Checkpoint: Phase 1
- [ ] tsc clean, vitest 370+ pass, oxlint 0 warnings
- [ ] Manual: track names correct, tabs correct, Preview plays, AI Match closes, Customize navigates

---

## Phase 2: Preview Controls (5 tasks)

### Task 2.1: Add preview scrub bar
- **Acceptance:** A draggable seek bar below the preview video shows current position within total duration. Dragging updates playhead in real-time.
- **Files:** `PreviewPanel.tsx`, `PreviewPanel.css` (new `.preview-scrub` styles)
- **Verify:** tsc + vitest pass, manual drag test

### Task 2.2: Add duration display
- **Acceptance:** Time display shows `current / total` format (e.g., `00:05.120 / 00:30.000`)
- **Files:** `PreviewPanel.tsx` (formatTime update)
- **Verify:** tsc + vitest pass

### Task 2.3: Add volume control
- **Acceptance:** Volume slider/mute button in preview transport. Controls the `<video>` element's volume.
- **Files:** `PreviewPanel.tsx`, `PreviewPanel.css`
- **Verify:** tsc + vitest pass, manual volume change

### Task 2.4: Add fit/display mode selector
- **Acceptance:** Button cycles through Fit, Fill, 50%, 100% display modes. Updates `object-fit` on preview media.
- **Files:** `PreviewPanel.tsx`, `PreviewPanel.css`
- **Verify:** tsc + vitest pass

### Task 2.5: Add fullscreen preview
- **Acceptance:** Fullscreen button calls `requestFullscreen()` on the preview stage element.
- **Files:** `PreviewPanel.tsx`
- **Verify:** tsc + vitest pass, manual fullscreen test

### Checkpoint: Phase 2
- [ ] tsc clean, vitest pass
- [ ] Manual: scrub bar drags, time shows duration, volume changes, display modes cycle, fullscreen works

---

## Phase 3: Timeline Visuals (2 tasks)

### Task 3.1: Add thumbnails to timeline clips
- **Acceptance:** Image/video clips show a small thumbnail (first frame or asset proxy) as clip background. Audio clips show waveform placeholder. Clips too narrow hide thumbnail gracefully.
- **Files:** `ClipBlock.tsx`, `ClipBlock.css` (`.clip-thumb` styles), may need asset proxy URL access
- **Verify:** tsc + vitest pass, manual visual check with imported images

### Task 3.2: Add audio waveforms on voice/music tracks
- **Acceptance:** Voice and music clips render a simple waveform visualization (can use pre-computed peaks or CSS approximation). Waveform updates on clip trim.
- **Files:** `ClipBlock.tsx`, `ClipBlock.css` (`.clip-waveform` styles), possibly a `lib/waveform.ts` utility
- **Verify:** tsc + vitest pass, manual visual check with imported audio

### Checkpoint: Phase 3
- [ ] tsc clean, vitest pass
- [ ] Manual: clips show thumbnails, audio clips show waveforms

---

## Phase 4: AI Match Visual (3 tasks)

### Task 4.1: Add Matched Images strip
- **Acceptance:** After matching, a horizontal scrollable strip shows matched image thumbnails with beat labels. Replaces the text-only list.
- **Files:** `MatchPanel.tsx` or `AIMatchPanel.tsx`, new CSS `.match-strip`
- **Verify:** tsc + vitest pass

### Task 4.2: Add View All button
- **Acceptance:** "View All" button expands the matched images strip to a full grid view
- **Files:** `MatchPanel.tsx` / `AIMatchPanel.tsx`
- **Verify:** tsc + vitest pass

### Task 4.3: Add voiceover waveform visualization
- **Acceptance:** Transcript panel shows a visual waveform bar (simple CSS-based) above the segment list
- **Files:** `TranscriptPanel.tsx`, new CSS `.waveform-bar`
- **Verify:** tsc + vitest pass

### Checkpoint: Phase 4
- [ ] tsc clean, vitest pass
- [ ] Manual: matched images show as thumbnail strip, View All expands, waveform visible

---

## Phase 5: Extractor Fixes (4 tasks)

### Task 5.1: Add imported presentation card
- **Acceptance:** After importing a presentation, a card shows the filename, page count, and file type before extraction
- **Files:** `ExtractorPanel.tsx`
- **Verify:** tsc + vitest pass

### Task 5.2: Add slide numbers to thumbnails
- **Acceptance:** Each slide thumbnail displays its page number (1, 2, 3...) as an overlay badge
- **Files:** `ExtractorPanel.tsx`, `ExtractorPanel.css`
- **Verify:** tsc + vitest pass

### Task 5.3: Persist extracted images grid
- **Acceptance:** After extraction, extracted images remain visible in the panel as a grid with filename + dimensions. Pages are not cleared.
- **Files:** `ExtractorPanel.tsx` (state management)
- **Verify:** tsc + vitest pass

### Task 5.4: Add Export JPG/PNG buttons
- **Acceptance:** Each extracted image shows Export JPG and Export PNG buttons. Clicking downloads the image in the chosen format.
- **Files:** `ExtractorPanel.tsx`, may need canvas conversion utility
- **Verify:** tsc + vitest pass, manual download test

### Checkpoint: Phase 5
- [ ] tsc clean, vitest pass
- [ ] Manual: presentation card shows, slide numbers visible, extracted grid persists, JPG/PNG downloads work

---

## Phase 6: Image-to-Image (2 tasks)

### Task 6.1: Fix source state and add result display
- **Acceptance:** Source image can be set (drag-drop or file picker). After generation, result image displays in a side-by-side or stacked layout.
- **Files:** `ImageToImagePanel.tsx` (fix `useState` bug, add result state and rendering)
- **Verify:** tsc + vitest pass

### Task 6.2: Add Apply Style button
- **Acceptance:** "Apply Style" button appears after generation. Clicking it adds the generated image as a clip to the timeline.
- **Files:** `ImageToImagePanel.tsx`
- **Verify:** tsc + vitest pass

### Checkpoint: Phase 6
- [ ] tsc clean, vitest pass
- [ ] Manual: source can be set, result displays, Apply Style adds to timeline

---

## Phase 7: Auto Captions Polish (2 tasks)

### Task 7.1: Add timestamps to transcript preview
- **Acceptance:** Transcript preview shows timestamped lines (e.g., `[00:03.20] Hello world`) instead of raw text
- **Files:** `AutoCaptionsPanel.tsx`
- **Verify:** tsc + vitest pass

### Task 7.2: Wire caption timing mode
- **Acceptance:** Auto/Manual toggle actually affects caption generation (Auto uses AI timing, Manual uses even distribution)
- **Files:** `AutoCaptionsPanel.tsx`, `editorStore.ts` (generateCaptions action may need timing mode parameter)
- **Verify:** tsc + vitest pass

### Checkpoint: Phase 7
- [ ] tsc clean, vitest pass
- [ ] Manual: transcript shows timestamps, Auto/Manual timing affects output

---

## Final Checkpoint
- [ ] All 23 tasks complete
- [ ] tsc clean, vitest 370+ pass, oxlint 0 warnings
- [ ] Every item from V2_EXACT_FRONTEND spec is MATCHED
- [ ] Session log updated
- [ ] Graphify updated

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Waveform rendering performance on low-end hardware | Medium | Use CSS-only approximation, not canvas analysis |
| Fullscreen API browser differences | Low | Feature-detect, graceful fallback |
| Extractor dimensions showing 0x0 | Medium | Need to read actual image dimensions after extraction |
| Image-to-Image source state bug | Low | Simple useState fix, straightforward |

## Files Likely Touched (estimated)
- `frontend/src/components/PreviewPanel.tsx` + `.css` (Phase 2)
- `frontend/src/components/timeline/ClipBlock.tsx` + `.css` (Phase 3)
- `frontend/src/components/MatchPanel.tsx` or `AIMatchPanel.tsx` (Phase 4)
- `frontend/src/components/ExtractorPanel.tsx` + `.css` (Phase 5)
- `frontend/src/components/ImageToImagePanel.tsx` (Phase 6)
- `frontend/src/components/AutoCaptionsPanel.tsx` (Phase 7)
- `frontend/src/editor/types.ts` (Phase 1)
- `frontend/src/components/AssetsPanel.tsx` (Phase 1)
- `frontend/src/components/TopBar.tsx` (Phase 1)
- `frontend/src/components/RightPanel.tsx` (Phase 1)
