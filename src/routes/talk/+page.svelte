<script>
	import { gsap } from 'gsap';
	import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { tick } from 'svelte';
	import About from '$lib/landingPage/About.svelte';
	import Avatar, { lenses } from '$lib/landingPage/Avatar.svelte';
	import Intro from '$lib/landingPage/Intro.svelte';
	import Evolution from '$lib/talk/Evolution.svelte';
	import { BEATS, CREDITS, FILM, STEPS } from '$lib/talk/beats.js';
	import face from '$lib/talk/face.webp';
	import glasses from '$lib/talk/glasses.webp';
	import keyDown from '$lib/talk/keyframe-down.webp';
	import keyUp from '$lib/talk/keyframe-up.webp';
	import keyWonder from '$lib/talk/keyframe-wonder.webp';
	import paperExploded from '$lib/talk/paper-exploded.webp';
	import paperLayers from '$lib/talk/paper-layers.webp';
	import down from '$lib/talk/pose-down.webp';
	import up from '$lib/talk/pose-up.webp';
	import sketch from '$lib/talk/sketch.webp';
	import tapnow from '$lib/talk/tapnow.webp';
	import turn1 from '$lib/talk/turn-1.webp';
	import turn2 from '$lib/talk/turn-2.webp';
	import turn3 from '$lib/talk/turn-3.webp';
	import turn4 from '$lib/talk/turn-4.webp';
	import worried from '$lib/talk/worried.webp';
	import { POSES, createWorld, fit, holdAt } from '$lib/talk/world.js';

	/*
	 * The talk, as one page that turns itself: the deck stays put while the page scrolls under it, and
	 * the scroll drives one GSAP timeline that holds everything, scrubbed: the words, the world's poses
	 * (world.js, on a canvas behind the whole deck), the page's own panels (the site itself, live; the
	 * landing's drawing; the evolution; the film; the credits) and the hand-overs between them, where the
	 * world lays the avatar's sheet exactly over the avatar on the panel before it gives way. The arrow
	 * keys (or a clicker) fly from beat to beat; a hand on the wheel lands on the nearest one.
	 */

	/** The pictures the world draws with (see `createWorld`). */
	const PICTURES = { face, glasses, up, down, tapnow, paperLayers, paperExploded, sketch, turn1, turn2, turn3, turn4, worried, keyUp, keyDown, keyWonder };

	const N = BEATS.length;
	/** Where each beat is on the timeline (and the page's scroll), in screens: the way to each takes its `len`. */
	const AT = BEATS.reduce((at, beat, i) => [...at, i ? at[i - 1] + (beat.len ?? 1) : 0], /** @type {number[]} */ ([]));
	const END = AT[N - 1];

	/** Which layer of the stage each scene is on: the world, or one of the page's panels. @type {Record<string, string>} */
	const PANELS = { live: 'live', blank: 'drawing', drawn: 'drawing', evolution: 'evolution', film: 'film', credits: 'credits' };
	const layerOf = (/** @type {string} */ scene) => PANELS[scene] ?? 'world';
	/** The panels the world hands the avatar's sheet to (and takes it back from), laid exactly over theirs. */
	const HANDOFF = ['live', 'drawing'];

	/**
	 * When, within the world's part of a turn, each part of a pose moves, [as it goes, as it comes]:
	 * things come late and go early, so the camera has moved before anything rises and all is back down
	 * before it moves again; the glasses come off before the mesh goes on, and go back on after it has
	 * gone. The camera, the board and the head move throughout.
	 */
	const PART = [
		[0, 0.5],
		[0.5, 1]
	];
	/** @type {Record<string, number[][]>} */
	const WINDOWS = {
		lift: PART,
		cut: PART,
		sketch: PART,
		tries: PART,
		keys: PART,
		strip: PART,
		blank: PART,
		rims: [
			[0.45, 0.9],
			[0.4, 1]
		],
		carry: [
			[0.1, 0.6],
			[0.5, 0.9]
		],
		wire: [
			[0, 0.4],
			[0.66, 1]
		],
		chrome: [
			[0.5, 1],
			[0, 0.5]
		]
	};
	/** Where the glasses are held moves with their carrying. */
	const HELD = ['gx', 'gz', 'gs'];

	/** The beat on screen. */
	let beat = $state(0);
	const current = $derived(BEATS[beat]);
	/** What the pointer is over on the stage. @type {string | null} */
	let over = $state(null);
	/** Gordon's lines and the clock, for rehearsing (N). */
	let notes = $state(false);
	/** The film, from YouTube when Gordon's own copy is not there. */
	let tube = $state(false);

	/** The world's pose, moved by the timeline. */
	const pose = { ...POSES.picture };
	/** How far the landing's drawing is drawn, likewise. */
	const pen = { p: 0.02 };
	/** @type {import('$lib/talk/world.js').World | null} */
	let world = null;
	/** @type {gsap.core.Timeline | null} */
	let timeline = null;
	/** @type {Intro | undefined} */
	let drawing = $state();
	/** @type {HTMLVideoElement | undefined} */
	let film = $state();
	/** The scroll from beat to beat, and whether one is under way (a new tween is not `isActive()` until its first frame). @type {gsap.core.Tween | null} */
	let flying = null;
	let inFlight = false;
	/** The beat the keys last asked for, so quick presses count on from it. */
	let aim = 0;
	/** The canvas and the panels, and the canvas's size and the stage's box in it, as last measured. */
	/** @type {{ canvas: HTMLCanvasElement, panels: Record<string, HTMLElement>, left: number, top: number, w: number, h: number, stage: import('$lib/talk/world.js').Stage } | null} */
	let laid = null;
	/** Builds the timeline again, once the layout has settled (see `deck`). */
	let relayout = () => {};
	const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	/**
	 * Measures the page, works out each beat's pose (the hand-overs and where the glasses are held come
	 * from where things are on it), and builds the timeline: a label a beat, and between each two the
	 * turn from one to the next.
	 * @param {HTMLElement} root
	 */
	function build(root) {
		const one = (/** @type {string} */ selector) => /** @type {HTMLElement} */ (root.querySelector(selector));
		const all = (/** @type {string} */ selector) => /** @type {HTMLElement[]} */ ([...root.querySelectorAll(selector)]);
		const canvas = /** @type {HTMLCanvasElement} */ (one('canvas.world'));
		const panels = { live: one('.panel.live'), drawing: one('.panel.drawing'), evolution: one('.panel.evolution'), film: one('.panel.film'), credits: one('.panel.credits') };
		const box = canvas.getBoundingClientRect();
		const stageBox = one('.stage').getBoundingClientRect();
		/** A box of the page, in the canvas's px. @param {Element} element */
		const rel = (element) => {
			const r = element.getBoundingClientRect();
			return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
		};
		const stage = { cx: stageBox.left - box.left + stageBox.width / 2, cy: stageBox.top - box.top + stageBox.height / 2, w: stageBox.width, h: stageBox.height };
		laid = { canvas, panels, left: box.left, top: box.top, w: box.width, h: box.height, stage };
		world?.resize(box.width, box.height, stage);

		/** @type {Record<string, import('$lib/talk/world.js').Pose>} */
		const handoff = {
			live: { ...POSES.picture, chrome: 0, ...fit(rel(one('.panel.live .avatar')), stage) },
			drawing: { ...POSES.picture, chrome: 0, blank: 1, ...fit(rel(one('.panel.drawing .paper')), stage) }
		};
		const words = all('.words');
		/** @type {import('$lib/talk/world.js').Pose[]} */
		const poses = [];
		BEATS.forEach((b, i) => {
			let p = POSES[b.scene] ?? handoff[layerOf(b.scene)] ?? poses[i - 1] ?? POSES.picture;
			const slot = words[i].querySelector('.slot');
			if (slot) p = { ...p, ...holdAt(rel(slot), p, stage) };
			poses.push(p);
		});
		Object.assign(pose, poses[0]);

		const steps = all('.step');
		const keys = /** @type {(keyof typeof pose)[]} */ (Object.keys(pose));
		const evolution = {
			trunk: one('.evolution .trunk'),
			nodes: all('.evolution .node'),
			branches: all('.evolution .branch')
		};

		timeline = gsap.timeline({
			defaults: { ease: 'power2.inOut', immediateRender: false },
			scrollTrigger: {
				trigger: root,
				start: 'top top',
				end: 'bottom bottom',
				scrub: reduced ? true : 0.18,
				snap: { snapTo: land, duration: { min: 0.3, max: 0.9 }, delay: 0.12, ease: 'power1.inOut', inertia: false }
			},
			onUpdate: turned
		});
		timeline.set({}, {}, END);

		for (let i = 1; i < N; i++) {
			const a = AT[i - 1];
			const length = AT[i] - a;
			const at = (/** @type {number} */ f) => a + f * length;
			const span = (/** @type {number} */ f) => f * length;
			const [was, is] = [BEATS[i - 1], BEATS[i]];

			// The words: the last go before the world moves, the next come once it has.
			timeline.fromTo(words[i - 1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: span(0.2), ease: 'power2.in' }, at(0.04));
			timeline.fromTo(words[i], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: span(0.24), ease: 'power2.out' }, at(0.7));
			if (was.step !== is.step) {
				timeline.fromTo(steps[was.step], { autoAlpha: 1 }, { autoAlpha: 0, duration: span(0.2), ease: 'none' }, at(0.04));
				timeline.fromTo(steps[is.step], { autoAlpha: 0 }, { autoAlpha: 1, duration: span(0.24), ease: 'none' }, at(0.7));
			}

			// The layers: a panel comes in over the world (or the world under a panel) before the other goes,
			// so where they hand over, the avatar is always all there.
			const [from, to] = [layerOf(was.scene), layerOf(is.scene)];
			let [s, e] = [0.1, 0.9];
			if (from !== to) {
				const element = (/** @type {string} */ layer) => (layer === 'world' ? canvas : panels[/** @type {keyof typeof panels} */ (layer)]);
				const show = (/** @type {string} */ layer, /** @type {number} */ f) =>
					timeline?.fromTo(element(layer), { autoAlpha: 0 }, { autoAlpha: 1, duration: span(0.07), ease: 'none' }, at(f));
				const hide = (/** @type {string} */ layer, /** @type {number} */ f) =>
					timeline?.fromTo(element(layer), { autoAlpha: 1 }, { autoAlpha: 0, duration: span(0.07), ease: 'none' }, at(f));
				if (from === 'world') {
					show(to, 0.8);
					hide('world', 0.87);
					e = 0.8;
				} else if (to === 'world') {
					show('world', 0.06);
					hide(from, 0.13);
					s = 0.2;
				} else if (HANDOFF.includes(from) && HANDOFF.includes(to)) {
					show('world', 0.06);
					hide(from, 0.13);
					show(to, 0.8);
					hide('world', 0.87);
					[s, e] = [0.2, 0.8];
				} else {
					show(to, 0.42);
					hide(from, 0.5);
				}
			}

			// The world, from one pose to the next.
			const [p0, p1] = [poses[i - 1], poses[i]];
			const carrying = p0.carry !== p1.carry ? WINDOWS.carry[p1.carry > p0.carry ? 1 : 0] : null;
			for (const key of keys) {
				if (p0[key] === p1[key]) continue;
				const [f0, f1] = (HELD.includes(key) ? carrying : WINDOWS[key]?.[p1[key] > p0[key] ? 1 : 0]) ?? [0, 1];
				timeline.fromTo(pose, { [key]: p0[key] }, { [key]: p1[key], duration: span((e - s) * (f1 - f0)) }, at(s + (e - s) * f0));
			}

			// The landing's drawing, drawn by the scroll.
			if (is.scene === 'drawn') timeline.fromTo(pen, { p: 0.02 }, { p: 1, duration: span(0.86), ease: 'none' }, at(0.08));

			// The evolution, its line drawn left to right once its panel is in, each version as the line reaches it.
			if (is.scene === 'evolution' && evolution.trunk) {
				const [start, draw] = [at(0.5), span(0.44)];
				timeline.fromTo(evolution.trunk, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: draw, ease: 'none', autoRound: false }, start);
				for (const node of evolution.nodes) {
					timeline.fromTo(node, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: span(0.07), ease: 'power2.out' }, start + draw * Number(node.dataset.at) - span(0.02));
				}
				for (const branch of evolution.branches) {
					const from = start + draw * Number(branch.dataset.at);
					const path = branch.querySelector('path');
					if (path) timeline.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: span(0.08), ease: 'power1.out', autoRound: false }, from);
					timeline.fromTo(branch.querySelector('.end'), { autoAlpha: 0 }, { autoAlpha: 1, duration: span(0.05), ease: 'none' }, from + span(0.06));
				}
			}
		}
	}

	/** Follows the timeline: the beat on screen, the film, the drawing, and the world, drawn in the same frame as the rest. */
	let drawnAt = -1;
	let playing = false;
	function turned() {
		if (!timeline || !laid) return;
		const t = timeline.time();
		let i = 0;
		while (i < N - 1 && t >= (AT[i] + AT[i + 1]) / 2) i++;
		if (i !== beat) {
			beat = i;
			world?.enter(BEATS[i].scene);
		}
		if (!inFlight) aim = i;
		world?.show(Number(gsap.getProperty(laid.canvas, 'opacity')) > 0.001);
		world?.render();
		if (pen.p !== drawnAt) drawing?.seek((drawnAt = pen.p));
		const showing = Number(gsap.getProperty(laid.panels.film, 'opacity')) > 0.5;
		if (showing !== playing && film && !tube) {
			playing = showing;
			if (showing) film.play().catch(() => {});
			else {
				film.pause();
				film.currentTime = 0;
			}
		}
	}

	/**
	 * Where a hand on the wheel lands, as a share of the scroll: on the beat it has nearly reached, or
	 * else the next beat the way it was going. Never while the glasses are held, or the keys are flying.
	 * @param {number} value
	 */
	function land(value) {
		if (lenses.held || inFlight) return value;
		const t = value * END;
		const nearest = AT.reduce((best, at, i) => (Math.abs(at - t) < Math.abs(AT[best] - t) ? i : best), 0);
		if (Math.abs(AT[nearest] - t) < 0.12) return AT[nearest] / END;
		const forward = (timeline?.scrollTrigger?.direction ?? 1) > 0;
		let i = forward ? AT.findIndex((at) => at > t) : -1;
		if (!forward) for (let j = 0; j < N; j++) if (AT[j] < t) i = j;
		return AT[i < 0 ? nearest : i] / END;
	}

	/**
	 * Scrolls to beat `i`: off at once and easing in to land, so a key press is answered on the next
	 * frame; each turn's own parts ease within it.
	 * @param {number} i @param {number} [duration]
	 */
	function fly(i, duration) {
		const st = timeline?.scrollTrigger;
		if (!st) return;
		const forward = i > aim;
		aim = Math.min(N - 1, Math.max(0, i));
		flying?.kill();
		inFlight = true;
		const landed = () => (inFlight = false);
		flying = gsap.to(window, {
			scrollTo: { y: st.start + ((st.end - st.start) * AT[aim]) / END, autoKill: true, onAutoKill: landed },
			duration: reduced ? 0 : (duration ?? (forward ? (BEATS[aim].travel ?? 1.1) : 0.75)),
			ease: 'power2.out',
			onComplete: landed
		});
	}

	/** @param {HTMLElement} root */
	function deck(root) {
		gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
		/** @type {gsap.Context | null} */
		let context = null;
		let frame = 0;
		relayout = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				context?.revert();
				context = gsap.context(() => build(root), root);
			});
		};
		const observer = new ResizeObserver(() => relayout());
		observer.observe(/** @type {Element} */ (root.querySelector('.deck')));
		document.fonts.ready.then(() => relayout());
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
			relayout = () => {};
			flying?.kill();
			context?.revert();
			timeline = null;
		};
	}

	/** The world on the canvas behind the deck, once its pictures are in. @param {HTMLCanvasElement} canvas */
	function stage(canvas) {
		let gone = false;
		createWorld(canvas, PICTURES, pose, (name) => (over = name))
			.then((made) => {
				if (gone) return made.dispose();
				world = made;
				if (laid) world.resize(laid.w, laid.h, laid.stage);
				world.enter(BEATS[beat].scene);
				world.show(Number(gsap.getProperty(canvas, 'opacity')) > 0.001);
				world.render();
			})
			.catch((error) => console.warn('The stage is unavailable:', error));
		return () => {
			gone = true;
			world?.dispose();
			world = null;
		};
	}

	/** The film, or YouTube's copy when the file is not there (it is Gordon's own, see beats.js). @param {HTMLVideoElement} video */
	function reel(video) {
		const check = () => {
			if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) tube = true;
		};
		check();
		video.addEventListener('error', check);
		return () => video.removeEventListener('error', check);
	}

	/** The last scroll the page made on its own: held to while the glasses are carried to a window's edge. */
	let free = 0;
	function hold() {
		if (lenses.held) scrollTo(0, free);
		else free = scrollY;
	}

	/** The arrows, space, the page keys and a clicker turn the page; N shows the notes. @param {KeyboardEvent} event */
	async function key(event) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		const target = /** @type {HTMLElement} */ (event.target);
		if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A|VIDEO|IFRAME)$/.test(target.tagName) || target.isContentEditable) return;
		/** @type {Record<string, number>} */
		const turns = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, Enter: 1, ' ': event.shiftKey ? -1 : 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
		const turn = turns[event.key];
		if (turn) fly(aim + turn);
		else if (event.key === 'Home') fly(0, 0.6);
		else if (event.key === 'End') fly(N - 1, 0.6);
		else if (event.key === 'n' || event.key === 'N') {
			notes = !notes;
			await tick();
			relayout();
		} else return;
		event.preventDefault();
	}

	/** @param {PointerEvent} event */
	const point = (event) => laid && world?.point({ x: event.clientX - laid.left, y: event.clientY - laid.top });
	const two = (/** @type {number} */ n) => String(n).padStart(2, '0');
</script>

<svelte:head>
	<title>How a picture became me — Gordon Tu</title>
	<meta name="description" content="A five-minute talk: how the avatar on gordontu.com came alive." />
	<meta name="robots" content="noindex" />
</svelte:head>

<svelte:window onkeydown={key} onscroll={hold} />

<!-- The page scrolls a screen a beat (more where the way is the show); the deck stays, and shows the beat the scroll is on. -->
<div class="talk" style:--screens={END + 1} {@attach deck}>
	<div class="deck" role="presentation" onpointermove={point} onpointerleave={() => world?.point(null)}>
		<canvas class="world" aria-hidden="true" {@attach stage}></canvas>

		<header>
			<p><strong>Gordon Tu</strong> <span>How a picture became me</span></p>
			<p>
				{#if notes}<span class="clock">from {STEPS[current.step].at}</span>{/if}
				{two(beat + 1)} / {N}
			</p>
		</header>

		<section class="copy">
			<h1 class="sr-only">How a picture became me</h1>
			<p class="sr-only" aria-live="polite">{current.line} {current.sub ?? ''}</p>
			<div class="steps" aria-hidden="true">
				{#each STEPS as { name }, i (name)}
					<p class={['step', { first: !i }]}><span>{i + 1}</span> {name}</p>
				{/each}
			</div>
			<div class="blocks" aria-hidden="true">
				{#each BEATS as b, i (b.line)}
					<div class={['words', { first: !i }]}>
						<h2>{b.line}</h2>
						{#if b.glasses}<div class="slot"></div>{/if}
						{#if b.sub}<p class="sub">{b.sub}</p>{/if}
						{#if notes}<p class="say">{b.say}</p>{/if}
					</div>
				{/each}
			</div>
		</section>

		<div class="stage">
			<!-- The site itself, live: the avatar and the bio its glasses read. -->
			<div class="panel live" inert={layerOf(current.scene) !== 'live'}>
				<div class="site">
					<p class="hello">I’m Gordon. <Avatar /></p>
					<div class="bio"><About /></div>
				</div>
			</div>

			<!-- The landing's own drawing (Intro.svelte), drawn by the scroll. -->
			<div class="panel drawing" aria-hidden="true">
				<div class="paper"><Intro scrub bind:this={drawing} /></div>
			</div>

			<div class="panel evolution"><Evolution onlayout={() => relayout()} /></div>

			<div class="panel film" inert={layerOf(current.scene) !== 'film'}>
				{#if tube}
					<iframe title="Portfolio update 2026" src="https://www.youtube-nocookie.com/embed/{FILM.youtube}?rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
				{:else}
					<video bind:this={film} src={FILM.src} playsinline preload="metadata" controls {@attach reel}>
						<track kind="captions" />
					</video>
				{/if}
			</div>

			<div class="panel credits">
				<dl>
					{#each CREDITS as [role, names] (role)}
						<div><dt>{role}</dt><dd>{names}</dd></div>
					{/each}
					<p>Made by Gordon, with a small cast of very talented tools.</p>
				</dl>
			</div>

			<output class="read">{over ?? current.read}</output>
		</div>

		<nav class="rail" aria-label="Steps">
			{#each STEPS as { name }, i (name)}
				<button type="button" aria-current={i === current.step ? 'step' : undefined} onclick={() => fly(BEATS.findIndex((b) => b.step === i), 0.9)}>
					<span class="n">{i + 1}</span> <span class="name">{name}</span>
				</button>
			{/each}
		</nav>
	</div>
</div>

<style>
	/* Ink on white, in steps of alpha black: words, supporting words, labels, rules. */
	.talk {
		--ink: #000;
		--ink-2: rgb(0 0 0 / 0.64);
		--ink-3: rgb(0 0 0 / 0.56);
		--rule: rgb(0 0 0 / 0.1);
		--rule-2: rgb(0 0 0 / 0.18);
		--pad: clamp(1.25rem, 3.4vw, 4rem);
		--meta: clamp(0.8125rem, 0.95vw, 1rem);
		height: calc(var(--screens) * 100svh);
		color: var(--ink);
	}

	/* One screen: the words on the left, the stage on the right, the steps along the foot; the world behind it all. */
	.deck {
		position: sticky;
		top: 0;
		display: grid;
		grid-template:
			'head head' auto
			'copy stage' minmax(0, 1fr)
			'rail rail' auto / minmax(0, 5fr) minmax(0, 7fr);
		column-gap: var(--pad);
		height: 100svh;
		padding: clamp(1rem, 2.2vw, 2rem) var(--pad);
		overflow: hidden;
		background: #fff;
	}

	.world {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}

	header,
	.copy,
	.stage,
	.rail {
		position: relative;
	}

	header {
		grid-area: head;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: var(--meta);
		line-height: 1.4;
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}

	header strong {
		font-weight: 500;
		color: var(--ink);
	}

	header span {
		margin-left: 0.5em;
	}

	.clock {
		margin-right: 1.25em;
	}

	/* Every beat's words, and every step's name, laid in the same place; the timeline shows one. */
	.copy {
		grid-area: copy;
		align-self: center;
		display: grid;
		min-width: 0;
		padding: 2rem 0;
	}

	.steps,
	.blocks {
		display: grid;
	}

	.step,
	.words {
		grid-area: 1 / 1;
	}

	.blocks {
		margin-top: 1.25rem;
	}

	.words {
		align-self: start;
	}

	.step:not(.first),
	.words:not(.first),
	.panel {
		visibility: hidden;
		opacity: 0;
	}

	.step {
		font-size: var(--meta);
		font-weight: 500;
		line-height: 1.4;
	}

	.step span {
		margin-right: 0.5em;
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}

	h2 {
		font-size: clamp(1.875rem, 4vw, 4.25rem);
		font-weight: 500;
		line-height: 1.06;
		letter-spacing: -0.04em;
		text-wrap: balance;
	}

	/* Where the glasses are set down, under the line: as tall as they are held, as wide as they are. */
	.slot {
		height: clamp(3.75rem, 8.5vh, 6rem);
		aspect-ratio: 2.45;
		margin-top: 1.25rem;
	}

	.sub {
		max-width: 24em;
		margin-top: 1.1em;
		font-size: clamp(1.0625rem, 1.5vw, 1.625rem);
		line-height: 1.45;
		color: var(--ink-2);
		text-wrap: pretty;
	}

	.slot + .sub {
		margin-top: 1rem;
	}

	.say {
		max-width: 34em;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--rule);
		font-size: var(--meta);
		line-height: 1.5;
		color: var(--ink-2);
	}

	.stage {
		grid-area: stage;
		min-width: 0;
		min-height: 0;
		container-type: size;
	}

	.panel {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: #fff;
	}

	.read {
		position: absolute;
		top: 0;
		right: 0;
		font-size: var(--meta);
		line-height: 1.4;
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
		pointer-events: none;
	}

	/* The site at a size the room can read: the headline's avatar at 4em, the bio's second half under it. */
	.live {
		place-items: center start;
	}

	.site {
		width: min(100%, 30em);
		font-size: clamp(1.0625rem, 3.3cqw, 1.9rem);
		line-height: 1.5;
	}

	.hello {
		font-size: 1.25em;
		font-weight: 450;
		line-height: 2;
		letter-spacing: -0.02em;
		color: var(--color-obsidian);
	}

	.bio {
		margin-top: 1.2em;
		color: var(--color-stone);
	}

	/* Only the struck tool list and the hidden line, which the glasses are for. */
	.bio :global(p:first-child) {
		display: none;
	}

	.live :global(.scrambled) {
		color: var(--color-ash);
	}

	/* The sheet, as big as the world draws the avatar's, and the drawing's lines kept over its picture, so it stays crisp. */
	.paper {
		position: relative;
		width: 57cqmin;
		aspect-ratio: 1;
		overflow: clip;
		border: 1px solid var(--rule-2);
		border-radius: 6px;
	}

	.paper :global(.intro .lines) {
		opacity: 1 !important;
	}

	.evolution {
		display: block;
	}

	.film video,
	.film iframe {
		display: block;
		width: 100%;
		max-height: 100%;
		aspect-ratio: 16 / 9;
		border: 1px solid var(--rule);
		border-radius: 8px;
		background: #fff;
	}

	.credits {
		place-items: center start;
	}

	.credits dl {
		display: grid;
		gap: 1.25rem;
		font-size: clamp(1rem, 1.35vw, 1.5rem);
		line-height: 1.4;
	}

	.credits dt {
		font-size: var(--meta);
		color: var(--ink-3);
	}

	.credits dd {
		margin-top: 0.2em;
	}

	.credits p {
		max-width: 24em;
		margin-top: 0.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--rule);
		font-size: var(--meta);
		color: var(--ink-2);
	}

	/* The eight steps along the foot, the one we are on in ink and marked from above. */
	.rail {
		grid-area: rail;
		display: grid;
		grid-template-columns: repeat(8, minmax(0, 1fr));
		border-top: 1px solid var(--rule);
	}

	.rail button {
		margin-top: -1px;
		padding: 0.75rem 0 0;
		border: 0;
		border-top: 1px solid transparent;
		border-radius: 0;
		background: none;
		color: var(--ink-3);
		font-size: var(--meta);
		font-weight: 500;
		line-height: 1.4;
		text-align: left;
		cursor: pointer;
		transition: color 160ms var(--ease-out);
	}

	.rail button:hover,
	.rail button[aria-current] {
		color: var(--ink);
	}

	.rail button[aria-current] {
		border-top-color: var(--ink);
	}

	.rail .n {
		margin-right: 0.5em;
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}

	/* A phone: the stage above the words, and only the steps' numbers along the foot. */
	@media (max-width: 47.5rem) {
		.deck {
			grid-template:
				'head' auto
				'stage' minmax(0, 44svh)
				'copy' minmax(0, 1fr)
				'rail' auto / minmax(0, 1fr);
		}

		.copy {
			align-self: start;
			padding: 1.5rem 0 1rem;
		}

		.rail button {
			padding: 0.875rem 0 0.25rem;
		}

		.rail .name {
			display: none;
		}

		.credits {
			place-items: start;
			overflow-y: auto;
		}

		.credits dl {
			gap: 0.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rail button {
			transition: none;
		}
	}
</style>
