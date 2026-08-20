/**
 * Pure layout math for the Postcard gallery — no Svelte, no three, so plain `node` can run it.
 * World units are CSS pixels; +x right, +y up (three convention); the plane is centred on the origin.
 */

/** Postcard proportion (6 × 4). */
export const CARD_RATIO = 1.5;
/** Card footprint inside its cell. */
const CARD_FILL = 0.8;
/** Row pitch as a fraction of the cell. */
const ROW_PITCH = 1.15;

/** Cell pitch from viewport width — one knob for how big the postcards read. @param {number} viewportWidth */
export function cellSize(viewportWidth) {
	return Math.max(340, Math.min(620, viewportWidth * 0.4));
}

/**
 * Landscape and portrait cards share the same cell so a late aspect decision never moves the grid.
 * @param {number} cell @param {boolean} landscape @returns {{ w: number, h: number }}
 */
export function cardSize(cell, landscape) {
	const long = cell * CARD_FILL;
	const short = long / CARD_RATIO;
	return landscape ? { w: long, h: short } : { w: short, h: long };
}

/**
 * The whole section laid out once — every project appears exactly one time.
 * Columns follow the visible cell pitch (two on a phone, ~four on a wide desktop), preferring a count whose
 * last row is fullest; a short last row is spread across the full width so there is no void.
 * Odd rows shift half a step (checkerboard) and every card gets seed jitter and a ±4° tilt.
 * @param {{ seed: number }[]} projects
 * @param {number} cell
 * @param {number} viewportW @param {number} viewportH
 * @returns {{ width: number, height: number, cells: { x: number, y: number, rot: number }[] }}
 *   `cells` are centred on the origin, so the plane spans ±width/2 × ±height/2.
 */
export function layoutPlane(projects, cell, viewportW, viewportH) {
	const n = projects.length;
	const low = Math.min(n, Math.max(2, Math.round(viewportW / cell)));
	const high = Math.min(n, low + 1);
	let cols = low;
	let bestFill = -1;
	for (let candidate = low; candidate <= Math.min(high, n); candidate += 1) {
		const remainder = n % candidate;
		const fill = remainder === 0 ? 1 : remainder / candidate;
		if (fill > bestFill) {
			bestFill = fill;
			cols = candidate;
		}
	}
	const rows = Math.max(1, Math.ceil(n / cols));
	// Odd rows overhang by half a cell (checkerboard), so the plane is that much wider.
	const rowWidth = cols * cell;
	const width = rowWidth + (rows > 1 ? cell / 2 : 0);
	// Cards are mostly landscape (0.53 cell tall), so rows sit closer than columns; one portrait still fits.
	const rowPitch = cell * ROW_PITCH;
	const height = rows * rowPitch;
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
			y: height / 2 - ((row + 0.5) * rowPitch + jitterY),
			rot
		};
	});
	return { width, height, cells };
}

/**
 * How far the camera may travel so the plane's edge never leaves the viewport more than `margin`
 * behind. A plane smaller than the viewport is pinned to the centre on that axis.
 * @param {number} planeW @param {number} planeH @param {number} viewportW @param {number} viewportH @param {number} margin
 * @returns {{ x: number, y: number }} half-extents; the camera stays within ±x, ±y
 */
export function panLimits(planeW, planeH, viewportW, viewportH, margin) {
	return {
		x: Math.max(0, (planeW + margin * 2 - viewportW) / 2),
		y: Math.max(0, (planeH + margin * 2 - viewportH) / 2)
	};
}
