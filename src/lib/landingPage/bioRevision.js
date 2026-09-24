const SVG = 'http://www.w3.org/2000/svg';

/**
 * The Bio revision, as an attachment on the bio paragraph. About.svelte's CSS holds the start state
 * (no highlight, untyped sentence) only while scripting runs without reduced motion, so this plays
 * it forward: after a beat a grey highlight and a pen-like scratch sweep across the tool list
 * together, then the <ins> is typed out behind a caret. The scratch is one straight stroke per line
 * box of the <del>, redrawn whenever the paragraph reflows. The motion preference is read once, on
 * arrival: flipping it mid-visit leaves the revision as it is rather than replaying it.
 * @param {HTMLElement} node
 */
export function bioRevision(node) {
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const del = /** @type {HTMLElement} */ (node.querySelector('del'));
	const svg = /** @type {SVGSVGElement} */ (node.querySelector('svg.scratch'));
	const chars = /** @type {HTMLElement[]} */ ([...node.querySelectorAll('ins .char')]);
	const strike = { p: reduced ? 1 : 0 };
	const typed = { n: 0 };
	/** @type {{ path: SVGPathElement, start: number, length: number }[]} */
	let strokes = [];
	// How far along the pen's run the highlight is complete: the stroke runs on past the list.
	let reach = 1;

	// The list is struck as if it were one unbroken line, then cut at its line breaks the way its
	// highlight is sliced: one stroke that sinks from 40% of the highlight's height to 72% across the
	// whole list (from the mockup) and runs half an em past its end (not past a line break, where it
	// would poke into the margin), so a wrapped list is struck in reading order at one speed.
	function layout() {
		const box = node.getBoundingClientRect();
		const rects = [...del.getClientRects()];
		const overshoot = (rects.at(-1)?.height ?? 0) * 0.35;
		const width = rects.reduce((sum, rect) => sum + rect.width, 0);
		const total = width + overshoot;
		let run = 0;
		svg.replaceChildren();
		strokes = rects.map((rect, i) => {
			const length = rect.width + (i === rects.length - 1 ? overshoot : 0);
			const x = rect.left - box.left;
			/** @param {number} at */
			const y = (at) => rect.top - box.top + rect.height * (0.4 + (0.32 * at) / total);
			const path = document.createElementNS(SVG, 'path');
			path.setAttribute('d', `M${x} ${y(run)}L${x + length} ${y(run + length)}`);
			path.setAttribute('pathLength', '1');
			svg.append(path);
			const stroke = { path, start: run / total, length: length / total };
			run += length;
			return stroke;
		});
		reach = width / total || 1;
		drawStrike();
	}

	// The highlight's front keeps pace with the pen until the pen runs past the end of the list.
	function drawStrike() {
		for (const { path, start, length } of strokes) {
			const drawn = Math.min(1, Math.max(0, (strike.p - start) / length));
			path.style.strokeDashoffset = String(1 - drawn);
		}
		del.style.backgroundSize = `${Math.min(1, strike.p / reach) * 100}% 100%`;
	}

	/** @param {number} n */
	function type(n) {
		chars.forEach((char, i) => {
			char.style.opacity = i < n ? '1' : '';
			char.classList.toggle('caret', i === n - 1);
		});
	}

	// Taking over from the CSS failsafe that reveals the revision if this never runs.
	node.classList.add('revising');
	const observer = new ResizeObserver(layout);
	/** @type {ReturnType<import('gsap').gsap['timeline']> | undefined} */
	let timeline;
	let disposed = false;

	// Line boxes are only final once the web font has swapped in. GSAP comes in lazily: the
	// revision waits a beat anyway, so the landing's first paint doesn't carry it.
	Promise.all([document.fonts.ready, reduced ? undefined : import('gsap')]).then(([, lib]) => {
		if (disposed) return;
		observer.observe(node);
		layout();
		if (!lib) return;
		const { gsap } = lib;

		timeline = gsap
			.timeline({ delay: 0.8 })
			.to(strike, { p: 1, duration: 0.6, ease: 'power2.inOut', onUpdate: drawStrike })
			.to(
				typed,
				{
					n: chars.length,
					duration: chars.length * 0.035,
					ease: 'none',
					onUpdate: () => type(Math.floor(typed.n))
				},
				'+=0.2'
			)
			// The caret blinks a few more times at the end of the sentence, then goes.
			.call(() => chars.at(-1)?.classList.remove('caret'), undefined, '+=1.6');
	}).catch((error) => {
		// GSAP failed to load: show the finished revision rather than leave the sentence hidden.
		console.warn('Bio revision unavailable:', error);
		if (disposed) return;
		strike.p = 1;
		layout();
		type(chars.length);
		chars.at(-1)?.classList.remove('caret');
	});

	return () => {
		disposed = true;
		timeline?.kill();
		observer.disconnect();
		node.classList.remove('revising');
		del.style.backgroundSize = '';
		for (const char of chars) {
			char.style.opacity = '';
			char.classList.remove('caret');
		}
	};
}
