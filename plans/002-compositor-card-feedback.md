# 002 — Move card feedback onto transform and opacity

- **Status**: DONE
- **Commit**: 2320138
- **Severity**: HIGH
- **Category**: Easing & duration, performance, accessibility
- **Estimated scope**: 1 file, small-to-medium edit

## Problem

`src/lib/landingPage/ProjectCard.svelte:149-157` animates a full-card drop-shadow filter, and lines 187-195 animate full-image saturation, contrast, and sepia filters while also running a `420ms` zoom:

```css
.project-card {
	filter: drop-shadow(0 18px 22px rgb(50 46 38 / 0.08));
	transition: filter 180ms ease;
}

img {
	filter: saturate(0.64) contrast(0.92) sepia(0.1);
	transition: filter 240ms ease, transform 420ms cubic-bezier(0.2, 0.75, 0.25, 1);
}
```

The zoom fires for hover, keyboard focus, and every active-card change, exceeds the 300ms UI ceiling, has no fine-pointer gate, and has no reduced-motion alternative. Lazy images at lines 115-124 have no load-state transition and can pop into the moving wall.

## Target

- Keep image grading and base shadow static.
- Represent enhanced shadow with a pseudo-element whose static shadow is revealed only through `opacity`.
- Use `.image-wash` opacity instead of animating image filters.
- Reserve `scale(1.012)` for fine-pointer hover only.
- Use `180ms cubic-bezier(0.23, 1, 0.32, 1)` for hover transform and `180ms ease` for opacity.
- Remove animated zoom from `.project-card:focus-visible` and `.project-card.active`; the focus ring and wall geometry already communicate those states.
- Gate hover motion behind:

```css
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {}
```

- Keep reduced-motion feedback to `opacity 200ms ease` with no transform.
- Add `let imageLoaded = $state(false)`, set it from `onload`, and use `class={['project-image', { loaded: imageLoaded }]}`. Images transition from `opacity: 0` to `1` over `180ms ease`; a fallback image load follows the same path.

## Repo conventions to follow

- Use Svelte 5 runes and clsx-style class arrays, not `class:` directives.
- Preserve `RoughSvg`, semantic link markup, the optimized-image fallback, and current focus outline behavior.
- Use the shared color and motion tokens introduced by plan 003.

## Steps

1. Add reactive image-load state and a load handler without introducing an effect.
2. Convert image class handling to a Svelte 5 class array.
3. Replace animated filters with static filters plus pseudo-element/image-wash opacity.
4. Limit zoom to fine-pointer, no-reduced-motion hover at exactly 180ms.
5. Add reduced-motion and coarse-pointer rules.

## Boundaries

- Do NOT change image URLs, sizes, alt text, loading priority, or card destinations.
- Do NOT add a duplicated second image.
- Do NOT animate layout, `filter`, or `box-shadow` values.
- Do NOT animate focus-driven or active-card-driven scale.

## Verification

- **Mechanical**: run Svelte autofixer on `ProjectCard.svelte`, then `npm run check` and `npm run build`.
- **Feel check**: hover rapidly between cards and confirm feedback reverses smoothly within 180ms; tab through cards and confirm only the focus ring changes; observe lazy cards entering from an edge and confirm images fade over their placeholders instead of popping.
- Use the Performance panel with paint flashing and confirm hover does not repaint the full image for filter interpolation.
- Emulate touch and reduced motion and confirm there is no hover zoom.
- **Done when**: card emphasis uses only transform/opacity and keyboard focus is immediate.
