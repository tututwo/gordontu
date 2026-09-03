/**
 * Drift for the landing Blob field: three soft discs cruise across the whole viewport in straight
 * lines and bounce off its edges. Pure math in CSS px with a y-up origin (bottom-left, the
 * shader's frame) — no DOM, no Svelte; `blobDrift.check.js` proves the invariants.
 */

/** Cruising speed per second as a fraction of min(width, height). */
export const SPEED = 0.02;
/** A blob bounces when this fraction of its radius meets an edge: the dense paint, not the last speckle. */
export const EDGE = 0.75;
/** Longest step integrated at once; a background tab's first frame back is not a jump. */
const MAX_DT = 0.05;

/**
 * @typedef {object} Seed
 * @property {[number, number]} home  x, y as fractions of the viewport, origin bottom-left
 * @property {number} radius  fraction of min(width, height)
 */

/**
 * @typedef {object} Blob
 * @property {number} x
 * @property {number} y
 * @property {number} r
 * @property {number} vx  unit direction; scaled by SPEED in step()
 * @property {number} vy
 */

/**
 * @param {Seed[]} seeds
 * @param {{ random?: () => number }} [options]  inject `random` for a deterministic run
 */
export function createDrift(seeds, { random = Math.random } = {}) {
	let width = 0;
	let height = 0;
	let scale = 1;
	// Headings fan out evenly from one random spin so the three never set off the same way.
	const spin = random() * Math.PI * 2;
	/** @type {Blob[]} */
	const blobs = seeds.map((_, i) => {
		const heading = spin + (i / seeds.length) * Math.PI * 2;
		return { x: 0, y: 0, r: 1, vx: Math.cos(heading), vy: Math.sin(heading) };
	});

	/** Anything past an edge is put back on it and sent the other way. */
	function bounce() {
		for (const blob of blobs) {
			// A viewport narrower than the blob just pins it to the middle instead of flapping.
			const rx = Math.min(EDGE * blob.r, width / 2);
			const ry = Math.min(EDGE * blob.r, height / 2);
			if (blob.x < rx) (blob.x = rx), (blob.vx = Math.abs(blob.vx));
			else if (blob.x > width - rx) (blob.x = width - rx), (blob.vx = -Math.abs(blob.vx));
			if (blob.y < ry) (blob.y = ry), (blob.vy = Math.abs(blob.vy));
			else if (blob.y > height - ry) (blob.y = height - ry), (blob.vy = -Math.abs(blob.vy));
		}
	}

	return {
		blobs,

		/** @param {number} w @param {number} h CSS px */
		resize(w, h) {
			const first = width === 0;
			const sx = first ? 0 : w / width;
			const sy = first ? 0 : h / height;
			width = w;
			height = h;
			scale = Math.min(w, h);
			blobs.forEach((blob, i) => {
				// First layout places every blob at home; later resizes re-frame the current positions.
				blob.x = first ? seeds[i].home[0] * w : blob.x * sx;
				blob.y = first ? seeds[i].home[1] * h : blob.y * sy;
				blob.r = seeds[i].radius * scale;
			});
			bounce();
		},

		/** @param {number} dt seconds */
		step(dt) {
			const v = SPEED * scale * Math.min(dt, MAX_DT);
			for (const blob of blobs) {
				blob.x += blob.vx * v;
				blob.y += blob.vy * v;
			}
			bounce();
		}
	};
}
