<script>
	import { resolve } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
	import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
	import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
	import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
	import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
	import CodeIcon from 'phosphor-svelte/lib/CodeIcon';
	import CompassIcon from 'phosphor-svelte/lib/CompassIcon';
	import CrosshairSimpleIcon from 'phosphor-svelte/lib/CrosshairSimpleIcon';
	import HandPalmIcon from 'phosphor-svelte/lib/HandPalmIcon';
	import HouseSimpleIcon from 'phosphor-svelte/lib/HouseSimpleIcon';
	import ListIcon from 'phosphor-svelte/lib/ListIcon';
	import MapTrifoldIcon from 'phosphor-svelte/lib/MapTrifoldIcon';
	import QuestionIcon from 'phosphor-svelte/lib/QuestionIcon';
	import { categories } from '$lib/project/project.js';
	import { WallMotion } from '$lib/landingPage/wallMotion.svelte.js';
	import { Pan } from './pan.js';

	/** @typedef {import('$lib/project/project.js').Project} Project */

	/** @type {{ projects: Project[], category: (typeof categories)[number] }} */
	let { projects, category } = $props();

	const PAN_STEP = 160;
	const categoryLinks = categories.map((section) => ({
		...section,
		Icon:
			section.slug === 'charts'
				? ChartBarIcon
				: section.slug === 'maps'
					? MapTrifoldIcon
					: CodeIcon
	}));

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

	function resetView() {
		pan.stop();
		pan.x = 0;
		pan.y = 0;
		scene?.wake();
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

	<header class="gallery-header">
		<a class="home-button" href={resolve('/')} aria-label="Back to the portfolio">
			<ArrowLeftIcon size={18} weight="bold" aria-hidden="true" />
		</a>
		<div class="header-copy">
			<span>Gordon Tu · Portfolio</span>
			<h1>{category.label}</h1>
			<small>{projects.length} projects on the canvas</small>
		</div>
	</header>

	<div class={['intro', { ready }]} aria-hidden={ready}>
		<strong>{category.label}</strong>
		<p>{category.description}</p>
	</div>

	<nav class="tool-rail" aria-label="Gallery navigation">
		<a class="tool-button" href={resolve('/')} aria-label="Home">
			<HouseSimpleIcon size={20} weight="regular" aria-hidden="true" />
			<span class="tooltip">Home</span>
		</a>
		<span class="tool-divider" aria-hidden="true"></span>
		{#each categoryLinks as section (section.value)}
			{@const Icon = section.Icon}
			<a
				class="tool-button"
				href={resolve('/[category]', { category: section.slug })}
				aria-label={section.label}
				aria-current={section.slug === category.slug ? 'page' : undefined}
			>
				<Icon size={20} weight="regular" aria-hidden="true" />
				<span class="tooltip">{section.label}</span>
			</a>
		{/each}
		<span class="tool-divider" aria-hidden="true"></span>
		<button class="tool-button" type="button" aria-label="Recenter the gallery" onclick={resetView}>
			<CrosshairSimpleIcon size={20} weight="regular" aria-hidden="true" />
			<span class="tooltip">Recenter</span>
		</button>
	</nav>

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

	<!-- Keyed so it closes again after changing section (the component instance survives navigation). -->
	{#key category.slug}
	<details class="project-index bottom-chrome">
		<summary aria-label="Open the project index">
			<ListIcon size={18} weight="regular" aria-hidden="true" />
			<span class="summary-label">Project index</span>
			<span class="summary-count">{projects.length}</span>
			<span class="index-caret">
				<CaretDownIcon size={15} weight="bold" aria-hidden="true" />
			</span>
		</summary>
		<nav aria-label="{category.label} projects">
			<div class="index-heading">
				<strong>{category.label}</strong>
				<span>Select a postcard</span>
			</div>
			{#each projects as project, index (project.slug)}
				<a
					href={resolve('/[category]/[slug]', {
						category: category.slug,
						slug: project.slug
					})}
				>
					<span>{String(index + 1).padStart(2, '0')}</span>
					<strong>{project.projectName}</strong>
				</a>
			{/each}
		</nav>
	</details>
	{/key}

	<div class="pan-dock bottom-chrome" role="toolbar" aria-label="Move the gallery">
		<span class="pan-mode">
			<span class="pan-mode-icon">
				<HandPalmIcon size={19} weight="regular" aria-hidden="true" />
			</span>
			<span>Move</span>
		</span>
		<span class="pan-divider" aria-hidden="true"></span>
		<button type="button" aria-label="Move left" onclick={() => pan.nudge(PAN_STEP, 0)}>
			<ArrowLeftIcon size={17} weight="bold" aria-hidden="true" />
		</button>
		<button type="button" aria-label="Move up" onclick={() => pan.nudge(0, PAN_STEP)}>
			<ArrowUpIcon size={17} weight="bold" aria-hidden="true" />
		</button>
		<button type="button" aria-label="Move down" onclick={() => pan.nudge(0, -PAN_STEP)}>
			<ArrowDownIcon size={17} weight="bold" aria-hidden="true" />
		</button>
		<button type="button" aria-label="Move right" onclick={() => pan.nudge(-PAN_STEP, 0)}>
			<ArrowRightIcon size={17} weight="bold" aria-hidden="true" />
		</button>
	</div>

	<div class="gallery-status bottom-chrome">
		<span class="status-pill">
			<CompassIcon size={17} weight="regular" aria-hidden="true" />
			{projects.length} projects
		</span>
		<details class="help">
			<summary aria-label="How to use the gallery">
				<QuestionIcon size={18} weight="bold" aria-hidden="true" />
			</summary>
			<div class="help-popover">
				<strong>Explore the canvas</strong>
				<p>Drag, scroll, use the arrow keys, or tap the move controls.</p>
				<span>Open a postcard to flip it and view the project.</span>
			</div>
		</details>
	</div>

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
		filter: drop-shadow(0 18px 18px rgb(49 42 35 / 0.16));
		outline: none;
	}

	canvas:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -4px;
	}

	.gallery-header,
	.tool-rail,
	.project-index summary,
	.project-index nav,
	.pan-dock,
	.status-pill,
	.help summary,
	.help-popover {
		border: 1px solid color-mix(in srgb, var(--hairline) 82%, transparent);
		background: color-mix(in srgb, var(--surface-solid) 84%, transparent);
		box-shadow:
			0 14px 38px color-mix(in srgb, var(--shadow-soft) 86%, transparent),
			inset 0 1px rgb(255 255 255 / 0.72);
		backdrop-filter: blur(18px) saturate(1.12);
		-webkit-backdrop-filter: blur(18px) saturate(1.12);
	}

	.gallery-header {
		position: absolute;
		z-index: 5;
		top: clamp(1rem, 2.3vh, 1.35rem);
		left: clamp(1rem, 1.7vw, 1.5rem);
		display: flex;
		width: min(18rem, calc(100vw - 6rem));
		align-items: flex-start;
		gap: 0.8rem;
		padding: 0.85rem;
		border-radius: 1.35rem;
	}

	.home-button {
		display: grid;
		width: 2.45rem;
		height: 2rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 999px;
		background: var(--ink);
		color: var(--surface-solid);
		text-decoration: none;
	}

	.header-copy {
		display: grid;
		min-width: 0;
		gap: 0.12rem;
	}

	.header-copy > span {
		color: var(--muted-ink);
		font-size: 0.66rem;
		font-weight: 590;
		letter-spacing: 0.09em;
		line-height: 1.25;
		text-transform: uppercase;
	}

	.header-copy h1 {
		margin: 0.08rem 0 0;
		font-family: var(--font-display);
		font-size: 1.55rem;
		font-weight: 540;
		letter-spacing: -0.035em;
		line-height: 1;
	}

	.header-copy small {
		color: var(--muted-ink);
		font-size: 0.72rem;
		line-height: 1.3;
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

	.intro strong {
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

	.tool-rail {
		position: absolute;
		z-index: 5;
		top: 50%;
		right: clamp(0.8rem, 1.45vw, 1.3rem);
		display: grid;
		justify-items: center;
		gap: 0.16rem;
		padding: 0.36rem;
		border-radius: 999px;
		transform: translateY(-50%);
		transition:
			opacity 180ms var(--ease-out),
			visibility 180ms;
	}

	.gallery.open .tool-rail {
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
	}

	.tool-button {
		position: relative;
		display: grid;
		width: 2.55rem;
		height: 2.55rem;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--ink);
		text-decoration: none;
		cursor: pointer;
		transition:
			background 160ms var(--ease-out),
			color 160ms var(--ease-out),
			transform var(--press-out-duration) var(--ease-out);
	}

	.tool-button[aria-current='page'] {
		background: var(--ink);
		box-shadow: 0 5px 13px rgb(30 24 38 / 0.2);
		color: var(--surface-solid);
	}

	.tool-button:hover:not([aria-current='page']) {
		background: color-mix(in srgb, var(--ink) 8%, transparent);
	}

	.tool-button:active {
		transform: scale(0.93);
		transition-duration: var(--press-in-duration);
	}

	.tool-divider {
		display: block;
		width: 1.4rem;
		height: 1px;
		margin: 0.18rem 0;
		background: var(--hairline);
	}

	.tooltip {
		position: absolute;
		top: 50%;
		right: calc(100% + 0.68rem);
		width: max-content;
		padding: 0.34rem 0.52rem;
		border-radius: 0.55rem;
		background: var(--ink);
		box-shadow: 0 5px 16px rgb(30 24 38 / 0.18);
		color: var(--surface-solid);
		font-size: 0.69rem;
		font-weight: 590;
		opacity: 0;
		transform: translate(0.25rem, -50%);
		transition:
			opacity 130ms ease,
			transform 130ms ease;
		pointer-events: none;
	}

	.tool-button:hover .tooltip,
	.tool-button:focus-visible .tooltip {
		opacity: 1;
		transform: translate(0, -50%);
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

	.bottom-chrome {
		z-index: 5;
		transition:
			opacity 180ms var(--ease-out),
			visibility 180ms;
	}

	.gallery.open .bottom-chrome {
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
	}

	.project-index {
		position: absolute;
		left: clamp(0.8rem, 1.45vw, 1.3rem);
		bottom: clamp(0.8rem, 1.8vh, 1.1rem);
	}

	.project-index summary {
		display: flex;
		width: 17.5rem;
		height: 3.45rem;
		align-items: center;
		gap: 0.65rem;
		padding: 0 0.9rem;
		border-radius: 1.2rem;
		color: var(--ink);
		cursor: pointer;
		list-style: none;
		transition: transform var(--press-out-duration) var(--ease-out);
	}

	.project-index summary::-webkit-details-marker,
	.help summary::-webkit-details-marker {
		display: none;
	}

	.project-index summary:active {
		transform: scale(0.975);
	}

	.summary-label {
		flex: 1;
		font-size: 0.84rem;
		font-weight: 610;
	}

	.summary-count {
		display: grid;
		min-width: 1.65rem;
		height: 1.65rem;
		place-items: center;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 7%, transparent);
		color: var(--muted-ink);
		font-size: 0.69rem;
		font-weight: 650;
	}

	.index-caret {
		display: grid;
		place-items: center;
		transition: transform 180ms var(--ease-out);
	}

	.project-index[open] .index-caret {
		transform: rotate(180deg);
	}

	.project-index nav {
		position: absolute;
		left: 0;
		bottom: calc(100% + 0.7rem);
		display: grid;
		gap: 0.12rem;
		width: min(24rem, calc(100vw - 2rem));
		max-height: min(62vh, 34rem);
		padding: 0.7rem;
		overflow: auto;
		border-radius: 1.15rem;
		overscroll-behavior: contain;
	}

	.index-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.35rem 0.45rem 0.65rem;
	}

	.index-heading strong {
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 540;
		letter-spacing: -0.025em;
	}

	.index-heading span {
		color: var(--muted-ink);
		font-size: 0.7rem;
	}

	.project-index nav a {
		display: grid;
		grid-template-columns: 1.7rem 1fr;
		align-items: start;
		gap: 0.55rem;
		padding: 0.55rem 0.45rem;
		border-radius: 0.7rem;
		color: var(--ink);
		text-decoration: none;
		transition: background 140ms ease;
	}

	.project-index nav a:hover {
		background: color-mix(in srgb, var(--ink) 7%, transparent);
	}

	.project-index nav a > span {
		padding-top: 0.08rem;
		color: var(--muted-ink);
		font-size: 0.64rem;
		font-weight: 600;
		letter-spacing: 0.08em;
	}

	.project-index nav a > strong {
		font-family: var(--font-hand);
		font-size: 0.88rem;
		font-weight: 490;
		line-height: 1.35;
	}

	.pan-dock {
		position: absolute;
		left: 50%;
		bottom: clamp(0.8rem, 1.8vh, 1.1rem);
		display: flex;
		align-items: center;
		gap: 0.12rem;
		padding: 0.36rem;
		border-radius: 999px;
		transform: translateX(-50%);
	}

	.pan-mode {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding-right: 0.45rem;
		font-size: 0.78rem;
		font-weight: 620;
	}

	.pan-mode-icon {
		display: grid;
		width: 2.45rem;
		height: 2.45rem;
		place-items: center;
		border-radius: 50%;
		background: var(--ink);
		box-shadow: 0 5px 13px rgb(30 24 38 / 0.2);
		color: var(--surface-solid);
	}

	.pan-divider {
		width: 1px;
		height: 1.5rem;
		margin: 0 0.2rem;
		background: var(--hairline);
	}

	.pan-dock button {
		display: grid;
		width: 2.15rem;
		height: 2.15rem;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		transition:
			background 140ms ease,
			transform var(--press-out-duration) var(--ease-out);
	}

	.pan-dock button:hover {
		background: color-mix(in srgb, var(--ink) 8%, transparent);
	}

	.pan-dock button:active {
		transform: scale(0.9);
		transition-duration: var(--press-in-duration);
	}

	.gallery-status {
		position: absolute;
		right: clamp(0.8rem, 1.45vw, 1.3rem);
		bottom: clamp(0.8rem, 1.8vh, 1.1rem);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-pill {
		display: flex;
		height: 2.55rem;
		align-items: center;
		gap: 0.42rem;
		padding: 0 0.8rem;
		border-radius: 999px;
		color: var(--muted-ink);
		font-size: 0.72rem;
		font-weight: 590;
	}

	.help {
		position: relative;
	}

	.help summary {
		display: grid;
		width: 2.55rem;
		height: 2.55rem;
		place-items: center;
		border-radius: 50%;
		color: var(--ink);
		cursor: pointer;
		list-style: none;
		transition: transform var(--press-out-duration) var(--ease-out);
	}

	.help summary:active {
		transform: scale(0.94);
	}

	.help-popover {
		position: absolute;
		right: 0;
		bottom: calc(100% + 0.7rem);
		display: grid;
		gap: 0.45rem;
		width: min(17rem, calc(100vw - 2rem));
		padding: 0.9rem 1rem;
		border-radius: 1rem;
	}

	.help-popover strong {
		font-family: var(--font-display);
		font-size: 1.08rem;
		font-weight: 550;
		letter-spacing: -0.02em;
	}

	.help-popover p,
	.help-popover span {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.74rem;
		line-height: 1.45;
	}

	.gallery-header a:focus-visible,
	.tool-button:focus-visible,
	.project-index summary:focus-visible,
	.project-index nav a:focus-visible,
	.pan-dock button:focus-visible,
	.help summary:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.intro,
		.tool-button,
		.tooltip,
		.project-index summary,
		.index-caret,
		.pan-dock button,
		.help summary,
		.bottom-chrome {
			transition: none;
		}
	}

	@media (max-width: 840px) {
		.gallery-header {
			top: 0.75rem;
			left: 0.75rem;
			width: min(15rem, calc(100vw - 4.75rem));
			gap: 0.65rem;
			padding: 0.7rem;
			border-radius: 1.15rem;
		}

		.home-button {
			width: 2.25rem;
			height: 1.9rem;
		}

		.header-copy h1 {
			font-size: 1.35rem;
		}

		.header-copy small {
			display: none;
		}

		.intro {
			padding: 0 4.5rem 0 1rem;
		}

		.intro strong {
			font-size: clamp(2.35rem, 11vw, 3rem);
		}

		.intro p {
			font-size: 0.86rem;
		}

		.tool-rail {
			right: 0.7rem;
			gap: 0.05rem;
			padding: 0.28rem;
		}

		.tool-button {
			width: 2.35rem;
			height: 2.35rem;
		}

		.tooltip {
			display: none;
		}

		.project-index {
			left: 0.75rem;
			bottom: calc(0.75rem + env(safe-area-inset-bottom));
		}

		.project-index summary {
			width: 3rem;
			height: 3rem;
			justify-content: center;
			padding: 0;
			border-radius: 1rem;
		}

		.summary-label,
		.summary-count,
		.index-caret {
			display: none;
		}

		.project-index nav {
			width: calc(100vw - 1.5rem);
			max-height: min(58vh, 30rem);
		}

		.pan-dock {
			bottom: calc(0.75rem + env(safe-area-inset-bottom));
			gap: 0.05rem;
			padding: 0.25rem;
		}

		.pan-mode {
			gap: 0;
			padding: 0;
		}

		.pan-mode > span:last-child,
		.pan-divider {
			display: none;
		}

		.pan-mode-icon {
			width: 2.25rem;
			height: 2.25rem;
		}

		.pan-dock button {
			width: 2rem;
			height: 2rem;
		}

		.gallery-status {
			right: 0.75rem;
			bottom: calc(0.75rem + env(safe-area-inset-bottom));
		}

		.status-pill {
			display: none;
		}

		.help summary {
			width: 3rem;
			height: 3rem;
			border-radius: 1rem;
		}
	}

	@media (max-height: 420px) {
		.gallery-status {
			display: none;
		}

		.gallery.open .gallery-header {
			display: none;
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		.gallery-header,
		.tool-rail,
		.project-index summary,
		.project-index nav,
		.pan-dock,
		.status-pill,
		.help summary,
		.help-popover {
			background: var(--surface-solid);
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}

	@media (prefers-contrast: more) {
		.gallery-header,
		.tool-rail,
		.project-index summary,
		.project-index nav,
		.pan-dock,
		.status-pill,
		.help summary,
		.help-popover {
			border-color: var(--ink);
		}
	}
</style>
