<script>
	import { goto, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { devicePixelRatio } from 'svelte/reactivity/window';
	import { picture as photograph } from '../peel.js';
	import { covers } from './covers.js';
	import { createGarden } from './garden.js';

	/** @typedef {import('./layout.js').Cell} Cell */

	/**
	 * The Garden (CONTEXT.md) over the page: its scene on a full-window canvas, and over that, in the
	 * site's own type, the Back control and the card showing the Project of the Plant under the pointer
	 * (its image, its title, its Client and year). A list of
	 * the Projects' links, shown only to the keyboard and screen readers, opens the same pages.
	 * @type {{ cells: Cell[], picture?: HTMLCanvasElement | null, onleave: () => void, dev?: boolean, still?: boolean }}
	 *   `picture`: the page as it looked, which the Garden starts from; `still`: the grown Garden at once
	 *   (the dev route's ?still); `dev`: report the frame time to the console.
	 */
	let { cells, picture = null, onleave, dev = false, still = false } = $props();

	/** The Plant under the pointer and where its label points, CSS px. @type {{ cell: Cell, x: number, y: number } | null} */
	let label = $state(null);
	/** @type {ReturnType<typeof createGarden> | undefined} */
	let garden;
	let leaving = false;
	/** Leaving without a picture of the page to end on, the Garden fades off it. */
	let fading = $state(false);

	/** @param {Cell} cell */
	const href = ({ kind, project: { category, slug } }) =>
		kind === 'flower' ? resolve('/[category]/[slug]/case-study', { category, slug }) : resolve('/[category]/[[slug]]', { category, slug });

	/** The scene, made once: nothing it reads at the start should remake it. @param {HTMLCanvasElement} canvas */
	const scene = (canvas) =>
		untrack(() => {
			// The page's state while the Garden holds it: `true` as the Glasses take the page into it
			// (Avatar.svelte pushes it), then 'grown', so that coming back to it from a page it opened
			// finds it as it was left, grown, and the picture it opened with long out of date.
			const state = /** @type {{ garden?: true | 'grown' }} */ (page.state).garden;
			const back = state === 'grown';
			const made = createGarden(canvas, cells, {
				picture: back ? null : picture,
				reduced: prefersReducedMotion.current,
				onhover: (cell, at) => (label = cell && { cell, ...at }),
				onpick: (cell) => goto(href(cell))
			});
			garden = made;
			if (still || back) made.still();
			else {
				made.enter();
				made.grow();
			}
			if (state === true) replaceState('', { ...page.state, garden: 'grown' });
			const observer = new ResizeObserver(() => made.resize());
			observer.observe(canvas);
			const report = dev
				? setInterval(() => console.info(`garden: drawn in ${made.timing.render.toFixed(2)} ms, a frame every ${made.timing.interval.toFixed(1)} ms`), 2000)
				: 0;
			return () => {
				clearInterval(report);
				observer.disconnect();
				made.dispose();
				garden = undefined;
			};
		});

	/** The page under the Garden is out of reach while it is open: no focus, no screen reader. @param {HTMLElement} dialog */
	function modal(dialog) {
		const page = [...(dialog.parentElement?.children ?? [])].filter((node) => node !== dialog && node instanceof HTMLElement && !node.inert);
		for (const node of page) /** @type {HTMLElement} */ (node).inert = true;
		return () => {
			for (const node of page) /** @type {HTMLElement} */ (node).inert = false;
		};
	}

	// A move to another screen changes its density but not its size, which the observer would miss.
	$effect(() => {
		devicePixelRatio.current;
		garden?.resize();
	});

	async function leave() {
		if (leaving || !garden) return;
		leaving = true;
		label = null;
		const made = garden;
		const left = made.leave();
		// Without a picture of the page to end on (coming back to the Garden, or the window has changed
		// size), it takes one of the page behind it as it starts to leave; failing that in time, it fades
		// off the page as the camera returns.
		if (!made.printed && !prefersReducedMotion.current) {
			const shot = await Promise.race([photograph({}, true).catch(() => null), new Promise((late) => setTimeout(late, 300, null))]);
			if (shot) made.print(shot);
			else fading = true;
		}
		await left;
		onleave();
	}

	/**
	 * Focus starts on Back, inside the dialog, without the ring: the Garden is entered with a pointer,
	 * and the ring comes back with the keyboard's first move.
	 * @param {HTMLElement} node
	 */
	const focus = (node) => node.focus({ preventScroll: true, focusVisible: false });

	/**
	 * The card's image width, CSS px, for a cover of aspect `ratio`: about the area of a 240 × 135
	 * picture, so a tall cover makes a narrower card rather than a taller one, between 144 and 256 px.
	 * @param {number} ratio
	 */
	const imageWidth = (ratio) => Math.round(Math.min(256, Math.max(144, Math.sqrt(240 * 135 * ratio))));

	/**
	 * The card over its Plant's anchor, a little above it, but never past the window's edge: a flower
	 * by the frame's side has its card moved in, still over the flower. Its image holds its box before
	 * it loads (sized from covers.js), so the card is measured at its full height.
	 * @param {{ x: number, y: number }} at
	 */
	const place = (at) => (/** @type {HTMLElement} */ node) => {
		const inset = 12;
		const half = node.offsetWidth / 2 + inset;
		const x = Math.min(Math.max(at.x, half), (node.parentElement?.clientWidth ?? innerWidth) - half);
		node.style.translate = `${x}px ${Math.max(at.y, node.offsetHeight + inset + 10)}px`;
	};
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && leave()} />

<div class="garden" class:fading role="dialog" aria-modal="true" aria-label="Garden" {@attach modal}>
	<!-- The Projects' links below say what it shows. -->
	<canvas {@attach scene} class:pointing={label !== null} aria-hidden="true"></canvas>

	<button type="button" class="back text-copy-14" onclick={leave} {@attach focus}>← Back</button>

	<ul class="projects text-copy-14" aria-label="Projects">
		{#each cells as cell (cell.project.slug)}
			<li><a href={href(cell)}>{cell.project.projectName}</a></li>
		{/each}
	</ul>

	<!-- What the Plant under the pointer stands for; the list above says it to the keyboard. -->
	{#if label}
		{@const { project } = label.cell}
		{@const [width, height] = covers[project.slug] ?? [16, 9]}
		{#key project.slug}
			<figure class="label" aria-hidden="true" style:width="{imageWidth(width / height)}px" {@attach place(label)}>
				<img src="/garden/covers/{project.slug}.webp" alt="" {width} {height} />
				<figcaption>
					<span class="text-copy-14">{project.projectName}</span>
					<span class="text-copy-13">{project.client ?? 'Personal'} · {project.date.slice(0, 4)}</span>
				</figcaption>
			</figure>
		{/key}
	{/if}
</div>

<style>
	.garden {
		position: fixed;
		inset: 0;
		z-index: 20;
	}

	/* The page under it stays where it is while it is open: a wheel turn, a key or a drag over the
	   Garden scrolls nothing, so its leave ends on the page as it will be shown. */
	:global(html:has(.garden)) {
		overflow: hidden;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}

	canvas.pointing {
		cursor: pointer;
	}

	/* Leaving without a picture of the page to end on: the Garden fades off it as the camera returns. */
	.garden.fading {
		opacity: 0;
		transition: opacity 1.2s var(--ease-out);
	}

	/* The site's hairline box: white, square, a 1px rule. */
	.back,
	.label,
	.projects a:focus-visible {
		border: 1px solid var(--color-hairline);
		background: var(--color-pure-white);
		padding: 0.5rem 0.65rem;
	}

	.back {
		position: absolute;
		top: 1rem;
		left: 1rem;
		color: var(--color-stone);
		cursor: pointer;
		transition: color 160ms var(--ease-out);
	}

	.back:hover {
		color: var(--color-obsidian);
	}

	/* Over the Plant's anchor, a little above it, rising into place as it appears (a tooltip's quick
	   ease, from just under its size, never from nothing). */
	.label {
		position: absolute;
		top: 0;
		left: 0;
		margin: 0;
		transform: translate(-50%, calc(-100% - 0.6rem));
		transform-origin: 50% 100%;
		pointer-events: none;
		animation: appear 160ms var(--ease-out);
	}

	@keyframes appear {
		from {
			opacity: 0;
			scale: 0.97;
		}
	}

	/* The Project's image in its own proportions; until it loads, its box holds a quiet fill. */
	.label img {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-gray-alpha-100);
	}

	/* The title close under the image, the Client and year close under the title. */
	.label figcaption {
		display: grid;
		margin-top: 0.5rem;
	}

	.label span:first-child {
		color: var(--color-obsidian);
	}

	.label span:last-child {
		color: var(--color-stone);
	}

	@media (prefers-reduced-motion: reduce) {
		.label {
			animation: none;
		}
	}

	/* Off screen until focused; a focused one shows under Back. */
	.projects {
		position: absolute;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.projects a {
		position: fixed;
		top: 4rem;
		left: 1rem;
		color: var(--color-obsidian);
		text-decoration: none;
		clip-path: inset(50%);
	}

	.projects a:focus-visible {
		clip-path: none;
	}
</style>
