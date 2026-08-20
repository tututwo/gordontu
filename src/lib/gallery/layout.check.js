// The one runnable check for the gallery's pure logic: `node src/lib/gallery/layout.check.js`.
// Plain throws on purpose — @types/node is not installed and svelte-check type-checks this file.
import { projects, slugify } from '../project/project.js';
import { cardSize, layoutPlane, panLimits } from './layout.js';

/** @param {unknown} condition @param {string} message */
const ok = (condition, message) => {
	if (!condition) throw new Error(`layout.check: ${message}`);
};

ok(slugify('Election Map - 3D Visualization with Three.js and GLSL') === 'election-map-3d-visualization-with-three-js-and-glsl', 'slugify');
ok(new Set(projects.map((p) => p.slug)).size === projects.length, 'slugs unique');
ok(projects.every((p) => p.slug.length > 0), 'slugs non-empty');

const landscape = cardSize(300, true);
const portrait = cardSize(300, false);
ok(landscape.w === portrait.h && landscape.h === portrait.w, 'aspects share a cell');
ok(layoutPlane(projects.slice(0, 6), 620, 2495, 1154).width === 2790, 'wide canvas uses four columns');

for (const [w, h] of [
	[1440, 900],
	[375, 812]
]) {
	for (const n of [6, 8, 17]) {
		const plane = layoutPlane(projects.slice(0, n), 300, w, h);
		ok(plane.cells.length === n, `one cell per project for n=${n}`);
		ok(
			plane.cells.every(
				(c) =>
					Math.abs(c.x) <= plane.width / 2 &&
					Math.abs(c.y) <= plane.height / 2 &&
					Math.abs(c.rot) <= (4 * Math.PI) / 180
			),
			`cells inside the plane for n=${n} at ${w}x${h}`
		);
		const keys = new Set(plane.cells.map((c) => `${Math.round(c.x / 50)}:${Math.round(c.y / 50)}`));
		ok(keys.size === n, `no two cards share a spot for n=${n} at ${w}x${h}`);
		ok(JSON.stringify(layoutPlane(projects.slice(0, n), 300, w, h)) === JSON.stringify(plane), `deterministic n=${n}`);
	}
}

const small = panLimits(600, 400, 1440, 900, 100);
ok(small.x === 0 && small.y === 0, 'a plane smaller than the viewport cannot pan');
const big = panLimits(2400, 1200, 1440, 900, 100);
ok(big.x === (2400 + 200 - 1440) / 2 && big.y === (1200 + 200 - 900) / 2, 'pan limits leave the margin visible');

console.log('layout ok');
