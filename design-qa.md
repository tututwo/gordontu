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

---

# Postcard gallery chrome design QA

- Source visual truth: `/Users/gordontu/Library/Application Support/CleanShot/media/media_b2r4OsqnWL/CleanShot 2026-08-19 at 21.21.11.png`
- Browser implementation: `.design-qa/gallery-desktop-final.png`
- Full-view comparison: `.design-qa/gallery-comparison-final.png`
- Focused control comparison: `.design-qa/gallery-controls-focused-final.png`
- Mobile implementation: `.design-qa/gallery-mobile-final.png`
- Mobile open-card state: `.design-qa/gallery-mobile-card-open-final.png`
- Tablet implementation: `.design-qa/gallery-tablet-final.png`
- Short landscape implementation: `.design-qa/gallery-landscape-final.png`
- Short landscape open-card state: `.design-qa/gallery-landscape-card-open-final.png`
- Desktop viewport/state: 1500 × 883 CSS px, Maps gallery ready, no postcard open
- Mobile viewport/state: 390 × 844 CSS px, Creative Code gallery ready, closed and open-card states
- Tablet viewport/state: 768 × 900 CSS px, Maps gallery ready, no postcard open
- Short landscape viewport/state: 568 × 320 CSS px, Maps gallery ready, no postcard open
- Density normalization: source 1506 × 883 px; implementation 1500 × 883 px at device pixel ratio 1. The full comparison preserves both at native height with a 24 px separator; focused crops use native pixels.

## Findings and comparison history

### Pass 1

- [P2] The persistent right category rail overlapped the right edge of an opened postcard at the
  390 × 844 breakpoint.
  - Fix: hide the rail together with the lower chrome while a postcard dialog is open.
  - Post-fix evidence: `.design-qa/gallery-mobile-card-open-final.png` keeps the postcard, focus
    outline, and action row unobstructed.

### Pass 2 — final full-view and focused comparisons

No actionable P0, P1, or P2 mismatch remains.

- Fonts and typography: the chrome uses the portfolio's native UI stack plus Newsreader for the
  category hierarchy. Weight, tracking, and compact labels preserve the reference's restrained UI
  density while remaining consistent with the existing product.
- Spacing and layout: top-left identity, vertically centered right rail, wide bottom-left panel,
  centered move dock, and bottom-right status/help controls reproduce the reference's edge rhythm,
  rounded geometry, hairlines, elevation, and safe margins.
- Colors and tokens: translucent light surfaces, dark active controls, subtle borders, and shadows
  match the source material treatment through the existing portfolio tokens. The blue/green gallery
  wash is intentionally preserved because the request targets the surrounding chrome, not the canvas
  artwork or background.
- Image quality and assets: existing WebGL postcard imagery is unchanged and remains sharp. All new
  interface icons come from one Phosphor icon family; no placeholder imagery, CSS drawings, custom
  SVGs, or raster icon substitutes were introduced.
- Copy and content: reference editor labels were replaced with real portfolio actions—project index,
  move, category navigation, recenter, status, and contextual help.
- Responsive/accessibility: mobile controls fit without collision, the project index scrolls, touch
  targets are at least 32–48 px, controls use native links/buttons/details, focus indicators are
  visible, and reduced-motion/reduced-transparency/high-contrast preferences are covered.
- Intentional P3 difference: the right rail is shorter than the source because unsupported editor
  tools (draw, upload, palette, zoom) were not represented as inert controls.

### Pass 3 — tablet collision audit

- [P1] At 768 px, the full-width project index and centered move dock could overlap.
  - Fix: apply the compact control layout through 840 px instead of only phone widths.
  - Post-fix evidence: `.design-qa/gallery-tablet-final.png` shows clear separation between the
    index, move dock, and help control at 768 × 900.

### Pass 4 — short landscape audit

- [P2] At 568 × 320, the optional help control could overlap the bottom of the category rail.
  - Fix: hide the help/status cluster below 421 px viewport height; category navigation, project
    index, canvas move controls, and recenter remain available.
  - Post-fix evidence: `.design-qa/gallery-landscape-final.png` shows no control collision.
- [P2] In the same short viewport, the identity header could overlap an opened postcard.
  - Fix: hide that informational header only while a postcard is open below 421 px height.
  - Post-fix evidence: `.design-qa/gallery-landscape-card-open-final.png` keeps the full postcard
    and action row clear.

## Browser interaction and validation evidence

- Every landing card navigates in one click: Charts → `/charts`, Maps → `/maps`, and Creative Code
  → `/creative-code`; dragging the card deck still suppresses navigation.
- Category rail navigation updates the route, heading, and active state.
- Directional controls visibly move the canvas; recenter returns focus to it.
- Project index opens with the correct category count and scrollable detail links.
- Help opens and closes; postcard open, flip, Escape/Close behavior, and bottom-chrome clearance pass.
- Fresh desktop and mobile browser sessions reported no console warnings or errors.
- Svelte autofixer: no issues in `CardDeck.svelte` or `PostcardGallery.svelte` (the gallery retains two
  pre-existing advisory suggestions around its Three.js effect and canvas binding).
- Gallery layout check: passed.
- Production build: passed.
- Repository-wide `npm run check`: only the two pre-existing missing `gtag` type errors remain in
  `src/lib/Analytics.svelte`; no diagnostic points to this change.

final result: passed
