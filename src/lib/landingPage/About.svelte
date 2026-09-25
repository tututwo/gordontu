<script module>
	import { gsap } from 'gsap';
	import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

	gsap.registerPlugin(ScrambleTextPlugin);
</script>

<script>
	import { hint, lenses, under } from './Avatar.svelte';

	const sentence = 'Claude Code, Codex & Jev across my toolkit to design and build interactive 2D&3D experiences.';
	const typed = [...sentence];
	/**
	 * The bio's last line, an afterthought: once the revision has sat a beat it comes in scrambled, and
	 * only the avatar's glasses read what it says.
	 */
	const afterword =
		'Alright, you really wanna know ha: I practice Chen- and Yang-style tai chi, play acoustic guitar, and I’m learning tango with my retired neighbor.';
	const words = afterword.split(' ');
	/**
	 * The afterword as it reads without the glasses: each small letter swapped for another of about its
	 * width, so it wraps as the words do, and the same on the server as in the browser.
	 */
	const cipher = afterword
		.replace(/[a-z]/g, (letter, i) => {
			const alike = ['ijl', 'frt', 'mw', 'abcdeghknopqsuvxyz'].find((set) => set.includes(letter)) ?? letter;
			return alike[(i * 7 + 3) % alike.length];
		})
		.split(' ');
	/** Read through the glasses, the afterword stays decoded for a day on this browser, then is a secret again. */
	const READ = { key: 'afterword-read', for: 24 * 60 * 60 * 1000 };

	/**
	 * The Bio revision, played on arrival by one timeline (see `revise`): how far the scratch has run
	 * across the tool list (0–1 along the pen's run), how many letters of the <ins> are typed, and the
	 * caret after them.
	 */
	const bio = $state({ strike: 0, letters: 0, caret: true });
	const shown = $derived(Math.floor(bio.letters));
	let revising = $state(false);
	let revealed = $state(false);
	/** Read once, on arrival: flipping it mid-visit leaves the page as it is rather than replaying it. */
	let reduced = false;
	/** The scratch: one straight stroke per line box of the <del>, and the stretch of the pen's run it takes. */
	/** @type {{ d: string, start: number, length: number }[]} */
	let strokes = $state.raw([]);
	/** @type {HTMLElement} */
	let del;
	/** @type {HTMLElement | undefined} */
	let secret = $state();
	/** The afterword's words as the page shows them: scrambled, until they are read. @type {HTMLElement} */
	let shownWords;

	/** The afterword as seen through the glasses: a mask of their lenses, in its own pixels. */
	const through = $derived.by(() => {
		if (revealed || !secret || !lenses.circles.length) return null;
		const box = secret.getBoundingClientRect();
		return lenses.circles
			.map(({ x, y, r }) => `radial-gradient(circle ${r}px at ${x - box.left}px ${y - box.top}px, #000 ${r - 0.5}px, transparent ${r}px)`)
			.join(', ');
	});

	/**
	 * The scramble from the reference: word after word, left to right, each span flickers through
	 * random letters (light grey, as `.scrambled`) and settles on its entry in `texts`, wrapped in
	 * `settle`'s class if one is given.
	 * @param {Element[]} spans
	 * @param {string[]} texts
	 */
	function scramble(spans, texts, settle = '') {
		const tl = gsap.timeline();
		spans.forEach((span, i) =>
			tl.to(span, { duration: 0.4, overwrite: 'auto', scrambleText: { text: texts[i], chars: 'lowerCase', oldClass: 'scrambled', newClass: settle } }, i * 0.03)
		);
		return reduced ? tl.progress(1) : tl;
	}

	/** Whether a lens has been over the words while the glasses were held. */
	let read = false;

	/**
	 * The words through the lenses, which the avatar's face watches. While the glasses are held, each
	 * word a lens comes over decodes, as the reference's menu does under the pointer.
	 * @param {HTMLElement} node
	 */
	function decoding(node) {
		lenses.text = node;
		const spans = [...node.children];
		/** @type {Element[]} */
		let seen = [];
		$effect(() => {
			const now = lenses.held ? spans.filter(under) : [];
			for (const span of now) if (!seen.includes(span)) scramble([span], [words[spans.indexOf(span)]]);
			seen = now;
			read ||= now.length > 0;
		});
		return () => {
			lenses.text = null;
		};
	}

	/**
	 * Let go of the glasses after reading, and the afterword decodes where it stands, for good (cutting
	 * short its arrival, if it was still coming in).
	 */
	function reveal() {
		if (!read || revealed) return;
		revealed = true;
		const spans = [...shownWords.children];
		gsap.set(spans, { opacity: 1, overwrite: true });
		scramble(spans, words);
		try {
			localStorage.setItem(READ.key, String(Date.now()));
		} catch {
			// Without storage it is a secret again on the next visit.
		}
	}

	function readRecently() {
		try {
			return Date.now() - Number(localStorage.getItem(READ.key)) < READ.for;
		} catch {
			return false;
		}
	}

	/**
	 * Plays the Bio revision forward from the start state the CSS below holds (unstruck list, untyped
	 * sentence, no afterword) while scripting runs without reduced motion: after a beat a pen-like
	 * scratch sweeps across the tool list, the <ins> is typed out behind a caret, and a beat later the
	 * afterword comes in word by word, scrambled (or decoded, if it was read in the last day). With
	 * reduced motion it jumps to the end.
	 * @param {HTMLElement} node
	 */
	function revise(node) {
		reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		revealed = readRecently();
		// Taking over from the CSS failsafe that reveals the revision if this never runs.
		revising = true;

		// The list is struck as if it were one unbroken line, then cut at its line breaks: one stroke that
		// sinks from 40% of its letters' height to 72% across the whole list (from the mockup) and runs half an em past its end (not past a line break, where it
		// would poke into the margin), so a wrapped list is struck in reading order at one speed.
		// Redrawn whenever the paragraph reflows.
		const observer = new ResizeObserver(() => {
			const box = node.getBoundingClientRect();
			const rects = [...del.getClientRects()];
			const overshoot = (rects.at(-1)?.height ?? 0) * 0.35;
			const width = rects.reduce((sum, rect) => sum + rect.width, 0);
			const total = width + overshoot;
			let run = 0;
			strokes = rects.map((rect, i) => {
				const length = rect.width + (i === rects.length - 1 ? overshoot : 0);
				const x = rect.left - box.left;
				/** @param {number} at */
				const y = (at) => rect.top - box.top + rect.height * (0.4 + (0.32 * at) / total);
				const stroke = { d: `M${x} ${y(run)}L${x + length} ${y(run + length)}`, start: run / total, length: length / total };
				run += length;
				return stroke;
			});
		});
		let disposed = false;
		/** @type {gsap.core.Timeline | undefined} */
		let tl;

		// Line boxes are only final once the web font has swapped in. A tab opened in the background has
		// no frames, and GSAP runs on frames: the revision plays when the tab is first seen.
		document.fonts.ready.then(() => {
			if (disposed) return;
			observer.observe(node);
			const spans = [...shownWords.children];
			tl = gsap
				.timeline()
				.to(bio, { strike: 1, duration: 0.6, ease: 'power2.inOut' }, 0.8)
				.to(bio, { letters: typed.length, duration: typed.length * 0.035, ease: 'none' }, '+=0.2')
				// The caret waits at the end of the revision for a beat while the afterword comes in.
				.to(spans, { opacity: 1, duration: 0.4, stagger: 0.03 }, '+=1.5')
				.add(revealed ? scramble(spans, words) : scramble(spans, cipher, 'scrambled'), '<')
				// The caret blinks a few more times at the end of the sentence, then goes.
				.set(bio, { caret: false }, '+=1.6');
			if (reduced) tl.progress(1);
		});

		return () => {
			disposed = true;
			tl?.kill();
			observer.disconnect();
		};
	}
</script>

<svelte:window onpointerup={reveal} onpointercancel={reveal} />

<p>
	I’m a design engineer based in the Bay Area. I’ve worked on design systems and AI workflows at VISA
	and turned complex research into visualization tools for Yale and UC Berkeley.
</p>

<p class={['revision', { revising }]} {@attach revise}>
	I use <del bind:this={del}>d3.js, three.js+GLSL/TSL, React&amp;Svelte, QGIS, Blender etc..</del>
	<!-- Read once as a sentence; the per-letter copy is only for the typing. -->
	<ins
		><span class="sr-only">{sentence}</span><span aria-hidden="true"
			>{#each typed as char, i}<span
					class={['char', { caret: bio.caret && i === shown - 1 }]}
					style:opacity={i < shown ? 1 : null}>{char}</span
				>{/each}</span
		></ins
	>
	<svg class="scratch" aria-hidden="true">
		{#each strokes as { d, start, length }}
			<path {d} pathLength="1" style:stroke-dashoffset={1 - Math.min(1, Math.max(0, (bio.strike - start) / length))} />
		{/each}
	</svg>
</p>

<!-- The words themselves are for screen readers, find and copy; the scrambles are only to look at.
     A pointer over the scramble, or a tap on it, nudges the avatar to show where to look. -->
<p class={['afterword', { revising }]} bind:this={secret}>
	<span class="sr-only">{afterword}</span>
	<span class="words" aria-hidden="true" bind:this={shownWords} onpointerenter={() => revealed || hint.peek()}
		>{#each cipher as word, i}{#if i}{' '}{/if}<span><span class="scrambled">{word}</span></span>{/each}</span
	>
	{#if through}<span class="through" aria-hidden="true" style:mask-image={through}
			><span {@attach decoding}>{#each words as word, i}{#if i}{' '}{/if}<span>{word}</span>{/each}</span></span
		>{/if}
</p>

<style>
	p {
		margin: 0;
	}

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

	/* Scrambled letters are lighter, as in the reference, and only to look at: selecting the paragraph
	   copies the words themselves. */
	.afterword :global(.scrambled) {
		color: #bcbcbc;
	}

	.words {
		user-select: none;
	}

	/* The words themselves laid over the scramble, and shown only inside the lenses. */
	.through {
		position: absolute;
		inset: 0;
		background: var(--paper);
	}

	.char {
		position: relative;
	}

	.char.caret::after {
		position: absolute;
		top: 0.05em;
		bottom: -0.1em;
		left: 100%;
		width: 1px;
		content: '';
		background: currentColor;
		animation: blink 1s steps(1) infinite;
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
		stroke: #000;
		stroke-width: 1;
		stroke-dasharray: 1;
	}

	/*
	 * The Bio revision's start state (and the afterword's, not yet in), held only while the script
	 * that plays it can run. If that script never arrives, a zero-length animation shows the finished
	 * revision after 5 s; the script marks both paragraphs `revising` on arrival and takes over.
	 */
	@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
		del {
			animation: bio-failsafe-del 0s 5s forwards;
		}

		.char,
		.words > span {
			opacity: 0;
			animation: bio-failsafe-shown 0s 5s forwards;
		}

		.revising :is(del, .char, .words > span) {
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

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
