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
