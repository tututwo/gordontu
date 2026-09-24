<script module>
	/**
	 * The glasses' lenses while they are off the face, as circles in viewport pixels, for text that
	 * shows only through them (the bio's afterword, see About.svelte). Empty while they are on.
	 * @type {{ circles: { x: number, y: number, r: number }[] }}
	 */
	export const lenses = $state({ circles: [] });
</script>

<script>
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	// The avatar in three layers, split from static/landing/avatar.png: the head without a face, its
	// features (eyes, brows, mouth), and the glasses, which stacked rebuild the drawing. Features and
	// glasses are small enough for Vite to inline, so they are never late onto the head.
	import face from './avatar-bare.png';
	import featuresImage from './features.png';
	import glassesImage from './glasses.png';

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
	 * side to sit this far above the pointer: clear of a finger, and able to reach both ends of a line.
	 */
	const CARRY = { reach: 1.5, above: 0.7 };
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

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function press(event) {
		if (event.button || grab) return;
		const box = event.currentTarget.getBoundingClientRect();
		event.currentTarget.setPointerCapture(event.pointerId);
		side = box.left + box.width / 2 < innerWidth / 2 ? 1 : -1;
		const near = {
			x: (event.clientX - box.left) / box.width - BRIDGE[0] / 134,
			y: (event.clientY - box.top) / box.width - BRIDGE[1] / 134 - CARRY.above
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
		move({ x: 0, y: 0 });
	}
</script>

<!-- A picture and a toy, so screen readers pass it by. -->
<span
	class="avatar"
	aria-hidden="true"
	{@attach aim}
	style:--off={off}
	onpointerdown={press}
	onpointermove={drag}
	onlostpointercapture={drop}
>
	<img src={face} alt="" width="134" height="134" draggable="false" />
	<img
		class="features"
		src={featuresImage}
		alt=""
		width="134"
		height="134"
		draggable="false"
		style:transform="translateX({look * TURN * 100}%)"
	/>
	<svg class="startle" viewBox="0 0 134 134">
		<path d="M101.9 21.3 105.2 15.1M104.7 23.6 110 19.1M106.9 28.4 113.8 27.3" />
	</svg>
	<span
		class="glasses"
		style:transform-origin="{(BRIDGE[0] / 134) * 100}% {(BRIDGE[1] / 134) * 100}%"
		style:transform="translate({glasses.current.x * 100}%, {glasses.current.y * 100}%) rotate({tilt}deg) scale({zoom})"
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
	svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.features,
	.startle,
	.glasses,
	.glasses svg {
		position: absolute;
		top: 0;
		left: 0;
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

	/* The face starts once the glasses are halfway off: three strokes by the hair, as in the sketch. */
	.startle {
		opacity: calc(var(--off) * 2 - 1);
		fill: none;
		stroke: #000;
		stroke-width: 1.5;
		stroke-linecap: round;
	}
</style>
