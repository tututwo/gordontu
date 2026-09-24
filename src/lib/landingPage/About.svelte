<script>
	import { bioRevision } from './bioRevision.js';

	const sentence = 'Claude Code, Codex & Jev across my toolkit to design and build interactive 2D&3D experiences.';
	const typed = [...sentence];
</script>

<p>
	I’m a design engineer based in the Bay Area. I’ve worked on design systems and AI workflows at VISA
	and turned complex research into visualization tools for Yale and UC Berkeley.
</p>

<p class="revision" {@attach bioRevision}>
	I use <del>d3.js, three.js+GLSL/TSL, React&amp;Svelte, QGIS, Blender etc..</del>
	<!-- Read once as a sentence; the per-letter copy is only for the typing. -->
	<ins
		><span class="sr-only">{sentence}</span><span aria-hidden="true"
			>{#each typed as char}<span class="char">{char}</span>{/each}</span
		></ins
	>
	<svg class="scratch" aria-hidden="true"></svg>
</p>

<p>Oh I practice Chen&amp;Yang style Taiji and acoustic guitar.</p>

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
	   runs on from the end of one line to the start of the next (see bioRevision.js). */
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

	.char:global(.caret)::after {
		position: absolute;
		top: 0.05em;
		bottom: -0.1em;
		left: 100%;
		width: 1px;
		content: '';
		background: currentColor;
		animation: blink 1s steps(1) infinite;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.scratch {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.scratch :global(path) {
		fill: none;
		stroke: #000;
		stroke-width: 1;
		stroke-dasharray: 1;
	}

	/*
	 * The Bio revision's start state, held only while the script that plays it can run. If that
	 * script never arrives, a zero-length animation shows the finished revision after 5 s; the
	 * script marks the paragraph `revising` on arrival and takes over.
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

		.revision:global(.revising) :is(del, .char) {
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
