# 004 — Stabilize mobile project-wall dragging

- **Status**: DONE
- **Commit**: 9a35795
- **Severity**: HIGH
- **Category**: Purpose & frequency, interruptibility, performance, accessibility
- **Estimated scope**: 1 file, medium interaction refactor

## Problem

`src/lib/landingPage/ProjectWall.svelte:252-268` moves the wall before the horizontal gesture has crossed its `8px` intent threshold:

```js
// src/lib/landingPage/ProjectWall.svelte:252-268 — current
function handlePointerMove(event) {
	if (!isDragging || event.pointerId !== pointerId) return;
	const now = performance.now();
	const delta = event.clientX - dragStartX;
	recordPointerSample(event.clientX, now);

	if (Math.abs(delta) > DRAG_THRESHOLD) {
		suppressClick = true;
		const target = /** @type {HTMLDivElement} */ (event.currentTarget);
		if (!target.hasPointerCapture(event.pointerId)) {
			target.setPointerCapture(event.pointerId);
		}
		event.preventDefault();
	}

	offset = dragStartOffset + delta / step;
}
```

The wall allows vertical page scrolling with `touch-action: pan-y`. A normal mobile scroll can therefore introduce horizontal jitter, visibly move the cards, and then emit `pointercancel`. The cancellation branch at lines 274-290 calls `finishMotion()` without restoring or snapping `offset`, so the wall can remain between projects. Unexpected pointer-capture loss at lines 313-319 has the same failure.

Release motion also has an unnecessarily long tail. Lines 168-176 integrate exponential inertia until velocity falls below `0.055` project units per second, and only then begin the snap spring. At the accepted release speeds, inertia alone can last approximately `0.39–2.49s`; the spring adds more time. The user can watch several cards continue past the finger before the wall becomes usable again.

Finally, every raw `pointermove` assigns reactive `offset` at line 267. High-frequency touch input can recompute and restyle the complete visible 3D card window more often than the display can present it.

## Target

- Treat `pointerdown` as a gesture candidate. Do not set the reactive `isDragging` state and do not change `offset` until horizontal travel exceeds the existing exact `DRAG_THRESHOLD = 8` pixels.
- On threshold crossing, set `isDragging = true`, set `isMoving = true`, set `suppressClick = true`, claim pointer capture, and call `preventDefault()`.
- Preserve the full finger delta after threshold crossing so the card catches up to the pointer without changing the established pixel-to-project mapping.
- Coalesce drag presentation writes to one `requestAnimationFrame` using a separate `dragFrame` and `pendingDragOffset`. Flush the final position synchronously on a committed `pointerup`; cancel the queued write during cleanup, cancellation, or capture loss.
- A candidate that ends without crossing the threshold must leave `offset` unchanged and preserve the native card click.
- A `pointercancel` or unexpected `lostpointercapture` before commitment restores `dragStartOffset`. After commitment it snaps immediately to `nearestStep(offset)` so the wall can never rest between cards.
- Replace the free-running inertia phase with endpoint projection followed immediately by the existing interruptible spring. Keep the exact Apple-style decay rate already documented by this repository:

```js
const DECELERATION_RATE = 0.998;

function projectRelease(velocityPerSecond) {
	return (velocityPerSecond / 1000) * (DECELERATION_RATE / (1 - DECELERATION_RATE));
}

function releaseTarget(velocityPerSecond) {
	const maximumTravel = stageWidth <= 720 ? 2 : 4;
	const projectedTravel = clamp(projectRelease(velocityPerSecond), -maximumTravel, maximumTravel);
	return nearestStep(offset + projectedTravel);
}
```

- On a committed release, call `startSpring(releaseTarget(releaseVelocity), releaseVelocity)` immediately. The existing `response = 0.5s` and `dampingRatio = 0.88` remain the spring convention; do not add a second easing system.
- Reduced motion skips projection and sets `nearestStep(offset)` immediately.
- Keep spring integration stable and wall-clock-correct during a slow frame: consume up to `100ms` of elapsed time in substeps no larger than the existing `1 / 30s` maximum instead of discarding all elapsed time above `33ms`.

## Repo conventions to follow

- Keep Svelte 5 runes, class arrays, `prefersReducedMotion` from `svelte/motion`, and the `{@attach dragSurface}` lifecycle pattern.
- `src/lib/landingPage/ProjectWall.svelte:121-195` already centralizes frame ownership and spring integration; extend that driver rather than adding a dependency.
- Keep `touch-action: pan-y` at `src/lib/landingPage/ProjectWall.svelte:437` so vertical document scrolling remains native.
- Keep the delayed pointer capture introduced by commit `4d3d12d`; only real drags may capture the pointer.

## Steps

1. In `src/lib/landingPage/ProjectWall.svelte`, separate pointer candidacy (`pointerId !== undefined`) from committed drag state (`isDragging`). Add `dragFrame` and `pendingDragOffset` bookkeeping plus queue, flush, and cancel helpers.
2. Change `handlePointerDown` so it cancels active spring motion and records the candidate without setting `isDragging` or `isMoving`.
3. Change `handlePointerMove` so sub-threshold movement records velocity samples but does not move the wall. Commit the drag once `Math.abs(delta) > 8`, then queue at most one presentation write per display frame.
4. Replace the `inertia` mode and `startInertia` branch with the exact endpoint projection above, clamped to two mobile cards and four desktop cards, then spring directly to that snapped target.
5. Update `handlePointerEnd`, `handleLostPointerCapture`, and attachment cleanup so queued writes are flushed or cancelled appropriately and every interrupted gesture ends at its original or nearest integer offset.
6. Integrate long frames with bounded substeps totaling at most `100ms`; each substep must remain at or below `1 / 30s`.

## Boundaries

- Do NOT change project data, destinations, semantic link markup, keyboard controls, or reduced-motion semantics.
- Do NOT capture the pointer on `pointerdown`; native taps must continue to open the chosen project.
- Do NOT block vertical page scrolling.
- Do NOT add a motion or gesture dependency.
- Do NOT change card geometry in this plan; plan 005 owns width, spacing, stacking, and the mobile render window.
- If the cited code has drifted from commit `9a35795`, stop and report instead of improvising.

## Verification

- **Mechanical**: run `npx @sveltejs/mcp svelte-autofixer src/lib/landingPage/ProjectWall.svelte --svelte-version 5`, then `npm run check` and `npm run build`; expect no new diagnostics.
- **Feel check**: on a real phone or coarse-pointer emulation, scroll vertically with a slightly diagonal finger and confirm the wall does not twitch or stop between cards. Tap the active card with less than `8px` travel and confirm its native link still opens.
- Slowly drag past `8px`, reverse direction, release, and confirm the wall tracks at display refresh and settles on one card. Flick hard in both directions and confirm mobile travel never exceeds two projected cards and begins settling immediately instead of coasting for seconds.
- Interrupt a settling spring with a new finger, reverse it, and confirm there is no jump. Trigger `pointercancel` in DevTools and confirm the final offset is integer-aligned.
- Use CPU throttling and confirm a slow frame does not make spring time stretch proportionally; no single integration substep exceeds `33ms`.
- Toggle `prefers-reduced-motion` and confirm direct dragging still works while release snaps immediately with no position animation.
- **Done when**: taps remain taps, vertical scrolling never leaves the wall fractional, drag updates are display-coalesced, and every mobile flick settles promptly within a two-card travel bound.
