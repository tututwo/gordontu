<script>
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { frameLoop } from '$lib/frameLoop.js';
	import About from '$lib/landingPage/About.svelte';
	import { lenses } from '$lib/landingPage/Avatar.svelte';
	import Figure from './Figure.svelte';
	import { BEAT, ERASE, OPENING, ending } from './ending.js';
	import { REST, curve } from './figure.js';
	import { POSES } from './poses.js';

	/*
	 * The demo video's ending, filmed from the landing itself (this page is the about tab): he looks up
	 * at his glasses, the camera rises over him and comes back down in front of him, whole, and the
	 * figure in figure.js plays out ending_1 to ending_8 (static/demo/ending) before he is rubbed out.
	 * A tap replays it; `?t=` holds it at a time (s); `?sheet=` shows one drawing's pose (see below).
	 */

	const params = page.url.searchParams;
	/** A drawing's pose alone, over the drawing, beside it, or by itself: to check the figure. */
	const sheet = params.get('sheet');
	const mode = params.get('mode') ?? 'over';
	/** Held at this time (s), for a still. */
	const at = params.get('t');

	const scene = $state({
		pose: structuredClone(POSES[/** @type {keyof typeof POSES} */ (Number(sheet))] ?? REST),
		camera: { x: 537, y: 724, zoom: 1 },
		page: { rest: 1, avatar: 1 },
		held: { x: 0, y: 0, scale: 1, spin: 0, shown: 0 },
		star: { scale: 0, spin: -90 },
		erase: { progress: 0, tool: 0 },
		/** The timeline's time (s), for what ages by it. */
		time: 0
	});

	let width = $state(1);
	let height = $state(1);
	/** The camera's view, in the figure's units: 1448 tall at zoom 1 (ending_1's frame). */
	const view = $derived.by(() => {
		const h = 1448 / scene.camera.zoom;
		const w = (h * width) / height;
		return `${scene.camera.x - w / 2} ${scene.camera.y - h / 2} ${w} ${h}`;
	});

	/** The star he points to, a four-pointed twinkle, where his finger ends up (as he stands then). */
	const STAR = { x: 950, y: 265, r: 34 };
	const star = `M0 ${-STAR.r}Q${STAR.r * 0.12} ${-STAR.r * 0.12} ${STAR.r} 0Q${STAR.r * 0.12} ${STAR.r * 0.12} 0 ${STAR.r}Q${-STAR.r * 0.12} ${STAR.r * 0.12} ${-STAR.r} 0Q${-STAR.r * 0.12} ${-STAR.r * 0.12} 0 ${-STAR.r}Z`;

	/**
	 * The eraser's run over him, as he stands at the end: back and forth, from above his head down to his
	 * feet, each pass overlapping the last.
	 */
	const RUB = curve(Array.from({ length: 13 }, (_, i) => /** @type {[number, number]} */ ([i % 2 ? 830 : 360, 290 + i * 72 + (i % 2 ? 24 : 0)])));
	/** @type {SVGPathElement | undefined} */
	let rub = $state();
	/** Where the eraser is along its run, and which way it leans: into the way it is going. */
	const eraser = $derived.by(() => {
		if (!rub) return { x: 0, y: 0, lean: 0 };
		const length = rub.getTotalLength();
		const at = rub.getPointAtLength(length * scene.erase.progress);
		const ahead = rub.getPointAtLength(Math.min(length, length * scene.erase.progress + 8));
		// Brought in from off to the right, and taken away there.
		const off = 1 - scene.erase.tool;
		return { x: at.x + off * 700, y: at.y - off * 300, lean: Math.max(-1, Math.min(1, (ahead.x - at.x) / 8)) };
	});

	/**
	 * Crumbs rubbed off as the eraser goes: each shaken loose at its point on the run, flicked off and
	 * falling, gone in `CRUMB.life` (s). The run is steady, so a crumb's age is the time since the eraser
	 * got to it.
	 */
	const CRUMB = { count: 46, life: 0.7, fall: 1400 };
	/** When the eraser's run starts and how long it takes (s). */
	const RUN = { start: (OPENING + ERASE.at) * BEAT, length: ERASE.beats * BEAT };
	/** The same crumbs every time. */
	const crumbSeeds = Array.from({ length: CRUMB.count }, (_, i) => {
		const r = (/** @type {number} */ k) => ((Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
		return { at: (i + r(1)) / CRUMB.count, dx: (r(2) - 0.5) * 60, vx: (r(3) - 0.5) * 260, vy: -60 - r(4) * 180, spin: (r(5) - 0.5) * 900, turn: r(6) * 360, size: 0.7 + r(7) * 0.7 };
	});
	const crumbs = $derived.by(() => {
		if (!rub || scene.time < RUN.start) return [];
		const length = rub.getTotalLength();
		return crumbSeeds.flatMap((c) => {
			const age = scene.time - (RUN.start + c.at * RUN.length);
			if (age <= 0 || age >= CRUMB.life) return [];
			const at = /** @type {SVGPathElement} */ (rub).getPointAtLength(length * c.at);
			return [
				{
					x: at.x + c.dx + c.vx * age,
					y: at.y + 30 + c.vy * age + 0.5 * CRUMB.fall * age * age,
					turn: c.turn + c.spin * age,
					size: c.size,
					opacity: 1 - (age / CRUMB.life) ** 2
				}
			];
		});
	});

	/** The avatar's glasses, as the figure has them: two rims and the bridge, about the bridge. */
	const GLASSES = { apart: 40, r: 33 };

	/**
	 * The avatar's drawing and the figure's, lined up: the figure's hair (426 to 651 across, its top at
	 * 171) over the avatar's looking up (from 27.2 to 100.4 across its 134, its top at 10.7).
	 */
	const AVATAR = { x: 61.8, y: 10.7, scale: 3.07, figure: [538.5, 171] };

	/** The landing's parts, which fade as the camera leaves them. */
	const landing = () => /** @type {HTMLElement | null} */ (document.querySelector('.landing'));
	const rest = () => document.querySelectorAll('.landing h1 > :not(.avatar), .landing :is(.socials, hr, nav, .panel)');
	const avatar = () => /** @type {HTMLElement} */ (document.querySelector('.landing .avatar'));

	/**
	 * Takes hold of the avatar's glasses as a mouse would, and carries them up to his right, so he looks
	 * up at them (Avatar.svelte does the rest). The events are made, not real: they cannot capture the
	 * pointer, so the capture is waved through.
	 */
	function lift() {
		const face = avatar();
		const box = face.getBoundingClientRect();
		const head = { x: box.left + box.width * 0.48, y: box.top + box.width * 0.37 };
		const to = { x: head.x + 1.4 * box.width, y: Math.max(head.y - 0.45 * box.width, 86) };
		face.setPointerCapture = () => {};
		const at = (/** @type {string} */ type, /** @type {number} */ x, /** @type {number} */ y) =>
			face.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y, button: 0, buttons: 1 }));
		at('pointerdown', head.x, head.y);
		return new Promise((done) => {
			let i = 0;
			const steps = 24;
			const loop = frameLoop(() => {
				const t = ++i / steps;
				const e = t * t * (3 - 2 * t);
				at('pointermove', head.x + (to.x - head.x) * e, head.y + (to.y - head.y) * e);
				if (i < steps) return true;
				done(undefined);
				return false;
			});
			loop.start();
		});
	}

	/**
	 * Where the opening starts: the camera that puts the figure's head over the avatar's, and the glasses
	 * where the avatar holds them, in the figure's units.
	 * @returns {import('./ending.js').Start}
	 */
	function start() {
		const box = avatar().getBoundingClientRect();
		/** Screen px per figure unit, with the avatar's side `box.width` for its 134. */
		const k = box.width / 134 / AVATAR.scale;
		const zoom = (k * 1448) / innerHeight;
		const anchor = { x: box.left + (AVATAR.x * box.width) / 134, y: box.top + (AVATAR.y * box.width) / 134 };
		// The figure's point under the window's middle.
		const camera = { x: AVATAR.figure[0] + (innerWidth / 2 - anchor.x) / k, y: AVATAR.figure[1] + (innerHeight / 2 - anchor.y) / k, zoom };
		const toFigure = (/** @type {number} */ x, /** @type {number} */ y) => [camera.x + (x - innerWidth / 2) / k, camera.y + (y - innerHeight / 2) / k];
		const [a, b] = lenses.circles;
		const [x, y] = a && b ? toFigure((a.x + b.x) / 2, (a.y + b.y) / 2) : toFigure(anchor.x + 60, anchor.y - 40);
		const scale = a ? a.r / k / GLASSES.r : 2.6;
		const spin = a && b ? (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI : 0;
		return { camera, held: { x, y, scale, spin } };
	}

	/**
	 * The stage is this page's, which the landing's layout puts in its panel; it goes on the body instead,
	 * so it neither fades nor moves with the landing.
	 * @param {HTMLElement} node
	 */
	function outside(node) {
		document.body.append(node);
		return () => node.remove();
	}

	/** The landing moves with the camera until it has faded: scaled and moved as the figure is. */
	let begin = $state.raw(/** @type {import('./ending.js').Start | null} */ (null));
	$effect(() => {
		const land = landing();
		if (!begin || !land) return;
		const k0 = (begin.camera.zoom * innerHeight) / 1448;
		const k = (scene.camera.zoom * innerHeight) / 1448;
		const s = k / k0;
		const tx = (innerWidth / 2) * (1 - s) + (begin.camera.x - scene.camera.x) * k;
		const ty = (innerHeight / 2) * (1 - s) + (begin.camera.y - scene.camera.y) * k;
		land.style.transformOrigin = '0 0';
		land.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
		land.style.visibility = scene.page.rest > 0 || scene.page.avatar > 0 ? '' : 'hidden';
		for (const part of rest()) /** @type {HTMLElement} */ (part).style.opacity = String(scene.page.rest);
		avatar().style.opacity = String(scene.page.avatar);
	});

	onMount(() => {
		Object.assign(window, { scene, ready: !!sheet });
		if (sheet) return;
		let gone = false;
		/** @type {ReturnType<typeof frameLoop> | undefined} */
		let loop;
		/** @type {gsap.core.Timeline | undefined} */
		let tl;
		// A stage, not a page: real pointers do nothing here (they would turn his head), but a tap replays.
		const still = (/** @type {PointerEvent} */ event) => {
			if (!event.isTrusted) return;
			event.stopImmediatePropagation();
			if (event.type === 'pointerdown' && tl && loop) tl.time(0), loop.start();
		};
		for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointerout']) addEventListener(type, /** @type {EventListener} */ (still), { capture: true });
		(async () => {
			await document.fonts.ready;
			// The avatar's poses load after the page (Avatar.svelte); give them a moment.
			await new Promise((r) => setTimeout(r, 900));
			if (gone) return;
			await lift();
			// Let the glasses and his head settle where they are going.
			await new Promise((r) => setTimeout(r, 1300));
			if (gone) return;
			begin = start();
			tl = ending(scene, begin);
			// Run through once, so every tween knows where it starts, and back: time 0 is then drawn too.
			tl.progress(1).progress(0);
			Object.assign(window, { ending: tl, ready: true });
			if (at !== null) return void tl.time(Number(at));
			loop = frameLoop((dt) => {
				tl?.time(tl.time() + Math.min(dt, 50) / 1000);
				return !!tl && tl.progress() < 1;
			});
			loop.start();
		})();
		return () => {
			gone = true;
			loop?.stop();
			tl?.kill();
			for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointerout']) removeEventListener(type, /** @type {EventListener} */ (still), { capture: true });
		};
	});
</script>

<About />

{#if sheet}
	<div class={['sheet', mode]}>
		{#if mode !== 'solo'}<img src="/demo/ending/ending_{sheet}.png" alt="" />{/if}
		<svg viewBox="0 0 1086 1448"><Figure pose={scene.pose} /></svg>
	</div>
{:else}
	<div class="stage" bind:clientWidth={width} bind:clientHeight={height} {@attach outside}>
		<svg viewBox={view} preserveAspectRatio="xMidYMid meet">
			<defs>
				<!-- An eraser's edge is never quite clean. -->
				<filter id="rubbed" x="-5%" y="-5%" width="110%" height="110%">
					<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" />
					<feDisplacementMap in="SourceGraphic" scale="16" xChannelSelector="R" yChannelSelector="G" />
				</filter>
			</defs>
			<Figure pose={scene.pose} />
			{#if scene.held.shown > 0}
				<!-- His glasses, held up away from him, then dropped back on. -->
				<g class="held" transform="translate({scene.held.x} {scene.held.y}) rotate({scene.held.spin}) scale({scene.held.scale})" opacity={scene.held.shown}>
					<circle cx={-GLASSES.apart} r={GLASSES.r} />
					<circle cx={GLASSES.apart} r={GLASSES.r} />
					<path d="M-7 0Q0 -5 7 0" />
				</g>
			{/if}
			<!-- What the eraser has rubbed out: the page's white, laid over him. -->
			<!-- (Its rough edge only while it rubs: the noise is redrawn every frame it is on.) -->
			<path class="rubbed" bind:this={rub} d={RUB} pathLength="1" stroke-dasharray="1 2" stroke-dashoffset={1 - scene.erase.progress} filter={scene.erase.progress > 0 ? 'url(#rubbed)' : undefined} />
			{#if scene.star.scale > 0}
				<path class="star" d={star} transform="translate({STAR.x} {STAR.y}) rotate({scene.star.spin}) scale({scene.star.scale})" />
			{/if}
			{#each crumbs as crumb, i (i)}
				<path class="crumb" d="M-5 1Q-1 -5 5 -1" transform="translate({crumb.x} {crumb.y}) rotate({crumb.turn}) scale({crumb.size})" opacity={crumb.opacity} />
			{/each}
			{#if scene.erase.tool > 0}
				<!-- A block eraser in a paper sleeve, drawn in his line, rubbing with its end. -->
				<g class="eraser" transform="translate({eraser.x} {eraser.y}) rotate({-28 + eraser.lean * 9})">
					<rect x="-34" y="-158" width="68" height="160" rx="12" />
					<path class="sleeve" d="M-37 -118H37V-40H-37Z" />
					<path d="M-26 -104 -8 -104M-26 -92 4 -92" />
				</g>
			{/if}
		</svg>
	</div>
{/if}

<style>
	.sheet,
	.stage {
		position: fixed;
		inset: 0;
		z-index: 10;
		--ink: #22140f;
	}

	/* The landing shows through the stage until the camera leaves it. */
	.sheet {
		display: flex;
		background: #fff;
	}

	.sheet img,
	.sheet svg {
		width: 1086px;
		height: 1448px;
		flex: none;
	}

	.over img,
	.over svg {
		position: absolute;
		top: 0;
		left: 0;
	}

	.over img {
		opacity: 0.45;
	}

	.over svg {
		opacity: 0.75;
	}

	.stage svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.rubbed {
		fill: none;
		stroke: #fff;
		stroke-width: 130;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.star,
	.eraser {
		fill: #fff;
		stroke: var(--ink);
		stroke-width: 3.6;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.crumb {
		fill: none;
		stroke: var(--ink);
		stroke-width: 3;
		stroke-linecap: round;
	}

	/* The glasses' finer line, as on his face (figure.js's RIM). */
	.held {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2.4;
		stroke-linecap: round;
	}
</style>
