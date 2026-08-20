# Infinite canvas card-wall design QA

- Source visual truth: `/Users/gordontu/Library/Application Support/CleanShot/media/media_TMJuTRZdxU/CleanShot 2026-08-19 at 21.18.02.png`
- Local source copy: `.design-qa/reference-card-wall.png`
- Implementation screenshot: `.design-qa/implementation-card-wall-final.png`
- Full-view comparison: `.design-qa/comparison-card-wall.png`
- Viewport: 2495 × 1154 CSS px
- Source pixels: 2495 × 1154
- Implementation pixels: 2495 × 1154
- Density normalization: none; implementation `devicePixelRatio` was 1
- State: `/creative-code`, initial closed-card canvas state

## Findings

No actionable P0, P1, or P2 mismatch remains.

- Fonts and typography: the reference's poster lettering belongs to its raster artwork. The implementation keeps each project's own raster artwork and adds no synthetic card text; the existing Gordon Tu home link remains as product navigation.
- Spacing and layout rhythm: uniform 2:3 portrait cards, four-to-five visible desktop columns, deterministic loose tilts, a wider second-row interval, partial edge cards, and top-row breathing room match the source composition.
- Colors and visual tokens: the route now uses a warm neutral `#f3f0eb` canvas and soft brown-black drop shadows close to the source's paper-wall treatment.
- Image quality and asset fidelity: existing optimized project images remain sharp and are center-cropped into the selected portrait format. Opaque paper backings preserve a rectangular card silhouette behind transparent artwork in both wall and open-card states. No placeholder, generated, CSS-drawn, or replacement artwork was introduced.
- Copy and content: category names, descriptions, project names, links, and dialog actions are unchanged.

Focused-region comparison was not needed: the requested fidelity surfaces are card silhouette, spacing, tilt, background, and shadow, all clearly readable in the same-size full-view comparison. Fine text inside the cards is source artwork rather than editable interface copy.

## Comparison history

### Pass 1

- Evidence: `.design-qa/comparison-card-wall-pass1.png`
- [P2] The new portrait cards and wider row pitch pushed the first row above the viewport, clipping card tops and losing the reference's upper breathing room.
- Fix: biased the gallery's initial camera position downward by 18% of one responsive cell while preserving pan limits and centered-card opening.

### Pass 2

- Evidence: `.design-qa/comparison-card-wall-pass2.png`
- The row framing was corrected, but [P2] the transparent Sunset Blob artwork at bottom right still cast a dome-shaped shadow instead of reading as the source's rectangular paper card.
- Fix: added an opaque paper plane behind every gallery image and the opened-card front, sharing the existing transforms, opacity, ordering, and disposal lifecycle.

### Pass 3

- Evidence: `.design-qa/comparison-card-wall.png`
- Every item now keeps the rectangular poster silhouette. The first row lands below the top edge, the second row remains partially visible, and card scale, spacing, rotation, neutral background, and shadows align with the source. No P0/P1/P2 finding remains.

## Browser verification

- Landing cards: Charts and Creative Coding each navigated to their canvas route on the first click; Maps uses the same link path.
- Canvas: opening and closing a project card worked; drag panning changed the canvas position.
- Responsive check: `.design-qa/implementation-maps-mobile.png` at 390 × 844 CSS px.
- Open-card check: `.design-qa/open-card.png`.
- Browser console: no warnings or errors on the final `/creative-code` capture.

## Validation

- `node src/lib/gallery/layout.check.js`: passed.
- `npm run build`: passed.
- Svelte autofixer: no issues in the changed Svelte components.
- `npm run check`: still reports the two pre-existing undefined `gtag` diagnostics in `src/lib/Analytics.svelte`; no diagnostic points to this change.

final result: passed
