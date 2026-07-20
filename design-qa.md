# Landing page design QA

- Source visual truth: `static/landing-page.png`
- Browser-rendered implementation: `.design-qa/implementation-desktop-v4.png`
- Desktop viewport: 1672 × 941
- Mobile implementation: `.design-qa/implementation-mobile-v5.png`
- Mobile viewport: 390 × 844
- State: landing route, `All` filter active, carousel settled on the default project

## Comparison evidence

- First-pass full-view comparison: `.design-qa/comparison-desktop-v4-baseline.jpg`
- Final full-view comparison: `.design-qa/comparison-desktop-v4.jpg`
- Final focused wall comparison: `.design-qa/comparison-focused-v4.jpg`

The focused comparison was required because the card tangent, overlap, doubled graphite outlines, image matting, and small caption treatment are not legible enough in the full-page pair.

## Comparison history

### Pass 1

- [P2] The center card projected to roughly 517 × 447 px, which made the wall dominate the page and pushed the feature row below the reference's first viewport.
- [P2] Neighbor cards stayed nearly as large as the center card, so the wall read closer to a flat overlapping slider than a shallow panoramic cylinder.
- [P2] The desktop curve used a hard angle clamp and permanently promoted eleven large card layers, allowing the remote cards to converge and adding unnecessary compositor cost.
- [P2] The mobile center card projected to about 92vw and was taller than the intended paper-frame proportion.

Fixes made:

- Reduced and re-proportioned the card plane, stage, and responsive step.
- Replaced the hard angular cutoff with a smooth bounded arc, increased progressive tangent rotation, and deepened the restrained Z falloff.
- Reduced the desktop render window to nine cards and made compositor promotion conditional on active motion.
- Tuned mobile to a projected 338.9 × 326 px center card with visible edge slivers and no page overflow.

Post-fix evidence:

- The final center card projects to about 434.7 × 390.7 px at y≈367; the first neighbors are about 84% as wide and rotate 16.6°, the second pair are about 69% as wide and rotate 31.1°, adjacent cards overlap by roughly 6 px, and the feature row begins at y≈830.
- Final desktop evidence: `.design-qa/implementation-desktop-v4.png` and `.design-qa/comparison-desktop-v4.jpg`.
- Final mobile evidence: `.design-qa/implementation-mobile-v5.png`.

### Pass 2

- [P2] The overall composition matched, but the image openings still read cleaner than the reference's doubled pencil construction.

Fixes made:

- Added stable, project-specific double rough outlines around every image opening.
- Kept deterministic per-card vertical drift, Z-axis wobble, asymmetric paper corners, and double outer frames stable across filters.
- Softened saturation, contrast, and material shadows so the real portfolio imagery sits more naturally on the paper surface.

Post-fix evidence:

- The final focused comparison shows the added hand-drawn image edges without obscuring project imagery or captions: `.design-qa/comparison-focused-v4.jpg`.

## Required fidelity surfaces

- Fonts and typography: passed. Newsreader preserves the reference's editorial display hierarchy, Shantell Sans carries the hand annotation/caption voice, and the system UI face remains readable at small sizes. Weight, line height, wrapping, and optical hierarchy remain stable at desktop and mobile.
- Spacing and layout rhythm: passed. Header, hero, annotation band, card wall, and feature row follow the source's vertical cadence. The center card and neighbor overlap now match the intended shallow handscroll proportions.
- Colors and visual tokens: passed. Warm paper, graphite, muted ink, and restrained portfolio accents preserve the source's paper-gallery balance. The portfolio palette is intentionally a little warmer than the source rather than being a literal brand copy.
- Image quality and asset fidelity: passed. All cards use real optimized project assets, preserve sharpness, provide source-image fallbacks, and use consistent crops. No placeholder imagery was introduced.
- Copy and content: passed. All visible copy is portfolio-specific and coherent; the reference's structure is adapted rather than copied verbatim.
- Accessibility and responsiveness: passed. The carousel has pointer capture, click suppression, keyboard controls, a settled-state live announcement, reduced-motion behavior, visible focus treatment, and zero horizontal document overflow at 390, 820, and 1672 px.

## Interaction and runtime checks

- Pointer flick: active project changed immediately, continued changing under inertia at 320 ms, and settled at 3.82 s with the final card at `rotateY(0deg)`.
- Seamless wrap: the six-item Maps filter returned to the same logical project after six keyboard advances.
- Filter behavior: `aria-pressed` and the carousel dataset updated correctly, then returned to the default `All` state.
- Mobile: 390 × 844 rendered with side-card slivers and zero horizontal page overflow.
- Browser console errors and warnings after drag, wrap, filter, desktop, tablet, and mobile checks: 0.
- Svelte autofixer issues in `ProjectWall.svelte` and `ProjectCard.svelte`: 0.
- Production build: passed. Existing accessibility warnings remain in the unrelated legacy `src/routes/project/+page.svelte` route.

## Findings

No actionable P0, P1, or P2 differences remain. The implementation intentionally uses Gordon Tu's real project screenshots rather than the reference's watercolor subjects; the paper, linework, geometry, and motion carry the requested visual relationship.

## Follow-up polish

- [P3] A future art-direction pass could commission watercolor versions of selected project thumbnails, but that would change the portfolio assets rather than improve the carousel implementation itself.

Final result: passed
