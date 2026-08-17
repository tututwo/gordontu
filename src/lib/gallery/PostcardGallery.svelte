<script>
	import { resolve } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import { categories } from '$lib/project/project.js';
	import { WallMotion } from '$lib/landingPage/wallMotion.svelte.js';
	import { Pan } from './pan.js';

	/** @typedef {import('$lib/project/project.js').Project} Project */

	/** @type {{ projects: Project[], category: (typeof categories)[number] }} */
	let { projects, category } = $props();

	let ready = $state(false);
	/** @type {Project | null} */
	let selected = $state(null);
	let heroBox = $state({ w: 0, h: 0 });
	/** @type {HTMLCanvasElement | undefined} */
	let canvas = $state();
	/** @type {ReturnType<typeof import('./scene.js').createScene> | undefined} */
	let scene;

	const pan = new Pan({
		locked: () => selected !== null,
		reduced: () => prefersReducedMotion.current,
		limits: () => scene?.panLimits() ?? { x: 0, y: 0 },
		onchange: () => scene?.wake(),
		ontap: (event) => {
			if (selected) return close();
			const project = scene?.hitTest(event);
			if (project) open(project);
		}
	});

	// The flip is the landing wall's drag/spring controller with two "cards": one card-width of
	// drag is one half-turn, release springs to the nearest face, keys and clicks come free.
	const flip = new WallMotion({ step: () => heroBox.w || 1, isMobile: () => true, count: () => 2 });

	$effect(() => {
		// Read the offset before the optional chain: on the first run `scene` is still loading and
		// a short-circuit would leave the effect with no dependency to re-run on.
		const angle = flip.offset * Math.PI;
		scene?.setFlip(angle);
	});

	/** @param {Project[]} list */
	function gallery(list) {
		return (/** @type {HTMLCanvasElement} */ node) => {
			let disposed = false;
			/** @type {ReturnType<typeof import('./scene.js').createScene> | undefined} */
			let created;
			import('./scene.js').then(({ createScene }) => {
				if (disposed) return;
				created = createScene(node, list, {
					pan,
					reduced: () => prefersReducedMotion.current,
					onready: () => (ready = true)
				});
				scene = created;
			});
			return () => {
				disposed = true;
				created?.dispose();
				scene = undefined;
				ready = false;
				selected = null;
				pan.stop();
				pan.x = 0;
				pan.y = 0;
			};
		};
	}

	/** @param {Project} project */
	function open(project) {
		if (!scene) return;
		selected = project;
		flip.focusCard(0);
		scene.open(project);
		heroBox = scene.heroBox();
	}

	/** Keyboard users land on the flip target as soon as a card opens. @param {HTMLElement} node */
	const focusOnMount = (node) => node.focus({ preventScroll: true });

	function close() {
		if (!selected) return;
		selected = null;
		flip.focusCard(0);
		scene?.close();
		canvas?.focus({ preventScroll: true });
	}

	/** @param {MouseEvent} event */
	function handleFlipClick(event) {
		// WallMotion cancels the click that follows a drag; honour that instead of double-flipping.
		if (!event.defaultPrevented) flip.moveBy(1);
	}
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && selected && close()} />

<div class={['gallery', { open: selected !== null }]}>
	<!-- Keyed: a section switch disposes the WebGL context, and a lost context can't host a new renderer. -->
	{#key category.slug}
		<canvas
			bind:this={canvas}
			tabindex="0"
			aria-label="{category.label} postcards. Drag, scroll or use the arrow keys to look around; tap a card to open it."
			{@attach gallery(projects)}
			{@attach pan.attach}
		></canvas>
	{/key}

	<a class="brand" href={resolve('/')}>Gordon Tu</a>

	<div class={['intro', { ready }]} aria-hidden={ready}>
		<h1>{category.label}</h1>
		<p>{category.description}</p>
	</div>

	{#if selected}
		<div class="open" role="dialog" aria-labelledby="open-title">
			<button
				class="hero-hit"
				type="button"
				aria-label="Flip the postcard"
				style:width="{heroBox.w}px"
				style:height="{heroBox.h}px"
				onclick={handleFlipClick}
				{@attach (node) => flip.attach(/** @type {any} */ (node))}
				{@attach focusOnMount}
			></button>
			<div class="card-row">
				<h2 id="open-title">{selected.projectName}</h2>
				<a href={resolve('/[category]/[slug]', { category: category.slug, slug: selected.slug })}>
					Details →
				</a>
				<a href={selected.projectLink} target="_blank" rel="external noreferrer">Open project ↗</a>
				<button type="button" onclick={close}>Close</button>
			</div>
		</div>
	{/if}

	<!-- Keyed so it closes again after picking a section (same component instance survives the navigation). -->
	{#key category.slug}
	<details class="switcher">
		<summary aria-label="Switch section">
			<svg viewBox="0 0 27 21" width="26" height="20" aria-hidden="true">
				<path
					d="M2.1 4.8h16m0 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM8.8 15.5h14.7m-14.7 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
				/>
			</svg>
		</summary>
		<nav aria-label="Sections">
			<p>Discover different sections</p>
			{#each categories as section (section.value)}
				<a
					href={resolve('/[category]', { category: section.slug })}
					aria-current={section.slug === category.slug ? 'page' : undefined}
				>
					{section.label}
				</a>
			{/each}
		</nav>
	</details>
	{/key}

	<ul class="sr-only">
		{#each projects as project (project.slug)}
			<li>
				<a href={resolve('/[category]/[slug]', { category: category.slug, slug: project.slug })}>
					{project.projectName}
				</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	.gallery {
		position: fixed;
		inset: 0;
		z-index: 1;
		font-family: var(--font-ui);
		color: var(--ink);
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		cursor: grab;
		outline: none;
	}

	canvas:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -4px;
	}

	.brand {
		position: absolute;
		top: clamp(1rem, 2.6vh, 1.6rem);
		left: clamp(1rem, 2.4vw, 1.75rem);
		font-family: var(--font-display);
		font-size: clamp(1.35rem, 1.9vw, 1.7rem);
		font-weight: 560;
		letter-spacing: -0.03em;
		color: var(--ink);
		text-decoration: none;
	}

	.intro {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 0.9rem;
		text-align: center;
		pointer-events: none;
		transition: opacity 420ms var(--ease-out);
	}

	.intro.ready {
		opacity: 0;
	}

	.intro h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(3rem, 4vw, 4rem);
		font-weight: 440;
		letter-spacing: -0.035em;
		line-height: 1;
	}

	.intro p {
		margin: 0;
		color: var(--muted-ink);
		font-size: clamp(0.94rem, 1.08vw, 1.08rem);
	}

	.hero-hit {
		position: absolute;
		top: 50%;
		left: 50%;
		translate: -50% -50%;
		padding: 0;
		border: 0;
		background: transparent;
		touch-action: none;
		cursor: grab;
		outline: none;
	}

	.hero-hit:focus-visible {
		outline: 2px dashed var(--accent);
		outline-offset: 10px;
	}

	.card-row {
		position: absolute;
		inset-inline: 0;
		bottom: clamp(1.1rem, 4vh, 2.4rem);
		width: fit-content;
		margin-inline: auto;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: baseline;
		gap: 0.35rem 1.2rem;
		max-width: min(92vw, 44rem);
		padding: 0.7rem 1.2rem;
		border: 1px solid var(--hairline);
		border-radius: 1.1rem;
		background: var(--surface);
		box-shadow: var(--shadow-material);
		backdrop-filter: blur(10px);
	}

	.card-row h2 {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		flex-basis: 100%;
		margin: 0;
		overflow: hidden;
		font-family: var(--font-hand);
		font-size: 1.05rem;
		font-weight: 500;
		text-align: center;
	}

	.card-row a,
	.card-row button {
		padding: 0.25rem 0;
		border: 0;
		background: none;
		font: inherit;
		font-size: 0.92rem;
		color: var(--ink);
		text-decoration: none;
		cursor: pointer;
	}

	.card-row a:hover,
	.card-row button:hover,
	.card-row a:focus-visible,
	.card-row button:focus-visible {
		color: var(--accent);
		outline: none;
	}

	.switcher {
		position: absolute;
		left: clamp(1rem, 2.4vw, 1.5rem);
		bottom: clamp(1rem, 2.6vh, 1.5rem);
	}

	/* An open card owns the bottom edge; the switcher would collide with its row on narrow screens. */
	.gallery.open .switcher {
		visibility: hidden;
	}

	.switcher summary {
		display: grid;
		place-items: center;
		width: 3.4rem;
		height: 3.4rem;
		border: 1px solid var(--hairline);
		border-radius: 1.2rem;
		background: var(--surface-solid);
		box-shadow: var(--shadow-material);
		color: var(--ink);
		cursor: pointer;
		list-style: none;
		transition: transform var(--press-out-duration) var(--ease-out);
	}

	.switcher summary::-webkit-details-marker {
		display: none;
	}

	.switcher summary:active {
		transform: scale(0.96);
	}

	.switcher summary:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	.switcher nav {
		position: absolute;
		left: 0;
		bottom: calc(100% + 0.6rem);
		display: grid;
		gap: 0.15rem;
		min-width: 13rem;
		padding: 0.8rem 1rem 0.7rem;
		border: 1px solid var(--hairline);
		border-radius: 1rem;
		background: var(--surface-solid);
		box-shadow: var(--shadow-material);
	}

	.switcher nav p {
		margin: 0 0 0.35rem;
		color: var(--muted-ink);
		font-size: 0.78rem;
	}

	.switcher nav a {
		padding: 0.3rem 0;
		font-family: var(--font-hand);
		font-size: 1rem;
		color: var(--ink);
		text-decoration: none;
		opacity: 0.66;
	}

	.switcher nav a[aria-current='page'],
	.switcher nav a:hover,
	.switcher nav a:focus-visible {
		opacity: 1;
		outline: none;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.intro,
		.switcher summary {
			transition: none;
		}
	}
</style>
