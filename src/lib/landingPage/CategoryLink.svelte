<script>
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { devicePixelRatio } from 'svelte/reactivity/window';
	import { Spring } from './spring.js';

	/** @typedef {import('./icons/index.js').Shape} Shape */

	/** @type {{ href: string, label: string, shape: Shape }} */
	let { href, label, shape } = $props();

	/** Lit, the icon grows to this many times its size, and its brackets pop out this far (card px). */
	const LIT_ZOOM = 1.2;
	const POP = 6;

	/*
	 * The uikit-expt card hover as deployed at uikit-expt.vercel.app (commit 6f34d27), in that card's
	 * pixels: the bracket box grows from inset 0 to -6, the label's black bar grows as its right edge
	 * springs from 100% to 0%. (The reference's ink turned violet; here it stays black.) What the icon
	 * itself does when lit is its own (see icons/). Values reach the DOM as CSS custom properties and
	 * the icon as a three.js redraw.
	 */
	const inset = new Spring(0);
	/** Lit, the whole icon — brackets and drawing — doubles in size. */
	const zoom = new Spring(1);
	// The reference springs the bar's '100%' → '0%' as a string, which react-spring runs as a
	// 0→1 progress between the value it is at and the new goal, restarted on every retarget with
	// its (normalised) velocity kept, so a reversal turns straight round instead of coasting on.
	const wipe = { from: 100, to: 100, t: new Spring(1) };
	const wipeValue = () => wipe.from + (wipe.to - wipe.from) * wipe.t.value;

	/**
	 * What lights it: a mouse over it, keyboard focus, or a tap. A finger cannot hover, so its first
	 * tap lights the link, a second one follows it, and a press anywhere else puts it out.
	 */
	let hovered = false;
	let focused = false;
	let tapped = false;
	/** Whether the last press on it was a finger's (or a pen's) rather than a mouse's. */
	let touch = false;
	let lit = false;
	let frame = 0;
	let last = 0;
	/** @type {ReturnType<typeof import('./icons/index.js').createIcon> | undefined} */
	let icon;
	let told = '';
	let ready = $state(false);
	let enhanced = $state(false);
	/** @type {HTMLAnchorElement} */
	let link;

	/** Paint the current state, advancing the icon by `dt` ms; true while the icon wants frames. */
	function draw(dt = 0) {
		link.style.setProperty('--inset', String(inset.value));
		link.style.setProperty('--zoom', String(zoom.value));
		link.style.setProperty('--pop', String(-inset.value));
		// While it is magnified, this link sits above the other two.
		link.style.zIndex = zoom.value > 1.001 ? '2' : '';
		// Tell the headline, which makes room for the card (see headlineFlow.js), and whether it is
		// on its way in or out.
		const news = `${zoom.value} ${inset.value} ${wipeValue()} ${lit}`;
		if (news !== told) {
			told = news;
			// `full` is the lit card's side in card px, so the headline plans for the size it will reach.
			const full = (70 + 2 * POP) * LIT_ZOOM;
			const detail = { zoom: zoom.value, pop: -inset.value, bar: 1 - wipeValue() / 100, on: lit, full };
			link.dispatchEvent(new CustomEvent('iconzoom', { bubbles: true, detail }));
		}
		link.style.setProperty('--wipe', String(wipeValue()));
		return icon?.frame(dt, { lit, zoom: zoom.value, reduced: prefersReducedMotion.current }) ?? false;
	}

	/** @param {number} now */
	function tick(now) {
		const dt = Math.max(0, Math.min(64, now - last));
		last = now;
		let moving = inset.advance(dt);
		moving = zoom.advance(dt) || moving;
		moving = wipe.t.advance(dt) || moving;
		moving = draw(dt) || moving;
		frame = moving ? requestAnimationFrame(tick) : 0;
	}

	function play() {
		if (frame) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	function update() {
		const on = hovered || focused || tapped;
		if (on === lit) return;
		lit = on;
		inset.to(on ? -POP : 0);
		zoom.to(on ? LIT_ZOOM : 1);
		wipe.from = wipeValue();
		wipe.to = on ? 0 : 100;
		const velocity = wipe.t.velocity;
		wipe.t.set(0);
		wipe.t.velocity = velocity;
		wipe.t.to(1);
		if (prefersReducedMotion.current) {
			for (const spring of [inset, zoom, wipe.t]) spring.set(spring.target);
			draw();
			return;
		}
		play();
	}

	// Also starts the loop if the icon arrives (or is resized) while the link is already lit.
	function redraw() {
		icon?.resize();
		if (!frame && draw()) play();
	}

	// Zoom or a move to a denser screen changes devicePixelRatio but not the canvas's CSS size, and
	// turning reduced motion off while lit has to restart the icon's loop (and on, still it).
	$effect(() => {
		devicePixelRatio.current;
		prefersReducedMotion.current;
		if (icon) redraw();
	});

	/** Only a mouse hovers: a finger sends pointerenter as it presses and pointerleave as it lifts. */
	/** @param {PointerEvent} event @param {boolean} on */
	function hover(event, on) {
		if (event.pointerType !== 'mouse') return;
		hovered = on;
		update();
	}

	/** A finger's first tap lights the link instead of following it; a keyboard's click (detail 0) follows it. */
	/** @param {MouseEvent} event */
	function tap(event) {
		if (!touch || !event.detail || tapped) return;
		event.preventDefault();
		tapped = true;
		update();
	}

	/** A press anywhere else puts a tapped link out. @param {PointerEvent} event */
	function away(event) {
		if (!tapped || link.contains(/** @type {Node} */ (event.target))) return;
		tapped = false;
		update();
	}

	/**
	 * From here the effect is the focus indicator; a link focused before hydration picks it up now.
	 * @param {HTMLAnchorElement} node
	 */
	function enhance(node) {
		link = node;
		enhanced = true;
		focused = node.matches(':focus-visible');
		untrack(update);
		return () => {
			enhanced = false;
			cancelAnimationFrame(frame);
			frame = 0;
		};
	}

	/**
	 * The icon, drawn into the canvas by three, which is loaded here rather than at the top so the
	 * landing's first paint ships no WebGL.
	 * @param {Shape} kind
	 */
	function mountIcon(kind) {
		return (/** @type {HTMLCanvasElement} */ canvas) => {
			let disposed = false;
			const observer = new ResizeObserver(redraw);
			// three restores a lost context but draws nothing until asked.
			canvas.addEventListener('webglcontextrestored', redraw);
			import('./icons/index.js')
				.then(({ createIcon }) => {
					if (disposed) return;
					icon = createIcon(canvas, kind);
					observer.observe(canvas);
					redraw();
					ready = true;
				})
				.catch((error) => {
					// No WebGL (or a broken chunk): the frame stays empty but the link still works.
					console.warn('Category link icon unavailable:', error);
				});
			return () => {
				disposed = true;
				observer.disconnect();
				canvas.removeEventListener('webglcontextrestored', redraw);
				icon?.dispose();
				icon = undefined;
				ready = false;
			};
		};
	}
</script>

<svelte:document onpointerdown={away} />

<a
	class={['category-link', { enhanced }]}
	{href}
	onpointerenter={(event) => hover(event, true)}
	onpointerleave={(event) => hover(event, false)}
	onpointerdown={(event) => (touch = event.pointerType !== 'mouse')}
	onclick={tap}
	onfocus={() => ((focused = link.matches(':focus-visible')), update())}
	onblur={() => ((focused = false), update())}
	{@attach enhance}
>
	<span class="frame" aria-hidden="true">
		<span class="box"><span class="corners"><span></span><span></span><span></span><span></span></span></span>
		<canvas class={{ ready }} {@attach mountIcon(shape)}></canvas>
	</span><span class="label">{label}<span class="bar" data-label={label} aria-hidden="true"></span></span>
</a>

<style>
	/* Inline-block so the headline can move it as one piece. */
	.category-link {
		position: relative;
		display: inline-block;
		/*
		 * One reference-card pixel. The deployed card declares an 88px frame, but its flex row squeezes
		 * it to 70 while brackets, padding and inset keep their sizes (measured on the live page: the
		 * brackets spread 12 units = 24 device px, on a 140 device px frame). 70 units = 2.625em here,
		 * half as big again as the mockup's 1.75em.
		 */
		--u: calc(2.625em / 70);
		--inset: 0;
		--pop: 0;
		--zoom: 1;
		--wipe: 100;
		color: inherit;
		text-decoration: none;
		white-space: nowrap;
		-webkit-tap-highlight-color: transparent;
		/* Two quick taps light it and follow it; they are not a double-tap zoom. */
		touch-action: manipulation;
	}

	/* A plain ring until the effect is attached; then the effect is the indicator. Transparent, not
	   none, so forced-colors mode still draws it. */
	.category-link:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	.category-link.enhanced:focus-visible {
		outline-color: transparent;
	}

	/* The frame holds the icon's place in the line; lit, what is drawn in it grows past it. */
	.frame {
		position: relative;
		display: inline-block;
		width: calc(var(--u) * 70);
		height: calc(var(--u) * 70);
		/* The frame is taller than a line of text. It overhangs its line rather than stretching it (its
		   box counts as 1em tall), so a line holding an icon is as tall as any other and the headline's
		   line-height alone sets its spacing. */
		margin: calc((1em - var(--u) * 70) / 2) 0.5em calc((1em - var(--u) * 70) / 2) 0;
		vertical-align: middle;
	}

	/*
	 * The brackets, scaled as vectors when the icon doubles (the drawing zooms in three.js). At rest
	 * the icon stands in the sentence on its own, drawn straight on the page; the brackets are the
	 * hover's, showing as they spring out and going as they spring back. As the card grows it fills in
	 * white, with no border or shadow, so it stays part of the page and still hides the words where it
	 * magnifies over them (a headline that cannot make room).
	 */
	.box {
		position: absolute;
		inset: 0;
		/* The page's own colour, so it only shows where it hides a letter sliding out from under it. */
		background: color-mix(in srgb, var(--paper, #fff) clamp(0%, calc((var(--zoom) - 1) * 2000%), 100%), transparent);
		transform: scale(var(--zoom));
	}

	.corners {
		position: absolute;
		inset: calc(var(--u) * var(--inset));
		opacity: clamp(0, calc(var(--pop) / 3), 1);
	}

	/*
	 * The reference's Corner: an 8px box holding a 2×8 bar and an 8×2 bar in a flex row. They
	 * overflow it, so yoga shrinks both by their share: a 1.6-wide upright and a 6.4-long arm, 8
	 * across in all. The box sits 1px out past the frame's edge and is turned 0°, 90°, 180° or 270°
	 * about its centre for each corner.
	 */
	.corners span {
		position: absolute;
		width: calc(var(--u) * 8);
		height: calc(var(--u) * 8);
	}

	.corners span::before,
	.corners span::after {
		position: absolute;
		top: 0;
		content: '';
		background: #000;
	}

	.corners span::before {
		left: 0;
		width: calc(var(--u) * 1.6);
		height: 100%;
	}

	.corners span::after {
		left: calc(var(--u) * 1.6);
		width: calc(var(--u) * 6.4);
		height: calc(var(--u) * 2);
	}

	.corners span:nth-child(1) {
		top: calc(var(--u) * -1);
		left: calc(var(--u) * -1);
	}

	.corners span:nth-child(2) {
		top: calc(var(--u) * -1);
		right: calc(var(--u) * -1);
		transform: rotate(90deg);
	}

	.corners span:nth-child(3) {
		right: calc(var(--u) * -1);
		bottom: calc(var(--u) * -1);
		transform: rotate(180deg);
	}

	.corners span:nth-child(4) {
		bottom: calc(var(--u) * -1);
		left: calc(var(--u) * -1);
		transform: rotate(-90deg);
	}

	/* Four times the frame: room for an open icon at double size to spill past its brackets. */
	canvas {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--u) * 280);
		height: calc(var(--u) * 280);
		opacity: 0;
		pointer-events: none;
		transform: translate(-50%, -50%);
		transition: opacity 200ms var(--ease-out);
	}

	canvas.ready {
		opacity: 1;
	}

	/*
	 * In a headline that makes room (it carries data-flow), the icon grows from its top-left corner,
	 * right and down, brackets included, so the words before it can stay where they are; the drawing
	 * stays centred on the card, and the label moves right as the card widens. Without it, the icon
	 * grows about its centre, over the words.
	 */
	:global([data-flow]) .box {
		transform-origin: 0 0;
		transform: translate(calc(var(--pop) * var(--zoom) * var(--u)), calc(var(--pop) * var(--zoom) * var(--u)))
			scale(var(--zoom));
	}

	:global([data-flow]) canvas {
		--shift: calc(((70 + 2 * var(--pop)) * var(--zoom) / 2 - 35) * var(--u));
		transform: translate(-50%, -50%) translate(var(--shift), var(--shift));
	}

	:global([data-flow]) .label {
		transform: translateX(calc(((70 + 2 * var(--pop)) * var(--zoom) - 70) * var(--u)));
	}

	/* The black bar reaches `--bar` past the text either side; the negative margin gives that room back,
	   so the name and the comma after it sit exactly where plain text would. */
	.label {
		--bar: 0.1em;
		position: relative;
		display: inline-block;
		margin: 0 calc(-1 * var(--bar));
		padding: 0 var(--bar);
		font-weight: 400;
		line-height: 1.3;
	}

	/* The black bar is a white-on-black copy of the label, revealed from the left. The copy is
	   generated content so find-in-page and copy see the name once. */
	.bar {
		position: absolute;
		inset: 0;
		padding: inherit;
		color: #fff;
		background: #000;
		clip-path: inset(0 calc(var(--wipe) * 1%) 0 0);
	}

	.bar::before {
		content: attr(data-label);
	}
</style>
