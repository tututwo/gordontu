# 001 — Make the project wall fluid and velocity-aware

- **Status**: DONE
- **Commit**: 2320138
- **Severity**: HIGH
- **Category**: Purpose & frequency, interruptibility, performance, accessibility
- **Estimated scope**: 1 file, medium refactor

## Problem

`src/lib/landingPage/ProjectWall.svelte:8-12` stores the wall position in a Svelte `Spring`, while `src/lib/landingPage/ProjectWall.svelte:79-94` retargets that Spring from a second `requestAnimationFrame` loop for the entire visit:

```js
const position = new Spring(0, {
	stiffness: 0.16,
	damping: 0.82,
	precision: 0.05
});

position.set(position.target - elapsed * 0.018);
```

Drag writes at `src/lib/landingPage/ProjectWall.svelte:149` are instant, which resets the Spring's stored velocity. Release then calls `preserveMomentum` at lines 162-164, but there is no Spring velocity left to preserve. Keyboard and focus navigation at lines 171-193 and 227-231 also animate through the same slow Spring. `handlePointerDown` at lines 118-130 permits a second pointer to replace the active one.

## Target

Use one reactive numeric presentation value and one display-synced driver:

- `let position = $state(0)` is the single on-screen source of truth.
- Pointer movement updates `position` 1:1.
- Track a short pointer history and calculate release velocity in pixels per second.
- Project the endpoint with Apple's exact exponential-decay form and `decelerationRate = 0.998`:

```js
function project(initialVelocity, decelerationRate = 0.998) {
	return (initialVelocity / 1000) * (decelerationRate / (1 - decelerationRate));
}
```

- Snap to the nearest card step after projection.
- Spring from the current presentation position with the measured release velocity using `response = 0.4` seconds and `dampingRatio = 0.82`:

```js
const angularFrequency = (Math.PI * 2) / 0.4;
const acceleration =
	-angularFrequency ** 2 * (position - target) -
	2 * 0.82 * angularFrequency * motionVelocity;
```

- Clamp frame delta to `1 / 30` seconds. Settle when distance is under `0.5px` and velocity under `2px/s`, then set the exact target.
- ArrowLeft, ArrowRight, Home, and card focus cancel motion and update `position` instantly.
- Reduced motion disables autoplay and release inertia; direct dragging remains 1:1.
- Autoplay uses the same single animation frame driver at `18px/s` and starts after the existing `1100ms` delay.
- Reject additional pointers with `if (isDragging || event.button !== 0 || projects.length < 2) return`.
- Preserve pointer capture and click suppression.
- Add a `180ms` opacity-only `@starting-style` entrance to `.wall-wrap` so keyed category replacement does not teleport; reduced motion keeps a `120ms` opacity fade and adds no position movement.

## Repo conventions to follow

- Keep Svelte 5 runes and the existing `{@attach dragSurface}` lifecycle pattern.
- Keep `prefersReducedMotion` from `svelte/motion`; remove only the unusable `Spring` import.
- Keep the nine-card desktop/five-card mobile virtualization and all existing semantic carousel markup.
- Continue deriving `visibleCards` from the numeric presentation `position`.

## Steps

1. Replace the `Spring` position with numeric `$state` plus non-reactive frame, target, and velocity bookkeeping.
2. Add projection, nearest-step, cancellation, autoplay, and Apple-style spring helpers.
3. Track a short release-velocity history during pointer movement.
4. Hand the measured velocity into the release spring and make it interruptible on the next pointer-down.
5. Make keyboard/focus movement instant and add the active-pointer guard.
6. Change template position reads from `position.current` to `position` and direct transform/opacity styles.
7. Add the opacity-only keyed entrance and reduced-motion behavior.

## Boundaries

- Do NOT change the DOM-based wall architecture documented in `docs/adr/0001-dom-based-project-wall.md`.
- Do NOT add a motion dependency.
- Do NOT animate keyboard navigation.
- Do NOT remove the pause/play control, virtualization, pointer capture, or semantic project links.
- Do NOT change project data or destinations.

## Verification

- **Mechanical**: run Svelte autofixer on `ProjectWall.svelte`, then `npm run check` and `npm run build`; expect no new diagnostics.
- **Feel check**: drag slowly and confirm exact 1:1 tracking; flick and confirm there is no release hesitation; grab a moving wall and reverse it immediately; use a second finger and confirm it cannot steal the drag; press Arrow keys and Home and confirm the wall updates immediately.
- In DevTools at 10% playback, confirm release starts with the finger's velocity and settles with only subtle momentum-derived overshoot.
- Emulate reduced motion and confirm there is no autoplay or release spring, while category replacement retains a short opacity fade.
- **Done when**: a flick projects and snaps naturally, all motion is interruptible, and there is only one frame driver.
