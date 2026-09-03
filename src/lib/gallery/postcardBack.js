import rough from 'roughjs';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { categoryLabel } from '../project/project.js';

/** A Project's seed mapped into rough.js's accepted range, so its back is unique but stable. @param {number} projectSeed */
export function cardSeed(projectSeed) {
	return (projectSeed % 2000000000) + 1;
}

/** Design-token values the canvas needs (it cannot resolve `var()`). */
const TOKENS = ['--paper-elevated', '--ink', '--muted-ink', '--accent', '--sketch-line', '--sketch-line-soft'];
const HAND_FONT = '"Shantell Sans Variable"';
const DISPLAY_FONT = '"Newsreader Variable"';

/** Read the tokens once per session; the site has a single light theme. */
export function readTokens() {
	const style = getComputedStyle(document.documentElement);
	return Object.fromEntries(TOKENS.map((name) => [name, style.getPropertyValue(name).trim()]));
}

/** Make sure the two web fonts are usable on a canvas before we draw with them. */
export function loadBackFonts() {
	return Promise.all([
		document.fonts.load(`500 28px ${HAND_FONT}`),
		document.fonts.load(`440 20px ${DISPLAY_FONT}`)
	]).catch(() => undefined);
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
 * The back of a postcard: paper, a rough divider, name / date / tools on the left,
 * the category as a hand-stamped mark top-right. Same seed as the card's sketch frames.
 * @param {import('../project/project.js').Project} project
 * @param {boolean} landscape
 * @param {Record<string, string>} tokens from readTokens()
 */
export function backTexture(project, landscape, tokens) {
	const w = landscape ? 900 : 600;
	const h = landscape ? 600 : 900;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	const rc = rough.canvas(canvas);
	const seed = cardSeed(project.seed);
	const pad = Math.round(w * 0.07);

	ctx.fillStyle = tokens['--paper-elevated'] || '#fffefe';
	ctx.fillRect(0, 0, w, h);

	// Divider: postcards split message from address.
	const divide = landscape ? w * 0.56 : w * 0.5;
	if (landscape) {
		rc.line(divide, pad, divide, h - pad, { seed, stroke: tokens['--sketch-line-soft'], strokeWidth: 1.6, roughness: 1.3 });
	} else {
		rc.line(pad, h * 0.5, w - pad, h * 0.5, { seed, stroke: tokens['--sketch-line-soft'], strokeWidth: 1.6, roughness: 1.3 });
	}

	// Stamp: category label in a rough frame, slightly askew, top-right.
	const stampW = w * 0.2;
	const stampH = stampW * 0.72;
	ctx.save();
	ctx.translate(w - pad - stampW, pad);
	ctx.rotate(-0.06 + ((seed % 7) - 3) * 0.012);
	rc.rectangle(0, 0, stampW, stampH, {
		seed: seed + 17,
		stroke: tokens['--accent'],
		strokeWidth: 2,
		roughness: 1.6,
		fill: tokens['--accent'],
		fillStyle: 'hachure',
		hachureGap: 9,
		fillWeight: 0.6
	});
	ctx.fillStyle = tokens['--accent'] || '#e94f87';
	ctx.font = `600 ${Math.round(stampW * 0.16)}px ${HAND_FONT}, cursive`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(categoryLabel(project.category).toUpperCase(), stampW / 2, stampH / 2);
	ctx.restore();

	// Message side.
	const textX = pad;
	const textW = (landscape ? divide : w) - pad * 2;
	let y = landscape ? h * 0.3 : h * 0.16;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'alphabetic';
	ctx.fillStyle = tokens['--ink'] || '#342943';
	const titleSize = Math.round(w * 0.052);
	ctx.font = `500 ${titleSize}px ${HAND_FONT}, cursive`;
	for (const line of wrap(ctx, project.projectName, textW, 4)) {
		ctx.fillText(line, textX, y);
		y += titleSize * 1.28;
	}
	y += titleSize * 0.5;
	ctx.fillStyle = tokens['--muted-ink'] || '#70677f';
	const metaSize = Math.round(w * 0.03);
	ctx.font = `440 ${metaSize}px ${DISPLAY_FONT}, Georgia, serif`;
	ctx.fillText(formatDate(project.date), textX, y);
	y += metaSize * 1.6;
	for (const line of wrap(ctx, project.tools.join(' · '), textW, 3)) {
		ctx.fillText(line, textX, y);
		y += metaSize * 1.45;
	}

	// Address side: faint ruled lines, like a real postcard waiting for an address.
	const linesX = landscape ? divide + pad : pad;
	const linesW = landscape ? w - divide - pad * 2 : w - pad * 2;
	let lineY = landscape ? h * 0.56 : h * 0.66;
	for (let index = 0; index < 3; index += 1) {
		rc.line(linesX, lineY, linesX + linesW, lineY, {
			seed: seed + 31 + index,
			stroke: tokens['--sketch-line-soft'],
			strokeWidth: 1.2,
			roughness: 0.9
		});
		lineY += h * 0.09;
	}

	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	return texture;
}
