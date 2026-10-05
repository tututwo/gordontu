<script>
	import { gsap } from 'gsap';
	import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import About from '$lib/landingPage/About.svelte';
	import Avatar, { lenses } from '$lib/landingPage/Avatar.svelte';
	import Intro from '$lib/landingPage/Intro.svelte';
	import face from '$lib/landingPage/face.png';
	import glasses from '$lib/landingPage/glasses.png';
	import down from '$lib/landingPage/looking-down.webp';
	import up from '$lib/landingPage/looking-up.webp';
	import { BEATS, CREDITS, FILM, STEPS } from '$lib/talk/beats.js';
	import keyDown from '$lib/talk/keyframe-down.webp';
	import keyUp from '$lib/talk/keyframe-up.webp';
	import keyWonder from '$lib/talk/keyframe-wonder.webp';
	import { POSES, createWorld } from '$lib/talk/world.js';

	/*
	 * The talk, as one page that turns itself: the deck stays put while the page scrolls under it,
	 * and the scroll drives one GSAP timeline, a beat a page. The arrow keys (or a clicker) scroll
	 * from beat to beat; a hand on the wheel lands on the nearest one. On the stage, the world
	 * (world.js) is scrubbed by the timeline, and the page's own panels, the live avatar, the drawing,
	 * the film and the credits, cut in where a beat calls for them.
	 */

	const N = BEATS.length;
	/** Which of the stage's panels each scene is on. @type {Record<string, string>} */
	const PANELS = { live: 'live', paper: 'drawing', drawn: 'drawing', day: 'drawing', film: 'film', credits: 'credits' };
	const panelOf = (/** @type {string} */ scene) => PANELS[scene] ?? 'world';
	/** The world's pose in each beat: its own, or under a panel the picture's, ready to come back. */
	const poses = BEATS.map(({ scene }) => POSES[scene] ?? POSES.picture);
	/** Where a cut from the world to a panel falls in a turn, and one from a panel to the world. */
	const CUT = { out: 0.88, in: 0.12 };

	/** The beat on screen. */
	let beat = $state(0);
	const current = $derived(BEATS[beat]);
	/** The panel showing on the stage. */
	let panel = $state(panelOf(BEATS[0].scene));
	/** What the pointer is over on the stage. @type {string | null} */
	let over = $state(null);
	/** Gordon's lines and the clock, for rehearsing (N). */
	let notes = $state(false);
	/** The film, from YouTube when Gordon's own copy is not there. */
	let tube = $state(false);

	/** The world's pose, moved by the timeline. */
	const pose = { ...POSES.picture };
	/** How far the drawing is drawn, likewise. */
	const sketch = { p: 0.02 };
	/** @type {import('$lib/talk/world.js').World | null} */
	let world = null;
	/** @type {gsap.core.Timeline} */
	let timeline;
	/** @type {Intro | undefined} */
	let drawing;
	/** @type {HTMLVideoElement | undefined} */
	let film = $state();
	/** The scroll from beat to beat, while it is under way. @type {gsap.core.Tween | null} */
	let flying = null;
	const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	/**
	 * Builds the timeline: a label a beat, and between beats the world moving from one pose to the next.
	 * Lifting and meshing come late in a turn and go early, so the camera has moved before anything
	 * rises, and everything is back down before it moves again; the glasses come off early and go back
	 * on late, so the face is bare before it is meshed. Around a cut, the world moves on the side of the
	 * turn it is seen.
	 * @param {HTMLElement} root
	 */
	function build(root) {
		timeline = gsap.timeline({
			defaults: { ease: 'power2.inOut', immediateRender: false },
			scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: reduced ? true : 0.4 },
			onUpdate: turned
		});
		const LATE = new Set(['lift', 'wire']);
		const EARLY = new Set(['carry']);
		timeline.to({}, { duration: N - 1 }, 0);
		BEATS.forEach((b, i) => {
			timeline.addLabel(String(i), i);
			if (!i) return;
			const [from, to] = [poses[i - 1], poses[i]];
			const [before, after] = [panelOf(BEATS[i - 1].scene), panelOf(b.scene)];
			const start = before === 'world' && after !== 'world' ? 0.08 : after === 'world' && before !== 'world' ? 0.2 : 0.12;
			const span = 0.72;
			for (const key of /** @type {(keyof typeof from)[]} */ (Object.keys(to))) {
				if (from[key] === to[key]) continue;
				const grows = to[key] > from[key];
				const part = LATE.has(key) || EARLY.has(key) ? 0.6 : 1;
				const delayed = LATE.has(key) ? grows : EARLY.has(key) ? !grows : false;
				timeline.fromTo(pose, { [key]: from[key] }, { [key]: to[key], duration: span * part }, i - 1 + start + (delayed ? span * (1 - part) : 0));
			}
			if (b.scene === 'drawn') timeline.fromTo(sketch, { p: 0.02 }, { p: 1, duration: 0.86, ease: 'none' }, i - 1 + 0.07);
		});
	}

	/** Follows the timeline: the beat on screen, the panel on the stage, and the world redrawn. */
	function turned() {
		const t = timeline.time();
		const i = Math.min(N - 1, Math.max(0, Math.round(t)));
		if (i !== beat) {
			beat = i;
			world?.enter(BEATS[i].scene);
		}
		if (!flying?.isActive()) aim = i;
		const a = Math.min(N - 2, Math.floor(t));
		const [before, after] = [panelOf(BEATS[a].scene), panelOf(BEATS[a + 1].scene)];
		const cut = before === after ? 2 : before === 'world' ? CUT.out : after === 'world' ? CUT.in : 0.5;
		const showing = t - a < cut ? before : after;
		if (showing !== panel) {
			panel = showing;
			if (film && !tube) showing === 'film' ? film.play().catch(() => {}) : (film.pause(), (film.currentTime = 0));
		}
		world?.draw();
		drawing?.seek(sketch.p);
	}

	/** The beat the keys last asked for, so quick presses count on from it. */
	let aim = 0;

	/** Scrolls to beat `i`, over `duration` (s). @param {number} i @param {number} [duration] @param {string} [ease] */
	function fly(i, duration, ease = 'power2.inOut') {
		aim = Math.min(N - 1, Math.max(0, i));
		const { start, end } = timeline.scrollTrigger ?? { start: 0, end: 0 };
		flying?.kill();
		flying = gsap.to(window, {
			scrollTo: { y: start + ((end - start) * aim) / (N - 1), autoKill: true },
			duration: reduced ? 0 : (duration ?? (aim > beat ? BEATS[aim].travel : undefined) ?? 1.1),
			ease
		});
	}

	/** A hand on the wheel lets go: land on the next beat the way it was going, or back on this one. */
	function settle() {
		const st = timeline.scrollTrigger;
		if (!st || flying?.isActive() || lenses.held) return;
		const p = st.progress * (N - 1);
		const to = st.direction > 0 ? Math.ceil(p - 0.12) : Math.floor(p + 0.12);
		if (Math.abs(p - to) > 0.002) fly(to, Math.min(0.6, 0.25 + Math.abs(p - to) * 0.5), 'power1.inOut');
	}

	/** @param {HTMLElement} root */
	function deck(root) {
		gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
		const context = gsap.context(() => build(root), root);
		ScrollTrigger.addEventListener('scrollEnd', settle);
		return () => {
			ScrollTrigger.removeEventListener('scrollEnd', settle);
			flying?.kill();
			context.revert();
		};
	}

	/** The world on the stage's canvas, once its drawings are in. @param {HTMLCanvasElement} canvas */
	function stage(canvas) {
		let gone = false;
		const observer = new ResizeObserver(([entry]) => world?.resize(entry.contentRect.width, entry.contentRect.height));
		createWorld(canvas, { face, glasses, up, down, keyUp, keyDown, keyWonder }, pose, (name) => (over = name))
			.then((made) => {
				if (gone) return made.dispose();
				world = made;
				world.enter(BEATS[beat].scene);
				observer.observe(canvas);
			})
			.catch((error) => console.warn('The stage is unavailable:', error));
		return () => {
			gone = true;
			observer.disconnect();
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
	function key(event) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		const target = /** @type {HTMLElement} */ (event.target);
		if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A|VIDEO|IFRAME)$/.test(target.tagName) || target.isContentEditable) return;
		const turn = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, Enter: 1, ' ': event.shiftKey ? -1 : 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[event.key];
		if (turn) fly(aim + turn);
		else if (event.key === 'Home') fly(0, 0.6);
		else if (event.key === 'End') fly(N - 1, 0.6);
		else if (event.key === 'n' || event.key === 'N') notes = !notes;
		else return;
		event.preventDefault();
	}

	/** @param {PointerEvent} event */
	const point = (event) => world?.point({ x: event.offsetX, y: event.offsetY });
	const two = (/** @type {number} */ n) => String(n).padStart(2, '0');
</script>

<svelte:head>
	<title>How a picture became me — Gordon Tu</title>
	<meta name="description" content="A five-minute talk: how the avatar on gordontu.com came alive." />
	<meta name="robots" content="noindex" />
</svelte:head>

<svelte:window onkeydown={key} onscroll={hold} />

<!-- The page scrolls a screen a beat; the deck stays, and shows the beat the scroll is on. -->
<div class="talk" style:--beats={N} {@attach deck}>
	<div class={['deck', { wide: current.scene === 'film' }]}>
		<header>
			<p><strong>Gordon Tu</strong> <span>How a picture became me</span></p>
			<p>
				{#if notes}<span class="clock">from {STEPS[current.step].at}</span>{/if}
				{two(beat + 1)} / {N}
			</p>
		</header>

		<section class="copy" aria-live="polite">
			{#key beat}
				<div class="words">
					<p class="step"><span>{current.step + 1}</span> {STEPS[current.step].name}</p>
					<h1>{current.line}</h1>
					{#if current.sub}<p class="sub">{current.sub}</p>{/if}
					{#if notes}<p class="say">{current.say}</p>{/if}
				</div>
			{/key}
		</section>

		<div class="stage">
			<canvas class={['world', { on: panel === 'world' }]} aria-hidden="true" onpointermove={point} onpointerleave={() => world?.point(null)} {@attach stage}></canvas>

			<!-- The site itself, live: the avatar and the bio its glasses read. -->
			<div class={['panel', 'live', { on: panel === 'live' }]} inert={panel !== 'live'}>
				<div class="site">
					<p class="hello">I’m Gordon. <Avatar /></p>
					<div class="bio"><About /></div>
				</div>
			</div>

			<!-- The landing's own drawing (Intro.svelte), sought by the scroll, and the day it plays once in. -->
			<div class={['panel', 'drawing', { on: panel === 'drawing', day: current.scene === 'day' }]} aria-hidden="true">
				<div class="paper"><Intro scrub bind:this={drawing} /></div>
				<div class="hours">{#each { length: 24 }, hour}<i class={{ lit: !hour }}></i>{/each}</div>
			</div>

			<div class={['panel', 'film', { on: panel === 'film' }]} inert={panel !== 'film'}>
				{#if tube}
					<iframe title="Portfolio update 2026" src="https://www.youtube-nocookie.com/embed/{FILM.youtube}?rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
				{:else}
					<video bind:this={film} src={FILM.src} playsinline preload="metadata" controls {@attach reel}>
						<track kind="captions" />
					</video>
				{/if}
			</div>

			<div class={['panel', 'credits', { on: panel === 'credits' }]}>
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
				<button type="button" aria-current={i === current.step ? 'step' : undefined} onclick={() => fly(BEATS.findIndex((b) => b.step === i), 0.8)}>
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
		height: calc(var(--beats) * 100svh);
		color: var(--ink);
	}

	/* One screen: the words on the left, the stage on the right, the steps along the foot. */
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
		transition: grid-template-columns 320ms var(--ease-out);
	}

	/* The film is wide: the words make room for it. */
	.deck.wide {
		grid-template-columns: minmax(0, 3fr) minmax(0, 9fr);
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

	.copy {
		grid-area: copy;
		align-self: center;
		min-width: 0;
		padding: 2rem 0;
	}

	.words {
		animation: arrive 240ms var(--ease-out) both;
	}

	@keyframes arrive {
		from {
			opacity: 0;
			translate: 0 0.5rem;
		}
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

	h1 {
		margin-top: 1.25rem;
		font-size: clamp(1.875rem, 4.2vw, 4.5rem);
		font-weight: 500;
		line-height: 1.06;
		letter-spacing: -0.04em;
		text-wrap: balance;
	}

	.sub {
		max-width: 24em;
		margin-top: 1.1em;
		font-size: clamp(1.0625rem, 1.5vw, 1.625rem);
		line-height: 1.45;
		color: var(--ink-2);
		text-wrap: pretty;
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
		position: relative;
		min-width: 0;
		min-height: 0;
		container-type: size;
	}

	.world,
	.panel {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 200ms var(--ease-out),
			visibility 0s 200ms;
	}

	.world.on,
	.panel.on {
		opacity: 1;
		visibility: visible;
		transition: opacity 200ms var(--ease-out);
	}

	.world {
		display: block;
		touch-action: pan-y;
	}

	.panel {
		display: grid;
		place-items: center;
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

	/* The site at a size the room can read: the headline's avatar at 4em, the bio under it, as on gordontu.com. */
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

	/* Only the bio's second half: the struck tool list and the hidden line, which the glasses are for. */
	.bio :global(p:first-child) {
		display: none;
	}

	.live :global(.scrambled) {
		color: var(--color-ash);
	}

	/* The sheet, as big as the world draws it, and the drawing's lines kept over its picture, so it stays crisp at this size. */
	.drawing {
		align-content: center;
		row-gap: 1.5rem;
	}

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

	/* The day it plays once in: 24 hours, one of them lit. */
	.hours {
		display: flex;
		gap: 0.5rem;
		visibility: hidden;
	}

	.drawing.day .hours {
		visibility: visible;
	}

	.hours i {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		background: var(--rule-2);
	}

	.hours .lit {
		background: var(--ink);
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

	/* The eight steps along the foot, the one we are on in ink and underlined from above. */
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
		.deck,
		.deck.wide {
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
		.words,
		.deck,
		.world,
		.panel,
		.rail button {
			animation: none;
			transition: none;
		}
	}
</style>
