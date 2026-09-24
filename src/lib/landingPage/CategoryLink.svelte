<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { Spring } from './spring.js';

	/** @typedef {import('./icons/index.js').Shape} Shape */

	/** @type {{ href: string, label: string, shape: Shape }} */
	let { href, label, shape } = $props();

	let ready = $state(false);

	/**
	 * The uikit-expt card hover as deployed at uikit-expt.vercel.app (commit 6f34d27), in that card's
	 * pixels: the bracket box grows from inset 0 to -6, the label's black bar grows as its right edge
	 * springs from 100% to 0%, and the icon's ink switches to violet at once. What the icon itself
	 * does when lit is its own (see icons/).
	 * Values reach the DOM as CSS custom properties and the icon as a three.js redraw.
	 * @param {Shape} shape
	 */
	function hoverEffect(shape) {
		return (/** @type {HTMLAnchorElement} */ node) => {
			const canvas = /** @type {HTMLCanvasElement} */ (node.querySelector('canvas'));
			const inset = new Spring(0);
			/** Lit, the whole icon — brackets and drawing — doubles in size. */
			const zoom = new Spring(1);
			// The reference springs the bar's '100%' → '0%' as a string, which react-spring runs as a
			// 0→1 progress between the value it is at and the new goal, restarted on every retarget with
			// its (normalised) velocity kept, so a reversal turns straight round instead of coasting on.
			const wipe = { from: 100, to: 100, t: new Spring(1) };
			const wipeValue = () => wipe.from + (wipe.to - wipe.from) * wipe.t.value;
			let pointer = false;
			let focus = false;
			let lit = false;
			let frame = 0;
			let last = 0;
			let disposed = false;
			/** @type {ReturnType<typeof import('./icons/index.js').createIcon> | undefined} */
			let icon;
			let told = '';

			/** Paint the current state, advancing the icon by `dt` ms; true while the icon wants frames. */
			function draw(dt = 0) {
				node.style.setProperty('--inset', String(inset.value));
				node.style.setProperty('--zoom', String(zoom.value));
				node.style.setProperty('--pop', String(-inset.value));
				// While it is magnified, this link sits above the other two.
				node.style.zIndex = zoom.value > 1.001 ? '2' : '';
				// Tell the headline, which makes room for the card (see headlineFlow.js).
				const news = `${zoom.value} ${inset.value} ${wipeValue()}`;
				if (news !== told) {
					told = news;
					const detail = { zoom: zoom.value, pop: -inset.value, bar: 1 - wipeValue() / 100 };
					node.dispatchEvent(new CustomEvent('iconzoom', { bubbles: true, detail }));
				}
				node.style.setProperty('--wipe', String(wipeValue()));
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

			function update() {
				const on = pointer || focus;
				if (on === lit) return;
				lit = on;
				inset.to(on ? -6 : 0);
				zoom.to(on ? 2 : 1);
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
				if (!frame) {
					last = performance.now();
					frame = requestAnimationFrame(tick);
				}
			}

			// Touch fires pointerenter on press and pointerleave after release, so a tap plays the
			// effect while the finger is down and the click that follows navigates.
			const onenter = () => ((pointer = true), update());
			const onleave = () => ((pointer = false), update());
			const onfocus = () => ((focus = node.matches(':focus-visible')), update());
			const onblur = () => ((focus = false), update());
			node.addEventListener('pointerenter', onenter);
			node.addEventListener('pointerleave', onleave);
			node.addEventListener('focus', onfocus);
			node.addEventListener('blur', onblur);
			// From here the effect is the focus indicator; a link focused before hydration picks it up now.
			node.classList.add('enhanced');
			onfocus();

			// Also starts the loop if the icon arrives (or is resized) while the link is already lit.
			const redraw = () => {
				icon?.resize();
				if (!frame && draw()) {
					last = performance.now();
					frame = requestAnimationFrame(tick);
				}
			};
			const observer = new ResizeObserver(redraw);
			// Zoom or a move to a denser screen changes devicePixelRatio but not the canvas's CSS size.
			/** @type {MediaQueryList | undefined} */
			let density;
			const watchDensity = () => {
				density?.removeEventListener('change', ondensity);
				density = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
				density.addEventListener('change', ondensity);
			};
			const ondensity = () => (watchDensity(), redraw());
			watchDensity();
			// Turning reduced motion off while lit has to restart the icon's loop (and on, still it).
			const motion = matchMedia('(prefers-reduced-motion: reduce)');
			motion.addEventListener('change', redraw);
			// three restores a lost context but draws nothing until asked.
			canvas.addEventListener('webglcontextrestored', redraw);

			// three is loaded here, not at the top, so the landing's first paint ships no WebGL.
			import('./icons/index.js')
				.then(({ createIcon }) => {
					if (disposed) return;
					icon = createIcon(canvas, shape);
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
				cancelAnimationFrame(frame);
				observer.disconnect();
				density?.removeEventListener('change', ondensity);
				motion.removeEventListener('change', redraw);
				canvas.removeEventListener('webglcontextrestored', redraw);
				node.removeEventListener('pointerenter', onenter);
				node.removeEventListener('pointerleave', onleave);
				node.removeEventListener('focus', onfocus);
				node.removeEventListener('blur', onblur);
				node.classList.remove('enhanced');
				icon?.dispose();
				ready = false;
			};
		};
	}
</script>

<a class="category-link" {href} {@attach hoverEffect(shape)}>
	<span class="frame" aria-hidden="true">
		<span class="box"><span class="corners"><span></span><span></span><span></span><span></span></span></span>
		<canvas class={{ ready }}></canvas>
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
	}

	/* A plain ring until the effect is attached; then the effect is the indicator. Transparent, not
	   none, so forced-colors mode still draws it. */
	.category-link:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	.category-link:global(.enhanced):focus-visible {
		outline-color: transparent;
	}

	/* The frame holds the icon's place in the line; lit, what is drawn in it grows past it. */
	.frame {
		position: relative;
		display: inline-block;
		width: calc(var(--u) * 70);
		height: calc(var(--u) * 70);
		/* The frame is taller than a line: a little room above and below, so icons on consecutive
		   lines never touch bracket to bracket. */
		margin: 0.15em 0.5em 0.15em 0;
		vertical-align: middle;
	}

	/*
	 * Border and brackets, scaled as vectors when the icon doubles (the drawing zooms in three.js).
	 * As it grows it fills in white with a faint shadow, so the magnified icon reads as a card lifted
	 * over the sentence rather than lines drawn across its words.
	 */
	.box {
		--lift: calc(var(--zoom) - 1);
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		/* The reference's 25% #e5e5e5 composites to ~239 in its WebGL panel; this matches it on white. */
		border: calc(var(--u) * 1) solid rgb(229 229 229 / 0.62);
		background: rgb(255 255 255 / var(--lift));
		box-shadow: 0 calc(var(--u) * 6) calc(var(--u) * 18) rgb(0 0 0 / calc(var(--lift) * 0.08));
		transform: scale(var(--zoom));
	}

	.corners {
		position: absolute;
		inset: calc(var(--u) * var(--inset));
	}

	/*
	 * The reference's Corner: an 8px box holding a 2×8 bar and an 8×2 bar in a flex row. They
	 * overflow it, so yoga shrinks both by their share: a 1.6-wide upright and a 6.4-long arm, 8
	 * across in all. The box sits 1px out over the frame's border and is turned 0°, 90°, 180° or 270°
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

	/* The bar reaches 0.2em past the text (the reference's paddingX 4) without pushing the comma away. */
	.label {
		position: relative;
		display: inline-block;
		margin: 0 -0.2em;
		padding: 0 0.2em;
		/* The mockup's #7b7979 was 4.3:1 on white; this is the nearest grey that clears 4.5:1. */
		color: #737373;
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
