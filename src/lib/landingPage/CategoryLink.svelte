<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import { Spring } from './spring.js';

	/** @typedef {import('./wireframeIcon.js').Shape} Shape */

	/** @type {{ href: string, label: string, shape: Shape }} */
	let { href, label, shape } = $props();

	let ready = $state(false);

	/** The reference spins the icon as a linear 5 s tween per turn: degrees per millisecond. */
	const SPIN = 360 / 5000;

	/**
	 * The uikit-expt card hover as deployed at uikit-expt.vercel.app (commit 6f34d27), in that card's
	 * pixels: the bracket box grows from inset 0
	 * to -6, the icon's padding springs from 12 to 6, the label's black bar grows as its right edge
	 * springs from 100% to 0%, the icon turns while lit and springs back to rest when released.
	 * Values reach the DOM as CSS custom properties and the icon as a three.js redraw.
	 * @param {Shape} shape
	 */
	function hoverEffect(shape) {
		return (/** @type {HTMLAnchorElement} */ node) => {
			const canvas = /** @type {HTMLCanvasElement} */ (node.querySelector('canvas'));
			const inset = new Spring(0);
			const pad = new Spring(12);
			const wipe = new Spring(100);
			const spin = new Spring(0);
			let pointer = false;
			let focus = false;
			let lit = false;
			let frame = 0;
			let last = 0;
			let disposed = false;
			/** @type {ReturnType<typeof import('./wireframeIcon.js').createWireframeIcon> | undefined} */
			let icon;

			function draw() {
				node.style.setProperty('--inset', String(inset.value));
				node.style.setProperty('--pad', String(pad.value));
				node.style.setProperty('--wipe', String(wipe.value));
				// 68 = the 70 frame inside its 1px border; the content box is that minus inset and padding.
				icon?.render({ angle: spin.value, inner: 68 - 2 * inset.value - 2 * pad.value, lit });
			}

			/** @param {number} now */
			function tick(now) {
				const dt = Math.max(0, Math.min(64, now - last));
				last = now;
				let moving = inset.advance(dt);
				moving = pad.advance(dt) || moving;
				moving = wipe.advance(dt) || moving;
				if (lit) {
					spin.value = (spin.value + dt * SPIN) % 360;
					spin.velocity = SPIN;
					moving = true;
				} else {
					moving = spin.advance(dt) || moving;
				}
				draw();
				frame = moving ? requestAnimationFrame(tick) : 0;
			}

			function update() {
				const on = pointer || focus;
				if (on === lit) return;
				lit = on;
				inset.to(on ? -6 : 0);
				pad.to(on ? 6 : 12);
				wipe.to(on ? 0 : 100);
				// Released, the turn springs back to 0 from wherever it got to, unwinding like the reference.
				if (!on) spin.to(0);
				if (prefersReducedMotion.current) {
					for (const spring of [inset, pad, wipe]) spring.set(spring.target);
					spin.set(0);
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

			const observer = new ResizeObserver(() => {
				icon?.resize();
				if (!frame) draw();
			});

			// three is loaded here, not at the top, so the landing's first paint ships no WebGL.
			import('./wireframeIcon.js')
				.then(({ createWireframeIcon }) => {
					if (disposed) return;
					icon = createWireframeIcon(canvas, shape);
					observer.observe(canvas);
					icon.resize();
					draw();
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
				node.removeEventListener('pointerenter', onenter);
				node.removeEventListener('pointerleave', onleave);
				node.removeEventListener('focus', onfocus);
				node.removeEventListener('blur', onblur);
				icon?.dispose();
				ready = false;
			};
		};
	}
</script>

<a class="category-link" {href} {@attach hoverEffect(shape)}>
	<span class="frame" aria-hidden="true">
		<span class="corners"><span></span><span></span><span></span><span></span></span>
		<canvas class={{ ready }}></canvas>
	</span><span class="label">{label}<span class="bar" aria-hidden="true">{label}</span></span>
</a>

<style>
	.category-link {
		/*
		 * One reference-card pixel. The deployed card declares an 88px frame, but its flex row squeezes
		 * it to 70 while brackets, padding and inset keep their sizes (measured on the live page: the
		 * brackets spread 12 units = 24 device px, on a 140 device px frame). 70 units = 1.75em here.
		 */
		--u: calc(1.75em / 70);
		--inset: 0;
		--pad: 12;
		--wipe: 100;
		color: inherit;
		text-decoration: none;
		white-space: nowrap;
		-webkit-tap-highlight-color: transparent;
	}

	.category-link:focus-visible {
		outline: none;
	}

	.frame {
		position: relative;
		display: inline-block;
		box-sizing: border-box;
		width: calc(var(--u) * 70);
		height: calc(var(--u) * 70);
		margin-right: 0.375em;
		border: calc(var(--u) * 1) solid rgb(229 229 229 / 0.25);
		vertical-align: middle;
	}

	.corners {
		position: absolute;
		inset: calc(var(--u) * var(--inset));
	}

	/*
	 * The reference's Corner: an 8px box holding a 2×8 bar and then an 8×2 bar in a flex row, so the
	 * second bar overhangs to 10px; the box sits 1px out over the frame's border and is turned 0°,
	 * 90°, 180° or 270° about its centre for each corner.
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
		width: calc(var(--u) * 2);
		height: 100%;
	}

	.corners span::after {
		left: calc(var(--u) * 2);
		width: 100%;
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

	/* Twice the frame, so a spinning icon can spill past its brackets as it does in the reference. */
	canvas {
		position: absolute;
		top: 50%;
		left: 50%;
		width: calc(var(--u) * 140);
		height: calc(var(--u) * 140);
		opacity: 0;
		pointer-events: none;
		transform: translate(-50%, -50%);
		transition: opacity 200ms var(--ease-out);
	}

	canvas.ready {
		opacity: 1;
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

	/* The black bar is a white-on-black copy of the label, revealed from the left. */
	.bar {
		position: absolute;
		inset: 0;
		padding: inherit;
		color: #fff;
		background: #000;
		clip-path: inset(0 calc(var(--wipe) * 1%) 0 0);
	}
</style>
