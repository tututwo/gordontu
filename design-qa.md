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

# Maps gallery browser-comment QA — 2026-09-03

- Source visual truth: the five `/maps` browser annotations supplied in this task, plus the
  persisted pre-change capture `.design-qa/maps-comments-before.png`.
- Browser implementation: `.design-qa/maps-comments-after-final.png`.
- Full-view comparison: `.design-qa/maps-comments-comparison.png`.
- Focused bottom-control comparison: `.design-qa/maps-bottom-chrome-comparison.png`.
- Zoom/open-card evidence: `.design-qa/maps-zoom-open.png` and
  `.design-qa/maps-zoom-flipped.png`.
- Responsive evidence: `.design-qa/maps-comments-mobile-390.png`,
  `.design-qa/maps-comments-mobile-320.png`, and
  `.design-qa/maps-comments-landscape-568.png`.
- Viewport: 1044 × 817 CSS px for the primary comparison; source and implementation are both
  1044 × 817 pixels at browser capture density 1, so no density normalization was needed.
- State: `/maps`, initial closed-card canvas. The pre-change source capture retained the user's
  live pan position, so canvas art positions are not used as fidelity evidence in the full-view
  comparison; the annotated controls and the final home framing are compared directly.

## Findings

No actionable P0, P1, or P2 mismatch remains in the annotated gallery chrome or zoom flow.

- Fonts and typography: the existing Inter/Newsreader/Shantell type system is unchanged. The
  Project index label was intentionally reduced from 0.84rem/610 to 0.8rem/570 and its count from
  weight 650 to 590, producing the lighter control requested by the annotation without changing
  project-list typography.
- Spacing and layout rhythm: the visual header, Move dock, and project-count pill are absent. The
  category navigation is a 246.3 × 54.3 px horizontal pill centred at the bottom with zero measured
  centre error; dividers are vertical and tooltips open upward. Project index height fell from
  55.2 px to 42.4 px. At 390 × 844, 320 × 568, and 568 × 320 there is no overlap among index,
  navigation, and help, and `scrollWidth === innerWidth`.
- Colors and visual tokens: the existing paper, ink, hairline, blur, shadow, current-category fill,
  focus accent, reduced-transparency, and increased-contrast tokens are preserved.
- Image quality and asset fidelity: postcard textures, crop, optimized sources, shadows, and WebGL
  paper backings are unchanged. Navigation continues to use the existing Phosphor icon family; no
  placeholder, CSS-drawn, custom-SVG, or replacement artwork was introduced.
- Copy and content: deleted controls leave no stale references. Canvas and help text now explain
  drag/arrow movement, wheel/trackpad/touch pinch zoom, `+`/`−`, `0`, and Recenter. A visually hidden
  category `h1` preserves the page heading after the visual header was removed.

## Comparison history

### Pass 1

- Evidence: `.design-qa/maps-comments-comparison-pass1.png` and
  `.design-qa/maps-comments-after-pass1.png`.
- [P2] Removing the header's old camera compensation while adding zoom shifted the entire postcard
  plane roughly 75 px upward, changing unrelated artwork framing.
- Fix: restored the responsive home offset as a fixed screen-space composition value and included
  that offset in wheel/pinch anchor math, camera translation, and opened-card targeting.

### Pass 2 — final

- Evidence: `.design-qa/maps-comments-comparison.png` and
  `.design-qa/maps-bottom-chrome-comparison.png`.
- The original postcard framing is restored while every annotated chrome change remains in place.
  No P0/P1/P2 typography, spacing, token, image, copy, or responsive finding remains.

## Browser verification

- DOM/accessibility: no `.gallery-header`, `.pan-dock`, or `.status-pill` remains; one accessible
  `h1` and one `Gallery navigation` landmark remain, with the current category marked by
  `aria-current="page"`.
- Mouse/trackpad zoom: vertical wheel changed zoom from 1 to 1.3195 and back; `ctrl+wheel` changed it
  to 1.4142 while `visualViewport.scale` stayed 1. Safari gesture events are also handled. Pointer
  anchoring matched the expected pan offset, and repeated input clamped exactly at 0.55 and 2.5.
- Touch/controller: the deterministic two-pointer check covers pinch start, moving midpoint,
  pinch-to-one-finger drag handoff without a jump, and tap suppression after pinch.
- Keyboard/Recenter: `+` zoomed to 1.2, `0` returned zoom and pan to 1/0/0, and the visible Recenter
  control returned focus to the canvas and performed the same reset.
- Open-card path: at 1.4142×, hit testing opened the correct Manhattan project; the WebGL hero and
  DOM hit target measured 359.48 × 539.22 CSS px and stayed aligned, flip rendered the postcard
  back, zoom remained locked while open, Escape closed it, and the prior view was retained.
- Lifecycle: switching Maps → Charts → Maps after zoom reset the new category to 1× and updated the
  route/current state correctly.
- Fresh final `/maps` navigation reported no console errors or warnings; only Vite connection debug
  entries were present.

## Validation

- `node src/lib/gallery/pan.check.js`: passed.
- `node src/lib/gallery/layout.check.js`: passed.
- `npm run build`: passed.
- Svelte autofixer: no issues in `PostcardGallery.svelte`; its two advisory suggestions concern the
  existing Three.js effect and canvas binding.
- `npm run check`: still reports only the two pre-existing undefined `gtag` diagnostics in
  `src/lib/Analytics.svelte`; no diagnostic points to the gallery changes.

final result: passed

---

# Landing page colophon annotation QA — 2026-09-03

- Source visual truth: `docs/landing-page.png`
- Browser implementation: `.design-qa/landing-footer-implementation-final.png`
- Focused reference crop: `.design-qa/landing-footer-reference.png`
- Focused implementation crop: `.design-qa/landing-footer-focused-final.png`
- Focused comparison (reference above the pink divider, implementation below): `.design-qa/landing-footer-comparison-final.png`
- Responsive implementation: `.design-qa/landing-footer-responsive-1087.png`
- Reference and implementation pixels: 1672 × 941; CSS viewport: 1672 × 941; browser density: 1; no density normalization
- State: `/`, initial landing page; QA scope is the annotated colophon only

## Findings

No actionable P0, P1, or P2 mismatch remains in the annotated colophon.

- Fonts and typography: Inter Variable is preserved. Primary coordinates, opportunity text, and contact links use the stronger 500 weight; `STATUS:`, separators, and the version use 400 and a quieter gray. The desktop size now tops out at 14 px and scales fluidly at narrower one-line widths. Location and status receive the slightly wider tracking visible in the source.
- Spacing and layout rhythm: at 1672 × 941, the final colophon ink baseline is y=873–884, matching the source's y=873–884. The status group renders at x=664–976 versus the source's x=666–975, and the contact group at x=1168–1605 versus source ink at x=1167–1601. The larger radio, tighter contact gaps, and lower baseline reproduce the source hierarchy and edge rhythm.
- Colors and visual tokens: the existing paper and black ink remain unchanged. Secondary metadata uses `#77747a`, matching the lighter source treatment without weakening the primary labels.
- Image quality and asset fidelity: the existing Phosphor radio icon is retained and rendered responsively; no placeholder, generated image, CSS drawing, inline SVG, or replacement asset was introduced.
- Copy and content: coordinates, availability copy, email/GitHub/LinkedIn labels and targets, and `v1.0.0` are unchanged.
- Responsive behavior: checked at 1087 × 761, 901 × 760, 900 × 760, 720 × 800, and 390 × 844. The colophon stays on one line through 901 px, stacks at 900 px, and reports no horizontal overflow at any checked width.

## Comparison history

### Pass 1

- Before evidence: `/tmp/gordontu-landing-before.png` at 1672 × 941 and `/tmp/gordontu-landing-1087-before.png` at 1087 × 761.
- [P2] The fixed 14.4 px type, 500 weight on all metadata, fixed gaps, and 1000 px stacking threshold made the annotated 1087 px view too large and visually flat. Its colophon ended at x=1085.8 instead of the padded content edge x=1043.5.
- [P2] At source size the text sat about 5 px too high, the status block was 14–18 px too far right, and the contact group began about 14 px too far left.
- Fix: introduced fluid type and spacing, separated primary and secondary weights, lightened secondary metadata, increased/scaled the radio, lowered the baseline, gave location/status their source-specific tracking, shifted the desktop status group left responsively, and moved the stacking breakpoint to 900 px.

### Pass 2 — final

- Post-fix full evidence: `.design-qa/landing-footer-implementation-final.png`.
- Post-fix focused evidence: `.design-qa/landing-footer-comparison-final.png`.
- Post-fix responsive evidence: `.design-qa/landing-footer-responsive-1087.png`; the colophon ends exactly at the x=1043.5 content edge with `scrollWidth === innerWidth`.
- No P0/P1/P2 typography, spacing, color, asset, copy, or responsive issue remains in the annotated region.

## Browser verification

- The browser-rendered implementation was inspected at the source viewport and five responsive widths.
- Existing links and copy were left intact; this annotation changes presentation only.
- The colophon itself emits no warning or error. The current working tree still produces a pre-existing `collisionSteps is not defined` console error from `src/lib/landingPage/blobDrift.js`; that edited blob runtime is outside this annotation and was not changed here.

## Validation

- Svelte autofixer: no issues or suggestions in `src/routes/+page.svelte`.
- `npm run build`: passed.
- `npm run check`: still reports only the two pre-existing undefined `gtag` diagnostics in `src/lib/Analytics.svelte`; no diagnostic points to the colophon change.

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

---

# Landing page design QA

- Source visual truth: `docs/landing-page.png` (1672 × 941)
- Implementation screenshot: `.design-qa/landing-implementation-final.png`
- Full-view comparison (mock above the pink bar, implementation below, both at half scale): `.design-qa/landing-comparison-final.png`
- Blob-region comparison at native pixels: `.design-qa/landing-blobs-final.png`
- Viewport: 1672 × 941 CSS px, device pixel ratio 1
- State: `/`, Blob field at its home positions. Captured with headless Chrome under
  `--force-prefers-reduced-motion` so the drift is frozen and the capture is repeatable:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --hide-scrollbars --force-prefers-reduced-motion --window-size=1672,941 --virtual-time-budget=12000 --screenshot=.design-qa/landing-implementation-final.png http://localhost:5299/
```

  Without the reduced-motion flag headless Chrome marks the canvas ready but its virtual clock
  finishes before the 900 ms fade-in, so the blobs are missing from the capture; that is a
  capture artefact, the live page fades them in normally.

## Findings

No actionable P0, P1, or P2 mismatch remains.

- Fonts and typography: Inter Variable (added via `@fontsource-variable/inter`, exposed as
  `--font-sans`) for every landing element, all uppercase as in the mock. Headline 8.6vw at
  weight 640 with -0.015em tracking matches the mock's cap height (106 vs 107 px) and width
  within 1%; nav items (1.65vw, 0.1em), masthead and colophon match in size, weight and
  tracking within a few pixels.
- Spacing and layout rhythm: masthead, headline centre, nav pitch and colophon baseline land
  within 4 px of the mock at 1672 × 941. The brand's accent bar hangs 24 px outside the text
  column, the About underline sits 0.55em below, and the colophon is a three-column grid so the
  status line is centred on the page rather than between its neighbours.
- Colours and visual tokens: paper `#f2edec`, ink `#000`, muted `#5d5b60`, accent `#f4aa12`, blob
  cores `#cbdef6` / `#ee8b68` / `#fdd07e`, all sampled from the mock. The layout's ambient washes
  are switched off on the landing so only the Blob field colours the paper; the existing
  paper-noise layer still multiplies over the blobs.
- Blob field: sizes, placement and softness match the mock at rest (outer radii 0.15 / 0.215 /
  0.13 of the viewport height, feather 0.6, grain 0.65, wobble ±4%). Edges dissolve with a
  screen-fixed stipple; the union of the three densities never bridges on its own and the drift's
  `MIN_GAP` floor (0.72 of the summed radii) keeps every pair as two lobes.
- Copy and content: nav labels come from the category data (`Creative code` renamed to
  `Creative coding` so the gallery heading agrees with the landing), Blog and About link to their
  new placeholder routes, and the colophon copies the mock's location, status, links and version.
- Intentional P3 differences: the blobs drift, so any live frame differs from the static mock;
  the blue/salmon overlap mixes to a soft mauve where the mock shows two overlapping hazes.

## Comparison history

### Pass 1

- Evidence: `.design-qa/landing-comparison-pass1.png`
- Typography only (headless Chrome had no WebGL). [P1] Headline and nav were ~6% narrower than
  the mock, the brand bar sat inside the text column, the colophon was 18 px low and its type
  12% small.
- Fix: headline 8vw / weight 640, nav 1.62vw, brand `margin-left: -1.15rem`, bottom padding
  6.2svh, colophon 0.9rem. A later adversarial review measured the headline capitals 7% short
  and the nav 10% small; final values are headline 8.6vw / -0.015em, nav 1.65vw / 0.1em, and a
  1.85rem gap between the contact links.

### Pass 2

- Evidence: `.design-qa/landing-comparison-pass2.png`, `.design-qa/landing-blobs-pass2.png`
- [P0] Blob edges went grey: the shader wrote premultiplied colour but the material blended it
  as straight alpha, multiplying by alpha twice. [P1] With a symmetric distance-field feather and
  a large smooth-minimum, the three blobs melted into one haze and the sine hash showed a
  cross-hatch lattice.
- Fix: `blending: THREE.NoBlending`; replaced the distance-field shader with density metaballs
  (`(1 - x²)²` per blob, `mix(max, sum, uBlend)`), a sin-free hash on DPR-sized cells, and
  per-frame wave constants hoisted to uniforms.

### Pass 4

- Evidence: `.design-qa/landing-comparison-pass4.png`, `.design-qa/landing-blobs-pass4.png`
- [P2] Blobs were a third smaller than the mock and their outline wobble (±7%) read as eggs.
- Fix: outer radii raised to 0.15 / 0.215 / 0.13 with `MIN_GAP` 0.72 so the mock's resting
  overlap is legal, wobble ±4%, feather 0.6, grain 0.65.

### Final

- Evidence: `.design-qa/landing-comparison-final.png`, `.design-qa/landing-blobs-final.png`
- Sizes, softness, placement and typography agree with the mock; no P0/P1/P2 finding remains.

## Browser verification

- Every nav link navigates in one click: Charts → `/charts`, Maps → `/maps`, Creative coding →
  `/creative-code`, Blog → `/blog`; About → `/about`; the brand link returns to `/`.
- The Blob field drifts: frames 8–10 s apart show every blob in a new position with no console
  output; blobs stay behind the headline and never merge.
- Reduced motion: the headless `--force-prefers-reduced-motion` capture renders one still frame
  at the home positions.
- Responsive: verified in the Browser pane at 390 × 844 CSS px: `scrollWidth` equals the
  viewport, no element extends past the right edge, the headline stays on one line at 319 px,
  the colophon stacks and the brand and About stay in the masthead. Headless Chrome cannot
  produce this capture: on macOS it enforces a minimum window width, so a 375 or 390 px
  `--window-size` lays the page out wider and crops it, which looks like an overflow that the
  live page does not have.
- Keyboard: every link draws a 2 px ink focus ring (the accent yellow is 1.7:1 on this paper, so
  it is kept for hover only); the About and Blog crumb links no longer remove their outline.
- Colophon: at 900 × 700 the three groups stack, each on a single line; `v1.0.0` keeps its
  lowercase v.
- Browser console: no warnings or errors on `/`, `/about`, `/blog`, `/creative-code`.

## Validation

- `node src/lib/landingPage/blobDrift.check.js` (runs against the shipped seeds in
  `blobSeeds.js`): passed. `node src/lib/gallery/layout.check.js`: passed.
- Svelte autofixer: no issues in `BlobField.svelte`, `+page.svelte`, `about/+page.svelte`,
  `blog/+page.svelte`.
- `npm run check`: only the two pre-existing `gtag` diagnostics in `src/lib/Analytics.svelte`.
- `npm run build`: passed.

final result: passed
