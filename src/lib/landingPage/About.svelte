<script>
	import { cubicInOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	const sentence = 'Claude Code, Codex & Jev across my toolkit to design and build interactive 2D&3D experiences.';
	const typed = [...sentence];
	/** The bio's last line, an afterthought: typed on by the same caret once the revision has sat a beat. */
	const afterword = 'Oh I practice Chen&Yang style Taiji and acoustic guitar.';
	const afterTyped = [...afterword];

	/**
	 * The Bio revision. The CSS below holds its start state (no highlight, untyped sentence) only while
	 * scripting runs without reduced motion; `revise` plays it forward: after a beat a grey highlight
	 * and a pen-like scratch sweep across the tool list together (`strike`, 0–1 along the pen's run),
	 * then the <ins> is typed out behind a caret (`letters`).
	 */
	const strike = new Tween(0, { duration: 600, easing: cubicInOut });
	const letters = new Tween(0, { duration: typed.length * 35 });
	const shown = $derived(Math.floor(letters.current));
	const afterLetters = new Tween(0, { duration: afterTyped.length * 35 });
	const afterShown = $derived(Math.floor(afterLetters.current));
	let revising = $state(false);
	let caret = $state(true);
	/** The scratch: one straight stroke per line box of the <del>, and the stretch of the pen's run it takes. */
	/** @type {{ d: string, start: number, length: number }[]} */
	let strokes = $state.raw([]);
	/** How far along the pen's run the highlight is complete: the stroke runs on past the list. */
	let reach = $state(1);
	/** @type {HTMLElement} */
	let del;

	/**
	 * The motion preference is read once, on arrival: flipping it mid-visit leaves the revision as it
	 * is rather than replaying it.
	 * @param {HTMLElement} node
	 */
	function revise(node) {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) strike.set(1, { duration: 0 });
		// Taking over from the CSS failsafe that reveals the revision if this never runs.
		revising = true;

		// The list is struck as if it were one unbroken line, then cut at its line breaks the way its
		// highlight is sliced: one stroke that sinks from 40% of the highlight's height to 72% across the
		// whole list (from the mockup) and runs half an em past its end (not past a line break, where it
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
			reach = width / total || 1;
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
			// The caret waits at the end of the revision for a beat, then types the afterword.
			await afterLetters.set(afterTyped.length, { delay: 1500 });
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
	I use <del
		bind:this={del}
		style:background-size={revising ? `${Math.min(1, strike.current / reach) * 100}% 100%` : null}
		>d3.js, three.js+GLSL/TSL, React&amp;Svelte, QGIS, Blender etc..</del
	>
	<!-- Read once as a sentence; the per-letter copy is only for the typing. -->
	<ins
		><span class="sr-only">{sentence}</span><span aria-hidden="true"
			>{#each typed as char, i}<span
					class={['char', { caret: caret && afterShown === 0 && i === shown - 1 }]}
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

<p class={{ revising }}>
	<span class="sr-only">{afterword}</span><span aria-hidden="true"
		>{#each afterTyped as char, i}<span
				class={['char', { caret: caret && i === afterShown - 1 }]}
				style:opacity={i < afterShown ? 1 : null}>{char}</span
			>{/each}</span
	>
</p>

<style>
	p {
		margin: 0;
	}

	p + p {
		margin-top: 1em;
	}

	.revision {
		position: relative;
	}

	/* One highlight sliced across the line breaks, not one per line: if the list wraps, the sweep
	   runs on from the end of one line to the start of the next. */
	del {
		padding: 0.125em 0.1em;
		border-radius: 0.17em;
		background: linear-gradient(#ececec, #ececec) no-repeat;
		text-decoration: none;
	}

	ins {
		text-decoration: none;
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
	 * The Bio revision's start state (and the untyped afterword's), held only while the script that
	 * plays it can run. If that script never arrives, a zero-length animation shows the finished
	 * revision after 5 s; the script marks both paragraphs `revising` on arrival and takes over.
	 */
	@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
		del {
			background-size: 0% 100%;
			animation: bio-failsafe-del 0s 5s forwards;
		}

		.char {
			opacity: 0;
			animation: bio-failsafe-char 0s 5s forwards;
		}

		.revising :is(del, .char) {
			animation: none;
		}
	}

	@keyframes bio-failsafe-del {
		to {
			background-size: 100% 100%;
			text-decoration-line: line-through;
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
