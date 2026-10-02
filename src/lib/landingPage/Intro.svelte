<script module>
	/**
	 * The Intro (CONTEXT.md). app.html's first script decides it, before anything is drawn: once per
	 * 24 hours in this browser it marks the page `data-intro="hold"`, which keeps everything but the
	 * avatar's place hidden (see the landing's layout and Avatar.svelte). Here the avatar draws itself
	 * (`drawing`), then the page shows, its text scrambling in (`reveal`), and the mark goes.
	 */
	const html = typeof document === 'undefined' ? null : document.documentElement;
	let show = () => {};
	/** Resolves once the page is shown: at once, or once the avatar has been drawn and the page's text has landed. */
	export const shown = html?.dataset.intro ? new Promise((resolve) => (show = () => resolve(undefined))) : Promise.resolve();
	/**
	 * Whether this page opens on the Intro, still to be played. If not (app.html's failsafe may have
	 * shown the page in the meantime), nothing waits for it.
	 */
	export function pending() {
		if (html?.dataset.intro === 'hold') return true;
		show();
		return false;
	}
</script>

<script>
	import { gsap } from 'gsap';
	import { frameLoop } from '../frameLoop.js';
	import face from './face.png';
	import glassesImage from './glasses.png';
	import { BRUSH, PEN, RIMS } from './introStrokes.js';
	import { scrambleIn } from './scramble.js';

	/** @type {{ onend: () => void }} */
	let { onend } = $props();

	/**
	 * One pen, one line at a time, unhurried, so each line is seen growing from nothing to its end: a
	 * line takes `STROKE` plus its length over `SPEED` (the drawing's px a second), easing in and out as
	 * a hand does, and a dot is pressed on over `DOT`. Between lines the pen lifts and moves to the next,
	 * taking `LIFT` plus the distance over `REACH`.
	 */
	const STROKE = 0.13;
	const SPEED = 375;
	const DOT = 0.12;
	const LIFT = 0.024;
	const REACH = 1875;
	/**
	 * Drawn, the colour is brushed on under the lines: the hand puts down the pen and takes up the brush
	 * (`TAKE_UP`, s), which sweeps back and forth this fast (px a second). Then, over `HANDOFF` (s), the
	 * drawing gives way to face.png and glasses.png themselves, lines, brush marks and all, and a beat
	 * later he blinks, once (`BLINK`: when, and for how long his eyes are shut, s).
	 */
	const TAKE_UP = 0.2;
	const BRUSHING = 1100;
	const HANDOFF = 0.2;
	const BLINK = { after: 0.15, shut: 0.1, then: 0.15 };
	/** The pen or brush, in its hand, comes into view and goes over this long (s). */
	const TOOL = 0.15;
	/**
	 * The drawing moves on by a frame's time, but by no more than this (ms): after a stall (the page
	 * still setting itself up, say) the hand goes on from where it was, rather than jumping ahead.
	 */
	const FRAME = 50;
	/** Hurried along (a tap, a key, a scroll), what is left of the drawing takes this long (s). */
	const HURRY = 0.3;

	/**
	 * Plays the drawing once the web font is in (so the avatar's place in the headline is final): the
	 * pen draws the drawing's lines one after another, then the glasses, and a brush paints the colour in
	 * under them. Then it is face.png and glasses.png, exactly as the avatar shows them, and the page is
	 * shown.
	 * @param {SVGSVGElement} svg
	 */
	function play(svg) {
		if (!html) return;
		// Taken over from app.html's failsafe, which would otherwise show the page.
		html.dataset.intro = 'drawing';
		const one = (/** @type {string} */ selector) => /** @type {Element} */ (svg.querySelector(selector));
		const paths = (/** @type {string} */ selector) => /** @type {NodeListOf<SVGPathElement>} */ (svg.querySelectorAll(selector));
		let ended = false;
		const tl = gsap.timeline({ paused: true });

		// The pen comes into view where the first line starts, then draws.
		let at = TOOL;
		tl.to(one('.pen-tool'), { opacity: 1, duration: TOOL }, 0);
		/**
		 * Where the hand is over the drawing's time, so the pen or brush can be drawn there: along a
		 * stroke as it grows, or on its way to the next one.
		 * @type {{ from: number, to: number, point: (p: number) => { x: number, y: number } }[]}
		 */
		const moves = [];
		const along = gsap.parseEase('sine.inOut');
		/** Where the hand left the page. @type {DOMPoint | undefined} */
		let lifted;
		/** Moves the hand to where a stroke starts, as long as the way there is; gives the stroke's length. @param {SVGPathElement} stroke */
		const reach = (stroke) => {
			const length = stroke.getTotalLength();
			const start = stroke.getPointAtLength(0);
			const from = lifted;
			if (from) {
				const duration = LIFT + Math.hypot(start.x - from.x, start.y - from.y) / REACH;
				const point = (/** @type {number} */ p) => ({ x: from.x + (start.x - from.x) * along(p), y: from.y + (start.y - from.y) * along(p) });
				moves.push({ from: at, to: (at += duration), point });
			}
			lifted = stroke.getPointAtLength(length);
			return length;
		};
		/**
		 * Draws a stroke from nothing to its end, the hand on its growing end. Not rounded: GSAP rounds px
		 * values to whole ones by default, and a stroke whose offset runs from 1 to 0 would then appear all
		 * at once, halfway.
		 * @param {SVGPathElement} stroke @param {number} length @param {number} duration
		 */
		const draw = (stroke, length, duration) => {
			tl.fromTo(stroke, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration, ease: along, autoRound: false }, at);
			moves.push({ from: at, to: (at += duration), point: (p) => stroke.getPointAtLength(length * along(p)) });
		};
		for (const line of paths('.lines path')) {
			const length = reach(line);
			if (line.classList.contains('dot')) {
				// A dot has no length to draw along: pressed on, it swells from nothing.
				const dot = line.getPointAtLength(0);
				tl.to(line, { strokeWidth: 2.4, duration: DOT, ease: 'power2.out', autoRound: false }, at);
				moves.push({ from: at, to: (at += DOT), point: () => dot });
			} else draw(line, length, STROKE + length / SPEED);
		}
		// The pen is put down where it stopped, and the brush taken up where it starts.
		const down = lifted;
		if (down) moves.push({ from: at, to: at + TAKE_UP / 2, point: () => down });
		tl.to(one('.pen-tool'), { opacity: 0, duration: TAKE_UP / 2 }, at);
		tl.to(one('.brush-tool'), { opacity: 1, duration: TAKE_UP / 2 }, at + TAKE_UP / 2);
		at += TAKE_UP;
		lifted = undefined;
		// Its tuft carries the paint it lays: the hair's, then the skin's.
		const tuft = one('.tuft');
		paths('.colour path').forEach((sweep, i) => {
			tl.set(tuft, { fill: i ? '#f8d5b8' : '#261c1c' }, at);
			const length = reach(sweep);
			draw(sweep, length, length / BRUSHING);
		});
		tl.to(one('.brush-tool'), { opacity: 0, duration: TOOL }, at);
		tl.to([one('.picture'), one('.glasses')], { opacity: 1, duration: HANDOFF }, at);
		tl.to(one('.lines'), { opacity: 0, duration: HANDOFF }, at);
		// Drawn, he blinks.
		at += HANDOFF + BLINK.after;
		tl.set(one('.lids'), { opacity: 1 }, at).set(one('.lids'), { opacity: 0 }, (at += BLINK.shut));
		tl.set({}, {}, at + BLINK.then);

		const hand = one('.hand');
		const clamp01 = gsap.utils.clamp(0, 1);
		/** Puts the pen or brush where the hand is at time `t` of the drawing. @param {number} t */
		const place = (t) => {
			const move = moves.find((m) => t < m.to) ?? moves[moves.length - 1];
			const { x, y } = move.point(clamp01((t - move.from) / (move.to - move.from)));
			hand.setAttribute('transform', `translate(${x} ${y})`);
		};
		place(0);

		/** How fast the drawing plays: as drawn, or hurried along. */
		let rate = 1;
		let hurried = false;
		const clampFrame = gsap.utils.clamp(0, FRAME);
		const loop = frameLoop((dt) => {
			tl.time(tl.time() + (clampFrame(dt) / 1000) * rate);
			place(tl.time());
			if (tl.progress() < 1) return true;
			end();
			return false;
		});

		function hurry() {
			if (hurried) return;
			hurried = true;
			window.posthog.capture?.('intro_skipped', { at: Math.round(tl.time() * 10) / 10 });
			rate = Math.max(rate, (tl.duration() - tl.time()) / HURRY);
		}
		const hurryOn = /** @type {const} */ (['pointerdown', 'keydown', 'wheel', 'touchmove']);
		for (const type of hurryOn) addEventListener(type, hurry, { passive: true });
		document.fonts.ready.then(() => {
			if (!ended) loop.start();
		});

		/** The page is shown and the avatar is its own again. */
		function end() {
			if (ended) return;
			ended = true;
			finish();
		}

		/**
		 * Shows the page, its text scrambling in, every line at once (scramble.js); once it has landed,
		 * what waited for it goes on (WebGL, the icons).
		 */
		function finish() {
			if (!html) return;
			html.dataset.intro = 'reveal';
			onend();
			scrambleIn([...document.querySelectorAll('[data-reveal]')]).eventCallback('onComplete', () => {
				if (html.dataset.intro === 'reveal') delete html.dataset.intro;
				show();
			});
		}

		return () => {
			loop.stop();
			tl.kill();
			for (const type of hurryOn) removeEventListener(type, hurry);
			// Gone before it ended (a hot reload, say): the page is shown as it is.
			if (!ended) {
				ended = true;
				finish();
			}
		};
	}
</script>

<svg class="intro" viewBox="0 0 134 134" aria-hidden="true" {@attach play}>
	<defs>
		<!-- The brush's paint is face.png itself, so each sweep leaves the drawing's own colours. -->
		<pattern id="intro-paint" patternUnits="userSpaceOnUse" width="134" height="134">
			<image href={face} width="134" height="134" />
		</pattern>
		<!-- A brush's edge, not a marker's: the sweeps' edges waver a little. -->
		<filter id="intro-bristles" x="-10%" y="-10%" width="120%" height="120%">
			<feTurbulence type="fractalNoise" baseFrequency="0.3" numOctaves="2" seed="2" />
			<feDisplacementMap in="SourceGraphic" scale="2" xChannelSelector="R" yChannelSelector="G" />
		</filter>
	</defs>
	<g class="colour" filter="url(#intro-bristles)">{#each BRUSH as d (d)}<path {d} pathLength="1" />{/each}</g>
	<image class="picture" href={face} width="134" height="134" />
	<g class="lines">
		{#each PEN as d (d)}<path class={{ dot: d.endsWith('h0') }} {d} pathLength="1" />{/each}
		{#each RIMS as d (d)}<path class="rim" {d} pathLength="1" />{/each}
	</g>
	<!-- His eyes shut, for the blink: skin over each eye's dot, and a line where it was. -->
	<g class="lids">
		<ellipse cx="51.3" cy="58.9" rx="2.3" ry="2.1" />
		<ellipse cx="80.8" cy="57.9" rx="2.3" ry="2.1" />
		<path d="M49.7 59Q51.3 60 52.9 59" />
		<path d="M79.2 58Q80.8 59 82.4 58" />
	</g>
	<image class="glasses" href={glassesImage} width="134" height="134" />
	<!-- The hand's pen and brush, drawn in the drawing's line, slanted as held, their points where it draws. -->
	<g class="hand">
		<g class="pen-tool" transform="rotate(45) scale(1.4)">
			<path d="M0 0-3.6-8.5C-4.2-10-3.6-11.8-2.8-13H2.8C3.6-11.8 4.2-10 3.6-8.5Z" />
			<path d="M0-1V-6.6" />
			<circle cy="-7.8" r="1" />
			<rect x="-3.4" y="-19" width="6.8" height="6" rx="1" />
		</g>
		<g class="brush-tool" transform="rotate(45) scale(1.4)">
			<path class="tuft" d="M0 0C-1.6-1.6-4-5-4-8.5H4C4-5 1.6-1.6 0 0Z" />
			<rect x="-4.2" y="-12.5" width="8.4" height="4" rx="0.6" />
			<path d="M-3.4-12.5-2.2-30Q0-31.6 2.2-30L3.4-12.5Z" />
		</g>
	</g>
</svg>

<style>
	/* Over the avatar, whose own layers are hidden meanwhile (Avatar.svelte). */
	.intro {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Each line undrawn, and drawn as its offset goes to 0. The gap is twice the line, so an undrawn one
	   shows nothing: with a gap only as long, a round cap would leave a dot where the next dash starts. */
	.lines path,
	.colour path {
		stroke-dasharray: 1 2;
		stroke-dashoffset: 1;
	}

	/* The drawing's own line: its colour, and about its weight; the glasses' rims finer. */
	.lines {
		stroke: #140606;
		stroke-width: 1.7;
	}

	.rim {
		stroke-width: 1.1;
	}

	/* A dot has no length to draw along: pressed on, it swells from nothing (see `play`). */
	.dot {
		stroke-width: 0;
	}

	/* A broad brush, wide enough that its sweeps overlap. */
	.colour path {
		stroke: url(#intro-paint);
		stroke-width: 12;
	}

	.picture,
	.glasses,
	.lids,
	.pen-tool,
	.brush-tool {
		opacity: 0;
	}

	.lids ellipse {
		fill: #f8d5b8;
	}

	.lids path {
		stroke: #140606;
		stroke-width: 1.1;
	}

	/* White, so the hand's tool hides what it is over, outlined in the drawing's line. */
	.pen-tool,
	.brush-tool {
		fill: #fff;
		stroke: #140606;
		stroke-width: 0.8;
	}

	.tuft {
		fill: #261c1c;
	}
</style>
