/**
 * Pure layout math for the Postcard gallery — no Svelte, no three, so plain `node` can run it.
 * World units are CSS pixels; +x right, +y up (three convention); the plane is centred on the origin.
 */

/** A card takes its image's own proportions (width / height); this is only for an image that never loads. */
export const DEFAULT_CARD_RATIO = 4 / 3;
/** Card footprint inside its cell. */
const CARD_FILL = 0.8;
/** Space under a row's tallest card, as a fraction of the cell. */
const ROW_GAP = 0.35;

/** Cell pitch from viewport width — one knob for how big the postcards read. @param {number} viewportWidth */
export function cellSize(viewportWidth) {
	return Math.max(340, Math.min(620, viewportWidth * 0.4));
}

/**
 * Every card has the same long edge whatever its proportions, so an image's aspect never moves the grid.
 * @param {number} cell @param {number} ratio width / height
 * @returns {{ w: number, h: number }}
 */
export function cardSize(cell, ratio) {
	const long = cell * CARD_FILL;
	return ratio >= 1 ? { w: long, h: long / ratio } : { w: long * ratio, h: long };
}

/**
 * The whole section laid out once — every project appears exactly one time.
 * Columns follow the visible cell pitch (two on a phone, ~four on a wide desktop), preferring a count whose
 * last row is fullest; a short last row is spread across the full width so there is no void.
 * Odd rows shift half a step (checkerboard) and every card gets seed jitter and a ±4° tilt.
 * @param {{ seed: number }[]} projects
 * @param {number} cell
 * @param {number} viewportW
 * @param {number[]} [heights] each card's height in cells, once its image is in (unknown: the full 0.8)
 * @returns {{ width: number, height: number, cells: { x: number, y: number, rot: number }[] }}
 *   `cells` are centred on the origin, so the plane spans ±width/2 × ±height/2.
 */
export function layoutPlane(projects, cell, viewportW, heights = []) {
	const n = projects.length;
	const low = Math.min(n, Math.max(2, Math.round(viewportW / cell)));
	const high = Math.min(n, low + 1);
	/** How full the last row is with `c` columns (a full row is 1). @param {number} c */
	const lastRowFill = (c) => (n % c) / c || 1;
	const cols = lastRowFill(high) > lastRowFill(low) ? high : low;
	const rows = Math.ceil(n / cols);
	// Odd rows overhang by half a cell (checkerboard), so the plane is that much wider.
	const rowWidth = cols * cell;
	const width = rowWidth + (rows > 1 ? cell / 2 : 0);
	// Each row is as tall as its tallest card plus one gap, so a row of wide images packs as closely
	// as a row of tall ones instead of leaving a band of empty table under it.
	const pitches = Array.from({ length: rows }, (_, row) => {
		let tallest = 0;
		for (let index = row * cols; index < Math.min(n, (row + 1) * cols); index += 1) {
			tallest = Math.max(tallest, heights[index] ?? CARD_FILL);
		}
		return cell * (tallest + ROW_GAP);
	});
	const tops = pitches.map((_, row) => pitches.slice(0, row).reduce((sum, pitch) => sum + pitch, 0));
	const height = tops[rows - 1] + pitches[rows - 1];
	const cells = projects.map((project, index) => {
		const col = index % cols;
		const row = Math.floor(index / cols);
		const inRow = Math.min(cols, n - row * cols);
		const step = rowWidth / inRow;
		const s = project.seed;
		const jitterX = ((s % 100) / 100 - 0.5) * 0.16 * cell;
		const jitterY = (((s >>> 7) % 100) / 100 - 0.5) * 0.16 * cell;
		const rot = ((((s >>> 14) % 100) / 100) - 0.5) * ((8 * Math.PI) / 180);
		return {
			x: (row % 2 ? cell / 2 : 0) + (col + 0.5) * step + jitterX - width / 2,
			y: height / 2 - (tops[row] + pitches[row] / 2 + jitterY),
			rot
		};
	});
	return { width, height, cells };
}

/**
 * How far the camera may travel so the plane's edge never leaves the viewport more than `margin`
 * behind. A plane smaller than the viewport is pinned to the centre on that axis.
 * @param {number} planeW @param {number} planeH @param {number} viewportW @param {number} viewportH @param {number} margin
 * @param {number} [zoom=1]
 * @returns {{ x: number, y: number }} half-extents; the camera stays within ±x, ±y
 */
export function panLimits(planeW, planeH, viewportW, viewportH, margin, zoom = 1) {
	return {
		x: Math.max(0, ((planeW + margin * 2) * zoom - viewportW) / 2),
		y: Math.max(0, ((planeH + margin * 2) * zoom - viewportH) / 2)
	};
}
