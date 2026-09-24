/**
 * The headline makes room for a magnified Category link icon the way a page makes room for a picture
 * set into its text. The icon grows from its frame's top-left corner, right and down. On its own line
 * the words after it are pushed along by exactly as much as the card widens (past the column into the
 * window's spare margin, if the window has room). The lines below stay where they are: where the card
 * comes down over one, that line is cut round it, letter by letter, as Pretext's demos flow text round
 * shapes one line band at a time. The text runs on to a word space short of the card's left edge,
 * splitting a word between two letters if it has to, and carries on its frame's margin past its right
 * edge, as on the card's own line; so a word the card lands on bursts apart round it and closes up
 * again when it goes, and the sentence stays one stream running round a picture.
 *
 * A cut opens as the card comes down towards its line, in step with it, and is fully open by the time
 * the card reaches the line's letters (or a frame on it), so nothing is ever drawn under the card.
 *
 * A split word is drawn twice: the word itself, clipped to the letters before the cut, and an
 * aria-hidden copy, clipped to those after it and moved past the card. The copy draws its text as
 * generated content, so screen readers, find and copy see the sentence once. The letters are where the
 * browser set them (kerning and all) and a cut falls in the gap between two letters' ink, so the two
 * halves are exactly the word as set, and neither shows a sliver of the other.
 *
 * Only where the stream would run past the window's edge (a phone) does it wrap, between words: what
 * no longer fits moves to the next line, which holds room at its start for it as the line before fills.
 * A lit link's name stays whole but for breaking between its two words there, as any phrase would, its
 * black bar running on across the break. What jumps dissolves as the cards near the size where it
 * jumps and forms again after, and a line the stream runs onto past the last opens as its words come.
 *
 * Units are moved by transform, clip-path and opacity only, in the same frame as the card they make
 * room for, so the page never reflows and nothing trails the card; the page below moves down only
 * where a card, or a line the stream ran onto, would reach it.
 *
 * The layout is the browser's rest layout, moved: every unit keeps its rest spacing from the one before
 * it, so with nothing lit everything is exactly where the browser put it. Pretext checks that layout
 * once: if its own line breaks disagree with the browser's, the headline is not what this was measured
 * for, the flow stays off and the icons fall back to magnifying over the sentence.
 */

/** Space kept from the window's edge, in em. */
const EDGE = 1;
/** A cut opens over at least this much of its card's growth, so the letters slide rather than jump. */
const OPEN = 0.6;
/** Space kept between a card and the page below, in em. */
const CLEAR = 0.5;
/** A word that jumps to another line fades out over this much card growth before it, and in after, in em. */
const FADE = 0.75;
/** Layouts sampled each way along the cards' growth to find where words will jump, or did. */
const LOOK = 12;
/** Between two samples, moving further than this is a jump, not a glide, in em. */
const JUMP = 2;

/** @typedef {import('@chenglou/pretext/rich-inline').RichInlineItem} Item */

/**
 * Where a unit may be split, from its left: where the clip before it ends (`at`) and the one after it
 * starts (`from`), and where the ink before it ends and after it starts. Between two words (`word`)
 * the cut takes in the space both ways, so a lit label's black bar keeps its padding either side.
 * @typedef {{ at: number, from: number, head: number, tail: number, word: boolean }} Cut
 */

/**
 * One thing that moves as a whole: a word, the avatar, or a link, with any punctuation glued after it.
 * A word, or the label of a link that is not lit, may be split at one of its `cuts`; `split` is the
 * element that is clipped then, and `splitBox` its rest box in its containing block (the headline for
 * a word, the link for a label), where its copy is drawn.
 * @typedef {{
 *   els: HTMLElement[],
 *   item: Item,
 *   link: HTMLElement | null,
 *   label: HTMLElement | null,
 *   frame: DOMRect | null,
 *   frameOuter: number,
 *   labelX: number,
 *   labelWidth: number,
 *   split: HTMLElement | null,
 *   splitBox: DOMRect,
 *   cuts: Cut[],
 *   labelCuts: Cut[],
 *   restLine: number,
 *   restX: number,
 *   right: number,
 *   space: number
 * }} Unit
 */

/**
 * Where a unit goes: its line and left, and if it is split, the cut and the line and left of the ink
 * after it. A lit link's label may go elsewhere than its card (and split itself, between words).
 * @typedef {{ line: number, x: number, cut: Cut | null, tail: number, tailLine: number, labelLine: number, labelX: number }} Place
 */

/** A lit card as placed: its top-left, its side now, at rest and lit, and the margin after its frame. @typedef {{ x: number, y: number, side: number, rest: number, full: number, margin: number }} Card */

/**
 * What a card cuts out of a line, from `a` to `b`, opened `s` of the way (0–1); for frames only, or
 * for letters; `done` once the stream has passed it.
 * @typedef {{ a: number, b: number, s: number, frame: boolean, done: boolean }} Block
 */

/** @param {number} a @param {number} b @param {number} t */
const lerp = (a, b, t) => a + (b - a) * t;

/** Hermite ease of `x` between `a` and `b`, clamped. @param {number} a @param {number} b @param {number} x */
const smoothstep = (a, b, x) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

/** @param {HTMLElement} el @param {number} x @param {number} y */
const move = (el, x, y) => (el.style.transform = Math.abs(x) > 0.01 || Math.abs(y) > 0.01 ? `translate(${x}px, ${y}px)` : '');

/** @param {HTMLElement} h1 */
export function headlineFlow(h1) {
	/** @type {typeof import('@chenglou/pretext/rich-inline') | undefined} */
	let pretext;
	/** @type {Unit[]} */
	let units = [];
	/** Per rest line: the top of its words; and whether the last line holds a link's frame (1) or not (0). */
	/** @type {number[]} */
	let anchors = [];
	let framed = 0;
	/**
	 * A line of words is this tall and its letters start `textTop` down it; a frame on it starts
	 * `frameTop` down it (above it: negative) and adds `drop` below it.
	 */
	let lineHeight = 0;
	let textTop = 0;
	let frameTop = 0;
	let drop = 0;
	/** The page below's top at rest. */
	let nextTop = Infinity;
	let width = 0;
	/** How far a label's black bar reaches past its text (CategoryLink's .label padding), in px. */
	let barWidth = 0;
	/** The browser's space between two words. */
	let wordSpace = 4;
	/** How far the stream may run: to the window's edge, less a margin. */
	let limit = 0;
	let em = 16;
	let enabled = false;
	/** @type {HTMLElement[]} */
	let followers = [];
	/** Magnification, bracket pop, how far its black bar has wiped (0–1) and whether it is on its way in, of each lit link, by unit index. */
	/** And the side it grows to lit, in card px (of CategoryLink's 70 px frame). */
	/** @type {Map<number, { zoom: number, pop: number, bar: number, on: boolean, full: number }>} */
	const lit = new Map();
	/** Split elements' copies, made the first time each splits and dropped when nothing is lit. */
	/** @type {Map<HTMLElement, HTMLElement>} */
	const twins = new Map();
	let stale = false;
	let disposed = false;

	/** Measures letters' ink, which their boxes do not bound. */
	const ink = document.createElement('canvas').getContext('2d');

	/** @param {Element} el */
	const fontOf = (el) => {
		const s = getComputedStyle(el);
		return `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
	};

	/** Line `k`'s words' top, and past the last line, where a line the stream runs onto would have them. */
	const anchorOf = (/** @type {number} */ k) =>
		k < anchors.length ? anchors[k] : anchors[anchors.length - 1] + lineHeight + drop * framed + (k - anchors.length) * lineHeight;

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
	 * Break `items` into lines of the column's width with Pretext: each item's line. A line's first item
	 * draws no space, but spaced items carry the space drift, so every line gets that much back.
	 * @param {Item[]} items @param {number} slack
	 */
	function wrap(items, slack) {
		/** @type {number[]} */
		const out = [];
		if (!pretext) return out;
		let k = 0;
		pretext.walkRichInlineLineRanges(pretext.prepareRichInline(items), width + slack, (range) => {
			for (const fr of range.fragments) out[fr.itemIndex] = k;
			k++;
		});
		return out;
	}

	/**
	 * Where `el`'s text may be split, from `origin`: between two of its letters, or at a space. Letters
	 * are where the browser set them (kerning and all), each as wide as its glyph's ink.
	 * @param {HTMLElement} el @param {number} origin @returns {Cut[]}
	 */
	function cutsOf(el, origin) {
		const node = el.firstChild;
		if (node?.nodeType !== Node.TEXT_NODE || !ink) return [];
		ink.font = fontOf(el);
		const range = document.createRange();
		/** Each letter's ink, from its box's left (where the browser set it) and its glyph's own extent. */
		/** @type {{ left: number, right: number, ink: boolean }[]} */
		const letters = [];
		let at = 0;
		for (const char of node.textContent ?? '') {
			range.setStart(node, at);
			range.setEnd(node, (at += char.length));
			const x = range.getBoundingClientRect().left - origin;
			const m = ink.measureText(char);
			letters.push({ left: x - m.actualBoundingBoxLeft, right: x + m.actualBoundingBoxRight, ink: char.trim() !== '' });
		}
		/** @type {Cut[]} */
		const cuts = [];
		letters.slice(0, -1).forEach((letter, j) => {
			const head = letters.slice(0, j + 1).findLast((b) => b.ink);
			const tail = letters.slice(j + 1).find((b) => b.ink);
			// A space is a cut on its own: after the word before it, before the word after it.
			if (!head || !tail || !letters[j + 1].ink) return;
			// A pixel short of the ink either side, so neither half shows an antialiased sliver of the other.
			if (!letter.ink) cuts.push({ at: tail.left - 1, from: head.right + 1, head: head.right, tail: tail.left, word: true });
			// Between two letters it falls between their ink, where there is a gap to fall in: a letter
			// that reaches over its neighbour (kerned close) is not cut from it.
			else if (head.right <= tail.left) {
				const mid = (head.right + tail.left) / 2;
				cuts.push({ at: mid, from: mid, head: head.right, tail: tail.left, word: false });
			}
		});
		return cuts;
	}

	/** Read the browser's rest layout into units, and check Pretext breaks alike. */
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
				unit.els.push(el);
				unit.right = rect.right - box.left;
				unit.item.extraWidth = (unit.item.extraWidth ?? 0) + rect.width;
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
				labelX: 0,
				labelWidth: 0,
				split: null,
				splitBox: new DOMRect(rect.left - box.left, rect.top - box.top, rect.width, rect.height),
				cuts: [],
				labelCuts: [],
				restLine: 0,
				restX: rect.left - box.left,
				right: rect.right - box.left,
				space: 0
			};
			if (el.matches('.category-link')) {
				// At rest a link is one atomic item: its label's text, plus the frame and its margin as width.
				const frameEl = /** @type {HTMLElement} */ (el.querySelector('.frame'));
				const label = /** @type {HTMLElement} */ (el.querySelector('.label'));
				const f = frameEl.getBoundingClientRect();
				const l = label.getBoundingClientRect();
				const name = label.firstChild?.textContent ?? '';
				barWidth = parseFloat(getComputedStyle(label).paddingRight) || 0;
				unit.link = el;
				unit.label = label;
				unit.frame = new DOMRect(f.left - box.left, f.top - box.top, f.width, f.height);
				unit.frameOuter = f.width + parseFloat(getComputedStyle(frameEl).marginRight);
				// Its label's box takes in the room its black bar will need.
				unit.right = l.right - box.left;
				unit.labelX = l.left - rect.left;
				unit.labelWidth = l.width;
				// Not lit, it may split between its frame and its name, or inside its name.
				unit.split = label;
				unit.splitBox = new DOMRect(l.left - rect.left, l.top - rect.top, l.width, l.height);
				unit.cuts = [{ at: unit.labelX, from: unit.labelX, head: f.width, tail: unit.labelX + barWidth, word: false }, ...cutsOf(label, rect.left)];
				// Lit, its name stays whole but for breaking between its words at the window's edge.
				unit.labelCuts = cutsOf(label, l.left).filter((c) => c.word);
				// The label's negative margins cancel its padding, so the link is as wide as frame plus name.
				const drift = rect.width - unit.frameOuter - measureText(name, fontOf(label), spacing);
				unit.item = { text: lead + name, font: fontOf(label), letterSpacing: spacing, break: 'never', extraWidth: unit.frameOuter + drift };
			} else if (el.matches('.avatar')) {
				// The avatar is a box: a zero-width word joiner carrying its width.
				unit.item = { text: lead + '⁠', font: fontOf(h1), break: 'never', extraWidth: rect.width };
			} else {
				unit.split = el;
				unit.cuts = cutsOf(el, rect.left);
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
		// block as tall as the line-height, so it spans a line that holds nothing taller; its letters
		// start where its text's own box does.
		anchors = [];
		lineHeight = em * 1.8;
		const range = document.createRange();
		for (const unit of list) {
			if (unit.link || unit.els[0].matches('.avatar')) continue;
			const r = unit.els[0].getBoundingClientRect();
			const k = unit.restLine;
			anchors[k] = Math.min(anchors[k] ?? Infinity, r.top - box.top);
			lineHeight = r.height;
			range.selectNodeContents(unit.els[0]);
			textTop = range.getBoundingClientRect().top - r.top;
		}
		// A frame is taller than a line of words, so the browser opens its line up below it.
		framed = +list.some((unit) => unit.restLine === line && unit.link);
		drop = 0;
		for (const unit of list) {
			const f = unit.frame;
			if (!f || anchors[unit.restLine] === undefined) continue;
			const margin = parseFloat(getComputedStyle(/** @type {Element} */ (unit.link?.querySelector('.frame'))).marginBottom);
			drop = Math.max(drop, f.bottom + margin - (anchors[unit.restLine] + lineHeight));
			frameTop = f.top - anchors[unit.restLine];
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
		wordSpace = em / 4;
		let spaceDrift = 0;
		const pair = list.findIndex((unit, i) => i > 0 && unit.restLine === list[i - 1].restLine && list[i - 1].els.length === 1);
		if (pair > 0) {
			const prev = list[pair - 1];
			wordSpace = list[pair].restX - prev.restX - prev.els[0].getBoundingClientRect().width;
			spaceDrift = wordSpace - measureSpace(fontOf(h1), spacing);
		}
		for (const unit of list) if (unit.item.text.startsWith(' ')) unit.item.extraWidth = (unit.item.extraWidth ?? 0) + spaceDrift;
		// Each unit keeps its rest space from the one before; one that began a line takes a plain space.
		list.forEach((unit, i) => (unit.space = i && unit.restLine === list[i - 1].restLine ? unit.restX - list[i - 1].right : wordSpace));

		units = list;
		followers = /** @type {HTMLElement[]} */ ([...(h1.parentElement?.children ?? [])]).filter(
			(el) => h1.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
		);
		nextTop = followers.length ? followers[0].getBoundingClientRect().top - box.top : Infinity;

		// Pretext's rest layout must break exactly as the browser did, or the units are not the lines seen.
		const rest = wrap(
			units.map((unit) => unit.item),
			spaceDrift
		);
		enabled = units.every((unit, i) => rest[i] === unit.restLine);
		if (enabled) h1.dataset.flow = '';
		else delete h1.dataset.flow;
	}

	/**
	 * What the cards cut out of line `k`: from a word space before each card's left edge to its frame's
	 * margin after its right, so the lines it cuts keep the spacing of its own. A cut through the line's
	 * letters opens as the card comes down towards them, fully open when it gets there if it has room to
	 * open first; where lines sit close, so that a card is on the letters almost as soon as it grows, it
	 * opens over a stretch of the card's growth all the same, and the letters it is on slide out from
	 * under it (the card is opaque) rather than jump. A card that stops short of the letters but would
	 * reach a frame on the line cuts it for frames only.
	 * @param {number} k @param {Card[]} cards
	 */
	function carve(k, cards) {
		/** @type {Block[]} */
		const blocks = [];
		for (const c of cards) {
			// How far the card has grown towards its lit size, and how far it must grow to reach the band.
			const growth = Math.max(1, c.full - c.rest);
			const grown = (c.side - c.rest) / growth;
			for (const frame of [false, true]) {
				const top = anchorOf(k) + (frame ? frameTop : textTop);
				if (c.y + c.full <= top) continue;
				const reach = Math.max(0, (top - c.y - c.rest) / growth);
				const s = smoothstep(Math.max(0, reach - OPEN), Math.max(reach, OPEN), grown);
				blocks.push({ a: c.x - wordSpace, b: c.x + c.side + c.margin, s, frame, done: false });
			}
		}
		return blocks.sort((p, q) => p.a - q.a);
	}

	/** How far a lit label's black bar nudges what follows it: only once it reaches past the text. @param {number} i */
	const barNow = (i) => Math.max(0, barWidth - (1 - (lit.get(i)?.bar ?? 0)) * units[i].labelWidth);

	/**
	 * Lay the sentence out round cards of the given sides (of lit links, by unit index). Lines keep
	 * their place; along each, units keep their rest spacing, a lit card pushes on what follows it, and
	 * the stream jumps each card that comes down across the line, splitting the unit it lands on.
	 * Given where everything goes with the cards at full size (`full`), a line that is filling up
	 * opens room at the start of the next for what will wrap onto it, so that nothing there jumps.
	 * @param {Map<number, number>} sides @param {Place[] | null} [full]
	 */
	function layout(sides, full = null) {
		/** @type {Place[]} */
		const out = [];
		/** @type {Card[]} */
		const cards = [];
		/** @type {Block[]} */
		let blocks = [];
		let line = -1;
		let x = 0;
		/** Nothing on the line yet; or only room held for what will wrap onto it. */
		let fresh = true;
		let held = false;
		/** The last unit set on the line, how much of it would wrap, and how full the line is, now and at rest. */
		let last = { i: -1, w: 0, slack: 0, calm: 0 };
		const enter = (/** @type {number} */ k, room = 0) => {
			line = k;
			x = room;
			fresh = !(held = room > 0);
			blocks = carve(k, cards);
			last = { i: -1, w: 0, slack: 0, calm: 0 };
		};

		/**
		 * Place the next piece of the stream: `w` wide, `space` after the last, its ink `inset` from its
		 * left. It may be split at `cuts`. If it starts with a frame `frame` wide, that frame keeps off a
		 * card that only frames must. A card is not moved off its place by other cards, nor wrapped.
		 * @param {number} w @param {number} space @param {number} inset @param {Cut[]} cuts @param {number} [frame] @param {boolean} [card]
		 * @returns {{ line: number, x: number, cut: Cut | null, tail: number, tailLine: number }}
		 */
		const place = (w, space, inset, cuts, frame = 0, card = false) => {
			for (;;) {
				let left = fresh ? -inset : held ? x : x + space;
				let right = left + w;
				/** @type {Cut | null} */
				let cut = null;
				let tail = 0;
				let jumped = false;
				for (const o of card ? [] : blocks) {
					if (o.done || (o.frame && !frame) || (o.frame ? left + frame : right) <= o.a) continue;
					o.done = jumped = true;
					if (cut) {
						// Its second half runs into another card: it jumps that one too.
						const to = Math.max(tail, lerp(tail, o.b, o.s));
						right += to - tail;
						tail = to;
						continue;
					}
					// Its letters fill up to the card, the rest go on past it; if none fit, it all goes.
					cut = o.frame ? null : (cuts.findLast((c) => left + c.head <= o.a) ?? null);
					if (cut) {
						tail = Math.max(left + cut.tail, lerp(left + cut.tail, o.b, o.s));
						right = tail + w - cut.tail;
					} else {
						const to = Math.max(left, lerp(left, o.b - inset, o.s));
						right += to - left;
						left = to;
					}
				}
				if (!card && right > limit + 0.5 && line < anchors.length + 2) {
					// Past the edge, lines break between words, as they did: a name of two words may break
					// between them, the rest starting the next line; anything else goes there whole.
					const edge = cut ? null : cuts.findLast((c) => c.word && left + c.head <= limit + 0.5);
					if (edge) {
						const head = line;
						enter(line + 1);
						const rest = place(w - edge.tail, 0, 0, []);
						return { line: head, x: left, cut: edge, tail: rest.x, tailLine: rest.line };
					}
					if (!(fresh || held) || jumped) {
						enter(line + 1);
						continue;
					}
				}
				x = right;
				fresh = held = false;
				return { line, x: left, cut, tail, tailLine: line };
			}
		};

		units.forEach((unit, i) => {
			if (unit.restLine > line) {
				// What the last line ends with, if it will wrap, has room held for it here as the line fills.
				const will = last.i >= 0 && (full?.[last.i]?.tailLine ?? 0) > line;
				enter(unit.restLine, will ? (last.w + wordSpace) * Math.min(1, Math.max(0, 1 - last.slack / last.calm)) : 0);
			}
			const side = sides.get(i);
			/** @type {Place} */
			let p;
			/** Its width, and the part of it that would go to the next line. */
			let w = unit.right - unit.restX;
			let cuts = unit.cuts;
			if (side === undefined || !unit.frame) {
				const q = place(w, unit.space, 0, cuts, unit.frame?.width ?? 0);
				p = { ...q, labelLine: q.line, labelX: 0 };
			} else {
				// A lit link: its card, grown, stays where it is on its line; its label goes after it, whole
				// but for breaking between its words at the edge.
				const f = place(unit.frameOuter + side - unit.frame.width, unit.space, 0, [], 0, true);
				const full = (unit.frame.width * (lit.get(i)?.full ?? 70)) / 70;
				cards.push({ x: f.x, y: unit.frame.y + anchorOf(f.line) - anchors[unit.restLine], side, rest: unit.frame.width, full, margin: unit.frameOuter - unit.frame.width });
				w = unit.right - unit.restX - unit.labelX + barNow(i);
				cuts = unit.labelCuts;
				const l = place(w, unit.labelX - unit.frameOuter, barWidth, cuts);
				p = { ...f, cut: l.cut, tail: l.tail, tailLine: l.tailLine, labelLine: l.line, labelX: l.x };
			}
			out.push(p);
			// If it filled the line, what would go: the part after a break between words (once broken, the
			// rest of it), or the whole of it. Room opens as the line fills from how full it was at rest.
			const broken = p.cut && p.tailLine !== (side === undefined ? p.line : p.labelLine);
			const go = broken && p.cut ? w - p.cut.tail : p.cut ? w : w - (cuts.findLast((c) => c.word)?.tail ?? 0);
			const home = p.line === unit.restLine && Math.abs(p.x - unit.restX) < 0.01;
			last = { i, w: go, slack: limit - x, calm: Math.max(1, Math.min(FADE * em, home ? limit - unit.right : Infinity)) };
		});
		return out;
	}

	/**
	 * Each lit card's side now, or `t` further along its way in or out (a card on its way out shrinks);
	 * or, with `t` Infinity, each at full size whichever way it is going.
	 * @param {number} t
	 */
	function sidesAt(t) {
		/** @type {Map<number, number>} */
		const sides = new Map();
		for (const [i, { zoom, pop, on, full }] of lit) {
			const rest = units[i].frame?.width ?? 0;
			const side = (rest * (70 + 2 * pop) * zoom) / 70;
			const top = Math.max(side, (rest * full) / 70);
			sides.set(i, t === Infinity ? top : Math.min(Math.max(side + (on ? t : -t), rest), top));
		}
		return sides;
	}

	/**
	 * Whether a unit jumps between two layouts a little apart: to another line, or along its line (or
	 * the part of it after a cut) much faster than the cards grow. A letter moving from one side of a
	 * card to the other is the flow itself, not a jump.
	 * @param {Place} p @param {Place} q
	 */
	function jumps(p, q) {
		if (p.line !== q.line || p.labelLine !== q.labelLine || p.tailLine !== q.tailLine) return true;
		if (!p.cut !== !q.cut) return false;
		const far = JUMP * em;
		return Math.abs(p.x - q.x) > far || Math.abs(p.labelX - q.labelX) > far || (!!p.cut && Math.abs(p.tail - q.tail) > far);
	}

	/** The copy that draws a split unit's letters after the cut, made the first time it splits. @param {Unit} unit */
	function twinOf(unit) {
		const el = /** @type {HTMLElement} */ (unit.split);
		let twin = twins.get(el);
		if (!twin) {
			twin = /** @type {HTMLElement} */ (el.cloneNode(true));
			twin.firstChild?.remove();
			twin.dataset.twin = el.firstChild?.textContent ?? '';
			twin.setAttribute('aria-hidden', 'true');
			// Not a word of the sentence: nothing that counts words should count it.
			twin.classList.remove('word');
			const b = unit.splitBox;
			twin.style.cssText = `position: absolute; left: ${b.x}px; top: ${b.y}px; margin: 0`;
			el.after(twin);
			twins.set(el, twin);
		}
		twin.style.visibility = '';
		return twin;
	}

	function dropTwins() {
		for (const twin of twins.values()) twin.remove();
		twins.clear();
	}

	/** Place every unit for the cards as they are this frame. */
	function retarget() {
		limit = width + Math.max(0, document.documentElement.clientWidth - EDGE * em - h1.getBoundingClientRect().right);
		const sides = sidesAt(0);
		const full = layout(sidesAt(Infinity));
		const now = layout(sides, full);

		// Whatever jumps dissolves as the cards near the size where it jumps and forms again after: faded
		// in full by the time they settle, and fully there when they set out. Sample the cards a little
		// further along their way, and back.
		let ahead = 0;
		let behind = 0;
		for (const [i, { on, full }] of lit) {
			const rest = units[i].frame?.width ?? 0;
			const side = /** @type {number} */ (sides.get(i));
			const top = (rest * full) / 70;
			ahead = Math.max(ahead, on ? top - side : side - rest);
			behind = Math.max(behind, on ? side - rest : top - side);
		}
		const fade = FADE * em;
		const shown = units.map(() => 1);
		for (const dir of [1, -1]) {
			const room = dir > 0 ? behind : ahead;
			let prev = now;
			/** @type {Set<number>} */
			const seen = new Set();
			for (let k = 1; k <= LOOK && seen.size < units.length; k++) {
				const next = layout(sidesAt((dir * k * fade) / LOOK), full);
				next.forEach((q, i) => {
					if (seen.has(i) || !jumps(prev[i], q)) return;
					seen.add(i);
					const d = ((k - 0.5) * fade) / LOOK;
					shown[i] = Math.min(shown[i], d / Math.min(fade, d + room));
				});
				prev = next;
			}
		}

		// The page below makes room for a card that would reach it, and for a line the stream ran onto,
		// as that line's words arrive.
		let below = 0;
		/** @type {Map<number, number>} */
		const extra = new Map();
		now.forEach((p, i) => {
			const unit = units[i];
			const side = sides.get(i);
			if (side !== undefined && unit.frame) below = Math.max(below, unit.frame.y + anchorOf(p.line) - anchors[unit.restLine] + side + CLEAR * em - nextTop);
			for (const k of [p.line, p.labelLine, p.tailLine]) if (k >= anchors.length) extra.set(k, Math.max(extra.get(k) ?? 0, shown[i]));
		});
		below = Math.max(below, [...extra.values()].reduce((sum, o) => sum + o * lineHeight, 0));

		units.forEach((unit, i) => {
			const p = now[i];
			const side = sides.get(i);
			const dx = p.x - unit.restX;
			const dy = anchorOf(p.line) - anchors[unit.restLine];
			const opacity = shown[i] < 0.995 ? String(Math.round(shown[i] * 100) / 100) : '';
			const [main, ...glued] = unit.els;
			move(main, dx, dy);
			// A lit link's card stays whole; only its label and comma dissolve.
			main.style.opacity = side === undefined ? opacity : '';
			/** Where what is glued on after it goes. */
			let gx = dx;
			let gy = dy;
			const bright = side !== undefined && !!unit.frame && !!unit.label;
			if (bright && unit.label && unit.frame) {
				// Lit, its label goes where the stream took it (by CSS, when that is just past its card).
				const lx = p.labelX - (unit.restX + unit.labelX);
				const ly = anchorOf(p.labelLine) - anchors[unit.restLine];
				const home = p.labelLine === p.line && Math.abs(lx - dx - (side - unit.frame.width)) < 0.01;
				unit.label.style.transform = home ? '' : `translate(${lx - dx}px, ${ly - dy}px)`;
				unit.label.style.opacity = opacity;
				gx = lx;
				gy = ly;
			} else if (unit.label) unit.label.style.transform = unit.label.style.opacity = '';
			if (unit.split) {
				// Split, it shows the letters before the cut; its copy shows those after, where they went.
				// (A lit label's cuts are from its own left.)
				const cut = p.cut;
				const origin = bright ? 0 : -unit.labelX;
				unit.split.style.clipPath = cut ? `inset(-1em ${unit.splitBox.width - cut.at - origin}px -1em -1em)` : '';
				if (cut) {
					gx = p.tail - (unit.restX + unit.labelX + origin + cut.tail);
					gy = anchorOf(p.tailLine) - anchors[unit.restLine];
					const twin = twinOf(unit);
					twin.style.clipPath = `inset(-1em -1em -1em ${cut.from + origin}px)`;
					// A label's copy is inside its link and moves with it. It always has a transform of its
					// own, so its label's (the card's growth) never applies to it.
					twin.style.transform = unit.link ? `translate(${gx - dx}px, ${gy - dy}px)` : `translate(${gx}px, ${gy}px)`;
					twin.style.opacity = unit.link && !bright ? '' : opacity;
				} else {
					const twin = twins.get(unit.split);
					if (twin) twin.style.visibility = 'hidden';
				}
			}
			// A lit label's black bar nudges on what follows it.
			if (bright) gx += barNow(i);
			for (const el of glued) {
				move(el, gx, gy);
				el.style.opacity = opacity;
			}
		});
		const t = below > 0.01 ? `translateY(${below}px)` : '';
		for (const el of followers) el.style.transform = t;
	}

	/** @param {Event} event */
	function onzoom(event) {
		const { zoom, pop, bar, on, full } = /** @type {CustomEvent<{ zoom: number, pop: number, bar: number, on: boolean, full: number }>} */ (event).detail;
		const i = units.findIndex((unit) => unit.link === event.target);
		if (i < 0) return;
		if (zoom <= 1.0005 && pop <= 0.0005) lit.delete(i);
		else lit.set(i, { zoom, pop, bar, on, full });
		// In step with the card: the link tells us from inside its own frame, before it paints.
		if (enabled) retarget();
		if (!lit.size) {
			dropTwins();
			// Nothing lit: take up any layout change that waited (a resize, say).
			if (stale) remeasure();
		}
	}

	function reset() {
		for (const unit of units) {
			for (const el of [...unit.els, ...(unit.label ? [unit.label] : [])]) el.style.transform = el.style.opacity = el.style.clipPath = '';
		}
		for (const el of followers) el.style.transform = '';
		dropTwins();
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
