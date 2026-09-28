import { CanvasTexture, SRGBColorSpace } from 'three';
import { categoryLabel, formatDate } from '../project/project.js';

/** Design-token values the canvas needs (it cannot resolve `var()`). */
const TOKENS = [
	'--color-pure-white',
	'--color-obsidian',
	'--color-charcoal',
	'--color-stone',
	'--color-hairline',
	'--font-geist-sans',
	'--font-geist-mono'
];

/** The open card's width at which the back is set in the landing Project card's sizes, CSS px. */
const TYPE_WIDTH = 700;
/** How much bigger than that the type grows on a wider card (the title reaching heading-32), at most. */
const TYPE_GROWTH = 1.6;
/** The narrowest letter worth setting beside an address side, CSS px. */
const MIN_LETTER = 240;

/** Read the tokens once per session; the site has a single light theme. */
export function readTokens() {
	const style = getComputedStyle(document.documentElement);
	return Object.fromEntries(TOKENS.map((name) => [name, style.getPropertyValue(name).trim()]));
}

/** Make sure the web fonts are usable on a canvas before we draw with them. @param {Record<string, string>} tokens */
export function loadBackFont(tokens) {
	return Promise.all([
		document.fonts.load(`400 20px ${tokens['--font-geist-sans']}`),
		document.fonts.load(`400 12px ${tokens['--font-geist-mono']}`)
	]).catch(() => undefined);
}

/**
 * Word-wrap `text` into at most `maxLines` lines that fit `maxWidth`.
 * @param {CanvasRenderingContext2D} ctx @param {string} text @param {number} maxWidth @param {number} maxLines
 */
function wrap(ctx, text, maxWidth, maxLines) {
	/** @type {string[]} */
	const lines = [];
	let line = '';
	for (const word of text.split(/\s+/)) {
		const candidate = line ? `${line} ${word}` : word;
		if (ctx.measureText(candidate).width <= maxWidth || !line) {
			line = candidate;
		} else {
			lines.push(line);
			line = word;
		}
	}
	if (line) lines.push(line);
	if (lines.length > maxLines) {
		lines.length = maxLines;
		lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, '')}…`;
	}
	return lines;
}

/**
 * @typedef {object} Block one paragraph of the letter, sized in CSS px at the landing Project card's scale
 * @property {string} text
 * @property {number} size
 * @property {number} leading line-height, in sizes
 * @property {string} color
 * @property {number} lines at most
 * @property {number} [tracking] em
 * @property {number} [weight]
 * @property {boolean} [mono] Geist Mono rather than Geist
 * @property {number} [measure] its longest line, in sizes: a reading measure for running text
 * @property {number} [gap] space above, px (none at the top of its group)
 */

/**
 * The back of a postcard, drawn at the open card's size in device pixels, so it stays sharp. It is set
 * like a real one: a letter on the left (the date and title, the Project's Message, and its Client and
 * tools at the foot), a hairline down the middle, and the address side on the right, a stamp with the
 * category over three address lines, addressed to the Project's web page if it has one. A portrait
 * card stacks the two, letter on top; a landscape card too narrow for both is all letter, since the
 * caption under it carries Open project. The type grows with the card, so a big card reads like a
 * filled-in postcard, not a form in its corner.
 * @param {import('../project/project.js').Project} project
 * @param {{ w: number, h: number }} box the open card, CSS px
 * @param {number} pixelRatio
 * @param {Record<string, string>} tokens from readTokens()
 * @returns {{ texture: CanvasTexture, link: { x: number, y: number, w: number, h: number } | null }}
 *   `link` is where the Open project link is drawn, card px from the top left of the back, if it is
 */
export function backTexture(project, { w, h }, pixelRatio, tokens) {
	const ink = tokens['--color-obsidian'] || '#171717';
	const body = tokens['--color-charcoal'] || '#4d4d4d';
	const muted = tokens['--color-stone'] || '#666';
	const hairline = tokens['--color-hairline'] || '#ebebeb';
	const font = tokens['--font-geist-sans'] || 'sans-serif';
	const mono = tokens['--font-geist-mono'] || 'monospace';
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(w * pixelRatio));
	canvas.height = Math.max(1, Math.round(h * pixelRatio));
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	ctx.scale(canvas.width / w, canvas.height / h);
	ctx.fillStyle = tokens['--color-pure-white'] || '#fff';
	ctx.fillRect(0, 0, w, h);

	// The type and margins grow with the card, from the landing Project card's sizes to half as big again.
	const k = Math.min(TYPE_GROWTH, Math.max(1, w / TYPE_WIDTH));
	const pad = Math.min(32 * k, Math.max(12, Math.min(w, h) * 0.07));

	// Message and address sides, split by a hairline like a real postcard's.
	const landscape = w >= h;
	const split = landscape ? w * 0.56 : h * 0.56;
	const sides = !landscape || split - pad * 2 >= MIN_LETTER;
	const letter = !sides
		? { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 }
		: landscape
			? { x: pad, y: pad, w: split - pad * 2, h: h - pad * 2 }
			: { x: pad, y: pad, w: w - pad * 2, h: split - pad * 2 };
	const address = landscape
		? { x: split + pad, y: pad, w: w - split - pad * 2, h: h - pad * 2 }
		: { x: pad, y: split + pad, w: w - pad * 2, h: h - split - pad * 2 };
	if (sides) {
		ctx.strokeStyle = hairline;
		ctx.lineWidth = 1;
		ctx.beginPath();
		if (landscape) {
			ctx.moveTo(split, pad);
			ctx.lineTo(split, h - pad);
		} else {
			ctx.moveTo(pad, split);
			ctx.lineTo(w - pad, split);
		}
		ctx.stroke();
	}

	// The letter in the landing Project card's type, in sentence case: the date in Geist Mono, the title
	// in a Geist heading, the Message in copy at a reading measure, then Client and tools, each under a
	// grey label.
	/** @type {Block} */
	const label = { text: '', size: 13, leading: 18 / 13, color: muted, lines: 1 };
	/** @type {Block} */
	const value = { text: '', size: 13, leading: 18 / 13, color: body, lines: 2 };
	/** @type {Block} */
	const date = { text: formatDate(project.date), size: 12, leading: 16 / 12, color: muted, lines: 1, mono: true };
	/** @type {Block} */
	const title = {
		text: project.projectName,
		size: 20,
		leading: 26 / 20,
		color: ink,
		lines: 4,
		weight: 450,
		gap: 6,
		// Geist's headings tighten as they grow: -0.02em at heading-20, -0.06em at heading-32.
		tracking: -0.02 - (0.04 * (k - 1)) / (TYPE_GROWTH - 1)
	};
	/** @type {Block | null} */
	const message = project.message
		? { text: project.message, size: 14, leading: 1.5, color: body, lines: 8, gap: 16, measure: 34 }
		: null;
	const head = [date, title, ...(message ? [message] : [])];
	/** @type {Block[]} */
	const foot = [
		{ ...label, text: 'Client' },
		{ ...value, text: project.client ?? 'Personal' },
		{ ...label, text: 'Tools', gap: 12 },
		{ ...value, text: project.tools.join(', '), lines: 3 }
	];

	/** Wrap `blocks` at type scale `s`: one run per line, `y` its middle from the group's top. @param {Block[]} blocks @param {number} s */
	const set = (blocks, s) => {
		/** @type {{ text: string, font: string, spacing: string, color: string, y: number }[]} */
		const runs = [];
		let y = 0;
		for (const [index, block] of blocks.entries()) {
			const size = block.size * s;
			if (index) y += (block.gap ?? 0) * s;
			ctx.font = `${block.weight ?? 400} ${size}px ${block.mono ? mono : font}`;
			ctx.letterSpacing = `${(block.tracking ?? 0) * size}px`;
			const width = Math.min(letter.w, (block.measure ?? Infinity) * size);
			for (const text of wrap(ctx, block.text, width, block.lines)) {
				runs.push({ text, font: ctx.font, spacing: ctx.letterSpacing, color: block.color, y: y + (size * block.leading) / 2 });
				y += size * block.leading;
			}
		}
		return { runs, height: y };
	};
	/** The head and the foot at scale `s`, and the height they need with the least room between them. @param {number} s */
	const setLetter = (s) => {
		const top = set(head, s);
		const bottom = set(foot, s);
		return { top, bottom, height: top.height + (foot.length ? 24 * s + bottom.height : 0) };
	};
	// Too much for the card: the type shrinks together, and rather than go below 85% (a phone's Message
	// stays readable) it leaves off the least needed first: the tools, then the client, and with a
	// Message, the date and then the title (the caption under the card has both). Smaller type never
	// wraps to more lines.
	const leaveOff = [
		() => foot.splice(2),
		() => foot.splice(0),
		...(message ? [() => head.splice(head.indexOf(date), 1), () => head.splice(head.indexOf(title), 1)] : [])
	];
	let typeset = setLetter(k);
	for (const drop of leaveOff) {
		if (typeset.height * 0.85 <= letter.h) break;
		drop();
		typeset = setLetter(k);
	}
	if (typeset.height > letter.h) typeset = setLetter((k * letter.h) / typeset.height);
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	/** @param {ReturnType<typeof set>} group @param {number} top */
	const draw = (group, top) => {
		for (const run of group.runs) {
			ctx.font = run.font;
			ctx.letterSpacing = run.spacing;
			ctx.fillStyle = run.color;
			ctx.fillText(run.text, letter.x, top + run.y);
		}
	};
	draw(typeset.top, letter.y);
	// Client and tools at the letter's foot, level with the address lines' last line.
	draw(typeset.bottom, letter.y + letter.h - typeset.bottom.height);

	if (!sides) return { texture: toTexture(canvas), link: null };

	// Stamp: a thin black frame at the address side's top-right, the category inside in Geist Mono,
	// the site's type for stamping.
	const stampW = Math.min(88 * k, Math.max(44, address.w * 0.38));
	const stampH = stampW * 1.2;
	const stampX = address.x + address.w - stampW;
	ctx.strokeStyle = ink;
	ctx.strokeRect(stampX, address.y, stampW, stampH);
	const words = categoryLabel(project.category).split(' ');
	ctx.font = `100px ${mono}`;
	ctx.letterSpacing = '0px';
	const widest = Math.max(...words.map((word) => ctx.measureText(word).width));
	const size = Math.min(stampW * 0.13, (stampW * 0.76 * 100) / widest);
	ctx.font = `${size}px ${mono}`;
	ctx.fillStyle = ink;
	ctx.textAlign = 'center';
	for (const [index, word] of words.entries()) {
		ctx.fillText(word, stampX + stampW / 2, address.y + stampH / 2 + (index - (words.length - 1) / 2) * size * 1.6);
	}

	// Address lines at the bottom of that side, if there is room under the stamp.
	const gap = Math.min(28 * k, (address.h - stampH - 16 * k) / 3);
	const lines = gap >= 14;
	if (lines) {
		ctx.strokeStyle = hairline;
		ctx.beginPath();
		for (let index = 0; index < 3; index += 1) {
			const y = address.y + address.h - index * gap;
			ctx.moveTo(address.x, y);
			ctx.lineTo(address.x + address.w, y);
		}
		ctx.stroke();
	}

	// A Project with a web page of its own is addressed to it: "Open project ↗" on the top address line
	// (at the foot of that side when no lines fit), in the letter's copy, shrunk to fit a narrow side. A
	// canvas can't be clicked, so PostcardGallery lays a real link over the box it returns.
	let link = null;
	if (project.projectLink) {
		const text = 'Open project ↗';
		const full = 14 * k;
		ctx.font = `${full}px ${font}`;
		const size = Math.min(full, (full * address.w) / ctx.measureText(text).width);
		ctx.font = `${size}px ${font}`;
		const baseline = lines ? address.y + address.h - 2 * gap - size * 0.3 : address.y + address.h - size * 0.25;
		ctx.fillStyle = ink;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(text, address.x, baseline);
		link = { x: address.x, y: baseline - size, w: ctx.measureText(text).width, h: size * 1.25 };
	}

	return { texture: toTexture(canvas), link };
}

/** @param {HTMLCanvasElement} canvas */
function toTexture(canvas) {
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	return texture;
}
