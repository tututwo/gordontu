/**
 * The headline makes room for a magnified Category link icon the way a paragraph makes room for a tall
 * picture set into one of its lines. The icon grows from its frame's top-left corner, right and down,
 * so its line just gets taller: the words before it and the lines above stay put, the words after it on
 * its line are pushed along by exactly as much as the card widens (past the column into the margin, if
 * the window has room), and the lines below part by exactly as much as it deepens. No word changes line
 * or neighbour, and every one moves in step with the card's edge, so the sentence stays one paragraph
 * with a picture in it rather than text running round an object.
 *
 * Only where pushing the words along would take them past the window's edge (a phone) does the card's
 * line wrap: the words that will not fit go to the start of the next line if it has room for them, or
 * onto a line of their own under the card, broken by Pretext. The paragraph opens that room as the card
 * grows, and the words wrap into it once the first of them reaches the edge, as typing does.
 *
 * Units are moved by transform only, in the same frame as the card they make room for, so the page
 * never reflows and nothing trails the card; the page below moves down with the headline's last line.
 *
 * Pretext positions are only used as offsets between two of its own layouts (wrapped minus rest), so
 * the browser's rest layout stays the ground truth. If Pretext's rest line breaks disagree with the
 * browser's, the flow stays off and the icons fall back to magnifying over the sentence.
 */

/** Space kept from the window's edge, in em. */
const EDGE = 1;
/** The label's black bar reaches this far past its text (CategoryLink's .label padding), in em. */
const BAR = 0.2;
/** A lit card's side in reference-card units: CategoryLink's 70 frame, brackets popped by 6, doubled. */
const LIT = (70 + 2 * 6) * 2;
/** A wrapping word is fully gone when its line is this much short of, or past, full. */
const FADE = 0.2;

/** @typedef {import('@chenglou/pretext/rich-inline').RichInlineItem} Item */

/**
 * One thing that moves as a whole: a word, the avatar, or a link, with any punctuation glued after it.
 * For a link, `label`/`frameOuter`/`labelItem` let its label wrap away from its card while it is lit.
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
 *   right: number,
 *   labelWidth: number,
 *   modelX: number
 * }} Unit
 */

/** @param {HTMLElement} h1 */
export function headlineFlow(h1) {
	/** @type {typeof import('@chenglou/pretext/rich-inline') | undefined} */
	let pretext;
	/** @type {Unit[]} */
	let units = [];
	/** Unit indices on each rest line. */
	/** @type {number[][]} */
	let lines = [];
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
	/** Magnification, bracket pop, how far its black bar has wiped (0–1) and whether it is on its way in, of each lit link, by unit index. */
	/** @type {Map<number, { zoom: number, pop: number, bar: number, on: boolean }>} */
	const lit = new Map();
	let stale = false;
	let disposed = false;

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

	/**
	 * Break `items` into lines of the column's width with Pretext: each item's line and x. A line's first
	 * item draws no space, but spaced items carry the space drift, so every line gets that much back.
	 * @param {Item[]} items
	 * @returns {[number, number][]}
	 */
	function wrap(items) {
		/** @type {[number, number][]} */
		const out = [];
		if (!pretext) return out;
		let k = 0;
		pretext.walkRichInlineLineRanges(pretext.prepareRichInline(items), width + spaceDrift, (range) => {
			let at = 0;
			for (const fr of range.fragments) {
				at += fr.gapBefore;
				out[fr.itemIndex] = [k, at];
				at += fr.occupiedWidth;
			}
			k++;
		});
		return out;
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
				unit.right = rect.right - box.left;
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
				right: rect.right - box.left,
				labelWidth: 0,
				modelX: 0
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
				// Its label's box takes in the room its black bar will need.
				const l = label.getBoundingClientRect();
				unit.right = l.right - box.left;
				unit.labelWidth = l.width;
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
		lines = Array.from({ length: line + 1 }, (_, k) => list.flatMap((unit, i) => (unit.restLine === k ? [i] : [])));

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
		framed = lines.map((members) => +members.some((i) => list[i].link));
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
		const rest = wrap(units.map((unit) => unit.item));
		enabled = units.every((unit, i) => rest[i]?.[0] === unit.restLine);
		units.forEach((unit, i) => (unit.modelX = rest[i]?.[1] ?? 0));
		if (enabled) h1.dataset.flow = '';
		else delete h1.dataset.flow;
	}

	/** Place every unit for the cards as they are this frame. */
	function retarget() {
		// A lit label's black bar wipes in from the left across its box, and nudges on what follows it only
		// once it reaches past the text, into the room the label's negative margin gave back.
		const barNow = (/** @type {number} */ i) => Math.max(0, BAR * em - (1 - (lit.get(i)?.bar ?? 0)) * units[i].labelWidth);
		// The words after a card may be pushed this far right: to the window's edge, less a margin.
		const limit = width + Math.max(0, document.documentElement.clientWidth - EDGE * em - h1.getBoundingClientRect().right);
		/**
		 * How much each lit card has grown and how far it pushes what follows it (its bar included), now and
		 * as planned: lit, so that words know in time whether they will have to wrap. A card on its way out
		 * is planned lit too, so that leaving retraces arriving, unless one on its line is on its way in:
		 * then that one takes its room.
		 */
		/** @type {Map<number, { grow: number, push: number, plan: number }>} */
		const cards = new Map();
		const arriving = new Set([...lit].flatMap(([i, { on }]) => (on ? [units[i].restLine] : [])));
		for (const [i, { zoom, pop, on }] of lit) {
			const side = units[i].frame?.width ?? 0;
			const grow = (side * (70 + 2 * pop) * zoom) / 70 - side;
			const plan = on || !arriving.has(units[i].restLine) ? Math.max(grow, (side * LIT) / 70 - side) + BAR * em : 0;
			cards.set(i, { grow, push: grow + barNow(i), plan });
		}

		/** Each unit's offset, and its glued punctuation's (they differ for a lit link, past its label). */
		/** @type {[number, number][]} */
		const at = units.map(() => [0, 0]);
		/** @type {[number, number][]} */
		const tail = units.map(() => [0, 0]);
		/** A lit link's label, where it wraps away from its card: its offset. */
		/** @type {Map<number, [number, number]>} */
		const labelAt = new Map();
		/** Words that wrap dissolve as they reach the edge and form again on their new line. */
		/** @type {Map<number, number>} */
		const shown = new Map();
		/** How far each unit of a line that takes wrapped words at its start is to move right, once all there. */
		/** @type {Map<number, number>} */
		const room = new Map();
		let roomShare = 0;
		let down = 0;

		lines.forEach((members, k) => {
			// Along the line, each lit card pushes what follows it. How full the line is: the most any unit
			// has used of the room it has before the edge; at 1 the first of them reaches it.
			let push = 0;
			let pushLit = 0;
			let fill = 0;
			let grow = 0;
			let over = -1;
			for (const i of members) {
				const card = cards.get(i);
				const made = room.get(i) ?? 0;
				at[i] = [push + made * roomShare, down];
				tail[i] = [at[i][0] + (card?.push ?? 0), down];
				const reach = tail[i][0];
				if (reach > 0) fill = Math.max(fill, reach / Math.max(1, limit - units[i].right));
				if (over < 0 && units[i].right + pushLit + made + (card?.plan ?? 0) > limit + 0.5) over = i;
				push += card?.push ?? 0;
				pushLit += card?.plan ?? 0;
				grow = Math.max(grow, card?.grow ?? 0);
			}
			roomShare = 0;
			room.clear();
			// The card deepens its line: the lines below part to let it in.
			let open = grow;
			const wrapped = over < 0 ? [] : members.slice(members.indexOf(over));
			if (wrapped.length) {
				// Lit, these would pass the edge: they wrap, a lit link's label without its card. Room for
				// them opens as the line fills, and they move into it when it is full.
				const next = lines[k + 1] ?? [];
				/** @type {Item[]} */
				const items = wrapped.map((i) => {
					const labelItem = units[i].labelItem;
					return cards.has(i) && labelItem ? { ...labelItem, extraWidth: (labelItem.extraWidth ?? 0) + BAR * em } : units[i].item;
				});
				const share = Math.min(1, fill);
				const joined = next.length ? wrap([...items, ...next.map((i) => units[i].item)]) : [];
				const join = joined.length > 0 && joined.every(([line]) => line === 0);
				const placed = join ? joined : wrap(items);
				/** Where each line they wrap onto has its words' top, spaced as the browser would. */
				/** @type {number[]} */
				const tops = [];
				if (join) {
					// The next line moves along to make room at its start.
					next.forEach((i, n) => room.set(i, placed[wrapped.length + n][1] - units[i].modelX));
					roomShare = share;
					tops[0] = anchors[k + 1] + down + grow;
				} else {
					// Or they get lines of their own under the card, as many as Pretext breaks them into.
					const start = anchors[k] + down + lineHeight + drop * framed[k] + grow;
					let bottom = start;
					for (let line = 0; placed.some(([l]) => l === line); line++) {
						const frame = +wrapped.some((i, n) => placed[n][0] === line && units[i].link && !cards.has(i));
						tops[line] = bottom + rise * frame;
						bottom = tops[line] + lineHeight + drop * frame;
					}
					open += (bottom - start) * share;
				}
				for (const i of wrapped) shown.set(i, Math.min(1, Math.abs(fill - 1) / FADE));
				if (fill >= 1) {
					wrapped.forEach((i, n) => {
						const [line, x] = placed[n];
						const unit = units[i];
						const y = tops[line] - anchors[k];
						if (cards.has(i)) {
							// The card stays under the pointer; its label (and comma) go.
							const lx = x - (unit.modelX + unit.frameOuter);
							labelAt.set(i, [lx - at[i][0], y - at[i][1]]);
							tail[i] = [lx + barNow(i), y];
						} else at[i] = tail[i] = [x - unit.modelX, y];
					});
				}
			}
			down += open;
		});

		units.forEach((unit, i) => {
			// A lit link's card stays whole; only its label and comma dissolve.
			const opacity = shown.has(i) && shown.get(i) !== 1 ? String(shown.get(i)) : '';
			unit.els.forEach((el, n) => {
				const [x, y] = n ? tail[i] : at[i];
				el.style.transform = Math.abs(x) > 0.01 || Math.abs(y) > 0.01 ? `translate(${x}px, ${y}px)` : '';
				el.style.opacity = n || !cards.has(i) ? opacity : '';
			});
			const label = labelAt.get(i);
			if (unit.label) {
				unit.label.style.transform = label ? `translate(${label[0]}px, ${label[1]}px)` : '';
				unit.label.style.opacity = cards.has(i) ? opacity : '';
			}
		});
		const t = down > 0.01 ? `translateY(${down}px)` : '';
		for (const el of followers) el.style.transform = t;
	}

	/** @param {Event} event */
	function onzoom(event) {
		const { zoom, pop, bar, on } = /** @type {CustomEvent<{ zoom: number, pop: number, bar: number, on: boolean }>} */ (event).detail;
		const i = units.findIndex((unit) => unit.link === event.target);
		if (i < 0) return;
		if (zoom <= 1.0005 && pop <= 0.0005) lit.delete(i);
		else lit.set(i, { zoom, pop, bar, on });
		// In step with the card: the link tells us from inside its own frame, before it paints.
		if (enabled) retarget();
		// Nothing lit: take up any layout change that waited (a resize, say).
		if (!lit.size && stale) remeasure();
	}

	function reset() {
		for (const unit of units) {
			for (const el of [...unit.els, ...(unit.label ? [unit.label] : [])]) el.style.transform = el.style.opacity = '';
		}
		for (const el of followers) el.style.transform = '';
	}

	/** Re-read the rest layout, unless something is lit; then wait till nothing is. */
	function remeasure() {
		if (lit.size) {
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
		observer.disconnect();
		h1.removeEventListener('iconzoom', onzoom);
		delete h1.dataset.flow;
		reset();
	};
}
