<script module>
	/**
	 * What the glasses and the bio's afterword (About.svelte) tell each other: the lenses while the
	 * glasses are off the face, as circles in viewport pixels (empty while they are on), and whether
	 * they are held; and the words the lenses read, which the face watches for them to reach.
	 * @type {{ circles: { x: number, y: number, r: number }[], held: boolean, text: HTMLElement | null }}
	 */
	export const lenses = $state({ circles: [], held: false, text: null });

	/** Whether a lens is over any of an element's line boxes. @param {Element} element */
	export const under = (element) =>
		[...element.getClientRects()].some((box) =>
			lenses.circles.some(({ x, y, r }) => Math.hypot(x - Math.max(box.left, Math.min(x, box.right)), y - Math.max(box.top, Math.min(y, box.bottom))) < r)
		);

	/** The nudge the afterword gives anyone curious about it; the avatar on the page sets it (see `nudging`). */
	export const hint = { peek() {} };
</script>

<script>
	import { gsap } from 'gsap';
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	import { devicePixelRatio } from 'svelte/reactivity/window';
	// The avatar in two layers, split from static/landing/avatar.png: the drawing without its glasses,
	// and the glasses, which over it rebuild the drawing (and are small enough for Vite to inline, so
	// they are never late onto the face). Once WebGL is in, a canvas draws the face instead, bending
	// it into the poses drawn for it, looking up and looking down (see avatarMorph.js).
	import face from './face.png';
	import glassesImage from './glasses.png';
	import lookingDown from './looking-down.webp';
	import lookingUp from './looking-up.webp';

	/**
	 * Pressed, the glasses come off to here, in avatar sides from where they sit: up and away from the
	 * face, as in the sketch, turned this many degrees. Then the pointer carries them until let go.
	 */
	const OFF = { x: 1, y: -0.2, turn: -12 };
	/** The head turns to follow them: its features slide up to this far sideways, in avatar sides. */
	const TURN = 0.045;
	/** Off the face they come this many times bigger, as if held up to you: big enough to read through. */
	const ZOOM = 3;
	/**
	 * Their close-up, drawn in line over the drawing's own glasses, in its 134 px: the lenses' centres,
	 * the rims' radius and weight, and the bridge, which they grow and turn about.
	 */
	const LENSES = [
		[50.2, 59.3],
		[81.8, 57.4]
	];
	const RIM = 10.4;
	const STROKE = 0.7;
	const BRIDGE = [66, 57.6];

	// A little loose, so they settle back on with a small wobble.
	const glasses = new Spring({ x: 0, y: 0 }, { stiffness: 0.1, damping: 0.45, precision: 0.001 });
	/** They come off towards the roomier side of the window, so they stay on screen. */
	let side = $state(1);
	/**
	 * Carried this far from where they came off (in avatar sides), the glasses have come round from the
	 * side to sit this far above the pointer, or further above a finger, which is broader: clear of it,
	 * and able to reach both ends of a line.
	 */
	const CARRY = { reach: 1.5, above: 0.7, aboveFinger: 1.1 };
	/**
	 * Where the pointer took hold (`y` on the page, `from` in the window), where it is now (`at`, in
	 * the window), so the glasses stay with it when the page scrolls under it, and where the glasses sit
	 * once carried (`near`, from where they rest on the face).
	 * @type {{ x: number, y: number, from: number, size: number, at: { clientX: number, clientY: number }, near: { x: number, y: number } } | null}
	 */
	let grab = null;
	/** Held this near the top or bottom of the window, they scroll the page on (px). */
	const EDGE = 64;

	/** How far off the face they are, 0–1: they turn and grow as they go, and the face starts. */
	const off = $derived(Math.min(1, Math.hypot(glasses.current.x, glasses.current.y) / Math.hypot(OFF.x, OFF.y)));
	// Held where they came off to, they hang at an angle; carried half a side from there (to read
	// through), they level out, so both lenses sit on the same line.
	const carried = $derived(Math.hypot(glasses.current.x - side * OFF.x, glasses.current.y - OFF.y));
	const tilt = $derived(off * OFF.turn * side * Math.max(0, 1 - carried * 2));
	const zoom = $derived(1 + (ZOOM - 1) * off);
	/** Which way the head faces, -1–1: towards the side the glasses are on, fully once they are off. */
	const look = $derived(Math.max(-1, Math.min(1, glasses.current.x / OFF.x)));

	/**
	 * With the glasses in hand, the head looks up at the pointer, or down, when it is above or below it:
	 * within this many degrees of straight up, or down, from the head's centre (in avatar sides from
	 * the top left), and further from it than `r`.
	 */
	const PLUMB = 75;
	const HEAD = { x: 0.48, y: 0.37, r: 0.25 };
	/**
	 * Where the start by the hair moves to as the head looks down, in avatar sides: to where the
	 * drawing looking down has its own (painted out of it, so the start can turn to alarm there too).
	 */
	const STARTLED_DOWN = { x: 0.0302, y: 0.2295 };
	/**
	 * The start: three strokes by the hair, as in the sketch, [lower end, upper end] in the drawing's
	 * 134 px. Alarmed, each stands up into an exclamation mark: a stem at `x` from `top` to `bottom`,
	 * and a dot below it at `dot`. A mark is drawn upright and, at rest, turned, shortened and moved
	 * onto its stroke.
	 */
	const STROKES = [
		[[101.9, 21.3], [105.2, 15.1]],
		[[104.7, 23.6], [110, 19.1]],
		[[106.9, 28.4], [113.8, 27.3]]
	];
	const MARK = { x: [101.6, 107.2, 112.8], top: 11.5, bottom: 21.5, dot: 25.5 };
	const MARKS = STROKES.map(([[x0, y0], [x1, y1]], i) => ({
		x: MARK.x[i],
		dx: (x0 + x1) / 2 - MARK.x[i],
		dy: (y0 + y1) / 2 - (MARK.top + MARK.bottom) / 2,
		turn: (Math.atan2(x1 - x0, y0 - y1) * 180) / Math.PI,
		length: Math.hypot(x1 - x0, y1 - y0) / (MARK.bottom - MARK.top)
	}));
	/** -1 looking up, 1 looking down; unhurried, like a head. */
	const pitch = new Spring(0, { stiffness: 0.08, damping: 0.6 });
	let morph = $state.raw(/** @type {ReturnType<typeof import('./avatarMorph.js').createMorph> | null} */ (null));
	/** The canvas's side, in CSS px. */
	let size = $state(0);
	const pose = $derived({ up: Math.max(0, -pitch.current), down: Math.max(0, pitch.current), turn: look * TURN });
	// Worn, the glasses go where the face takes them; taken off, they leave the face's pose behind.
	const worn = $derived(
		morph?.glasses({ up: pose.up * (1 - off), down: pose.down * (1 - off), turn: 0 }, [BRIDGE[0] / 134, BRIDGE[1] / 134]) ?? ''
	);

	/** A lens over the scrambled afterword's words: he is being read, and the start turns to alarm. */
	const reading = $derived(!!lenses.text && under(lenses.text));
	/** Whether a finger holds the glasses: on a phone he is alarmed as soon as he looks down after them. */
	let finger = $state(false);
	const alarmed = $derived(reading || (finger && pose.down > 0.6));

	$effect(() => morph?.draw(pose, Math.round(size * (devicePixelRatio.current ?? 1))));

	/**
	 * The poses load after the page, as the Category link icons' three.js does, so the first paint ships
	 * no WebGL; until they are in, or without WebGL, the head stays as drawn.
	 * @param {HTMLCanvasElement} canvas
	 */
	function morphing(canvas) {
		let gone = false;
		const load = (/** @type {string} */ src) => {
			const image = new Image();
			image.src = src;
			return image.decode().then(() => image);
		};
		Promise.all([import('./avatarMorph.js'), load(face), load(lookingUp), load(lookingDown)])
			.then(([{ createMorph }, ...images]) => {
				if (!gone) morph = createMorph(canvas, images, () => ((morph = null), pitch.set(0, { instant: true })));
			})
			.catch((error) => console.warn('Avatar poses unavailable:', error));
		return () => {
			gone = true;
			morph?.dispose();
			morph = null;
		};
	}

	/**
	 * Watches the pointer anywhere on the page (the page scrolling under it too) and, while it holds the
	 * glasses, turns the head up or down to it; a finger lifted, or the mouse gone from the window, and
	 * it looks ahead again (as it does when the glasses go back on, see `drop`). Not holding them, it
	 * leaves the head to the nudge (see `nudging`).
	 * @param {HTMLElement} avatar
	 */
	function watching(avatar) {
		/** @type {{ x: number, y: number } | null} */
		let pointer = null;
		const plumb = Math.tan((PLUMB * Math.PI) / 180);
		const follow = () => {
			if (!grab) return;
			let target = 0;
			if (morph && pointer) {
				const box = avatar.getBoundingClientRect();
				const dx = pointer.x - (box.left + box.width * HEAD.x);
				const dy = pointer.y - (box.top + box.width * HEAD.y);
				if (Math.abs(dy) > box.width * HEAD.r && Math.abs(dx) <= Math.abs(dy) * plumb) target = Math.sign(dy);
			}
			if (target !== pitch.target) pitch.set(target, { instant: prefersReducedMotion.current });
		};
		const away = () => ((pointer = null), follow());
		const controller = new AbortController();
		const { signal } = controller;
		addEventListener('pointermove', (event) => ((pointer = { x: event.clientX, y: event.clientY }), follow()), { signal });
		addEventListener('pointerout', (event) => !event.relatedTarget && away(), { signal });
		addEventListener('pointerup', (event) => event.pointerType === 'touch' && away(), { signal });
		addEventListener('pointercancel', away, { signal });
		addEventListener('scroll', follow, { signal, passive: true });
		return () => controller.abort();
	}

	// Where the lenses are, for the text they read: each centre carried through the glasses' transform.
	/** @param {HTMLElement} avatar */
	function aim(avatar) {
		const { x, y } = glasses.current;
		if (off < 0.01) {
			lenses.circles = [];
			return;
		}
		const box = avatar.getBoundingClientRect();
		const s = box.width / 134;
		const a = (tilt * Math.PI) / 180;
		const [bx, by] = BRIDGE;
		lenses.circles = LENSES.map(([cx, cy]) => {
			const dx = (cx - bx) * s * zoom;
			const dy = (cy - by) * s * zoom;
			return {
				x: box.left + bx * s + x * box.width + dx * Math.cos(a) - dy * Math.sin(a),
				y: box.top + by * s + y * box.width + dx * Math.sin(a) + dy * Math.cos(a),
				r: (RIM - STROKE / 2) * s * zoom
			};
		});
	}

	/** @param {{ x: number, y: number }} to */
	const move = (to) => glasses.set(to, { instant: prefersReducedMotion.current });
	/** The roomier side of the window for the glasses, from the avatar's box. @param {DOMRect} box */
	const roomier = (box) => (box.left + box.width / 2 < innerWidth / 2 ? 1 : -1);

	/**
	 * The nudge for anyone curious about the scrambled afterword (a pointer over it, or a tap): he
	 * glances down at it and lifts his glasses a little way off, the way they come off, then puts them
	 * back and looks up again. Taking hold of the glasses cuts it short.
	 */
	const PEEK = { x: 0.3, y: -0.12 };
	/** @type {gsap.core.Timeline | undefined} */
	let peeking;

	/** @param {HTMLElement} avatar */
	function nudging(avatar) {
		hint.peek = () => {
			if (grab || peeking?.isActive()) return;
			side = roomier(avatar.getBoundingClientRect());
			const still = { instant: prefersReducedMotion.current };
			peeking = gsap
				.timeline()
				.call(() => pitch.set(1, still))
				.call(() => move({ x: side * PEEK.x, y: PEEK.y }), [], 0.2)
				// Off long enough for an eye on the words to find him.
				.call(() => move({ x: 0, y: 0 }), [], 0.9)
				.call(() => pitch.set(0, still), [], 1.1);
		};
		return () => {
			hint.peek = () => {};
			peeking?.kill();
		};
	}

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function press(event) {
		if (event.button || grab) return;
		const box = event.currentTarget.getBoundingClientRect();
		event.currentTarget.setPointerCapture(event.pointerId);
		peeking?.kill();
		lenses.held = true;
		side = roomier(box);
		finger = event.pointerType === 'touch';
		const near = {
			x: (event.clientX - box.left) / box.width - BRIDGE[0] / 134,
			y: (event.clientY - box.top) / box.width - BRIDGE[1] / 134 - (event.pointerType === 'touch' ? CARRY.aboveFinger : CARRY.above)
		};
		grab = { x: event.clientX, y: event.clientY + scrollY, from: event.clientY, size: box.width, at: event, near };
		drag(event);
		requestAnimationFrame(edge);
	}

	/** @param {{ clientX: number, clientY: number }} event */
	function drag(event) {
		if (!grab) return;
		grab.at = { clientX: event.clientX, clientY: event.clientY };
		const dx = (event.clientX - grab.x) / grab.size;
		const dy = (event.clientY + scrollY - grab.y) / grab.size;
		const round = Math.min(1, Math.hypot(dx, dy) / CARRY.reach);
		move({
			x: side * OFF.x + (grab.near.x - side * OFF.x) * round + dx,
			y: OFF.y + (grab.near.y - OFF.y) * round + dy
		});
	}

	/**
	 * While they are held, carried to the bottom (or top) of the window, the page scrolls on under them,
	 * so they can reach text further down than a phone shows at once. Scrolling fires no pointer
	 * events, so each frame they are aimed at the pointer again.
	 */
	function edge() {
		if (!grab) return;
		const y = grab.at.clientY;
		const down = y > grab.from && y > innerHeight - EDGE;
		const up = y < grab.from && y < EDGE;
		if (down || up) scrollBy(0, (down ? y - innerHeight + EDGE : y - EDGE) / 4);
		drag(grab.at);
		requestAnimationFrame(edge);
	}

	function drop() {
		grab = null;
		lenses.held = false;
		move({ x: 0, y: 0 });
		pitch.set(0, { instant: prefersReducedMotion.current });
	}
</script>

<!-- A picture and a toy, so screen readers pass it by. -->
<span
	class="avatar"
	aria-hidden="true"
	{@attach aim}
	{@attach watching}
	{@attach nudging}
	style:--off={off}
	onpointerdown={press}
	onpointermove={drag}
	onlostpointercapture={drop}
>
	<img src={face} alt="" width="134" height="134" draggable="false" />
	<canvas class={['poses', { ready: morph }]} bind:clientWidth={size} {@attach morphing}></canvas>
	<svg
		class={['startle', { alarmed }]}
		viewBox="0 0 134 134"
		style:transform="translate({pose.down * STARTLED_DOWN.x * 100}%, {pose.down * STARTLED_DOWN.y * 100}%)"
		style:--up={pose.up}
	>
		{#each MARKS as { x, dx, dy, turn, length }, i (x)}
			<g style:--dx="{dx}px" style:--dy="{dy}px" style:--turn="{turn}deg" style:--length={length} style:--i={i}>
				<path class="stem" d="M{x} {MARK.top}V{MARK.bottom}" />
				<path class="dot" d="M{x} {MARK.dot}h0" />
			</g>
		{/each}
	</svg>
	<span
		class="glasses"
		style:transform-origin="{(BRIDGE[0] / 134) * 100}% {(BRIDGE[1] / 134) * 100}%"
		style:transform="translate({glasses.current.x * 100}%, {glasses.current.y * 100}%) rotate({tilt}deg) scale({zoom}) {worn}"
	>
		<img src={glassesImage} alt="" width="134" height="134" draggable="false" />
		<svg viewBox="0 0 134 134" stroke-width={STROKE}>
			{#each LENSES as [cx, cy] (cx)}<circle {cx} {cy} r={RIM} />{/each}
			<path d="M62.6 58 69.4 57.6" />
		</svg>
	</span>
</span>

<style>
	/*
	 * Inline-block so the headline can move it as one piece (see headlineFlow.js), and above the words so
	 * the glasses pass over them. Its bottom sits where the image's did.
	 */
	.avatar {
		position: relative;
		z-index: 1;
		display: inline-block;
		width: 4em;
		vertical-align: 0.15em;
		cursor: grab;
		/* A drag on it moves the glasses, not the page, and a long press selects or saves nothing. */
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	.avatar:active {
		cursor: grabbing;
	}

	img,
	svg,
	canvas {
		display: block;
		width: 100%;
		height: auto;
	}

	.poses,
	.startle,
	.glasses,
	.glasses svg {
		position: absolute;
		top: 0;
		left: 0;
	}

	/* Over the drawing, drawing it too, once it can. */
	.poses {
		height: 100%;
		visibility: hidden;
	}

	.poses.ready {
		visibility: visible;
	}

	.glasses {
		width: 100%;
	}

	/* On the face they are the drawing's own; as they come off, the line close-up takes over. */
	.glasses img {
		opacity: calc(1 - var(--off) * 5);
	}

	.glasses svg {
		overflow: visible;
		opacity: calc(var(--off) * 5);
		fill: none;
		stroke: #000;
		stroke-linecap: round;
	}

	/* The face starts once the glasses are halfway off: three strokes by the hair, as in the sketch.
	   Alarmed, they stand up one after another into three exclamation marks; looking up, he has none. */
	.startle {
		opacity: calc((var(--off) * 2 - 1) * (1 - var(--up)));
		fill: none;
		stroke: #000;
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.stem,
	.dot {
		transform-box: fill-box;
		transform-origin: center;
		transition:
			transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i) * 60ms),
			opacity 120ms var(--ease-out) calc(var(--i) * 60ms),
			stroke-width 300ms var(--ease-out) calc(var(--i) * 60ms);
	}

	/* At rest each mark lies along its stroke, its dot not there yet. */
	.stem {
		transform: translate(var(--dx), var(--dy)) rotate(var(--turn)) scale(1, var(--length));
	}

	.dot {
		opacity: 0;
		transform: scale(0);
		stroke-width: 2.2;
	}

	.alarmed .stem {
		transform: none;
		stroke-width: 1.8;
	}

	/* A dot pops in once its stem is up. */
	.alarmed .dot {
		opacity: 1;
		transform: none;
		transition-delay: calc(var(--i) * 60ms + 160ms);
	}

	@media (prefers-reduced-motion: reduce) {
		.stem,
		.dot {
			transition: none;
		}
	}
</style>
