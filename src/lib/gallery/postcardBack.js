import { CanvasTexture, SRGBColorSpace } from 'three';
import { categoryLabel } from '../project/project.js';

/** Design-token values the canvas needs (it cannot resolve `var()`). */
const TOKENS = ['--paper', '--ink', '--muted-ink', '--hairline', '--font-sans'];

/** Read the tokens once per session; the site has a single light theme. */
export function readTokens() {
	const style = getComputedStyle(document.documentElement);
	return Object.fromEntries(TOKENS.map((name) => [name, style.getPropertyValue(name).trim()]));
}

/** Make sure the web font is usable on a canvas before we draw with it. @param {Record<string, string>} tokens */
export function loadBackFont(tokens) {
	return document.fonts.load(`400 20px ${tokens['--font-sans']}`).catch(() => undefined);
}

/** @param {string} value ISO date */
function formatDate(value) {
	return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
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
 * @typedef {object} Block one paragraph of the letter, sized in CSS px at full scale
 * @property {string} text
 * @property {number} size
 * @property {number} leading line-height, in sizes
 * @property {string} color
 * @property {number} lines at most
 * @property {number} [tracking] em
 * @property {boolean} [upper]
 * @property {number} [gap] space above, px
 */

/**
 * The back of a postcard, set like the landing's Project cards and drawn at the open card's size in
 * device pixels, so it stays sharp: a letter on the left (date, title, client, tools), a hairline
 * down the middle, a stamp with the category and three address lines on the right, addressed to the
 * Project's web page if it has one. A portrait card stacks the halves, letter on top.
 * @param {import('../project/project.js').Project} project
 * @param {{ w: number, h: number }} box the open card, CSS px
 * @param {number} pixelRatio
 * @param {Record<string, string>} tokens from readTokens()
 * @returns {{ texture: CanvasTexture, link: { x: number, y: number, w: number, h: number } | null }}
 *   `link` is where the Open project link is drawn, card px from the top left of the back, if it is
 */
export function backTexture(project, { w, h }, pixelRatio, tokens) {
	const ink = tokens['--ink'] || '#000';
	const muted = tokens['--muted-ink'] || '#767676';
	const hairline = tokens['--hairline'] || '#e3e3e3';
	const font = tokens['--font-sans'] || 'sans-serif';
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(w * pixelRatio));
	canvas.height = Math.max(1, Math.round(h * pixelRatio));
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	ctx.scale(canvas.width / w, canvas.height / h);
	ctx.fillStyle = tokens['--paper'] || '#fff';
	ctx.fillRect(0, 0, w, h);

	// Message and address halves, split by a hairline like a real postcard's.
	const landscape = w >= h;
	const pad = Math.min(32, Math.max(12, Math.min(w, h) * 0.07));
	const split = landscape ? w * 0.56 : h * 0.5;
	const letter = landscape
		? { x: pad, y: pad, w: split - pad * 2, h: h - pad * 2 }
		: { x: pad, y: pad, w: w - pad * 2, h: split - pad * 2 };
	const address = landscape
		? { x: split + pad, y: pad, w: w - split - pad * 2, h: h - pad * 2 }
		: { x: pad, y: split + pad, w: w - pad * 2, h: h - split - pad * 2 };
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

	// The letter, in the landing Project card's type: grey date, black title, then labelled client and tools.
	/** @type {Block} */
	const label = { text: '', size: 11, leading: 1.6, color: muted, lines: 1, tracking: 0.08, upper: true };
	/** @type {Block[][]} */
	let sections = [
		[
			{ text: formatDate(project.date), size: 14, leading: 1.5, color: muted, lines: 1 },
			{ text: project.projectName, size: 20, leading: 1.35, color: ink, lines: 4, tracking: -0.015, gap: 6 }
		],
		[
			{ ...label, text: 'Client', gap: 20 },
			{ text: project.client ?? 'Self-initiated', size: 14, leading: 1.5, color: ink, lines: 2 }
		],
		[
			{ ...label, text: 'Tools', gap: 12 },
			{ text: project.tools.join(', '), size: 14, leading: 1.5, color: ink, lines: 3 }
		]
	];

	/** Wrap the letter at type scale `k`: one run per line, `y` its middle from the letter's top. @param {number} k */
	const set = (k) => {
		/** @type {{ text: string, font: string, spacing: string, color: string, y: number }[]} */
		const runs = [];
		let y = 0;
		for (const block of sections.flat()) {
			const size = block.size * k;
			y += (block.gap ?? 0) * k;
			ctx.font = `${size}px ${font}`;
			ctx.letterSpacing = `${(block.tracking ?? 0) * size}px`;
			for (const text of wrap(ctx, block.upper ? block.text.toUpperCase() : block.text, letter.w, block.lines)) {
				runs.push({ text, font: ctx.font, spacing: ctx.letterSpacing, color: block.color, y: y + (size * block.leading) / 2 });
				y += size * block.leading;
			}
		}
		return { runs, height: y };
	};
	// Too long for the card: the type shrinks together, and rather than go below 70% it leaves off the
	// tools, then the client. Smaller type never wraps to more lines.
	let typeset = set(1);
	while (typeset.height * 0.7 > letter.h && sections.length > 1) {
		sections = sections.slice(0, -1);
		typeset = set(1);
	}
	if (typeset.height > letter.h) typeset = set(letter.h / typeset.height);
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	for (const run of typeset.runs) {
		ctx.font = run.font;
		ctx.letterSpacing = run.spacing;
		ctx.fillStyle = run.color;
		ctx.fillText(run.text, letter.x, letter.y + run.y);
	}

	// Stamp: a thin black frame at the address side's top-right, the category inside in label type.
	const stampW = Math.min(88, Math.max(44, address.w * 0.3));
	const stampH = stampW * 1.2;
	const stampX = address.x + address.w - stampW;
	ctx.strokeStyle = ink;
	ctx.strokeRect(stampX, address.y, stampW, stampH);
	const words = categoryLabel(project.category).toUpperCase().split(' ');
	ctx.font = `100px ${font}`;
	ctx.letterSpacing = '8px';
	const widest = Math.max(...words.map((word) => ctx.measureText(word).width));
	const size = Math.min(stampW * 0.12, (stampW * 0.76 * 100) / widest);
	ctx.font = `${size}px ${font}`;
	ctx.letterSpacing = `${size * 0.08}px`;
	ctx.fillStyle = ink;
	ctx.textAlign = 'center';
	for (const [index, word] of words.entries()) {
		ctx.fillText(word, stampX + stampW / 2, address.y + stampH / 2 + (index - (words.length - 1) / 2) * size * 1.6);
	}

	// Address lines at the bottom of that side, if there is room under the stamp.
	const gap = Math.min(28, (address.h - stampH - 16) / 3);
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
	// (at the foot of that side when no lines fit), in the letter's value type, shrunk to fit a narrow
	// side. A canvas can't be clicked, so PostcardGallery lays a real link over the box it returns.
	let link = null;
	if (project.projectLink) {
		const text = 'Open project ↗';
		ctx.font = `14px ${font}`;
		ctx.letterSpacing = '0px';
		const size = Math.min(14, (14 * address.w) / ctx.measureText(text).width);
		ctx.font = `${size}px ${font}`;
		const baseline = lines ? address.y + address.h - 2 * gap - size * 0.3 : address.y + address.h - size * 0.25;
		ctx.fillStyle = ink;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(text, address.x, baseline);
		link = { x: address.x, y: baseline - size, w: ctx.measureText(text).width, h: size * 1.25 };
	}

	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	return { texture, link };
}
