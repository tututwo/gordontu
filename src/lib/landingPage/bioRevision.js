const SVG = 'http://www.w3.org/2000/svg';

/**
 * The Bio revision, as an attachment on the bio paragraph. The page's CSS holds the start state
 * (no highlight, untyped sentence) only while scripting runs without reduced motion, so this plays
 * it forward: after a beat the tool list gets its grey highlight and a pen-like scratch, then the
 * <ins> sentence is typed out behind a caret. The scratch is one straight stroke per line box of
 * the <del>, redrawn whenever the paragraph reflows. The motion preference is read once, on
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

	function layout() {
		const box = node.getBoundingClientRect();
		svg.replaceChildren();
		let total = 0;
		const rects = [...del.getClientRects()];
		strokes = rects.map((rect, i) => {
			// From the mockup: the stroke enters at 40% of the highlight's height, leaves at 72%, and
			// runs half an em past the end of the list (not past a line break, where it would poke
			// into the margin).
			const overshoot = i === rects.length - 1 ? rect.height * 0.35 : 0;
			const x0 = rect.left - box.left;
			const x1 = rect.right - box.left + overshoot;
			const y0 = rect.top - box.top + rect.height * 0.4;
			const y1 = rect.top - box.top + rect.height * 0.72;
			const path = document.createElementNS(SVG, 'path');
			path.setAttribute('d', `M${x0} ${y0}L${x1} ${y1}`);
			path.setAttribute('pathLength', '1');
			svg.append(path);
			const length = Math.hypot(x1 - x0, y1 - y0);
			const stroke = { path, start: total, length };
			total += length;
			return stroke;
		});
		for (const stroke of strokes) {
			stroke.start /= total;
			stroke.length /= total;
		}
		drawStrike();
	}

	// Each line's stroke picks up where the previous one ends, so a wrapped list is struck in reading order.
	function drawStrike() {
		for (const { path, start, length } of strokes) {
			const drawn = Math.min(1, Math.max(0, (strike.p - start) / length));
			path.style.strokeDashoffset = String(1 - drawn);
		}
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
			// From the highlight's own grey at zero alpha: GSAP would fade from `transparent` as black.
			.fromTo(
				del,
				{ backgroundColor: 'rgba(236, 236, 236, 0)' },
				{ backgroundColor: '#ececec', duration: 0.3, ease: 'power1.out' }
			)
			.to(strike, { p: 1, duration: 0.55, ease: 'power2.inOut', onUpdate: drawStrike }, '<')
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
		del.style.backgroundColor = '#ececec';
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
		del.style.backgroundColor = '';
		for (const char of chars) {
			char.style.opacity = '';
			char.classList.remove('caret');
		}
	};
}
