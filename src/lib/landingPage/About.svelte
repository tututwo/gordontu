<script module>
	import { gsap } from 'gsap';

	/**
	 * How wide each word of a text is, set in the page's own type: read off a hidden copy of it (one
	 * clipped line, but laid out all the same).
	 * @param {HTMLElement} copy an element holding just the text
	 */
	function widths(copy) {
		const text = /** @type {Text} */ (copy.firstChild);
		const range = document.createRange();
		let at = 0;
		return text.data.split(' ').map((word) => {
			range.setStart(text, at);
			range.setEnd(text, (at += word.length));
			at += 1;
			return range.getBoundingClientRect().width;
		});
	}

	/** @param {number | undefined} width */
	const px = (width) => (width ? `${width}px` : null);

	/**
	 * Kept between visits to the about tab (not between page loads): whether the afterword is decoded,
	 * so coming back to it plays it scrambling back into its cipher.
	 */
	const kept = { leftRead: false };

	/**
	 * Look-alikes by width. The reference's type is monospace, so its random letters sit exactly where
	 * the real ones do; in Geist a letter flickers through others of about its own width, so the letters
	 * after it stay where they are. (GSAP's ScrambleTextPlugin draws every letter from one set, which in
	 * a proportional face cuts letters at word edges and runs words together, so the scramble is our own
	 * GSAP tween.) Anything not in a set (punctuation, &) stays itself.
	 */
	// Geist's advances, measured, in groups within 0.04 em (most within 0.02): i j l I about 0.24 em, f t r
	// 0.33, s z 0.52, a c e k v x y 0.54, h n o u 0.57, b d g p q 0.585, m w 0.84; capitals likewise;
	// digits are tabular. M and W have no match, so they keep still.
	const ALIKE = ['ijlI', 'ftr', 'sz', 'acekvxy', 'hnou', 'bdgpq', 'mw', 'FJLTZ', 'EXY', 'KPS', 'ABRV', 'CDGHU', 'NOQ', '0123456789'];
	/** @param {string} text */
	const jumble = (text) =>
		text.replace(/[a-z0-9]/gi, (letter) => {
			const alike = ALIKE.find((set) => set.includes(letter)) ?? letter;
			return alike[Math.floor(Math.random() * alike.length)];
		});

	/**
	 * Shows a word found up to its `n`th letter, in the look it will keep (plain, or in `settle`'s
	 * class), and the rest as look-alikes, light (`.scrambled`), spaced as what they stand in for.
	 * @param {Element} span @param {string} text @param {number} n @param {string} settle
	 */
	function show(span, text, n, settle) {
		const found = text.slice(0, n);
		/** @type {(Node | string)[]} */
		const parts = [];
		if (n) parts.push(settle ? Object.assign(document.createElement('span'), { className: settle, textContent: found }) : found);
		if (n < text.length)
			parts.push(Object.assign(document.createElement('span'), { className: settle ? `scrambled ${settle}-like` : 'scrambled', textContent: jumble(text.slice(n)) }));
		span.replaceChildren(...parts);
	}

	/** The scramble running on each word, so a new one takes over from it (and leaving stops it). */
	const running = new WeakMap();
	/** @param {Element[]} spans */
	const stop = (spans) => spans.forEach((span) => running.get(span)?.kill());
</script>

<script>
	import { hint, lenses, under } from './Avatar.svelte';

	/** The new tools, which come in scrambled after the old ones are struck out. */
	const sentence = 'Claude Code, Codex & Jev across my toolkit to design and build interactive 2D&3D experiences.';
	const tools = sentence.split(' ');
	/**
	 * The bio's last line, an afterthought: it reads scrambled, and only the avatar's glasses read what
	 * it says.
	 */
	const afterword =
		'Alright, you really wanna know ha: I practice Chen- and Yang-style tai chi, play acoustic guitar, and I’m learning tango with my retired neighbor.';
	const words = afterword.split(' ');
	/**
	 * The afterword as it reads without the glasses: each small letter swapped for another of about its
	 * width (see `ALIKE`), capitals and punctuation kept, the same on the server as in the browser.
	 */
	const cipher = afterword
		.replace(/[a-z]/g, (letter, i) => {
			const alike = /** @type {string} */ (ALIKE.find((set) => set.includes(letter))).replace(/[^a-z]/g, '');
			return alike[(i * 7 + 3) % alike.length];
		})
		.split(' ');
	/**
	 * The scramble's pace, from the reference: its front reveals 40 letters a second (spaces included),
	 * and the letters not yet found change about every 30 ms; the lenses read a word calmly, slower on
	 * both counts.
	 */
	const RATE = 40;
	const FLICKER = 0.03;
	/** The pen's height through the struck list, of its letters' height: where it starts each line, and where it would end the whole list. */
	const SINK = [0.46, 0.62];
	/** Read, the afterword turns back into its scramble after this long on the page (s), or once the page is left. */
	const FORGET = 180;

	/** The Bio revision's pen: how far the scratch has run across the tool list, 0–1 along its run. */
	const bio = $state({ strike: 0 });
	let revising = $state(false);
	/** Left decoded last time: it comes back decoded, then scrambles into its cipher (see `revise`). */
	const cameBackRead = kept.leftRead;
	let revealed = $state(cameBackRead);
	/** Read once, on arrival: flipping it mid-visit leaves the page as it is rather than replaying it. */
	let reduced = false;
	/** Whether the cipher's spacing is measured: until then the afterword is hidden, and cannot scramble. */
	let ready = $state(false);
	/** The mouse over the afterword, if one is: where the drawn glasses go. @type {{ x: number, y: number } | null} */
	let mouse = null;
	/**
	 * Whether a finger is down on the afterword and has not started a scroll (the browser cancels the
	 * pointer when it takes over the pan), so lifting it is a tap (see `tapped`).
	 */
	let touched = false;
	/**
	 * A mouse over the scrambled afterword, where the glasses drawn in place of its pointer sit (see the
	 * `.glasses-pointer`); null when there is none.
	 * @type {{ x: number, y: number } | null}
	 */
	let pointing = $state(null);
	/** A pointer on the afterword: it reads dark and a little heavier until the pointer leaves, as in the reference. */
	let hovered = $state(false);
	/** Whether a lens has been over the afterword's words while the glasses were held. */
	let read = false;
	/** A timer, not a tween: three idle minutes should not keep GSAP drawing frames. @type {ReturnType<typeof setTimeout> | undefined} */
	let forgetting;
	/** The scratch: one straight stroke per line box of the <del>, and the stretch of the pen's run it takes. */
	/** @type {{ d: string, start: number, length: number }[]} */
	let strokes = $state.raw([]);
	/**
	 * The letter spacing that makes each word of the cipher as wide as the word it stands for (px), so
	 * it keeps the spacing of the sentence under it.
	 * @type {number[]}
	 */
	let fits = $state.raw([]);
	const clamp01 = gsap.utils.clamp(0, 1);
	/** @type {HTMLElement} */
	let del;
	/** The screen readers' copy of the afterword, and a hidden one of its cipher, to measure. @type {HTMLElement} */
	let wordsCopy;
	/** @type {HTMLElement} */
	let cipherCopy;
	/** The new tools as the page shows them, word by word. @type {HTMLElement} */
	let shownTools;
	/** The afterword's words as the page shows them: scrambled, until they are read. @type {HTMLElement} */
	let shownWords;
	/** @type {HTMLElement | undefined} */
	let secret = $state();

	/** The afterword as seen through the glasses: a mask of their lenses, in its own pixels. */
	const through = $derived.by(() => {
		if (revealed || !secret || !lenses.circles.length) return null;
		const box = secret.getBoundingClientRect();
		return lenses.circles
			.map(({ x, y, r }) => `radial-gradient(circle ${r}px at ${x - box.left}px ${y - box.top}px, #000 ${r - 0.5}px, transparent ${r}px)`)
			.join(', ');
	});

	/**
	 * The scramble, as in Gordon's reference recording: the whole text turns at once into light random
	 * letters (each of about the width of the one it stands in for, see `ALIKE`), changing every
	 * `FLICKER`, and one front sweeps across it left to right at `RATE`, each letter it passes landing
	 * as it will stay (plain, or in `settle`'s class), so only the word under the front is ever
	 * part-found. `calm` is how the lenses read one word: slower, easy on the eyes.
	 * @param {Element[]} spans
	 * @param {string[]} texts
	 * @param {{ settle?: string, calm?: boolean }} [how]
	 */
	function scramble(spans, texts, { settle = '', calm = false } = {}) {
		stop(spans);
		// Each word keeps the width it has now while it scrambles, so the line around it stays put; its
		// look-alike letters come within about 0.15 em of it. Settled, it is let go again.
		const held = spans.map((span) => span.getBoundingClientRect().width);
		spans.forEach((span, i) => (/** @type {HTMLElement} */ (span).style.width = `${held[i]}px`));
		const tl = gsap.timeline();
		const flicker = calm ? 0.14 : FLICKER;
		// Letters before the word, spaces included: how long the front takes to reach it.
		let before = 0;
		spans.forEach((span, i) => {
			const text = texts[i];
			const delay = calm ? 0 : before / RATE;
			const reveal = calm ? 0.9 : text.length / RATE;
			before += text.length + 1;
			let found = -1;
			let drawn = -Infinity;
			const tween = gsap.to(
				{},
				{
					duration: delay + reveal,
					onUpdate() {
						const time = this.time();
						const n = Math.round(clamp01((time - delay) / reveal) * text.length);
						if (n === found && time - drawn < flicker) return;
						found = n;
						drawn = time;
						show(span, text, n, settle);
					},
					onComplete: () => {
						show(span, text, text.length, settle);
						/** @type {HTMLElement} */ (span).style.width = '';
					}
				}
			);
			running.set(span, tween);
			tl.add(tween, 0);
		});
		return reduced ? tl.progress(1) : tl;
	}

	/**
	 * The words through the lenses. While the glasses are held, each word a lens comes over decodes,
	 * calmly, once for each time they are taken up.
	 * @param {HTMLElement} node
	 */
	function decoding(node) {
		const spans = [...node.children];
		/** @type {Set<Element>} */
		const decoded = new Set();
		$effect(() => {
			if (!lenses.held) {
				decoded.clear();
				return;
			}
			for (const span of spans.filter(under)) {
				if (decoded.has(span)) continue;
				decoded.add(span);
				read = true;
				scramble([span], [words[spans.indexOf(span)]], { calm: true });
			}
		});
		return () => stop(spans);
	}

	/**
	 * Let go of the glasses after reading, and the afterword decodes where it stands, until it turns back
	 * into its scramble.
	 */
	function reveal() {
		if (!ready || !read || revealed) return;
		read = false;
		revealed = kept.leftRead = true;
		pointing = null;
		scramble([...shownWords.children], words);
		forgetting = setTimeout(conceal, FORGET * 1000);
	}

	/** Back into its scramble, played rather than switched: after a while on the page, or once it is left. */
	function conceal() {
		if (!revealed) return;
		clearTimeout(forgetting);
		revealed = kept.leftRead = false;
		// A secret again: a mouse still resting on it is a pair of glasses again.
		pointing = mouse;
		scramble([...shownWords.children], cipher, { settle: 'cipher' });
	}

	/**
	 * Someone curious about the afterword while it is a secret: it scrambles, as the reference's menu
	 * does under the pointer, the avatar wonders at it and a mouse turns into a pair of glasses. Read
	 * (decoded), these hints have done their work and rest until it is a secret again; only the glasses
	 * still read it.
	 */
	function stir() {
		if (!ready || revealed) return;
		hint.wonder();
		pointing = mouse;
		scramble([...shownWords.children], cipher, { settle: 'cipher' });
	}

	/**
	 * While it is a secret, a mouse or pen coming over the afterword stirs it, and it reads dark until
	 * the pointer leaves. A finger's touch only stirs it if it is a tap (see `tapped`), not a scroll that
	 * starts on it.
	 * @param {PointerEvent} event
	 */
	function entered(event) {
		if (event.pointerType === 'touch' || revealed) return;
		hovered = true;
		point(event);
		stir();
	}

	function tapped() {
		if (touched) stir();
		touched = false;
	}

	/** @param {PointerEvent} event */
	function point(event) {
		if (event.pointerType !== 'mouse') return;
		mouse = { x: event.clientX, y: event.clientY };
		if (pointing) pointing = mouse;
	}

	function left() {
		hovered = false;
		mouse = pointing = null;
	}

	/**
	 * Plays the Bio revision forward from the start state the CSS below holds (unstruck list, no new
	 * tools) while scripting runs without reduced motion: after a beat a pen-like scratch sweeps across
	 * the tool list, and the new tools come in scrambled, word by word, and settle. The afterword is
	 * simply there, scrambled, from the start (or, left decoded last time, scrambles back into it). With
	 * reduced motion it jumps to the end.
	 * @param {HTMLElement} node
	 */
	function revise(node) {
		reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		// Taking over from the CSS failsafe that reveals the revision if this never runs.
		revising = true;

		// The list is struck in one stroke, in reading order at one speed, cut at its line breaks; on
		// each line the pen sinks a little as it goes (`SINK`, of the letters' height, over the whole
		// list's length), through the middle of the letters, and past the list's end it runs on a
		// little, but stops short of the next word on its line. Redrawn whenever the paragraph reflows,
		// as is the cipher's spacing.
		const measure = () => {
			const real = widths(wordsCopy);
			const faked = widths(cipherCopy);
			fits = real.map((width, i) => (width - faked[i]) / cipher[i].length);
			const box = node.getBoundingClientRect();
			const rects = [...del.getClientRects()];
			const last = rects.at(-1);
			const next = shownTools.getClientRects()[0];
			const room = last && next && Math.abs(next.top - last.top) < last.height / 2 ? next.left - last.right - 2 : Infinity;
			const overshoot = Math.max(0, Math.min((last?.height ?? 0) * 0.35, room));
			const total = rects.reduce((sum, rect) => sum + rect.width, 0) + overshoot;
			let run = 0;
			strokes = rects.map((rect, i) => {
				const length = rect.width + (i === rects.length - 1 ? overshoot : 0);
				const x = rect.left - box.left;
				/** @param {number} along px from the line's start */
				const y = (along) => rect.top - box.top + rect.height * (SINK[0] + ((SINK[1] - SINK[0]) * along) / total);
				const stroke = { d: `M${x} ${y(0)}L${x + length} ${y(length)}`, start: run / total, length: length / total };
				run += length;
				return stroke;
			});
		};
		const observer = new ResizeObserver(measure);
		let disposed = false;
		/** @type {gsap.core.Timeline | undefined} */
		let tl;
		/** Every word a scramble may be running on, to stop them all on leaving. @type {Element[]} */
		let scrambling = [];

		// Line boxes are only final once the web font has swapped in. A tab opened in the background has
		// no frames, and GSAP runs on frames: the revision plays when the tab is first seen.
		document.fonts.ready.then(() => {
			if (disposed) return;
			measure();
			ready = true;
			observer.observe(node);
			// A face that arrives later changes the words' widths even where the paragraph keeps its size.
			document.fonts.addEventListener('loadingdone', measure);
			// The glasses come closer over the afterword's words, secret or read (see Avatar's `CLOSER`).
			lenses.text = shownWords;
			scrambling = [...shownTools.children, ...shownWords.children];
			const newTools = [...shownTools.children];
			tl = gsap
				.timeline()
				.to(bio, { strike: 1, duration: 0.6, ease: 'power2.inOut' }, 0.8)
				.to(newTools, { opacity: 1, duration: 0.2 }, '+=0.2')
				.add(scramble(newTools, tools), '<');
			// Left decoded, it is back as the words, and a moment later scrambles into its cipher.
			if (cameBackRead) tl.call(conceal, [], 0.5);
			if (reduced) tl.progress(1);
		});

		return () => {
			disposed = true;
			lenses.text = null;
			tl?.kill();
			stop(scrambling);
			clearTimeout(forgetting);
			observer.disconnect();
			document.fonts.removeEventListener('loadingdone', measure);
		};
	}
</script>

<svelte:window onpointerup={reveal} onpointercancel={reveal} />
<svelte:document onvisibilitychange={() => document.hidden && conceal()} />

<p>
	I’m a design engineer based in the Bay Area. I’ve worked on design systems and AI workflows at VISA
	and turned complex research into visualization tools for Yale and UC Berkeley.
</p>

<p class={['revision', { revising }]} {@attach revise}>
	I use <del bind:this={del}>d3.js, three.js+GLSL/TSL, React&amp;Svelte, QGIS, Blender etc..</del>
	<!-- Read once as a sentence; the words one by one are only for the scramble. -->
	<ins
		><span class="sr-only">{sentence}</span><span class="words" aria-hidden="true" bind:this={shownTools}
			>{#each tools as word, i}{#if i}{' '}{/if}<span class="word">{word}</span>{/each}</span
		></ins
	>
	<svg class="scratch" aria-hidden="true">
		{#each strokes as { d, start, length }}
			<path {d} pathLength="1" style:stroke-dashoffset={1 - clamp01((bio.strike - start) / length)} />
		{/each}
	</svg>
</p>

<!-- The words themselves are for screen readers, find and copy; the scrambles are only to look at.
     A pointer over the afterword, or a tap on it, scrambles it and makes the avatar wonder. -->
<p
	class={['afterword', { ready, secret: !revealed, pointing, hovered }]}
	bind:this={secret}
	onpointerenter={entered}
	onpointermove={point}
	onpointerleave={left}
	onpointerdown={(event) => (touched = event.pointerType === 'touch')}
	onpointerup={tapped}
	onpointercancel={() => (touched = false)}
>
	<span class="sr-only" bind:this={wordsCopy}>{afterword}</span>
	<span class="sr-only" aria-hidden="true" bind:this={cipherCopy}>{cipher.join(' ')}</span>
	<span class="words" aria-hidden="true" bind:this={shownWords}
		>{#each cipher as word, i}{#if i}{' '}{/if}<span class="word" style:--fit={px(fits[i])}
				>{#if cameBackRead}{words[i]}{:else}<span class="cipher">{word}</span>{/if}</span
			>{/each}</span
	>
	{#if ready && through}<span class="through" aria-hidden="true" style:mask-image={through}
			><span {@attach decoding}
				>{#each words as word, i}{#if i}{' '}{/if}<span class="word">{word}</span>{/each}</span
			></span
		>{/if}
</p>

<!-- The mouse over the scramble, as a pair of glasses and a question mark that draw themselves in. -->
{#if pointing}
	<svg class="glasses-pointer" viewBox="0 0 44 32" aria-hidden="true" style:translate="{pointing.x - 20}px {pointing.y - 20}px">
		<g class="halo">
			<circle cx="7.3" cy="16.5" r="5.7" /><circle cx="24.7" cy="15.5" r="5.7" /><path d="M14.1 15.8 17.9 15.6" />
		</g>
		<circle class="rim" cx="7.3" cy="16.5" r="5.7" pathLength="1" />
		<circle class="rim" cx="24.7" cy="15.5" r="5.7" pathLength="1" style:--i={1} />
		<path class="bridge" d="M14.1 15.8 17.9 15.6" />
		<g class="query">
			<path d="M32.6 6.2C32.7 4.3 34.1 3.4 35.7 3.5C37.4 3.6 38.4 4.9 38.2 6.4C38 8 36.8 8.4 35.9 8.9C35.2 9.3 34.9 9.9 34.8 11" />
			<path class="point" d="M34.6 13.9h0" />
		</g>
	</svg>
{/if}

<style>
	p + p {
		margin-top: 1em;
	}

	.revision,
	.afterword {
		position: relative;
	}

	del,
	ins {
		text-decoration: none;
	}

	.words {
		user-select: none;
	}

	/*
	 * Each word is one box that never breaks, so a line wraps the same whether it is scrambling (held at
	 * its width, see `scramble`) or not; at rest it is as wide as its letters, like any word.
	 */
	.word {
		display: inline-block;
		white-space: nowrap;
	}

	/*
	 * The scramble's look, as in the reference, and all of it in the bio's own weight: letters go light
	 * while they flicker, and land in the look they keep, the bio's grey. At rest the cipher is light
	 * too. Pointed at, the afterword reads dark, and eases back when the pointer leaves. Scrambled
	 * letters are only to look at: selecting the paragraph copies the words themselves.
	 */
	p :global(.cipher),
	p :global(.scrambled) {
		color: var(--color-ash);
	}

	.afterword.hovered .words,
	.afterword.hovered :global(.cipher) {
		color: var(--color-obsidian);
	}

	.afterword .words,
	.afterword :global(.cipher) {
		transition: color 240ms var(--ease-out);
	}

	/* Until its cipher's spacing is measured, the afterword is not shown (it would shift). */
	@media (scripting: enabled) {
		.afterword:not(.ready) .words {
			opacity: 0;
			animation: bio-failsafe-shown 0s 5s forwards;
		}
	}

	/* The cipher, and letters flickering towards it, spaced out (or in) to fill its word's box. */
	.words > .word > :global(:is(.cipher, .cipher-like)) {
		letter-spacing: var(--fit, 0);
	}

	/*
	 * A hint over the scramble: the pointer turns into a pair of glasses. Drawn by the page for a mouse
	 * (`.glasses-pointer`), so it can draw itself in; this still one (2x for sharp screens) is for when
	 * the page's script is not running.
	 */
	@media (scripting: none) {
		.afterword.secret {
			cursor:
				url('/landing/glasses-cursor.svg') 16 16,
				help;
			cursor:
				image-set(url('/landing/glasses-cursor@2x.svg') 2x) 16 16,
				help;
		}
	}

	.afterword.pointing {
		cursor: none;
	}

	/*
	 * In the avatar's line: thin black rims, a white halo to read over the letters, and a question mark;
	 * drawn at 1.25x (55 by 40 px, the bridge on the pointer), its line still about a pixel.
	 */
	.glasses-pointer {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 10;
		width: 55px;
		height: 40px;
		overflow: visible;
		fill: none;
		stroke: var(--color-carbon);
		stroke-width: 0.8;
		stroke-linecap: round;
		pointer-events: none;
	}

	.glasses-pointer .halo {
		stroke: var(--color-pure-white);
		stroke-width: 2.2;
		stroke-opacity: 0.9;
	}

	.glasses-pointer .point {
		stroke-width: 1.5;
	}

	/* Coming over the words, the rims draw on, left then right, then the question mark rises, unhurried. */
	.rim {
		stroke-dasharray: 1;
		animation: draw-rim 260ms var(--ease-out) calc(var(--i, 0) * 70ms) backwards;
	}

	.bridge,
	.halo {
		animation: appear 160ms var(--ease-out) 60ms backwards;
	}

	.query {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: pop 560ms cubic-bezier(0.34, 1.4, 0.64, 1) 280ms backwards;
	}

	@keyframes draw-rim {
		from {
			stroke-dashoffset: 1;
		}
	}

	@keyframes appear {
		from {
			opacity: 0;
		}
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(2px) scale(0.5);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rim,
		.bridge,
		.halo,
		.query {
			animation: none;
		}
	}

	/* The words themselves laid over the scramble, and shown only inside the lenses. */
	.through {
		position: absolute;
		inset: 0;
		background: var(--color-pure-white);
	}

	.scratch {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.scratch path {
		fill: none;
		stroke: var(--color-carbon);
		stroke-width: 1;
		stroke-dasharray: 1;
	}

	/*
	 * The Bio revision's start state (the new tools not in yet), held only while the script that
	 * plays it can run. If that script never arrives, a zero-length animation shows the finished
	 * revision after 5 s; the script marks the revision `revising` on arrival and takes over (the
	 * afterword has its own gate, `ready`).
	 */
	@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
		del {
			animation: bio-failsafe-del 0s 5s forwards;
		}

		ins .word {
			opacity: 0;
			animation: bio-failsafe-shown 0s 5s forwards;
		}

		.revising :is(del, ins .word) {
			animation: none;
		}
	}

	@keyframes bio-failsafe-del {
		to {
			text-decoration-line: line-through;
		}
	}

	@keyframes bio-failsafe-shown {
		to {
			opacity: 1;
		}
	}

	/* No script, no drawn scratch: fall back to a plain strikethrough. */
	@media (scripting: none) {
		del {
			text-decoration: line-through;
		}
	}
</style>
