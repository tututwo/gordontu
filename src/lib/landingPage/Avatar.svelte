<script>
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	// The avatar in two layers, split from static/landing/avatar.png: the face without its glasses, and
	// the glasses alone, which over that face rebuild the drawing. The glasses are small enough for Vite
	// to inline, so they are never late onto the face.
	import face from './avatar-bare.png';
	import glassesImage from './glasses.png';

	/**
	 * Pressed, the glasses come off to here, in avatar sides from where they sit: up and away from the
	 * face, as in the sketch, turned this many degrees. Then the pointer carries them until let go.
	 */
	const OFF = { x: 0.7, y: -0.2, turn: -12 };

	// A little loose, so they settle back on with a small wobble.
	const glasses = new Spring({ x: 0, y: 0 }, { stiffness: 0.1, damping: 0.45, precision: 0.001 });
	/** They come off towards the roomier side of the window, so they stay on screen. */
	let side = $state(1);
	/** @type {{ x: number, y: number, size: number } | null} */
	let grab = null;

	/** How far off the face they are, 0–1: they turn as they go, and the face starts. */
	const off = $derived(Math.min(1, Math.hypot(glasses.current.x, glasses.current.y) / Math.hypot(OFF.x, OFF.y)));

	/** @param {{ x: number, y: number }} to */
	const move = (to) => glasses.set(to, { instant: prefersReducedMotion.current });

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function press(event) {
		if (event.button) return;
		const box = event.currentTarget.getBoundingClientRect();
		event.currentTarget.setPointerCapture(event.pointerId);
		side = box.left + box.width / 2 < innerWidth / 2 ? 1 : -1;
		grab = { x: event.clientX, y: event.clientY, size: box.width };
		drag(event);
	}

	/** @param {PointerEvent} event */
	function drag(event) {
		if (!grab) return;
		move({
			x: side * OFF.x + (event.clientX - grab.x) / grab.size,
			y: OFF.y + (event.clientY - grab.y) / grab.size
		});
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
	style:--off={off}
	onpointerdown={press}
	onpointermove={drag}
	onlostpointercapture={drop}
>
	<img src={face} alt="" width="134" height="134" draggable="false" />
	<svg class="startle" viewBox="0 0 134 134">
		<path d="M101.9 21.3 105.2 15.1M104.7 23.6 110 19.1M106.9 28.4 113.8 27.3" />
	</svg>
	<img
		class="glasses"
		src={glassesImage}
		alt=""
		width="134"
		height="134"
		draggable="false"
		style:transform="translate({glasses.current.x * 100}%, {glasses.current.y * 100}%) rotate({off * OFF.turn * side}deg)"
	/>
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

	.startle,
	.glasses {
		position: absolute;
		top: 0;
		left: 0;
	}

	/* They turn about the bridge. */
	.glasses {
		transform-origin: 49% 43%;
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
