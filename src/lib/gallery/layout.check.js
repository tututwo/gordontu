// The one runnable check for the gallery's pure logic: `node src/lib/gallery/layout.check.js`.
// Plain throws on purpose — @types/node is not installed and svelte-check type-checks this file.
import { projects, slugify } from '../project/project.js';
import { cardSize, layoutPlane, panLimits } from './layout.js';
import { MAX_ZOOM, MIN_ZOOM, anchoredPan, clampZoom, wheelZoomRatio } from './pan.js';

/** @param {unknown} condition @param {string} message */
const ok = (condition, message) => {
	if (!condition) throw new Error(`layout.check: ${message}`);
};

ok(slugify('Election Map - 3D Visualization with Three.js and GLSL') === 'election-map-3d-visualization-with-three-js-and-glsl', 'slugify');
ok(projects.every((p) => p.slug.length > 0), 'slugs non-empty');

// The widest, a square and the tallest of the real images: each card is exactly its image, in one envelope.
for (const ratio of [960 / 378, 1, 850 / 1572]) {
	const { w, h } = cardSize(300, ratio);
	ok(Math.max(w, h) === 240, `a ${ratio.toFixed(2)} card fills the long-edge envelope`);
	ok(Math.abs(w / h - ratio) < 1e-9, `a ${ratio.toFixed(2)} card keeps its image's proportions`);
}
ok(layoutPlane(projects.slice(0, 6), 620, 2495).width === 2790, 'wide canvas uses four columns');
// Two columns, three rows: a row is its tallest card plus a 0.35-cell gap.
const tallRows = layoutPlane(projects.slice(0, 6), 300, 600);
const wideRows = layoutPlane(projects.slice(0, 6), 300, 600, [0.4, 0.4, 0.8, 0.3, 0.4, 0.4]);
ok(Math.abs(tallRows.height - 3 * 300 * (0.8 + 0.35)) < 1e-9, 'unknown heights keep the full-height rhythm');
ok(Math.abs(wideRows.height - 300 * (0.75 + 1.15 + 0.75)) < 1e-9, 'each row packs to its tallest card');

for (const w of [1440, 375]) {
	for (const n of [6, 8, 17]) {
		const plane = layoutPlane(projects.slice(0, n), 300, w);
		ok(plane.cells.length === n, `one cell per project for n=${n}`);
		ok(
			plane.cells.every(
				(c) =>
					Math.abs(c.x) <= plane.width / 2 &&
					Math.abs(c.y) <= plane.height / 2 &&
					Math.abs(c.rot) <= (4 * Math.PI) / 180
			),
			`cells inside the plane for n=${n} at ${w}px`
		);
		const keys = new Set(plane.cells.map((c) => `${Math.round(c.x / 50)}:${Math.round(c.y / 50)}`));
		ok(keys.size === n, `no two cards share a spot for n=${n} at ${w}px`);
		ok(JSON.stringify(layoutPlane(projects.slice(0, n), 300, w)) === JSON.stringify(plane), `deterministic n=${n}`);
	}
}

const small = panLimits(600, 400, 1440, 900, 100);
ok(small.x === 0 && small.y === 0, 'a plane smaller than the viewport cannot pan');
const big = panLimits(2400, 1200, 1440, 900, 100);
ok(big.x === (2400 + 200 - 1440) / 2 && big.y === (1200 + 200 - 900) / 2, 'pan limits leave the margin visible');

const zoomed = panLimits(2400, 1200, 1440, 900, 100, 2);
ok(zoomed.x === ((2400 + 200) * 2 - 1440) / 2, 'zoom expands horizontal pan limits');
ok(zoomed.y === ((1200 + 200) * 2 - 900) / 2, 'zoom expands vertical pan limits');
ok(panLimits(600, 400, 1440, 900, 100, 0.55).x === 0, 'a zoomed-out small plane stays pinned');

const startPan = { x: 90, y: -35 };
const anchor = { x: -220, y: 140 };
const ratio = 1.75;
const nextPan = anchoredPan(startPan, anchor, anchor, ratio);
const worldBefore = { x: (anchor.x - startPan.x) / 1, y: (anchor.y - startPan.y) / 1 };
const worldAfter = { x: (anchor.x - nextPan.x) / ratio, y: (anchor.y - nextPan.y) / ratio };
ok(Math.abs(worldAfter.x - worldBefore.x) < 1e-9, 'wheel zoom keeps the x anchor fixed');
ok(Math.abs(worldAfter.y - worldBefore.y) < 1e-9, 'wheel zoom keeps the y anchor fixed');

const movedAnchor = { x: -170, y: 110 };
const pinchedPan = anchoredPan(startPan, anchor, movedAnchor, ratio);
ok(Math.abs((movedAnchor.x - pinchedPan.x) / ratio - worldBefore.x) < 1e-9, 'pinch follows the moving x midpoint');
ok(Math.abs((movedAnchor.y - pinchedPan.y) / ratio - worldBefore.y) < 1e-9, 'pinch follows the moving y midpoint');
ok(clampZoom(0.1) === MIN_ZOOM && clampZoom(10) === MAX_ZOOM, 'zoom clamps at both ends');
ok(wheelZoomRatio(-100, 0, false) > 1, 'wheel up zooms in');
ok(wheelZoomRatio(100, 0, false) < 1, 'wheel down zooms out');
ok(Number.isFinite(wheelZoomRatio(Number.MAX_SAFE_INTEGER, 0, true)), 'huge wheel deltas stay finite');

console.log('layout ok');
