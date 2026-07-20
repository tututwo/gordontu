# 005 — Separate mobile project cards

- **Status**: DONE
- **Commit**: 9a35795
- **Severity**: HIGH
- **Category**: Physicality & origin, performance, accessibility
- **Estimated scope**: 1 file, small responsive geometry edit

## Problem

Mobile overlap is encoded directly in `src/lib/landingPage/ProjectWall.svelte:43-49`:

```js
// src/lib/landingPage/ProjectWall.svelte:43-49 — current
let cardWidth = $derived(
	stageWidth < 720
		? Math.min(stageWidth * 0.76, 304)
		: Math.min(390, Math.max(320, stageWidth * 0.233))
);
let step = $derived(cardWidth * (stageWidth < 720 ? 0.9 : 1));
let visibleCount = $derived(stageWidth < 720 ? 7 : 9);
```

The center-to-center mobile step is only `90%` of card width. The cylindrical `sin(tanh(...))` mapping at lines 69-75 compresses that separation further while the center card scales to approximately `1.045`. With the CSS dimensions at lines 524-527, the current formulas produce approximately `15–28px` of adjacent-card overlap across `320–430px` phone widths, both at rest and around half-step handoff. Project-specific scale variation can increase it.

Every overlapping card remains a live anchor. `tabindex="-1"` at lines 398-404 removes inactive cards only from sequential keyboard focus; it does not remove them from touch hit-testing. The quantized z-index at line 396 ties neighboring cards around each half-step, allowing DOM paint order to decide which live target covers the other while dragging.

Mobile also renders seven cards. Each card contains two generated `RoughSvg` trees and an image. Re-centering the keyed virtual window at every half-step mounts another full card during a flick, increasing main-thread and layer work on the device that needs it least.

## Target

- Use one inclusive mobile predicate everywhere in the component: `let isMobile = $derived(stageWidth <= 720);`. This removes the exact-`720px` mismatch with the existing CSS `@media (max-width: 720px)` query.
- Reduce the mobile card plane to exactly `70vw`, capped at `280px`, and make the JavaScript geometry match the CSS:

```js
let cardWidth = $derived(
	isMobile ? Math.min(stageWidth * 0.7, 280) : Math.min(390, Math.max(320, stageWidth * 0.233))
);
let step = $derived(cardWidth * (isMobile ? 1.08 : 1));
let visibleCount = $derived(isMobile ? 5 : 9);
```

```css
@media (max-width: 720px) {
	.card-positioner {
		width: min(70vw, 17.5rem);
		height: min(17.5rem, 67vw);
	}
}
```

- Keep the existing mobile perspective, arc function, maximum angle, Z falloff, natural variation, and desktop geometry. With the exact target values above, a browser sweep across all 31 projects at `390px` must retain at least `11px` between card-positioner bounds. That leaves visible paper between the two `0.25rem` RoughSvg frame overhangs while retaining neighboring-card slivers.
- Make stacking explicit: give the active/nearest card `z-index: 200`; for other cards keep the existing distance ordering. This avoids quantized ties deciding which card owns the half-step handoff.
- On mobile only, the active card positioner is the only card that may receive pointer events. Inactive visible slivers remain visual drag affordances but pass touch input through to `.wall-stage`, so they cannot cover the active link or open the wrong project. Desktop pointer hit testing remains unchanged:

```css
@media (max-width: 720px) {
	.card-positioner:not(.active) {
		pointer-events: none;
	}
}
```

- Render five mobile cards, matching the established intent in plan 001, to reduce offscreen SVG/image/layer work. Desktop stays at nine.

## Repo conventions to follow

- Preserve the DOM-based CSS 3D wall documented in `docs/adr/0001-dom-based-project-wall.md`.
- Keep geometry in project units and keep CSS card dimensions numerically aligned with the JavaScript `cardWidth` derivation.
- Keep Svelte 5 class arrays and inline transform/opacity/z-index styles.
- Preserve the existing hand-drawn frames, deterministic natural variation, optimized images, focus behavior, and semantic active project link.

## Steps

1. Add the inclusive `isMobile` derived value in `src/lib/landingPage/ProjectWall.svelte` and replace every `stageWidth < 720` geometry branch with it.
2. Change mobile `cardWidth` to `Math.min(stageWidth * 0.7, 280)`, mobile `step` to `cardWidth * 1.08`, and mobile `visibleCount` to `5`.
3. Keep `radius` and `maxTheta` responsive branches on the same `isMobile` value so card positions remain internally consistent.
4. Add `active` to each `.card-positioner` class array. Set active z-index to `200`; retain distance-based ordering for inactive cards.
5. Inside the existing `@media (max-width: 720px)` query, add `.card-positioner:not(.active) { pointer-events: none; }`, ensuring pointerdown on a mobile side sliver reaches `.wall-stage` without changing desktop mouse behavior.
6. Change the mobile CSS plane to `min(70vw, 17.5rem)` wide and `min(17.5rem, 67vw)` high. Do not change desktop dimensions or perspective.

## Boundaries

- Do NOT flatten the wall, replace it with CSS scroll snap, or remove the cylindrical depth/rotation treatment.
- Do NOT change desktop card dimensions, spacing, count, or perspective.
- Do NOT make inactive mobile cards openable; they are spatial context and drag surface until centered. Preserve the existing desktop mouse behavior.
- Do NOT change card artwork, data, image URLs, text, or destinations.
- Do NOT add dependencies or animate layout properties.
- Plan 004 owns gesture intent, frame coalescing, cancellation, and release physics; do not duplicate those edits here.
- If the cited code has drifted from commit `9a35795`, stop and report instead of improvising.

## Verification

- **Mechanical**: run `npx @sveltejs/mcp svelte-autofixer src/lib/landingPage/ProjectWall.svelte --svelte-version 5`, then `npm run check` and `npm run build`; expect no new diagnostics.
- **Feel check**: inspect settled and half-drag states at `320×568`, `390×844`, `430×932`, and exactly `720px` wide. Confirm neighboring paper edges never cover one another and remain visually separated through the active-card handoff.
- Drag from the exposed sliver of an inactive card and confirm the wall moves; tap that sliver and confirm it does not open the inactive project. Tap the centered card and confirm its native project link still works.
- Record a hard mobile flick in the Performance panel. Confirm only five card positioners exist, at most one new card mounts per crossed step, and inactive/offscreen cards are not touch targets.
- Check desktop at `1440px` and `1672px`; card size, nine-card window, tangent, and overlap must remain unchanged.
- Toggle `prefers-reduced-motion` and confirm separation and hit testing are identical; only release motion behavior changes via plan 004.
- **Done when**: phone cards retain side-card context without any paper-edge overlap or touch-target collision, mobile renders five cards, and desktop is visually unchanged.
