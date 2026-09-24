<script>
	import { cubicInOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { lenses } from './Avatar.svelte';

	const sentence = 'Claude Code, Codex & Jev across my toolkit to design and build interactive 2D&3D experiences.';
	const typed = [...sentence];
	/**
	 * The bio's last line, an afterthought: once the revision has sat a beat a grey bar sweeps across it
	 * and keeps it, and only the avatar's glasses read what is under the bar.
	 */
	const afterword = 'Oh, and I practice Chen- and Yang-style tai chi and play acoustic guitar.';

	/**
	 * The Bio revision. The CSS below holds its start state (unstruck list, untyped sentence, no bar)
	 * only while scripting runs without reduced motion; `revise` plays it forward: after a beat a
	 * pen-like scratch sweeps across the tool list (`strike`, 0–1 along the pen's run), the <ins> is
	 * typed out behind a caret (`letters`), and then the bar sweeps over the afterword (`veil`).
	 */
	const strike = new Tween(0, { duration: 600, easing: cubicInOut });
	const letters = new Tween(0, { duration: typed.length * 35 });
	const shown = $derived(Math.floor(letters.current));
	const veil = new Tween(0, { duration: 600, easing: cubicInOut });
	let revising = $state(false);
	let caret = $state(true);
	/** The scratch: one straight stroke per line box of the <del>, and the stretch of the pen's run it takes. */
	/** @type {{ d: string, start: number, length: number }[]} */
	let strokes = $state.raw([]);
	/** @type {HTMLElement} */
	let del;
	/** @type {HTMLElement | undefined} */
	let secret = $state();

	/** The afterword as seen through the glasses: a mask of their lenses, in its own pixels. */
	const through = $derived.by(() => {
		if (!secret || !lenses.circles.length) return null;
		const box = secret.getBoundingClientRect();
		return lenses.circles
			.map(({ x, y, r }) => `radial-gradient(circle ${r}px at ${x - box.left}px ${y - box.top}px, #000 ${r - 0.5}px, transparent ${r}px)`)
			.join(', ');
	});

	/**
	 * The motion preference is read once, on arrival: flipping it mid-visit leaves the revision as it
	 * is rather than replaying it.
	 * @param {HTMLElement} node
	 */
	function revise(node) {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			strike.set(1, { duration: 0 });
			veil.set(1, { duration: 0 });
		}
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
		/** @type {ReturnType<typeof setTimeout> | undefined} */
		let timer;

		// Line boxes are only final once the web font has swapped in.
		document.fonts.ready.then(async () => {
			if (disposed) return;
			observer.observe(node);
			if (reduced) return;
			// A tab opened in the background has no frames: the revision plays when it is first seen.
			await new Promise(requestAnimationFrame);
			await strike.set(1, { delay: 800 });
			await letters.set(typed.length, { delay: 200 });
			// The caret waits at the end of the revision for a beat while the bar covers the afterword.
			await veil.set(1, { delay: 1500 });
			// The caret blinks a few more times at the end of the sentence, then goes.
			timer = setTimeout(() => (caret = false), 1600);
		});

		return () => {
			disposed = true;
			clearTimeout(timer);
			observer.disconnect();
		};
	}
</script>

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
					class={['char', { caret: caret && i === shown - 1 }]}
					style:opacity={i < shown ? 1 : null}>{char}</span
				>{/each}</span
		></ins
	>
	<svg class="scratch" aria-hidden="true">
		{#each strokes as { d, start, length }}
			<path {d} pathLength="1" style:stroke-dashoffset={1 - Math.min(1, Math.max(0, (strike.current - start) / length))} />
		{/each}
	</svg>
</p>

<!-- Under the bar the words are only transparent, so screen readers, find and copy still have them. -->
<p class={['afterword', { revising }]} bind:this={secret}>
	<span class="veil" style:background-size={revising ? `${veil.current * 100}% 100%` : null}>{afterword}</span>
	{#if through}<span class="through" aria-hidden="true" style:mask-image={through}><span>{afterword}</span></span
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

	/* One bar sliced across the line breaks, not one per line: if the afterword wraps, the sweep runs
	   on from the end of one line to the start of the next. The words under it are never drawn. */
	.veil,
	.through > span {
		padding: 0.125em 0.1em;
	}

	.veil {
		border-radius: 0.17em;
		color: transparent;
		background: linear-gradient(#ececec, #ececec) no-repeat;
	}

	/* The same words laid over the bar, set exactly as it is, and shown only inside the lenses. */
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
	 * The Bio revision's start state (and the afterword's, not yet barred), held only while the script
	 * that plays it can run. If that script never arrives, a zero-length animation shows the finished
	 * revision after 5 s; the script marks both paragraphs `revising` on arrival and takes over.
	 */
	@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
		del {
			animation: bio-failsafe-del 0s 5s forwards;
		}

		.char {
			opacity: 0;
			animation: bio-failsafe-char 0s 5s forwards;
		}

		.veil {
			background-size: 0% 100%;
			animation: bio-failsafe-veil 0s 5s forwards;
		}

		.revising :is(del, .char, .veil) {
			animation: none;
		}
	}

	@keyframes bio-failsafe-del {
		to {
			text-decoration-line: line-through;
		}
	}

	@keyframes bio-failsafe-veil {
		to {
			background-size: 100% 100%;
		}
	}

	@keyframes bio-failsafe-char {
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
