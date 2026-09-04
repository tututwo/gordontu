// The one runnable check for the gallery's pure logic: `node src/lib/gallery/layout.check.js`.
// Plain throws on purpose — @types/node is not installed and svelte-check type-checks this file.
import { projects, slugify } from '../project/project.js';
import {
	CARD_RATIOS,
	cardSize,
	closestCardRatio,
	containScale,
	layoutPlane,
	panLimits
} from './layout.js';
import { MAX_ZOOM, MIN_ZOOM, anchoredPan, clampZoom, wheelZoomRatio } from './viewTransform.js';

/** @param {unknown} condition @param {string} message */
const ok = (condition, message) => {
	if (!condition) throw new Error(`layout.check: ${message}`);
};

ok(slugify('Election Map - 3D Visualization with Three.js and GLSL') === 'election-map-3d-visualization-with-three-js-and-glsl', 'slugify');
ok(new Set(projects.map((p) => p.slug)).size === projects.length, 'slugs unique');
ok(projects.every((p) => p.slug.length > 0), 'slugs non-empty');

const a4 = cardSize(300, CARD_RATIOS.a4);
const instagram = cardSize(300, CARD_RATIOS.instagram);
const macbook = cardSize(300, CARD_RATIOS.macbookAir);
ok(a4.h === 240 && instagram.h === 240 && macbook.w === 240, 'all aspects share a long-edge envelope');
ok(a4.w < instagram.w && macbook.h < macbook.w, 'the three cards keep their supplied proportions');
ok(closestCardRatio(4967 / 6730) === CARD_RATIOS.a4, 'A4 is selected for tall source art');
ok(closestCardRatio(1200 / 1200) === CARD_RATIOS.instagram, 'Instagram is selected for square source art');
ok(closestCardRatio(2018 / 947) === CARD_RATIOS.macbookAir, 'MacBook Air is selected for wide source art');
const a4InstagramBoundary = Math.sqrt(CARD_RATIOS.a4 * CARD_RATIOS.instagram);
const instagramMacbookBoundary = Math.sqrt(CARD_RATIOS.instagram * CARD_RATIOS.macbookAir);
ok(closestCardRatio(a4InstagramBoundary * 0.999) === CARD_RATIOS.a4, 'A4 boundary lower side');
ok(closestCardRatio(a4InstagramBoundary * 1.001) === CARD_RATIOS.instagram, 'A4 boundary upper side');
ok(
	closestCardRatio(instagramMacbookBoundary * 0.999) === CARD_RATIOS.instagram,
	'Instagram boundary lower side'
);
ok(
	closestCardRatio(instagramMacbookBoundary * 1.001) === CARD_RATIOS.macbookAir,
	'Instagram boundary upper side'
);
ok(closestCardRatio(Number.NaN) === CARD_RATIOS.instagram, 'invalid image ratios use the stable fallback');
const containedWide = containScale(2018 / 947, CARD_RATIOS.macbookAir);
ok(containedWide.x === 1 && containedWide.y < 1, 'wide art is contained without horizontal cropping');
const containedTall = containScale(4967 / 6730, CARD_RATIOS.a4);
ok(
	containedTall.x <= 1 && containedTall.y <= 1 && (containedTall.x === 1 || containedTall.y === 1),
	'tall art is contained without cropping'
);
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
