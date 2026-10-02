import { gsap } from 'gsap';

/**
 * The scramble, as in Gordon's reference recording: a word turns at once into light look-alike
 * letters, changing every `FLICKER` (s), and a front sweeps across it left to right at `RATE` letters
 * a second (spaces included), each letter it passes landing as it will stay. Our own GSAP tweens:
 * GSAP's ScrambleTextPlugin draws every letter from one set, which in a proportional face cuts
 * letters at word edges and runs words together (ADR-0006).
 */
export const RATE = 40;
const FLICKER = 0.03;

/**
 * Look-alikes by width. The reference's type is monospace, so its random letters sit exactly where
 * the real ones do; in Geist a letter flickers through others of about its own width, so the letters
 * after it stay where they are. Anything not in a set (punctuation, &) stays itself.
 */
// Geist's advances, measured, in groups within 0.04 em (most within 0.02): i j l I about 0.24 em, f t r
// 0.33, s z 0.52, a c e k v x y 0.54, h n o u 0.57, b d g p q 0.585, m w 0.84; capitals likewise;
// digits are tabular. M and W have no match, so they keep still.
export const ALIKE = ['ijlI', 'ftr', 'sz', 'acekvxy', 'hnou', 'bdgpq', 'mw', 'FJLTZ', 'EXY', 'KPS', 'ABRV', 'CDGHU', 'NOQ', '0123456789'];

/** @param {string} text */
const jumble = (text) =>
	text.replace(/[a-z0-9]/gi, (letter) => {
		const alike = ALIKE.find((set) => set.includes(letter)) ?? letter;
		return alike[Math.floor(Math.random() * alike.length)];
	});

const clamp01 = gsap.utils.clamp(0, 1);

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
export const stop = (spans) => spans.forEach((span) => running.get(span)?.kill());

/**
 * One word's scramble: look-alikes until `delay` (s), then over `reveal` (s) its letters land left to
 * right. It is held `width` (px) wide meanwhile, so the line around it stays put (its look-alikes
 * come within about 0.15 em of it), and let go once it has landed.
 * @param {HTMLElement} span
 * @param {string} text
 * @param {{ width: number, delay?: number, reveal: number, flicker?: number, settle?: string }} how
 */
export function scrambleWord(span, text, { width, delay = 0, reveal, flicker = FLICKER, settle = '' }) {
	running.get(span)?.kill();
	span.style.width = `${width}px`;
	show(span, text, 0, settle);
	let found = 0;
	let drawn = 0;
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
			onComplete() {
				show(span, text, text.length, settle);
				span.style.width = '';
			}
		}
	);
	running.set(span, tween);
	return tween;
}

/**
 * The page coming in: one front runs down all its lines together, left to right at `ACROSS` px a
 * second (about `RATE` letters of the bio), so every line decodes at once, in step.
 */
const ACROSS = 450;
/** Text not to scramble: hidden copies for screen readers, and what is typed or drawn rather than set. */
const SKIP = '.sr-only, textarea, select, svg, script, style';

/**
 * Scrambles in the text of `roots` that is on screen: all of it turns at once into light look-alikes,
 * and the lines decode together (see `ACROSS`). Meanwhile each word is a stand-in, held at its width,
 * so nothing moves; its text node waits beside it for screen readers, in a hidden span, and goes back
 * where it was once the last word has landed. A word the browser broke across lines (after a slash,
 * say) is a stand-in per line, so it breaks there still. Text beside a Svelte block's markers is left
 * as it is: moved, it could take the block's bounds with it.
 * @param {Element[]} roots
 */
export function scrambleIn(roots) {
	const range = document.createRange();
	/** @param {Text} node @param {number} from @param {number} to */
	const box = (node, from, to) => {
		range.setStart(node, from);
		range.setEnd(node, to);
		return range.getBoundingClientRect();
	};

	// Everything is measured first and changed after, so the page is laid out once.
	/** @type {{ node: Text, parts: (string | { text: string, box: DOMRect })[] }[]} */
	const plans = [];
	for (const root of roots) {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		for (let node; (node = /** @type {Text | null} */ (walker.nextNode())); ) {
			const parent = /** @type {Element} */ (node.parentElement);
			if (!/\S/.test(node.data) || parent.closest(SKIP) || [...parent.childNodes].some((n) => n.nodeType === Node.COMMENT_NODE)) continue;
			range.selectNodeContents(node);
			const whole = range.getBoundingClientRect();
			if (!whole.width || whole.bottom < 0 || whole.top > innerHeight) continue;
			/** @type {(string | { text: string, box: DOMRect })[]} */
			const parts = [];
			for (const { 0: run, index: at = 0 } of node.data.matchAll(/\s+|\S+/g)) {
				if (/\s/.test(run)) {
					parts.push(run);
					continue;
				}
				const whole = box(node, at, at + run.length);
				if (range.getClientRects().length < 2) {
					parts.push({ text: run, box: whole });
					continue;
				}
				let from = 0;
				let top = box(node, at, at + 1).top;
				for (let i = 1; i <= run.length; i++) {
					const next = i < run.length ? box(node, at + i, at + i + 1).top : NaN;
					if (next === top) continue;
					parts.push({ text: run.slice(from, i), box: box(node, at + from, at + i) });
					from = i;
					top = next;
				}
			}
			plans.push({ node, parts });
		}
	}

	const boxes = plans.flatMap(({ parts }) => parts.flatMap((part) => (typeof part === 'string' ? [] : [part.box])));
	const left = Math.min(...boxes.map((b) => b.left));
	const tl = gsap.timeline();
	/** @type {[Text, HTMLElement, HTMLElement][]} */
	const swapped = [];
	for (const { node, parts } of plans) {
		const shown = document.createElement('span');
		shown.setAttribute('aria-hidden', 'true');
		for (const part of parts) {
			if (typeof part === 'string') {
				shown.append(part);
				continue;
			}
			const word = document.createElement('span');
			word.style.cssText = 'display: inline-block; white-space: nowrap';
			shown.append(word);
			const { width } = part.box;
			tl.add(scrambleWord(word, part.text, { width, delay: (part.box.left - left) / ACROSS, reveal: Math.max(width / ACROSS, 0.01) }), 0);
		}
		const real = Object.assign(document.createElement('span'), { className: 'sr-only' });
		node.replaceWith(shown, real);
		real.append(node);
		swapped.push([node, shown, real]);
	}
	return tl.call(() => {
		for (const [node, shown, real] of swapped) {
			if (!real.isConnected) continue;
			real.replaceWith(node);
			shown.remove();
		}
	});
}
