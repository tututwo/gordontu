<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import { devicePixelRatio } from 'svelte/reactivity/window';
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
	import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
	import CodeIcon from 'phosphor-svelte/lib/CodeIcon';
	import CrosshairSimpleIcon from 'phosphor-svelte/lib/CrosshairSimpleIcon';
	import HouseSimpleIcon from 'phosphor-svelte/lib/HouseSimpleIcon';
	import ListIcon from 'phosphor-svelte/lib/ListIcon';
	import MapTrifoldIcon from 'phosphor-svelte/lib/MapTrifoldIcon';
	import QuestionIcon from 'phosphor-svelte/lib/QuestionIcon';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
	import { allProjects, categories, categoryLabel, formatDate } from '$lib/project/project.js';
	import { WallMotion } from './wallMotion.js';
	import { Pan } from './pan.js';

	/** @typedef {import('$lib/project/project.js').Project} Project */

	/**
	 * `opened` is the postcard the URL opens (`/maps/<slug>`).
	 * @type {{ projects: Project[], category: (typeof categories)[number], opened?: Project | null }}
	 */
	let { projects, category, opened = null } = $props();

	const icons = { all: SquaresFourIcon, maps: MapTrifoldIcon, charts: ChartBarIcon, 'creative-code': CodeIcon };
	const categoryLinks = [allProjects, ...categories].map((section) => ({
		...section,
		Icon: icons[/** @type {keyof typeof icons} */ (section.slug)]
	}));

	let ready = $state(false);
	/** @type {Project | null} */
	let selected = $state.raw(null);
	/** Whether the open card shows its back: the face its flip is nearest. */
	let back = $state(false);
	/** @type {import('./scene.js').HeroBox} */
	let heroBox = $state.raw({ w: 0, h: 0, y: 0 });
	/** @type {HTMLCanvasElement | undefined} */
	let canvas = $state();
	/** @type {ReturnType<typeof import('./scene.js').createScene> | undefined} */
	let scene;

	const pan = new Pan({
		locked: () => selected !== null,
		reduced: () => prefersReducedMotion.current,
		limits: () => scene?.panLimits() ?? { x: 0, y: 0 },
		offset: () => scene?.viewOffset() ?? { x: 0, y: 0 },
		onchange: () => scene?.wake(),
		ontap: (event) => {
			const project = scene?.hitTest(event);
			if (project) open(project);
		}
	});
	/** Whether the press now ending began with a card open: then a click on the table around it closes it. */
	let closeOnClick = false;

	// The flip is the old landing wall's drag/spring controller: one card-width of drag is one
	// half-turn, release springs to the nearest face, keys and clicks come free.
	const flip = new WallMotion(
		() => heroBox.w || 1,
		(offset) => {
			scene?.setFlip(offset * Math.PI);
			back = Math.round(offset) % 2 !== 0;
		}
	);

	/**
	 * The scene, one per canvas. `projects` is read once three is in, untracked: the canvas is keyed by
	 * category, so a new list always comes with a new canvas, and opening a postcard (which changes the
	 * URL, and so the page's data) leaves the scene alone.
	 * @param {HTMLCanvasElement} node
	 */
	function gallery(node) {
		let disposed = false;
		/** @type {ReturnType<typeof import('./scene.js').createScene> | undefined} */
		let created;
		import('./scene.js').then(({ createScene }) => {
			if (disposed) return;
			created = createScene(node, projects, {
				pan,
				reduced: () => prefersReducedMotion.current,
				onready: () => {
					ready = true;
					if (opened) show(opened);
				},
				onheroresize: (box) => (heroBox = box)
			});
			scene = created;
		});
		return () => {
			disposed = true;
			created?.dispose();
			scene = undefined;
			ready = false;
			selected = null;
			pan.reset();
		};
	}

	// Moved to a screen of another density, the postcards redraw sharp on it. A browser zoom resizes the
	// canvas too, so there the scene follows a second time, a frame later; on the way in it isn't there yet.
	$effect(() => {
		devicePixelRatio.current;
		scene?.resize();
	});

	/** This gallery's URL, with `project`'s postcard open (`/maps/<slug>`) or none (`/maps`). @param {Project | null} project */
	const urlFor = (project) => resolve('/[category]/[[slug]]', { category: category.slug, slug: project?.slug });

	/** @param {Project} project */
	function show(project) {
		// The index and help go with the rest of the chrome, closed: in the top layer they wouldn't fade with it.
		for (const panel of document.querySelectorAll('.gallery [popover]')) /** @type {HTMLElement} */ (panel).togglePopover?.(false);
		if (!ready || !scene) return;
		selected = project;
		flip.reset();
		scene.open(project);
	}

	function hide() {
		selected = null;
		// The scene unwinds the card to its front on the way home; this only rewinds the controller.
		scene?.close();
		flip.reset();
		canvas?.focus({ preventScroll: true });
	}

	/**
	 * The URL follows the open postcard. Replaced, not pushed, so Back still leaves the gallery; the card
	 * doesn't wait for it, and before the postcards are in, the gallery opens what the URL names once they are.
	 * @param {Project | null} project
	 */
	const go = (project) => goto(urlFor(project), { replaceState: true, noScroll: true, keepFocus: true });

	/** @param {Project} project */
	function open(project) {
		show(project);
		go(project);
	}

	/** Keyboard users land on the flip target as soon as a card opens. @param {HTMLElement} node */
	const focusOnMount = (node) => node.focus({ preventScroll: true });

	function close() {
		if (!selected) return;
		hide();
		go(null);
	}

	function resetView() {
		pan.reset();
		canvas?.focus({ preventScroll: true });
	}

	/** @param {MouseEvent} event */
	function handleFlipClick(event) {
		// WallMotion cancels the click that follows a drag; honour that instead of double-flipping.
		if (!event.defaultPrevented) flip.moveBy(1);
	}

	/**
	 * A plain click on an index entry opens its postcard, as tapping the card does; a modified click
	 * follows the link, to the same open postcard in a new tab.
	 * @param {MouseEvent} event @param {Project} project
	 */
	function pick(event, project) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		open(project);
	}

	/** The rail's labels in the order of its buttons; `key` is a shortcut the gallery answers to. */
	const tips = [{ label: 'Home' }, ...categoryLinks.map(({ label }) => ({ label })), { label: 'Recenter', key: '0' }];

	/**
	 * One tooltip for the whole rail (docs/index-button.mp4): it fades in over the first button pointed
	 * at, then glides from button to button, taking each label's width as the labels slide past inside
	 * it like a strip, and fades out where it is when the pointer leaves.
	 */
	let tip = $state.raw({ x: 0, w: 0, offset: 0, shown: false, glide: false });
	/** @type {HTMLElement} */
	let tipStrip;

	/** @param {EventTarget | null} target */
	function showTip(target) {
		const button = target instanceof Element ? target.closest('.tool-button') : null;
		if (!(button instanceof HTMLElement)) return;
		const label = /** @type {HTMLElement} */ (tipStrip.children[Number(button.dataset.tip)]);
		tip = {
			x: button.offsetLeft + (button.offsetWidth - label.offsetWidth) / 2,
			w: label.offsetWidth,
			offset: label.offsetLeft,
			shown: true,
			glide: tip.shown && !prefersReducedMotion.current
		};
	}

	function hideTip() {
		if (tip.shown) tip = { ...tip, shown: false, glide: false };
	}
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && close()} />

<div class={['gallery', { open: selected !== null }]}>
	<!-- Keyed: a section switch disposes the WebGL context, and a lost context can't host a new renderer. -->
	{#key category.slug}
		<canvas
			bind:this={canvas}
			tabindex="0"
			aria-label="{category.label} postcards. Drag or use the arrow keys to move; scroll, pinch, or use plus and minus to zoom; press zero to recenter; tap a card to open it."
			onpointerdown={() => (closeOnClick = selected !== null)}
			onclick={() => closeOnClick && close()}
			{@attach gallery}
			{@attach pan.attach}
		></canvas>
	{/key}
	<h1 class="sr-only">{category.label}</h1>

	<div class={['intro', { ready }]} aria-hidden={ready}>
		<strong>{category.label}</strong>
		<p>{category.description}</p>
	</div>

	<!-- Tooltips follow a mouse or the keyboard; a finger taps straight through. -->
	<nav
		class="tool-rail frosted"
		aria-label="Gallery navigation"
		onpointerover={(event) => event.pointerType === 'mouse' && showTip(event.target)}
		onpointerleave={(event) => event.pointerType === 'mouse' && hideTip()}
		onfocusin={(event) => event.target instanceof Element && event.target.matches(':focus-visible') && showTip(event.target)}
		onfocusout={(event) => !event.currentTarget.contains(/** @type {Node | null} */ (event.relatedTarget)) && hideTip()}
	>
		<a class="tool-button" href={resolve('/')} aria-label="Home" data-tip="0">
			<HouseSimpleIcon size={20} weight="regular" aria-hidden="true" />
		</a>
		<span class="tool-divider" aria-hidden="true"></span>
		{#each categoryLinks as section, index (section.value)}
			<a
				class="tool-button"
				href={resolve('/[category]/[[slug]]', { category: section.slug })}
				aria-label={section.label}
				aria-current={section.slug === category.slug ? 'page' : undefined}
				data-tip={index + 1}
			>
				<section.Icon size={20} weight="regular" aria-hidden="true" />
			</a>
		{/each}
		<span class="tool-divider" aria-hidden="true"></span>
		<button
			class="tool-button"
			type="button"
			aria-label="Recenter the gallery"
			aria-keyshortcuts="0"
			data-tip={tips.length - 1}
			onclick={resetView}
		>
			<CrosshairSimpleIcon size={20} weight="regular" aria-hidden="true" />
		</button>
		<span
			class={['tip', { shown: tip.shown, glide: tip.glide }]}
			aria-hidden="true"
			style:width="{tip.w}px"
			style:translate="{tip.x}px 0"
		>
			<span class="tip-strip" bind:this={tipStrip} style:translate="{-tip.offset}px 0">
				{#each tips as { label, key }}<span>{label}{#if key}<kbd>{key}</kbd>{/if}</span>{/each}
			</span>
		</span>
	</nav>

	{#if selected}
		<div class="open" role="dialog" aria-labelledby="open-title">
			<button
				class="hero-hit"
				type="button"
				aria-label="Flip the postcard"
				style:top="calc(50% + {heroBox.y}px)"
				style:width="{heroBox.w}px"
				style:height="{heroBox.h}px"
				onclick={handleFlipClick}
				{@attach flip.attach}
				{@attach focusOnMount}
			></button>
			{#if back && heroBox.link}
				<!-- The back's Open project link is drawn on the card; this is the real one, laid over the words. -->
				<a
					class="back-link"
					href={selected.projectLink}
					target="_blank"
					rel="external noreferrer"
					draggable="false"
					style:left="calc(50% + {heroBox.link.x - heroBox.w / 2}px)"
					style:top="calc(50% + {heroBox.y - heroBox.h / 2 + heroBox.link.y}px)"
					style:width="{heroBox.link.w}px"
					style:height="{heroBox.link.h}px"
				><span class="sr-only">Open project</span></a>
			{/if}
			<!-- Everything else about the Project is on the back, so the caption points there. -->
			<div
				class="caption"
				style:top="calc(50% + {heroBox.y + heroBox.h / 2}px)"
				style:width="max({heroBox.w}px, min(20rem, 100vw - 2rem))"
			>
				<h2 id="open-title">{selected.projectName}</h2>
				<span class="year">{selected.date.slice(0, 4)}</span>
				<!-- The back, in words, for screen readers. -->
				<dl class="sr-only">
					<dt>Date</dt>
					<dd>{formatDate(selected.date)}</dd>
					<dt>Client</dt>
					<dd>{selected.client ?? 'Self-initiated'}</dd>
					<dt>Tools</dt>
					<dd>{selected.tools.join(', ')}</dd>
					<dt>Category</dt>
					<dd>{categoryLabel(selected.category)}</dd>
				</dl>
				<div class="actions">
					<button type="button" onclick={() => flip.moveBy(1)}>{back ? 'Flip to front' : 'Flip for details'}</button>
					<button type="button" onclick={close}>Close</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Keyed so it closes again after changing section (the component instance survives navigation). -->
	{#key category.slug}
	<div class="project-index bottom-chrome">
		<button class="frosted" type="button" popovertarget="project-index" aria-label="Open the project index">
			<ListIcon size={18} weight="regular" aria-hidden="true" />
			<span class="index-label">Project index</span>
			<span class="index-count">{projects.length}</span>
			<span class="index-caret">
				<CaretDownIcon size={14} weight="bold" aria-hidden="true" />
			</span>
		</button>
		<nav id="project-index" class="frosted" popover aria-label="{category.label} projects">
			<div class="index-heading">
				<strong>{category.label}</strong>
				<span>Select a postcard</span>
			</div>
			{#each projects as project, index (project.slug)}
				<a href={urlFor(project)} onclick={(event) => pick(event, project)}>
					<span>{String(index + 1).padStart(2, '0')}</span>
					<strong>{project.projectName}</strong>
					<span>{project.date.slice(0, 4)}</span>
				</a>
			{/each}
		</nav>
	</div>
	{/key}

	<div class="gallery-status bottom-chrome">
		<button class="help frosted" type="button" popovertarget="gallery-help" aria-label="How to use the gallery">
			<QuestionIcon size={18} weight="regular" aria-hidden="true" />
		</button>
		<div id="gallery-help" class="help-popover frosted" popover>
			<strong>Explore the canvas</strong>
			<p>Drag or use the arrow keys to move. Scroll, pinch, or use + / − to zoom.</p>
			<span>Press 0 or use Recenter to return home.</span>
			<span>Open a postcard to flip it and view the project.</span>
		</div>
	</div>

</div>

<style>
	/*
	 * The landing's page, type and greys (app.css), with one addition it has no need for: the floating
	 * controls, all of one material and one height, set one distance in from the window's edges, so
	 * the index, the rail and help line up along their tops and their bottoms.
	 */
	.gallery {
		--bar: 3rem;
		--edge: 1rem;
		/* How far up the index and help sit, and so where their panels open from. */
		--chrome-bottom: var(--edge);
		position: fixed;
		inset: 0;
		z-index: 1;
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
		/* Lifts the postcards off the white page, and gives a white chart an edge against it. */
		filter: drop-shadow(0 8px 18px rgb(0 0 0 / 0.12));
		outline: none;
	}

	canvas:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: -4px;
	}

	.frosted {
		border: 1px solid var(--hairline);
		background: rgb(255 255 255 / 0.82);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.06);
		backdrop-filter: blur(20px) saturate(1.8);
		-webkit-backdrop-filter: blur(20px) saturate(1.8);
	}

	.intro {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 0.75rem;
		text-align: center;
		pointer-events: none;
		transition: opacity 420ms var(--ease-out);
	}

	.intro.ready {
		opacity: 0;
	}

	.intro strong {
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 400;
		letter-spacing: -0.03em;
		line-height: 1.1;
	}

	.intro p {
		margin: 0;
		color: var(--muted-ink);
	}

	.tool-rail {
		position: absolute;
		z-index: 5;
		bottom: var(--edge);
		left: 50%;
		display: flex;
		align-items: center;
		gap: 0.125rem;
		height: var(--bar);
		padding: 0 calc(0.25rem - 1px);
		border-radius: 999px;
		transform: translateX(-50%);
		transition:
			opacity 180ms var(--ease-out),
			visibility 180ms;
	}

	.gallery.open .tool-rail {
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
	}

	/* Grey until pointed at, like the landing's nav; the current section white on black, like the bar
	   that wipes across a lit Category link. */
	.tool-button {
		display: grid;
		width: calc(var(--bar) - 0.5rem);
		height: calc(var(--bar) - 0.5rem);
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--muted-ink);
		text-decoration: none;
		cursor: pointer;
		transition:
			background 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	.tool-button[aria-current='page'] {
		background: var(--ink);
		color: #fff;
	}

	.tool-button:hover:not([aria-current='page']) {
		background: rgb(0 0 0 / 0.05);
		color: var(--ink);
	}

	.tool-divider {
		display: block;
		width: 1px;
		height: 1.25rem;
		margin: 0 0.1875rem;
		background: var(--hairline);
	}

	/*
	 * The rail's one tooltip. Every label sits on one strip, in the order of the buttons, seen through a
	 * window as wide as the current label: moving along the rail, the window glides over the next button
	 * and takes its label's width while the strip slides that label into it.
	 */
	.tip {
		position: absolute;
		bottom: calc(100% + 0.625rem);
		left: 0;
		overflow: hidden;
		border-radius: 0.375rem;
		background: var(--ink);
		color: #fff;
		font-size: 0.75rem;
		line-height: 1.3;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 150ms var(--ease-out);
	}

	.tip.shown {
		opacity: 1;
	}

	.tip.glide {
		transition:
			opacity 150ms var(--ease-out),
			translate 220ms var(--ease-out),
			width 220ms var(--ease-out);
	}

	.tip-strip {
		display: flex;
		width: max-content;
	}

	.tip.glide .tip-strip {
		transition: translate 220ms var(--ease-out);
	}

	.tip-strip > span {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.3125rem 0.5rem;
	}

	kbd {
		padding: 0 0.25rem;
		border: 1px solid rgb(255 255 255 / 0.3);
		border-radius: 0.25rem;
		font: inherit;
		font-size: 0.6875rem;
	}

	.hero-hit {
		position: absolute;
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
		outline: 2px solid var(--ink);
		outline-offset: 4px;
	}

	/* Under the open card and as wide, set like a landing Project card: the title with its year at the
	   right edge, then the flip, the way out at the far end. On paper, like the landing's growing white
	   card that hides the words under it: the faded postcards pass behind the words, not through them. */
	.caption {
		position: absolute;
		left: 50%;
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: baseline;
		column-gap: 1.25rem;
		margin-top: 1rem;
		background: var(--paper);
		box-shadow: 0 0 0.5rem 0.25rem var(--paper);
		translate: -50% 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.caption h2 {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		margin: 0;
		overflow: hidden;
		font-size: 1rem;
		font-weight: 400;
		line-height: 1.4;
	}

	.year {
		color: var(--muted-ink);
	}

	.actions {
		display: flex;
		grid-column: 1 / -1;
		justify-content: space-between;
		gap: 1.25rem;
		margin-top: 0.375rem;
	}

	/* Grey until pointed at, like the landing's links; padding grows the tap target to 44px without
	   moving the text. */
	.actions button {
		margin-block: -0.6875rem;
		padding: 0.6875rem 0;
		border: 0;
		background: none;
		color: var(--muted-ink);
		font: inherit;
		text-decoration: none;
		cursor: pointer;
		transition: color 160ms var(--ease-out);
	}

	.actions button:hover {
		color: var(--ink);
	}

	/* Exactly over the words drawn on the back, padded to a 44px target without moving; it lights like
	   an entry in the project index. */
	.back-link {
		position: absolute;
		box-sizing: content-box;
		margin: -0.8125rem -0.5rem;
		padding: 0.8125rem 0.5rem;
		border-radius: 0.5rem;
		transition: background 140ms ease;
	}

	.back-link:hover {
		background: rgb(0 0 0 / 0.05);
	}

	.back-link:active {
		background: rgb(0 0 0 / 0.1);
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
		left: var(--edge);
		bottom: var(--chrome-bottom);
	}

	.project-index > button {
		display: flex;
		height: var(--bar);
		align-items: center;
		gap: 0.625rem;
		padding: 0 1rem;
		border-radius: 999px;
		color: inherit;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.index-count,
	.index-caret {
		color: var(--muted-ink);
	}

	.index-caret {
		display: grid;
		place-items: center;
		transition: transform 180ms var(--ease-out);
	}

	.project-index:has(:popover-open) .index-caret {
		transform: rotate(180deg);
	}

	/* The panels open in the top layer, out of their buttons' boxes, so they are placed on the window:
	   a gap above the buttons, at the same edge. Closed, the browser hides them. */
	.project-index nav:popover-open {
		inset: auto auto calc(var(--chrome-bottom) + var(--bar) + 0.5rem) var(--edge);
		margin: 0;
		display: grid;
		width: min(24rem, calc(100vw - 2 * var(--edge)));
		max-height: min(62vh, 34rem);
		padding: 0.5rem;
		overflow: auto;
		border-radius: 1rem;
		overscroll-behavior: contain;
	}

	/* Headings in the landing's label type (its Project cards' "Client"). */
	.index-heading,
	.help-popover strong {
		color: var(--muted-ink);
		font-size: 0.6875rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		line-height: 1.6;
		text-transform: uppercase;
	}

	.index-heading {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0.625rem;
	}

	.index-heading strong {
		font-weight: inherit;
	}

	/* Number, title, and the year at the right edge, as on the landing's Project cards. */
	.project-index nav a {
		display: grid;
		grid-template-columns: 1.5rem 1fr auto;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.5625rem 0.625rem;
		border-radius: 0.5rem;
		color: var(--ink);
		font-size: 0.875rem;
		line-height: 1.4;
		text-decoration: none;
		transition: background 140ms ease;
	}

	.project-index nav a:hover {
		background: rgb(0 0 0 / 0.05);
	}

	.project-index nav a > span {
		color: var(--muted-ink);
		font-size: 0.75rem;
	}

	.project-index nav a > strong {
		font-weight: 400;
	}

	.gallery-status {
		position: absolute;
		right: var(--edge);
		bottom: var(--chrome-bottom);
	}

	.help {
		display: grid;
		width: var(--bar);
		height: var(--bar);
		place-items: center;
		padding: 0;
		border-radius: 50%;
		color: var(--muted-ink);
		cursor: pointer;
		transition: color 160ms var(--ease-out);
	}

	.help:hover,
	.gallery-status:has(:popover-open) .help {
		color: var(--ink);
	}

	.help-popover:popover-open {
		inset: auto var(--edge) calc(var(--chrome-bottom) + var(--bar) + 0.5rem) auto;
		margin: 0;
		display: grid;
		gap: 0.375rem;
		width: min(17rem, calc(100vw - 2 * var(--edge)));
		padding: 1rem;
		border-radius: 1rem;
	}

	.help-popover p,
	.help-popover span {
		margin: 0;
		color: var(--ink);
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	/* A browser from before popovers (Safari 16, Firefox 124) would stand both panels open over the
	   table, under buttons that do nothing: there the index and help stay away. */
	@supports not selector(:popover-open) {
		.project-index,
		.gallery-status {
			display: none;
		}
	}

	/* The landing's press and focus, on every control. */
	.tool-button:active,
	.project-index > button:active,
	.project-index nav a:active,
	.help:active,
	.actions button:active {
		opacity: 0.55;
	}

	.tool-button:focus-visible,
	.project-index > button:focus-visible,
	.project-index nav a:focus-visible,
	.help:focus-visible,
	.actions button:focus-visible,
	.back-link:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.intro,
		.tool-button,
		.index-caret,
		.help,
		.actions button,
		.back-link,
		.bottom-chrome {
			transition: none;
		}
	}

	/* Fingers: 44px controls (Apple's minimum), and the index shrinks to its icon. */
	@media (max-width: 840px) {
		.gallery {
			--bar: 2.75rem;
			--edge: 0.75rem;
			--chrome-bottom: calc(var(--edge) + env(safe-area-inset-bottom));
		}

		.intro {
			padding: 0 1rem;
		}

		.tool-rail {
			bottom: calc(var(--edge) + env(safe-area-inset-bottom));
			gap: 0;
		}

		.project-index > button {
			width: var(--bar);
			justify-content: center;
			padding: 0;
		}

		.index-label,
		.index-count,
		.index-caret {
			display: none;
		}
	}

	/* Narrower than this, the rail (238px) reaches the index and help buttons: they step up above it. */
	@media (max-width: 368px) {
		.gallery {
			--chrome-bottom: calc(var(--edge) * 2 + var(--bar) + env(safe-area-inset-bottom));
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		.frosted {
			background: #fff;
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}

	@media (prefers-contrast: more) {
		.frosted {
			border-color: var(--ink);
		}
	}
</style>
