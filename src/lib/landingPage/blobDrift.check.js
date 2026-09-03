// Run with `node src/lib/landingPage/blobDrift.check.js`: every blob stays inside the viewport,
// keeps its speed, and actually crosses the screen instead of idling.
import { createDrift, EDGE, SPEED } from './blobDrift.js';
import { landingBlobs as seeds } from './blobSeeds.js';

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
	if (!condition) throw new Error(message);
}

/** @param {number} seed */
function lcg(seed) {
	let s = seed >>> 0;
	return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

/** @param {import('./blobDrift.js').Blob[]} blobs @param {number} w @param {number} h @param {string} label */
function assertInside(blobs, w, h, label) {
	blobs.forEach((blob, i) => {
		const rx = Math.min(EDGE * blob.r, w / 2);
		const ry = Math.min(EDGE * blob.r, h / 2);
		assert(
			blob.x >= rx - 1e-6 && blob.x <= w - rx + 1e-6 && blob.y >= ry - 1e-6 && blob.y <= h - ry + 1e-6,
			`${label}: blob ${i} left the viewport (${blob.x.toFixed(1)}, ${blob.y.toFixed(1)})`
		);
	});
}

for (const [w, h] of [
	[1672, 941],
	[390, 844],
	[2560, 1440]
]) {
	for (const seed of [1, 2, 3]) {
		const label = `${w}x${h} seed ${seed}`;
		const drift = createDrift(seeds, { random: lcg(seed) });
		drift.resize(w, h);
		assertInside(drift.blobs, w, h, label);
		const start = drift.blobs.map(({ x, y }) => ({ x, y }));
		const span = drift.blobs.map(() => 0);
		for (let frame = 0; frame < 120 * 60; frame++) {
			const before = drift.blobs.map(({ x, y }) => ({ x, y }));
			drift.step(1 / 60);
			assertInside(drift.blobs, w, h, label);
			drift.blobs.forEach((blob, i) => {
				const moved = Math.hypot(blob.x - before[i].x, blob.y - before[i].y);
				// A wall hit clamps the step short; anything else is exactly one cruising step.
				assert(moved <= (SPEED * Math.min(w, h)) / 60 + 1e-6, `${label}: blob ${i} jumped ${moved.toFixed(2)}px`);
				span[i] = Math.max(span[i], Math.hypot(blob.x - start[i].x, blob.y - start[i].y));
			});
		}
		span.forEach((s, i) =>
			assert(s > 0.3 * Math.min(w, h), `${label}: blob ${i} barely travelled (${s.toFixed(1)}px)`)
		);
		// A resize re-frames positions and immediately puts strays back inside.
		drift.resize(390, 844);
		assertInside(drift.blobs, 390, 844, `${label} after resize`);
	}
}

console.log('blobDrift check passed');
