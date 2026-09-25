import { BoxGeometry, Group, Mesh, Vector3, Vector4 } from 'three';
import { sineInOut } from 'svelte/easing';
import { Spring } from '../spring.js';
import { lineGlsl, smoothstep } from './stage.js';

/**
 * visual stories: a pop-up book. At rest a closed book lies cover-up. Lit, it opens almost flat on its
 * spine, and five cubes of different sizes push up through the gutter one after another, then drift
 * well above the spread, spread out in depth as well as along it, and melt into one another and
 * apart like metaballs, on a fixed
 * seven-second script so every in-between state reads. The cubes are raymarched (rounded boxes joined
 * by a smooth union, cut off at page level) in the same canvas: where the surface is still a cube's
 * own it gets a hairline at the cube's edges like the boxes, where cubes have melted together only
 * the silhouette is inked, so necks stay soft.
 */

/**
 * Book length along the spine (long enough that no cube ever hangs off the end), thickness of each
 * half closed, width spine to fore-edge: a thin book, nearly as wide as it is long, so it opens on a
 * big spread. Closed it lies flat, one slab with no seam between its halves; opening, the seam comes
 * back and the halves thin to sheets, so the spread is drawn in single lines.
 */
const SPINE = 0.82;
const HALF = 0.08;
const WIDE = 0.66;
/** Open this far, the halves have thinned to sheets. */
const SHEET = 0.6;
/** Open, the top half turns over and the bottom half tilts back: a shallow, symmetric 152° V. */
const TURN = (166 * Math.PI) / 180;
const TILT = (14 * Math.PI) / 180;

/** Reference px per unit, closed and open (the open spread and its cubes stay inside the lit brackets). */
const SCALE_CLOSED = 48;
const SCALE_OPEN = 60;

/**
 * Cubes, biggest to smallest: half-size, bob period (s) and phase, and the order they rise in: the
 * two small ones of the high row first, so each clears the gutter before the next comes up past it.
 */
const CUBES = [
	{ half: 0.125, bob: 1.3, phase: 0, order: 3 },
	{ half: 0.105, bob: 1.7, phase: 2, order: 2 },
	{ half: 0.088, bob: 1.5, phase: 4, order: 4 },
	{ half: 0.075, bob: 1.9, phase: 1, order: 0 },
	{ half: 0.062, bob: 1.4, phase: 3, order: 1 }
];
/** Once the spread is half open, a cube pops up this often (ms). */
const STAGGER = 90;
/** Smooth-union radius: about a 2.6 px fillet where cubes meet. */
const MELT = 0.1;
/** How far a cube bobs up and down while it floats. */
const BOB = 0.02;

/**
 * Where the cubes float, [along the spine, height above the gutter, out across it] for each, biggest
 * first: a low row of three, staggered behind and in front of the spine, and a high pair above them,
 * placed so that from the icon's 45° view no cube hides behind another. Apart, faces are more than
 * the melt radius apart (and the bob), so edges stay crisp.
 */
const APART = [[-0.21, 0.33, -0.18], [-0.07, 0.34, 0.19], [0.3, 0.34, 0.17], [-0.03, 0.67, -0.1], [0.25, 0.67, -0.1]];
/** Two pairs fuse, a high cube dropping onto a low one at each end, as the middle one rises between them. */
const PAIRS = [[-0.2, 0.34, -0.12], [0.1, 0.71, -0.1], [0.27, 0.34, 0.14], [-0.19, 0.53, -0.12], [0.26, 0.48, 0.14]];
/** All five in one blob. */
const ALL = [[-0.08, 0.38, -0.04], [0.08, 0.4, 0.06], [0.16, 0.34, -0.06], [-0.04, 0.56, 0.02], [0.1, 0.56, -0.02]];
/** New partners: the two biggest below, the two smallest above; the third waits apart. */
const CROSS = [[-0.18, 0.35, -0.08], [0, 0.37, 0.04], [0.3, 0.36, 0.17], [-0.06, 0.66, -0.04], [0.06, 0.66, 0.02]];
/** The goo script, 7 s: [time, positions]. Apart; two pairs; one blob; new pairs; apart; hold. */
const SCRIPT = /** @type {[number, number[][]][]} */ ([
	[0, APART],
	[0.8, APART],
	[1.8, PAIRS],
	[2.4, PAIRS],
	[3.4, ALL],
	[3.8, ALL],
	[4.8, CROSS],
	[5.4, CROSS],
	[6.4, APART],
	[7, APART]
]);
const LOOP = 7;

/** @param {number} t loop time in seconds */
function scripted(t) {
	const at = t % LOOP;
	for (let k = 1; k < SCRIPT.length; k++) {
		const [t0, a] = SCRIPT[k - 1];
		const [t1, b] = SCRIPT[k];
		if (at <= t1) {
			const e = sineInOut((at - t0) / (t1 - t0));
			return a.map((from, i) => from.map((v, axis) => v + (b[i][axis] - v) * e));
		}
	}
	return APART;
}

const gooVertex = /* glsl */ `
varying vec3 vLocal;
varying vec3 vDir;

void main() {
	vLocal = position;
	// The camera looks down view -z; in the book's own space that is one direction for every pixel.
	vDir = normalize((inverse(modelViewMatrix) * vec4(0.0, 0.0, -1.0, 0.0)).xyz);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const gooFragment = /* glsl */ `
// three sets these for every program; the fragment stage has to declare them to write depth.
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec3 uInk;
uniform vec4 uCubes[${CUBES.length}];
uniform float uMelt;
uniform float uPixel;
// The two page surfaces, as planes through the spine: the side of each facing the air.
uniform vec3 uPageBottom;
uniform vec3 uPageTop;
varying vec3 vLocal;
varying vec3 vDir;
${lineGlsl}

const float ROUND = 0.015;
const vec2 EDGE_ON = vec2(0.4, 0.7);

float cube(vec3 p, int i) {
	vec3 d = abs(p - uCubes[i].xyz) - vec3(uCubes[i].w - ROUND);
	return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0) - ROUND;
}

float smin(float a, float b, float k) {
	float h = max(k - abs(a - b), 0.0) / k;
	return min(a, b) - h * h * k * 0.25;
}

// The cubes, melted together...
float melted(vec3 p) {
	float d = 1e3;
	for (int i = 0; i < ${CUBES.length}; i++) d = smin(d, cube(p, i), uMelt);
	return d;
}

// Height above the open pages: they form a V on the spine, so the air above is where both
// page planes are below.
float aboveBook(vec3 p) {
	return min(dot(p, uPageBottom), dot(p, uPageTop));
}

// ...and cut off where they meet the pages, so they rise through the gutter.
float scene(vec3 p) {
	return max(melted(p), -aboveBook(p));
}

// How much the surface near p is still cube i's own (1) rather than a melted neck (0): a hard,
// pixel-thin test of how far the melt has pulled it off the cube, so necks never get fractional
// cube edges. Measured against the melted surface there, not the point itself, so the march's own
// error doesn't break a cube's edges into dots.
float owned(vec3 p, int i, float surface) {
	return 1.0 - smoothstep(0.0, uPixel * 0.3, cube(p, i) - surface);
}

vec3 normalAt(vec3 p) {
	vec2 e = vec2(0.0015, -0.0015);
	return normalize(
		e.xyy * scene(p + e.xyy) + e.yyx * scene(p + e.yyx) + e.yxy * scene(p + e.yxy) + e.xxx * scene(p + e.xxx)
	);
}

void main() {
	vec3 dir = normalize(vDir);
	float t = 0.0;
	float nearest = 1e3;
	float nearestT = 0.0;
	bool hit = false;
	for (int i = 0; i < 72; i++) {
		float d = scene(vLocal + dir * t);
		if (d < nearest) { nearest = d; nearestT = t; }
		if (d < 0.0004) { hit = true; break; }
		t += d;
		if (t > 3.0) break;
	}

	vec3 at = vLocal + dir * (hit ? t : nearestT);
	// On the page, the cut face lies exactly on the page's own face: nudge it forward so the rim
	// drawn there wins the depth test.
	bool onPage = aboveBook(at) < uPixel;
	vec4 clip = projectionMatrix * modelViewMatrix * vec4(at, 1.0);
	gl_FragDepth = clip.z / clip.w * 0.5 + 0.5 - (onPage ? 2e-5 : 0.0);

	// Every line here is a whole line wide: there is no second face to draw half of it, since the
	// surface is found per pixel.
	float surface = melted(at);
	float cubed = 0.0;
	for (int i = 0; i < ${CUBES.length}; i++) cubed = max(cubed, owned(at, i, surface));
	if (!hit) {
		// Just outside the silhouette, the outer half of its line: the ray's closest pass is its
		// distance from it, on screen.
		float fringe = centred(nearest / uPixel);
		if (fringe <= 0.0) discard;
		gl_FragColor = vec4(uInk, fringe);
		return;
	}
	vec3 n = normalAt(at);

	// Along a melted neck, which has no edge, the silhouette's inner half: the mirror of the fringe.
	// How deep the ray gets inside the blob before it comes out again, or is deeper than the line
	// reaches, is how far in from the silhouette it is; only where the surface is turning edge-on,
	// for a ray running along the crease where two cubes melt together stays as shallow.
	float neck = 0.0;
	float edgeOn = 1.0 - smoothstep(EDGE_ON.x, EDGE_ON.y, abs(dot(n, dir)));
	if (cubed < 1.0 && edgeOn > 0.0) {
		float deepest = 0.0;
		float s = t;
		for (int k = 0; k < 24; k++) {
			float d = melted(vLocal + dir * s);
			if (d > 0.0 && deepest < 0.0) break;
			deepest = min(deepest, d);
			if (deepest < -(0.5 * uLine + 0.5) * uPixel) break;
			s += max(-d, 0.3 * uPixel);
		}
		neck = (1.0 - cubed) * edgeOn * centred(deepest / uPixel);
	}

	// Edges of whichever cube the point still belongs to, measured exactly on screen (derivatives
	// break up along a raymarched edge): the distance from the line down the middle of the nearest
	// edge's rounding, in the plane across the edge, as the two faces there turn to the camera.
	float edges = neck;
	for (int i = 0; i < ${CUBES.length}; i++) {
		// Only a cube's own surface: in a melted neck the surface pulls away from every cube.
		float own = owned(at, i, surface);
		if (own <= 0.0) continue;
		// Distances in to the three face planes: the nearest edge runs along the axis of the largest.
		vec3 gap = uCubes[i].w - abs(at - uCubes[i].xyz);
		vec3 along = step(max(gap.x, max(gap.y, gap.z)), gap);
		vec3 across = (1.0 - along) * (ROUND * 0.29 - gap);
		vec3 facing = (1.0 - along) * sign(at - uCubes[i].xyz) * -dir;
		float edge = length(cross(across, facing)) / sqrt(max(1.0 - dot(dir * dir, along), 1e-4));
		edges = max(edges, own * centred(edge / uPixel));
	}

	// Where the page cuts the cubes, only the rim is inked: the line where a cube meets the page,
	// measured up the cube's side from the page (and, on the cut face, in from the cube's side).
	vec3 page = dot(at, uPageBottom) < dot(at, uPageTop) ? uPageBottom : uPageTop;
	vec3 rim = cross(n, page);
	float up = aboveBook(at) / max(length(rim), 1e-3);
	float slant = dot(normalize(rim + 1e-6), dir);
	up *= abs(dot(n, dir)) / sqrt(max(1.0 - slant * slant, 1e-4));
	float cut = centred(max(up, -surface) / uPixel);

	gl_FragColor = vec4(mix(vec3(1.0), uInk, max(edges, cut)), 1.0);
}`;

/** @param {import('./stage.js').Stage} stage @returns {import('./stage.js').Icon} */
export function createBookIcon(stage) {
	const book = new Group();
	stage.pivot.add(book);

	// The spine runs along x through the origin at page level; both halves reach out towards +z, the
	// bottom one below the page, the top one above it. Closed, their pages lie against each other and
	// the two read as one; opening, each draws half the seam between them, and so do their spine ends,
	// the gutter.
	const looks = [stage.inked(), stage.inked()];
	const [bottomGlued, topGlued] = looks.map((look) => /** @type {Vector3[]} */ (look.uniforms.uGlued.value));
	const halves = looks.map((look) => stage.box([SPINE, HALF, WIDE], [0, 0, WIDE / 2], look));
	const [bottom, top] = halves.map((half) => new Group().add(half));
	book.add(bottom, top);

	// The cubes live in a box of space above the gutter; its front faces start the rays.
	const room = stage.own(new BoxGeometry(SPINE + 0.2, 0.98, 0.72));
	room.translate(0, 0.47, 0);
	const cubes = CUBES.map(() => new Vector4());
	const goo = stage.material(
		gooFragment,
		{
			uCubes: { value: cubes },
			uMelt: { value: MELT },
			uPixel: { value: 0.01 },
			uPageBottom: { value: new Vector3(0, 1, 0) },
			uPageTop: { value: new Vector3(0, -1, 0) }
		},
		{ vertexShader: gooVertex, transparent: true }
	);
	const gooMesh = new Mesh(room, goo);
	book.add(gooMesh);

	const open = new Spring(0);
	// A little overshoot as each cube pops up (ζ ≈ 0.55).
	const lifts = CUBES.map(() => new Spring(0, { tension: 300, friction: 19 }));
	let time = 0;
	/** How long the spread has been half open, while lit. */
	let opened = 0;

	return {
		frame(dt, { lit, reduced }) {
			// The spread leads and the cubes rise with it in turn; closing waits for them to sink.
			const showing = lifts.some((s) => s.value > 0.1);
			const openGoal = lit || showing ? 1 : 0;
			if (open.target !== openGoal) open.to(openGoal);
			opened = lit && open.value > 0.5 ? opened + dt : 0;
			lifts.forEach((s, i) => {
				const goal = lit && opened >= STAGGER * CUBES[i].order ? 1 : 0;
				if (s.target !== goal) s.to(goal);
			});
			if (reduced) {
				open.set(lit ? 1 : 0);
				for (const s of lifts) s.set(lit ? 1 : 0);
			}
			let moving = open.advance(dt);
			for (const s of lifts) moving = s.advance(dt) || moving;

			const risen = Math.max(0, ...lifts.map((s) => s.value));
			// Reduced motion: one still frame, two pairs fused and one cube apart.
			if (reduced) time = 2100;
			else if (risen > 0.001) time += dt;
			else time = 0;
			const t = time / 1000;
			// The script eases in over its first 0.4 s so the rise isn't yanked sideways.
			const amount = smoothstep(0, 0.4, t);
			const at = scripted(t);

			const p = Math.min(1, Math.max(0, open.value));
			const thick = Math.max(1e-4, HALF * (1 - smoothstep(0, SHEET, p)));
			halves.forEach((half, i) => {
				half.scale.y = thick;
				half.position.y = ((i ? 1 : -1) * thick) / 2;
			});
			bottomGlued[0].z = topGlued[0].z = p;
			bottomGlued[1].y = topGlued[0].y = 2 - smoothstep(0, 0.15, p);
			top.rotation.x = -TURN * open.value;
			bottom.rotation.x = -TILT * open.value;
			// The page faces' normals into the air: the bottom half's top face and the top half's
			// underside, turned with their halves (closed, they face each other and leave no air).
			goo.uniforms.uPageBottom.value.set(0, Math.cos(bottom.rotation.x), Math.sin(bottom.rotation.x));
			goo.uniforms.uPageTop.value.set(0, -Math.cos(top.rotation.x), -Math.sin(top.rotation.x));
			stage.pivot.scale.setScalar(SCALE_CLOSED + (SCALE_OPEN - SCALE_CLOSED) * p);
			// Keep it centred: closed it lies to one side of the spine, open it straddles it, and risen
			// cubes add height.
			book.position.set(0, -0.23 * risen, -(WIDE / 2) * (1 - p));

			CUBES.forEach((c, i) => {
				const lift = lifts[i].value;
				const [x0, y0, z0] = APART[i];
				const x = x0 + (at[i][0] - x0) * amount;
				const height = y0 + (at[i][1] - y0) * amount + BOB * Math.sin((2 * Math.PI * t) / c.bob + c.phase) * amount;
				const z = z0 + (at[i][2] - z0) * amount;
				// Up through the gutter: from just below the page to its hover height, drifting out to
				// its place in front of or behind the spine as it goes.
				cubes[i].set(x, -c.half + (height + c.half) * lift, z * lift, c.half);
			});
			// Sunk to a sliver in the gutter, the cubes are gone.
			gooMesh.visible = risen > 0.03;
			// One device pixel in book units, for hairline widths.
			goo.uniforms.uPixel.value = stage.pixel() / stage.pivot.scale.x;
			return moving || (lit && !reduced);
		}
	};
}
