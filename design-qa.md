# Landing page design QA

- Source: `static/landing-page.png`
- Desktop viewport: 1672 × 941
- Mobile viewport: 390 × 844
- State: landing route, `All` filter active, default carousel state
- Final desktop capture: `.design-qa/implementation-desktop-v3.png`
- Final mobile capture: `.design-qa/implementation-mobile-v4.png`

## Comparison evidence

- Full-view comparison: `.design-qa/comparison-desktop-v3.jpg`
- Focused hero and wall comparison: `.design-qa/comparison-focused-v3.jpg`
- First-pass comparison: `.design-qa/comparison-desktop-v1.jpg`

The first pass showed an oversized, high-positioned center card and a feature row that sat too high. The second pass reduced the wall height, lowered the 3D card plane, aligned the annotation bands, widened and lowered the feature row, and added safe mobile spacing. The final comparison matches the reference's page rhythm, typography hierarchy, folded wall silhouette, paper palette, and hand-drawn annotation placement while using Gordon Tu's real portfolio content.

## Interaction and runtime checks

- Category filters update `aria-pressed` and replace the carousel dataset.
- Pointer drag changes the active project on desktop and mobile.
- Left/right keyboard controls change the active project.
- Keyboard focus remains on the stable wall after 10 consecutive virtualized card advances.
- Desktop auto-drift has a persistent pause/play control; its live region is disabled while motion is automatic.
- The infinite wall virtualizes nine desktop cards and five mobile cards while indexing all 31 projects modulo the dataset.
- Reduced-motion preferences disable auto-drift and inertial movement.
- Fresh browser-console errors/warnings after filter, keyboard, and drag checks: 0.
- Svelte autofixer issues in the new components: 0.
- Svelte-check diagnostics in the new landing-page files: 0.
- Production build: passed. Remaining repository-wide Svelte-check failures are isolated to legacy files outside this implementation.

Final result: passed
