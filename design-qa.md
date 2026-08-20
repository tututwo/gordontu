# Landing page design QA

- Source visual truth: `docs/landing-page.png`
- Browser implementation: `.design-qa/implementation-corrected-final.jpg`
- Side-by-side comparison: `.design-qa/comparison-corrected-final.jpg`
- Mobile implementation: `.design-qa/implementation-corrected-mobile.jpg`
- Desktop viewport: 1672 × 941 CSS px
- Mobile viewport: 390 × 844 CSS px
- Intentional omission: the reference's top-right navigation is not implemented

## Pass 1 — card material and page shell

Replaced the earlier Wallflow-inspired page with the corrected reference's sparse white canvas,
tracked two-line brand, three portrait category cards, and handwritten closing statement. Each
card now uses zero-padded numbering, ochre details, restrained uppercase typography, filtered
project imagery, rough double contours, stacked paper offsets, and real CSS 3D side planes.

Visible mismatch found:

- [P1] Preserving the original stage-width spacing left most neighboring cards off-screen, so
  the page did not form the reference's three-card fan.

Fix:

- Kept WallMotion's original drag step, spring, bounds, pointer capture, and shared `rotateY`
  progression, but separated the resting visual fan spacing. Maps now starts centered with both
  neighboring category designs visible.

## Pass 2 — same-size visual comparison

The final comparison places the 1672 × 941 implementation beside the corrected source.

- Brand lands at approximately x 57 / y 48 with matching tracking and line spacing.
- Cards occupy approximately x 148–1519 / y 182–792, matching the source's scale, overlap,
  center alignment, and opposing side rotations.
- The center face is approximately 437 × 555 px and uses the reference's internal hierarchy.
- The closing statement and ochre dash land in the same bottom-center zone.
- The background is route-scoped neutral white; gallery routes keep their existing palette.
- Existing project images remain, as specified in the implementation plan, and are treated as
  pale monochrome sketches rather than introducing new assets.

No actionable P0, P1, or P2 visual mismatch remains within the approved existing-image scope.

## Responsive and interaction QA

- Mobile at 390 × 844 keeps the centered card readable, shows neighboring edges, places the
  accessible controls below the deck, and lets the closing statement follow in normal flow.
- A pointer drag moved Maps to Creative coding and changed all three card `rotateY` transforms
  together; the settled transforms were 360°, 180°, and 0°.
- Previous/next controls returned the page to Maps and the polite live region announced the
  correct category state.
- Card links, center-only tab order, keyboard controls, reduced-motion rules, and pointer click
  suppression remain intact.

## Validation

- Production build: passed.
- Svelte autofixer: passed for `+page.svelte` and `CardDeck.svelte` with no issues or suggestions.
- Landing-page diagnostics: clean.
- Repository-wide `npm run check`: only the two pre-existing missing `gtag` type errors remain in
  `src/lib/Analytics.svelte`; no diagnostic points to the landing redesign.

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
