# Animation and visual-system plans

> Historical: plans 001–005 built the DOM landing wall and card deck, removed on 2026-09-03 by the
> landing redesign (see `docs/adr/0003-three-js-landing-blob-field.md`). Of that work only
> `src/lib/gallery/wallMotion.svelte.js` (the postcard flip) and `cardSeed` in
> `src/lib/gallery/postcardBack.js` survive.

| Plan | Title | Severity | Status | Dependencies |
| --- | --- | --- | --- | --- |
| 001 | Make the project wall fluid and velocity-aware | HIGH | DONE | 003 for shared tokens |
| 002 | Move card feedback onto transform and opacity | HIGH | DONE | 003 for shared tokens |
| 003 | Add an Apple-style visual system without losing the sketch | MEDIUM | DONE | None |
| 004 | Stabilize mobile project-wall dragging | HIGH | DONE | None |
| 005 | Separate mobile project cards | HIGH | DONE | 004 (shared `ProjectWall.svelte` motion geometry) |

## Recommended execution order

1. **003** — establish palette, material, typography, and easing tokens.
2. **001** — replace the wall's competing motion drivers with velocity-aware Apple-style behavior.
3. **002** — move card feedback to compositor-safe properties and add image-load feedback.

Plans 001 and 002 may be executed in parallel after the token names in plan 003 are established. Run the complete mechanical and visual verification suite after all three are integrated.

For the mobile refinement, execute **004** before **005** because both edit `ProjectWall.svelte`; then run their combined real-device/coarse-pointer feel checks. Plan 004 fixes gesture intent, cancellation, frame pacing, and runaway release motion. Plan 005 fixes card geometry, stacking, touch-target collision, and the mobile render window.
