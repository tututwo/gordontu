import { Spring } from './spring.js';

/**
 * The headline makes room for a magnified Category link icon. At rest the headline is plain HTML in the
 * browser's own layout. When a link's icon grows (from its top-left corner, to the right and down),
 * Pretext lays the sentence out again around it: the card stays where the link sits, so everything before
 * it stays put and the reading order holds; everything after it flows on past the card, and round it on
 * the lines it reaches down into, the way text wraps a floated image. The link's own label follows its
 * card: beside it (reaching past the column if the window has room), or on the next free line if not.
 *
 * It is laid out again every frame at the card's current size, so the words rewrap live as the card grows
 * and never pass through one another; they are moved by transform only, so the page itself never
 * reflows. The rest of the page slides down (on a spring) if the sentence needs another line.
 *
 * Pretext positions are only used as offsets between two of its own layouts (lit minus rest), so the
 * browser's rest layout stays the ground truth. If Pretext's rest line breaks disagree with the
 * browser's, the flow stays off and the icons fall back to magnifying over the sentence.
 */

/** Space kept between the card and the words flowing round it, in em; and from the window's edge. */
const GAP_X = 0.35;
const GAP_Y = 0.15;
const EDGE = 1;
/** The label's black bar reaches this far past its text (CategoryLink's .label padding), in em. */
const BAR = 0.2;
/** The page below slides down and back on this, so an added line never jolts it. */
const GLIDE = { tension: 260, friction: 31 };

/** @typedef {import('@chenglou/pretext/rich-inline').RichInlineItem} Item */
/** @typedef {import('@chenglou/pretext/rich-inline').RichInlineCursor} Cursor */

/**
 * One thing that moves as a whole: a word, the avatar, or a link, with any punctuation glued after it.
 * For a link, `label`/`frameOuter`/`labelItem` let the flow split it in two while it is lit.
 * @typedef {{
 *   els: HTMLElement[],
 *   item: Item,
 *   link: HTMLElement | null,
 *   label: HTMLElement | null,
 *   frame: DOMRect | null,
 *   frameOuter: number,
 *   labelItem: Item | null,
 *   restLine: number,
 *   restX: number,
 *   modelX: number,
 *   frameY: number
 * }} Unit
 */

/**
 * Where a layout put things: each unit (for a lit link, its card), each lit link's label, the top of
 * each line's words, and each card's top.
 * @typedef {{
 *   line: number[],
 *   x: number[],
 *   labelLine: Map<number, number>,
 *   labelX: Map<number, number>,
 *   anchor: number[],
 *   cardTop: Map<number, number>
 * }} Placement
 */

/** @param {HTMLElement} h1 */
export function headlineFlow(h1) {
	/** @type {typeof import('@chenglou/pretext/rich-inline') | undefined} */
	let pretext;
	/** @type {Unit[]} */
	let units = [];
	/** Per rest line: the top of its words, and whether it holds a link's frame (1) or not (0). */
	/** @type {number[]} */
	let anchors = [];
	/** @type {number[]} */
	let framed = [];
	/** A line of words is this tall; a frame on it adds `rise` above its words and `drop` below. */
	let lineHeight = 0;
	/** How much wider the browser's space between words is than Pretext's. */
	let spaceDrift = 0;
	let rise = 0;
	let drop = 0;
	let width = 0;
	let em = 16;
	let enabled = false;
	/** @type {HTMLElement[]} */
	let followers = [];
	/** Magnification, bracket pop and how far its black bar has wiped (0–1) of each lit link, by unit index. */
	/** @type {Map<number, { zoom: number, pop: number, bar: number }>} */
	const lit = new Map();
	const below = new Spring(0, GLIDE);
	let frame = 0;
	let last = 0;
	let dirty = false;
	let stale = false;
	let disposed = false;

	const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
	/** @param {Element} el */
	const fontOf = (el) => {
		const s = getComputedStyle(el);
		return `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
	};

	/** @param {string} text @param {string} font @param {number} letterSpacing */
	function measureText(text, font, letterSpacing) {
		if (!pretext) return 0;
		const prepared = pretext.prepareRichInline([{ text, font, letterSpacing }]);
		return pretext.layoutNextRichInlineLineRange(prepared, 1e6)?.width ?? 0;
	}

	/** Pretext's space between two words. @param {string} font @param {number} letterSpacing */
	function measureSpace(font, letterSpacing) {
		if (!pretext) return 0;
		const prepared = pretext.prepareRichInline([{ text: 'x', font, letterSpacing }, { text: ' x', font, letterSpacing }]);
		return pretext.layoutNextRichInlineLineRange(prepared, 1e6)?.fragments[1]?.gapBefore ?? 0;
	}

	/** Read the browser's rest layout into units and Pretext items, and check Pretext breaks alike. */
	function measure() {
		if (!pretext) return;
		const style = getComputedStyle(h1);
		em = parseFloat(style.fontSize);
		const spacing = parseFloat(style.letterSpacing) || 0;
		const box = h1.getBoundingClientRect();
		width = h1.clientWidth;

		/** @type {Unit[]} */
		const list = [];
		for (const el of /** @type {HTMLElement[]} */ ([...h1.children])) {
			// Is there a space before it? Skip Svelte's comment markers on the way back.
			let before = el.previousSibling;
			while (before && before.nodeType === Node.COMMENT_NODE) before = before.previousSibling;
			const spaced = before?.nodeType === Node.TEXT_NODE && /\s$/.test(before.textContent ?? '');
			const rect = el.getBoundingClientRect();
			const lead = spaced ? ' ' : '';
			if (!spaced && list.length) {
				// Punctuation glued to the element before it (the comma after a link) travels with it, as
				// part of its item: Pretext would otherwise let a line break between them.
				const unit = list[list.length - 1];
				const glued = rect.width;
				unit.els.push(el);
				unit.item.extraWidth = (unit.item.extraWidth ?? 0) + glued;
				if (unit.labelItem) unit.labelItem.extraWidth = (unit.labelItem.extraWidth ?? 0) + glued;
				continue;
			}
			// Each item carries the difference between the browser's width for it and Pretext's, so Pretext
			// breaks lines exactly where the browser did.
			const text = el.textContent ?? '';
			/** @type {Unit} */
			const unit = {
				els: [el],
				item: {
					text: lead + text,
					font: fontOf(el),
					letterSpacing: spacing,
					break: 'never',
					extraWidth: rect.width - measureText(text, fontOf(el), spacing)
				},
				link: null,
				label: null,
				frame: null,
				frameOuter: 0,
				labelItem: null,
				restLine: 0,
				restX: rect.left - box.left,
				modelX: 0,
				frameY: 0
			};
			if (el.matches('.category-link')) {
				// At rest a link is one atomic item: its label's text, plus the frame and its margin as width.
				const frameEl = /** @type {HTMLElement} */ (el.querySelector('.frame'));
				const label = /** @type {HTMLElement} */ (el.querySelector('.label'));
				const f = frameEl.getBoundingClientRect();
				const name = label.firstChild?.textContent ?? '';
				unit.link = el;
				unit.label = label;
				unit.frame = new DOMRect(f.left - box.left, f.top - box.top, f.width, f.height);
				unit.frameOuter = f.width + parseFloat(getComputedStyle(frameEl).marginRight);
				// The label's negative margins cancel its padding, so the link is as wide as frame plus name.
				const drift = rect.width - unit.frameOuter - measureText(name, fontOf(label), spacing);
				unit.item = { text: lead + name, font: fontOf(label), letterSpacing: spacing, break: 'never', extraWidth: unit.frameOuter + drift };
				unit.labelItem = { text: name, font: fontOf(label), letterSpacing: spacing, break: 'never', extraWidth: drift };
			} else if (el.matches('img')) {
				// The avatar is a box: a zero-width word joiner carrying its width.
				unit.item = { text: lead + '⁠', font: fontOf(h1), break: 'never', extraWidth: rect.width };
			}
			list.push(unit);
		}

		// The browser's lines: a unit that starts no further right than the one before begins a new line.
		let line = 0;
		list.forEach((unit, i) => {
			if (i && unit.restX <= list[i - 1].restX + 1) line++;
			unit.restLine = line;
		});

		// Lines are anchored by their words' tops, which share the line's baseline. A word is an inline
		// block as tall as the line-height, so it spans a line that holds nothing taller.
		anchors = [];
		lineHeight = em * 1.8;
		for (const unit of list) {
			if (unit.link || unit.els[0].matches('img')) continue;
			const r = unit.els[0].getBoundingClientRect();
			const k = unit.restLine;
			anchors[k] = Math.min(anchors[k] ?? Infinity, r.top - box.top);
			lineHeight = r.height;
		}
		// A frame is taller than a line of words, so the browser opens its line up above and below.
		framed = Array.from({ length: line + 1 }, (_, k) => +list.some((unit) => unit.link && unit.restLine === k));
		rise = drop = 0;
		for (const unit of list) {
			const f = unit.frame;
			if (!f || anchors[unit.restLine] === undefined) continue;
			const margin = parseFloat(getComputedStyle(/** @type {Element} */ (unit.link?.querySelector('.frame'))).marginTop);
			rise = Math.max(rise, anchors[unit.restLine] - (f.top - margin));
			drop = Math.max(drop, f.bottom + margin - (anchors[unit.restLine] + lineHeight));
		}
		for (let k = 0; k <= line; k++) {
			// A line holding only links or images takes the spacing of the line before.
			if (anchors[k] !== undefined) continue;
			const step = k >= 2 && anchors[k - 1] !== undefined && anchors[k - 2] !== undefined ? anchors[k - 1] - anchors[k - 2] : lineHeight;
			anchors[k] = (anchors[k - 1] ?? 0) + step;
		}
		for (const unit of list) if (unit.frame) unit.frameY = unit.frame.top - anchors[unit.restLine];

		// Between these inline blocks the browser's space is a fraction of a pixel wider than Pretext's.
		// Each spaced item carries the difference; a line's first item draws no space, so every line is
		// given that much back as slack.
		spaceDrift = 0;
		const pair = list.findIndex((unit, i) => i > 0 && unit.restLine === list[i - 1].restLine && list[i - 1].els.length === 1);
		if (pair > 0) {
			const prev = list[pair - 1];
			const gap = list[pair].restX - prev.restX - prev.els[0].getBoundingClientRect().width;
			spaceDrift = gap - measureSpace(fontOf(h1), spacing);
		}
		for (const unit of list) if (unit.item.text.startsWith(' ')) unit.item.extraWidth = (unit.item.extraWidth ?? 0) + spaceDrift;

		units = list;
		followers = /** @type {HTMLElement[]} */ ([...(h1.parentElement?.children ?? [])]).filter(
			(el) => h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
		);

		// Pretext's rest layout must break exactly as the browser did, or its offsets would be wrong.
		const rest = layout(new Map());
		enabled = units.every((unit, i) => rest.line[i] === unit.restLine);
		units.forEach((unit, i) => (unit.modelX = rest.x[i]));
		if (enabled) h1.dataset.flow = '';
		else delete h1.dataset.flow;
	}

	/**
	 * Lay the sentence out with each lit link's card grown to `side` px square from its frame's top-left.
	 * A lit link splits into its card, pinned where the link sits, and its label, which follows the card.
	 * @param {Map<number, number>} cards unit index → card side in px
	 * @returns {Placement}
	 */
	function layout(cards) {
		/** @type {Placement} */
		const out = { line: [], x: [], labelLine: new Map(), labelX: new Map(), anchor: [], cardTop: new Map() };
		if (!pretext) return out;
		/** @type {Item[]} */
		const items = [];
		/** What each item is: [unit index, 'unit' | 'card' | 'label']. */
		/** @type {[number, string][]} */
		const whose = [];
		units.forEach((unit, i) => {
			const side = cards.get(i);
			if (side === undefined || !unit.labelItem) {
				items.push(unit.item);
				whose.push([i, 'unit']);
				return;
			}
			const lead = unit.item.text.startsWith(' ') ? ' ' : '';
			const marginRight = unit.frameOuter - /** @type {DOMRect} */ (unit.frame).width;
			items.push({ text: lead + '⁠', font: unit.item.font, break: 'never', extraWidth: side + marginRight + (lead ? spaceDrift : 0) });
			whose.push([i, 'card']);
			items.push({ ...unit.labelItem, extraWidth: (unit.labelItem.extraWidth ?? 0) + barReach(i) });
			whose.push([i, 'label']);
		});
		const prepared = pretext.prepareRichInline(items);
		// How far past the column a label may reach to stay beside its card: to the window's edge.
		const right = h1.getBoundingClientRect().right;
		const spare = Math.max(0, document.documentElement.clientWidth - EDGE * em - right);

		/** Per line of this layout: whether it holds a frame (1) or not (0). */
		/** @type {number[]} */
		const hasFrame = [];
		/** Cards placed on the line being filled. */
		/** @type {number[]} */
		const fresh = [];
		/** @param {number} item @param {number} k @param {number} x */
		const put = (item, k, x) => {
			const [i, part] = whose[item];
			if (part === 'label') {
				out.labelLine.set(i, k);
				out.labelX.set(i, x);
			} else {
				out.line[i] = k;
				out.x[i] = x;
				if (units[i].link) hasFrame[k] = 1;
				if (part === 'card') fresh.push(i);
			}
		};
		/** A placed card's left edge, where its frame's is at rest. @param {number} i */
		const cardLeft = (i) => /** @type {DOMRect} */ (units[i].frame).left + out.x[i] - units[i].modelX;

		/** @type {Cursor | undefined} */
		let cursor;
		let done = false;
		for (let k = 0; !done && k < 64; k++) {
			// Where this line starts: its words' top if it holds no frame, its frames' top if it does (the
			// browser opens a framed line up by `rise`, so both land here). Spaced as at rest, adjusted for
			// lines above that gained or lost a frame; past the rest lines, as the browser would space them.
			hasFrame[k] = 0;
			const above = k ? hasFrame[k - 1] : 0;
			const top =
				k === 0
					? anchors[0] - rise * framed[0]
					: k < anchors.length
						? out.anchor[k - 1] + anchors[k] - anchors[k - 1] - rise * framed[k] + drop * (above - framed[k - 1])
						: out.anchor[k - 1] + lineHeight + drop * above;

			// This line's free stretches: all of it, less any card reaching down from a line above.
			/** @type {[number, number][]} */
			let free = [[0, width]];
			for (const [i, y] of out.cardTop) {
				const side = /** @type {number} */ (cards.get(i));
				if (top > y + side + GAP_Y * em) continue;
				const lo = cardLeft(i) - GAP_X * em;
				const hi = cardLeft(i) + side + GAP_X * em;
				free = free.flatMap(([a, b]) =>
					/** @type {[number, number][]} */ ([
						[a, Math.min(b, lo)],
						[Math.max(a, hi), b]
					]).filter(([c, d]) => d - c > 1)
				);
			}

			for (let s = 0; !done && s < free.length; s++) {
				let a = free[s][0];
				const b = free[s][1];
				while (!done) {
					const next = cursor ? cursor.itemIndex : 0;
					if (next >= items.length) {
						done = true;
						break;
					}
					const atBoundary = !cursor || (cursor.segmentIndex === 0 && cursor.graphemeIndex === 0);
					const [unitIndex, part] = whose[next];
					const unit = units[unitIndex];
					if (atBoundary && part === 'card' && unit.restLine === k) {
						// The card stays where the link sits, however much of the line it then needs.
						const x = Math.max(a, unit.modelX);
						put(next, k, x);
						a = x + (items[next].extraWidth ?? 0);
						cursor = { itemIndex: next + 1, segmentIndex: 0, graphemeIndex: 0 };
						continue;
					}
					// A label keeps to its card: beside it, reaching past the column if the window has room;
					// otherwise only in a stretch to the right of its card's left edge.
					let limit = b;
					if (atBoundary && part === 'label') {
						if (out.line[unitIndex] === k) limit = b + spare;
						else if (b <= cardLeft(unitIndex)) break;
					}
					const room = limit - a + spaceDrift;
					const range = pretext.layoutNextRichInlineLineRange(prepared, Math.max(1, room), cursor);
					if (!range) {
						done = true;
						break;
					}
					// Pretext always places at least one item, even one too wide, and may split a word to do
					// it. Only a full-width line may overflow; otherwise leave this stretch for the next.
					const split = range.end.segmentIndex !== 0 || range.end.graphemeIndex !== 0;
					const fullLine = a === 0 && b === width;
					if ((range.width > room + 0.5 || split) && !fullLine) break;
					let at = a;
					let stop = false;
					for (const fr of range.fragments) {
						const [, kind] = whose[fr.itemIndex];
						// Anything but the label itself must end by the column's edge.
						if (kind !== 'label' && at + fr.gapBefore + fr.occupiedWidth > b + 0.5 && at > a) {
							cursor = { itemIndex: fr.itemIndex, segmentIndex: 0, graphemeIndex: 0 };
							stop = true;
							break;
						}
						at += fr.gapBefore;
						put(fr.itemIndex, k, at);
						at += fr.occupiedWidth;
						cursor = { itemIndex: fr.itemIndex + 1, segmentIndex: 0, graphemeIndex: 0 };
						if (kind === 'card' || (kind === 'label' && at > b)) {
							stop = kind === 'label';
							break;
						}
					}
					if (stop) break;
					if (range.end.itemIndex >= items.length) done = true;
					if (cursor && cursor.itemIndex < range.end.itemIndex) {
						// Stopped early at a card: carry on after it in this stretch.
						a = at;
						continue;
					}
					cursor = range.end;
					// Next up is a card pinned to this line, or the label of a card that just ended it: carry on here.
					const upcoming = cursor.itemIndex < items.length ? whose[cursor.itemIndex] : null;
					if (upcoming && (upcoming[1] === 'card' ? units[upcoming[0]].restLine === k : upcoming[1] === 'label' && out.line[upcoming[0]] === k)) {
						a = at;
						continue;
					}
					break;
				}
			}
			out.anchor[k] = top + rise * hasFrame[k];
			for (const i of fresh) out.cardTop.set(i, out.anchor[k] + units[i].frameY);
			fresh.length = 0;
		}
		return out;
	}

	/** How far a lit link's black bar reaches past its label's text, as it wipes in. @param {number} i */
	const barReach = (i) => BAR * em * (lit.get(i)?.bar ?? 0);

	/** Lay the sentence out round the cards as they are this frame, and place every unit there. */
	function retarget() {
		dirty = false;
		/** @type {Map<number, number>} */
		const cards = new Map();
		for (const [i, { zoom, pop }] of lit) {
			const f = units[i].frame;
			if (f && (zoom > 1.0005 || pop > 0.0005)) cards.set(i, (f.width * (70 + 2 * pop) * zoom) / 70);
		}
		const flowed = cards.size ? layout(cards) : null;
		let grow = 0;
		units.forEach((unit, i) => {
			const k = flowed?.line[i] ?? unit.restLine;
			const dx = flowed ? (flowed.x[i] ?? unit.modelX) - unit.modelX : 0;
			const dy = flowed ? flowed.anchor[k] - anchors[unit.restLine] : 0;
			grow = Math.max(grow, dy);
			/** @type {[number, number]} */
			let after = [dx, dy];
			let label = '';
			if (flowed && flowed.labelLine.has(i)) {
				// The label (and its comma) follow the card; the label's transform is inside the link's.
				const lk = /** @type {number} */ (flowed.labelLine.get(i));
				const ldx = /** @type {number} */ (flowed.labelX.get(i)) - (unit.modelX + unit.frameOuter);
				const ldy = flowed.anchor[lk] - anchors[unit.restLine];
				label = `translate(${ldx - dx}px, ${ldy - dy}px)`;
				// Punctuation after it clears the bar that reaches past its text, as the bar wipes in.
				after = [ldx + barReach(i), ldy];
				grow = Math.max(grow, ldy);
			}
			unit.els.forEach((el, n) => {
				const [x, y] = n ? after : [dx, dy];
				el.style.transform = Math.abs(x) > 0.01 || Math.abs(y) > 0.01 ? `translate(${x}px, ${y}px)` : '';
			});
			if (unit.label) unit.label.style.transform = label;
		});
		// The page below slides down if the sentence needs more lines, or a card reaches past its end.
		for (const [i, side] of cards) {
			const top = flowed?.cardTop.get(i);
			if (top !== undefined) grow = Math.max(grow, top + side + GAP_Y * em - h1.clientHeight);
		}
		if (below.target !== grow) below.to(grow);
		if (reduced()) below.set(grow);
	}

	function slideFollowers() {
		const t = below.value > 0.01 ? `translateY(${below.value}px)` : '';
		for (const el of followers) el.style.transform = t;
	}

	/** @param {number} now */
	function tick(now) {
		const dt = Math.max(0, Math.min(64, now - last));
		last = now;
		if (dirty) retarget();
		const moving = below.advance(dt);
		slideFollowers();
		frame = moving || dirty ? requestAnimationFrame(tick) : 0;
		// Settled with nothing lit: take up any layout change that waited (a resize, say).
		if (!frame && !lit.size && stale) remeasure();
	}

	function wake() {
		if (frame || !enabled) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	/** @param {Event} event */
	function onzoom(event) {
		const { zoom, pop, bar } = /** @type {CustomEvent<{ zoom: number, pop: number, bar: number }>} */ (event).detail;
		const i = units.findIndex((unit) => unit.link === event.target);
		if (i < 0) return;
		if (zoom <= 1.0005 && pop <= 0.0005) lit.delete(i);
		else lit.set(i, { zoom, pop, bar });
		dirty = true;
		wake();
	}

	function reset() {
		for (const unit of units) {
			for (const el of unit.els) el.style.transform = '';
			if (unit.label) unit.label.style.transform = '';
		}
		for (const el of followers) el.style.transform = '';
	}

	/** Re-read the rest layout, unless something is lit or still moving; then wait till it settles. */
	function remeasure() {
		if (lit.size || frame) {
			stale = true;
			return;
		}
		stale = false;
		reset();
		measure();
	}

	h1.addEventListener('iconzoom', onzoom);
	const observer = new ResizeObserver(remeasure);

	// Pretext is only needed once someone hovers; fetch it after the fonts, off the first paint.
	Promise.all([document.fonts.ready, import('@chenglou/pretext/rich-inline')])
		.then(([, lib]) => {
			if (disposed) return;
			pretext = lib;
			remeasure();
			observer.observe(h1);
		})
		.catch((error) => console.warn('Headline flow unavailable:', error));

	return () => {
		disposed = true;
		cancelAnimationFrame(frame);
		observer.disconnect();
		h1.removeEventListener('iconzoom', onzoom);
		delete h1.dataset.flow;
		reset();
	};
}
