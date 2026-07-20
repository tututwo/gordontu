# 003 — Add an Apple-style visual system without losing the sketch

- **Status**: DONE
- **Commit**: 2320138
- **Severity**: MEDIUM
- **Category**: Cohesion, physicality, accessibility, missed opportunities
- **Estimated scope**: 5 files, medium visual polish

## Problem

The live landing page uses component-local colors and timings. `src/routes/+page.svelte:258-263` defines only paper and ink colors, `src/lib/landingPage/PortfolioHeader.svelte:133-159` gives controls opacity feedback but no pointer-down response, and `src/lib/landingPage/RoughSvg.svelte:21-27` hard-codes the sketch stroke. The primary drag arrow at `src/routes/+page.svelte:223-226` appears fully formed and static.

## Target

Introduce a restrained Apple-inspired light palette while preserving the hand-drawn language:

```css
:root {
	--paper: #f5f5f7;
	--paper-elevated: #fbfbfd;
	--ink: #1d1d1f;
	--muted-ink: #6e6e73;
	--accent: #0071e3;
	--accent-pressed: #0068d1;
	--surface: rgb(255 255 255 / 0.72);
	--surface-solid: #fbfbfd;
	--hairline: rgb(29 29 31 / 0.10);
	--shadow-soft: rgb(0 0 0 / 0.10);
	--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
	--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
```

- Use the system UI font stack for controls and body copy; retain Newsreader for the display headline and Shantell Sans for annotations and card captions.
- Keep the paper-noise layer at lower opacity so the interface reads cleanly but still tactile.
- Make the header a light translucent material using `backdrop-filter: blur(24px) saturate(160%)`, with a solid fallback under `prefers-reduced-transparency: reduce` and a stronger border under `prefers-contrast: more`.
- Use system blue only for active underline, focus rings, and the rough GitHub button; keep all other sketch marks graphite.
- Change RoughSvg's default stroke to `var(--sketch-ink, var(--ink, #1d1d1f))` so the rough rendering participates in the palette.
- Add asymmetric press response to header controls and the motion toggle: `100ms` pointer-down to `scale(0.97)`, `160ms` release using `var(--ease-out)`. Remove the transform under reduced motion.
- Reveal the first-view drag arrow once with opacity plus a `10px` horizontal directional offset over `400ms var(--ease-out)` after a `350ms` delay; reduced motion keeps a `200ms` opacity-only reveal.
- Keep the existing rough frames, seal, paper texture, hand-drawn annotations, display serif, and irregular card rotations.

## Repo conventions to follow

- Put global palette and motion tokens in `src/app.css`.
- Consume tokens from scoped component CSS rather than repeating color literals.
- Preserve all current responsive breakpoints and semantics.
- Use CSS media queries for motion, transparency, pointer capability, and contrast preferences.

## Steps

1. Add shared palette, material, typography, shadow, and easing tokens to `src/app.css`.
2. Update landing-page background, paper texture, text colors, and the drag cue in `src/routes/+page.svelte`.
3. Update `PortfolioHeader.svelte` with glass material, accent rough marks, focus color, and press feedback.
4. Update `RoughSvg.svelte` to use the shared sketch-ink default.
5. Align `ProjectCard.svelte` and `ProjectWall.svelte` surfaces and controls to the shared palette.
6. Add reduced-transparency and increased-contrast fallbacks.

## Boundaries

- Do NOT replace the rough SVG artwork, serif headline, handwritten annotations, seal, paper texture, or irregular wall geometry.
- Do NOT turn every element blue; blue is a sparse functional accent.
- Do NOT add a dependency or imitate an Apple product literally.
- Do NOT reduce text contrast below WCAG-readable levels.

## Verification

- **Mechanical**: run Svelte autofixer on every edited component, then `npm run check` and `npm run build`.
- **Feel check**: compare desktop and mobile screenshots to the saved QA captures; the result should feel calmer, brighter, and more layered while remaining unmistakably hand-sketched.
- Press each header control and confirm response begins on pointer-down; toggle reduced motion and confirm press scaling disappears; toggle reduced transparency and confirm the header becomes solid.
- Inspect at 200% zoom and confirm the accent remains sparse and rough lines remain legible.
- **Done when**: system neutral/blue hierarchy and translucent material coexist with the original sketch identity.
