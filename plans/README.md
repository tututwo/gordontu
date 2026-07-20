# Animation and visual-system plans

| Plan | Title | Severity | Status | Dependencies |
| --- | --- | --- | --- | --- |
| 001 | Make the project wall fluid and velocity-aware | HIGH | DONE | 003 for shared tokens |
| 002 | Move card feedback onto transform and opacity | HIGH | DONE | 003 for shared tokens |
| 003 | Add an Apple-style visual system without losing the sketch | MEDIUM | DONE | None |

## Recommended execution order

1. **003** — establish palette, material, typography, and easing tokens.
2. **001** — replace the wall's competing motion drivers with velocity-aware Apple-style behavior.
3. **002** — move card feedback to compositor-safe properties and add image-load feedback.

Plans 001 and 002 may be executed in parallel after the token names in plan 003 are established. Run the complete mechanical and visual verification suite after all three are integrated.
