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

	/** What the afterword asks of the avatar when someone is curious about it; the avatar on the page sets it (see `wonder`). */
	export const hint = { wonder() {} };
</script>

<script>
	import { gsap } from 'gsap';
	import { onMount } from 'svelte';
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	import { devicePixelRatio } from 'svelte/reactivity/window';
	import { frameLoop } from '../frameLoop.js';
	import Intro, { pending, shown } from './Intro.svelte';
	// The avatar in two layers, split from static/landing/avatar.png: the drawing without its glasses,
	// and the glasses, which over it rebuild the drawing (and are small enough for Vite to inline, so
	// they are never late onto the face). Once WebGL is in, a canvas draws the face instead, bending
	// it into the poses drawn for it, looking up, looking down and wondering (see avatarMorph.js).
	import face from './face.png';
	import glassesImage from './glasses.png';
	import lookingDown from './looking-down.webp';
	import lookingUp from './looking-up.webp';
	import wonderingImage from './wondering.webp';

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
	/**
	 * Over the afterword's words, the held glasses grow this much more (at most 30%, so they still sit
	 * on a line), as if brought closer to read.
	 */
	const CLOSER = 0.25;
	/** A lens over the afterword's words: the glasses come closer (see `CLOSER`). */
	const reading = $derived(!!lenses.text && under(lenses.text));
	const closer = Spring.of(() => (reading ? 1 : 0), { stiffness: 0.12, damping: 0.8 });
	const zoom = $derived((1 + (ZOOM - 1) * off) * (1 + CLOSER * (prefersReducedMotion.current ? +reading : closer.current)));
	const clampLook = gsap.utils.clamp(-1, 1);
	/** Which way the head faces, -1–1: towards the side the glasses are on, fully once they are off. */
	const look = $derived(clampLook(glasses.current.x / OFF.x));

	/**
	 * With the glasses in hand, the head looks up at the pointer, or down, when it is above or below it:
	 * within this many degrees of straight up, or down, from the head's centre (in avatar sides from
	 * the top left), and further from it than `r`.
	 */
	const PLUMB = 75;
	const HEAD = { x: 0.48, y: 0.37, r: 0.25 };
	/**
	 * Held within this many degrees of straight below his head (the glasses themselves, wherever the
	 * pointer holding them is), they alarm him: the start stands up into three exclamation marks.
	 * Further round, it stays three strokes.
	 */
	const ALARM = 45;
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
	/**
	 * Wondering, three question marks beside his head, spread out as in the drawing of him wondering:
	 * traced from wondering.png (and painted out of wondering.webp, with the glasses), each a hook and
	 * a dot, in the drawing's 134 px, nearest the head first.
	 */
	const QUESTIONS = [
		{
			hook: 'M106.2 58.2C106.3 58.1 106.3 57.4 106.5 57.1C106.7 56.8 107 56.5 107.2 56.4C107.5 56.2 107.9 56.1 108.2 56.1C108.6 56.1 109 56.3 109.3 56.5C109.6 56.7 109.8 57 109.9 57.3C110 57.7 110 58.1 109.9 58.5C109.8 58.9 109.5 59.3 109.3 59.6C109.2 60 109 60.1 108.9 60.5C108.9 60.8 109 61.5 109 61.7',
			dot: 'M109.7 64h0'
		},
		{
			hook: 'M111.1 45.4C111.2 45.2 111.3 44.6 111.6 44.2C111.8 43.9 112.2 43.5 112.7 43.3C113.2 43 113.9 42.8 114.6 42.8C115.2 42.8 115.8 43 116.3 43.3C116.8 43.6 117.1 44.2 117.3 44.7C117.5 45.1 117.5 45.6 117.4 45.9C117.4 46.3 117.2 46.6 117 46.9C116.8 47.2 116.4 47.6 116 47.9C115.6 48.2 115.1 48.4 114.8 48.6C114.4 48.9 114.2 49 113.9 49.2C113.7 49.4 113.4 49.8 113.3 50C113.2 50.2 113.3 50.4 113.3 50.4',
			dot: 'M112.6 53h0'
		},
		{
			hook: 'M118.6 56.5C118.7 56.4 118.9 55.8 119.2 55.6C119.6 55.3 120.4 54.9 121 54.8C121.5 54.8 122 54.9 122.4 55.2C122.8 55.4 123.2 55.9 123.4 56.3C123.5 56.7 123.5 57.2 123.3 57.6C123.2 58 123 58.4 122.6 58.7C122.3 59 121.7 59.3 121.3 59.6C120.8 59.8 120.1 60.1 119.7 60.4C119.3 60.7 119.1 61.1 119 61.3C118.8 61.6 118.8 61.9 118.8 62',
			dot: 'M117.7 64.5h0'
		}
	];
	/**
	 * Looking up at the held glasses, a bead of sweat on his cheek: the drawing's own, one stroke like a
	 * small U, traced from looking-up.png and drawn 2.5 times its size about its centre, in the drawing's
	 * 134 px (at the avatar's size it was a speck of two pixels, so it is painted out of looking-up.webp).
	 */
	const SWEAT = 'M86.9 54.95C87.3 58.56 88.37 61.23 89.84 61.23C91.58 61.23 91.98 58.83 91.84 54.55';
	/** -1 looking up, 1 looking down; unhurried, like a head. */
	const pitch = new Spring(0, { stiffness: 0.08, damping: 0.6 });
	let morph = $state.raw(/** @type {ReturnType<typeof import('./avatarMorph.js').createMorph> | null} */ (null));
	/** The canvas's side, in CSS px. */
	let size = $state(0);
	/** Wondering at the scrambled afterword: three question marks beside his head while he tips it forward to look. */
	let wondering = $state(false);
	/** How far his head has tipped forward to wonder, 0–1; unhurried, like `pitch`. */
	const tip = Spring.of(() => +wondering, { stiffness: 0.08, damping: 0.6 });
	const pose = $derived({
		up: Math.max(0, -pitch.current),
		down: Math.max(0, pitch.current),
		wonder: prefersReducedMotion.current ? +wondering : tip.current,
		turn: look * TURN
	});
	// Worn, the glasses go where the face takes them; taken off, they leave the face's pose behind.
	const worn = $derived(
		morph?.glasses(
			{ up: pose.up * (1 - off), down: pose.down * (1 - off), wonder: pose.wonder * (1 - off), turn: 0 },
			[BRIDGE[0] / 134, BRIDGE[1] / 134]
		) ?? ''
	);

	/** The glasses held right below him (see `ALARM`). */
	let alarmed = $state(false);

	$effect(() => morph?.draw(pose, Math.round(size * (devicePixelRatio.current ?? 1))));

	/**
	 * The poses load after the page, as the Category link icons' three.js does, so the first paint ships
	 * no WebGL; until they are in, or without WebGL, the head stays as drawn. WebGL waits out the Intro,
	 * as the icons do.
	 * @param {HTMLCanvasElement} canvas
	 */
	function morphing(canvas) {
		let gone = false;
		const load = (/** @type {string} */ src) => {
			const image = new Image();
			image.src = src;
			return image.decode().then(() => image);
		};
		Promise.all([import('./avatarMorph.js'), shown, load(face), load(lookingUp), load(lookingDown), load(wonderingImage)])
			.then(([{ createMorph }, , ...images]) => {
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
	 * leaves the head to his wondering (see `wonder`).
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
		return () => {
			controller.abort();
			// Gone mid-drag (off to another page), it never sees the glasses let go: stop scrolling here.
			edgeScroll.stop();
		};
	}

	const alarm = Math.tan((ALARM * Math.PI) / 180);

	/**
	 * Where the lenses are, for the text they read: each centre carried through the glasses' transform.
	 * And whether the glasses, held, are right below his head (their bridge, in avatar sides from it),
	 * which alarms him.
	 * @param {HTMLElement} avatar
	 */
	function aim(avatar) {
		const { x, y } = glasses.current;
		const dx = BRIDGE[0] / 134 + x - HEAD.x;
		const dy = BRIDGE[1] / 134 + y - HEAD.y;
		alarmed = !!grab && dy > HEAD.r && Math.abs(dx) <= dy * alarm;
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

	/** @type {gsap.core.Timeline | undefined} */
	let glance;

	/**
	 * For anyone curious about the scrambled afterword (a pointer over it, or a tap): he tips his head
	 * forward a little to look, wondering (three question marks beside it), then looks up again. Taking
	 * hold of the glasses cuts it short.
	 */
	function wonder() {
		if (grab || glance?.isActive()) return;
		glance = gsap
			.timeline()
			.call(() => (wondering = true))
			.call(() => (wondering = false), [], 1.4);
	}

	/** On a first visit, the avatar is drawn in before the page shows (Intro.svelte). */
	let intro = $state(false);

	onMount(() => {
		intro = pending();
		hint.wonder = wonder;
		return () => {
			hint.wonder = () => {};
			glance?.kill();
		};
	});

	/** @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function press(event) {
		if (event.button || grab) return;
		window.posthog.capture?.('glasses_lifted');
		const box = event.currentTarget.getBoundingClientRect();
		event.currentTarget.setPointerCapture(event.pointerId);
		glance?.kill();
		wondering = false;
		lenses.held = true;
		side = roomier(box);
		const near = {
			x: (event.clientX - box.left) / box.width - BRIDGE[0] / 134,
			y: (event.clientY - box.top) / box.width - BRIDGE[1] / 134 - (event.pointerType === 'touch' ? CARRY.aboveFinger : CARRY.above)
		};
		grab = { x: event.clientX, y: event.clientY + scrollY, from: event.clientY, size: box.width, at: event, near };
		drag(event);
		edgeScroll.start();
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
		if (!grab) return false;
		const y = grab.at.clientY;
		const down = y > grab.from && y > innerHeight - EDGE;
		const up = y < grab.from && y < EDGE;
		if (down || up) scrollBy(0, (down ? y - innerHeight + EDGE : y - EDGE) / 4);
		drag(grab.at);
		return true;
	}
	const edgeScroll = frameLoop(edge);

	function drop() {
		grab = null;
		edgeScroll.stop();
		lenses.held = false;
		alarmed = false;
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
	style:--off={off}
	onpointerdown={press}
	onpointermove={drag}
	onlostpointercapture={drop}
>
	<img src={face} alt="" width="134" height="134" draggable="false" />
	<canvas class={['poses', { ready: morph }]} bind:clientWidth={size} {@attach morphing}></canvas>
	<svg class="sweat" viewBox="0 0 134 134" style:--up={pose.up}><path d={SWEAT} /></svg>
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
	<svg class={['wonder', { wondering }]} viewBox="0 0 134 134">
		{#each QUESTIONS as { hook, dot }, i (dot)}
			<g style:--i={i}><path d={hook} /><path class="point" d={dot} /></g>
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
	{#if intro}<Intro onend={() => (intro = false)} />{/if}
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

	/* While the Intro holds the page and draws the avatar, the avatar is only that drawing, and cannot
	   be taken hold of yet. */
	:global(html:is([data-intro='hold'], [data-intro='drawing'])) .avatar {
		pointer-events: none;
	}

	:global(html:is([data-intro='hold'], [data-intro='drawing'])) .avatar > :is(img, .poses, .sweat, .startle, .wonder, .glasses) {
		visibility: hidden;
	}

	img,
	svg,
	canvas {
		display: block;
		width: 100%;
		height: auto;
	}

	.poses,
	.sweat,
	.startle,
	.wonder,
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

	/* The sweat comes with the look up, and slides a little down the cheek as the head tips back. */
	.sweat {
		opacity: calc(var(--up) * 1.4 - 0.4);
		transform: translateY(calc((var(--up) - 1) * 1.5%));
		fill: none;
		stroke: #42140a;
		stroke-width: 1.55;
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

	/* Wondering, the question marks pop up one after another, rising; they go all at once. */
	.wonder {
		overflow: visible;
		fill: none;
		stroke: #000;
		stroke-width: 1.15;
		stroke-linecap: round;
	}

	.wonder g {
		opacity: 0;
		transform: translateY(3px) scale(0.8);
		transform-box: fill-box;
		transform-origin: center bottom;
		transition:
			opacity 160ms var(--ease-out),
			transform 160ms var(--ease-out);
	}

	.wonder .point {
		stroke-width: 1.7;
	}

	/* Shown bigger than drawn, each about its foot, so they still stand apart. */
	.wondering g {
		opacity: 1;
		transform: scale(1.3);
		transition:
			opacity 120ms var(--ease-out) calc(var(--i) * 110ms),
			transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i) * 110ms);
	}

	@media (prefers-reduced-motion: reduce) {
		.stem,
		.dot,
		.wonder g {
			transition: none;
		}
	}
</style>
