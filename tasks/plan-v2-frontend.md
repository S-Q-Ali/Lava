# V2 Frontend Restructuring — Plan

## Capability Map

| Module ID | Responsibility | Depends On |
|-----------|---------------|------------|
| `v2-topbar` | Topbar redesign (brand, subtitle, 16:9, profile, settings) | — |
| `v2-left-nav` | 7-item navigation rail (Home, Projects, Media, AI Tools, Captions, Templates, Export) | — |
| `v2-right-panels` | Dedicated AI Match + Auto Captions panels (replaces Inspector stacking) | `v2-left-nav` |
| `v2-bottom-assets` | Bottom assets panel (media grid, categories, Image-to-Image AI, Tips) | — |
| `v2-extractor` | Presentation/Image Extractor (PPT/PPTX/PDF import, slide thumbnails, extraction) | `v2-left-nav` |

**Build order:** `v2-topbar` + `v2-left-nav` (parallel) → `v2-right-panels` → `v2-bottom-assets` → `v2-extractor`

## Theme Tokens

```css
--accent: #e8913a;       /* amber/orange — was #4f8cff blue */
--accent-soft: rgba(232, 145, 58, 0.18);
--accent-teal: #3ab0a2;  /* status accents */
--accent-teal-soft: rgba(58, 176, 162, 0.18);
--track-captions: #3ab0a2;  /* teal — was #4a9aa0 */
```

## Module 1: v2-topbar

### Tasks
1.1 Update CSS tokens (accent blue → amber, add teal)
1.2 Create `TopBar.tsx` component
1.3 Create `TopBar.css`
1.4 Wire project title editing
1.5 Wire 16:9 aspect ratio selector
1.6 Wire Preview button
1.7 Wire profile/settings placeholder dropdowns
1.8 Replace inline topbar in App.tsx
1.9 Write component tests
1.10 Full regression

## Module 2: v2-left-nav

### Tasks
2.1 Define nav items array
2.2 Create `NavRail.tsx`
2.3 Create `NavRail.css`
2.4 Create `LeftWorkspace.tsx`
2.5 Update App.tsx layout
2.6 Add SVG icons
2.7 Wire AI Tools → ManhwaPanel
2.8 Add placeholder panels
2.9 Write component tests
2.10 Full regression

## Module 3: v2-right-panels

### Tasks
3.1 Create `AIMatchPanel.tsx`
3.2 Move MatchPanel content into AIMatchPanel
3.3 Create `AutoCaptionsPanel.tsx`
3.4 Move CaptionPanel content into AutoCaptionsPanel
3.5 Create `RightPanel.tsx` container
3.6 Update App.tsx
3.7 Keep InspectorPanel accessible
3.8 Write component tests
3.9 Full regression

## Module 4: v2-bottom-assets

### Tasks
4.1 Create `AssetsPanel.tsx`
4.2 Create `AssetGrid.tsx`
4.3 Wire asset tab filtering
4.4 Add View All button
4.5 Create `ImageToImagePanel.tsx`
4.6 Create `TipsPanel.tsx`
4.7 Update App.tsx layout
4.8 Write component tests
4.9 Full regression

## Module 5: v2-extractor

### Tasks
5.1 Create `ExtractorPanel.tsx`
5.2 Add file picker
5.3 Create `SlideGrid.tsx`
5.4 Backend `/api/extract` endpoint
5.5 Create `ExtractedImageGrid.tsx`
5.6 Add Export JPG/PNG
5.7 Wire into LeftWorkspace
5.8 Write component + API tests
5.9 Full regression
