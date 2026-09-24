import { BoxGeometry, Group, Mesh, Vector3, Vector4 } from 'three';
import { Spring } from '../spring.js';
import { smoothstep } from './stage.js';

/**
 * visual stories: a pop-up book. At rest a closed book lies cover-up. Lit, it opens into a V on its
 * spine, and five cubes of different sizes push up through the gutter one after another, then drift
 * above the spread in two rows and melt into one another and apart like metaballs, on a fixed
 * seven-second script so every in-between state reads. The cubes are raymarched (rounded boxes joined
 * by a smooth union, cut off at page level) in the same canvas: where the surface is still a cube's
 * own it gets a hairline at the cube's edges like the boxes, where cubes have melted together only
 * the silhouette is inked, so necks stay soft.
 */

/**
 * Book length along the spine (long enough that no cube ever hangs off the end), thickness of each
 * half, width spine to fore-edge: a thin book, nearly as wide as it is long, so it opens on a big spread.
 */
const SPINE = 0.82;
const HALF = 0.1;
const WIDE = 0.66;
/** Open, the top half turns over and the bottom half tilts back: a symmetric 124° V. */
const TURN = (152 * Math.PI) / 180;
const TILT = (28 * Math.PI) / 180;

/** Reference px per unit, closed and open (the open spread and its cubes stay inside the lit brackets). */
const SCALE_CLOSED = 64;
const SCALE_OPEN = 54;

/**
 * Cubes, biggest to smallest: half-size, bob period (s) and phase, and the order they rise in: the
 * two small ones of the high row first, so each clears the gutter before the next comes up past it.
 */
const CUBES = [
	{ half: 0.1, bob: 1.3, phase: 0, order: 3 },
	{ half: 0.085, bob: 1.7, phase: 2, order: 2 },
	{ half: 0.07, bob: 1.5, phase: 4, order: 4 },
	{ half: 0.06, bob: 1.9, phase: 1, order: 0 },
	{ half: 0.05, bob: 1.4, phase: 3, order: 1 }
];
/** Once the spread is half open, a cube pops up this often (ms). */
const STAGGER = 90;
/** Smooth-union radius: about a 2.6 px fillet where cubes meet. */
const MELT = 0.1;
/** How far a cube bobs up and down while it floats. */
const BOB = 0.02;

/**
 * Where the cubes float, [position along the spine, height above the gutter] for each, biggest first:
 * a low row of three and a high row of two between them. Apart, faces are more than the melt radius
 * apart (and the bob), so edges stay crisp.
 */
const APART = [[-0.27, 0.2], [0.03, 0.22], [0.3, 0.2], [-0.1, 0.52], [0.17, 0.52]];
/** Two pairs fuse, a high cube dropping onto a low one at each end, as the middle one rises between them. */
const PAIRS = [[-0.25, 0.2], [0.02, 0.5], [0.27, 0.2], [-0.2, 0.35], [0.24, 0.32]];
/** All five in one blob. */
const ALL = [[-0.1, 0.22], [0.05, 0.27], [0.14, 0.2], [-0.07, 0.38], [0.08, 0.4]];
/** New partners: the two biggest below, the two smallest above; the third waits apart. */
const CROSS = [[-0.2, 0.2], [-0.03, 0.22], [0.3, 0.2], [-0.05, 0.5], [0.06, 0.49]];
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
			const e = 0.5 - 0.5 * Math.cos((Math.PI * (at - t0)) / (t1 - t0));
			return a.map(([x, y], i) => [x + (b[i][0] - x) * e, y + (b[i][1] - y) * e]);
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
uniform float uStrength;
uniform vec4 uCubes[${CUBES.length}];
uniform float uMelt;
uniform float uPixel;
// The two page surfaces, as planes through the spine: the side of each facing the air.
uniform vec3 uPageBottom;
uniform vec3 uPageTop;
varying vec3 vLocal;
varying vec3 vDir;

const float ROUND = 0.015;

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

	// How much the surface here is still one cube's own (1) rather than a melted neck (0): a hard,
	// pixel-thin test, so necks never get fractional cube edges.
	float owned = 0.0;
	for (int i = 0; i < ${CUBES.length}; i++) {
		owned = max(owned, 1.0 - smoothstep(0.0, uPixel * 0.3, abs(cube(at, i))));
	}

	if (!hit) {
		// Just outside the silhouette. Along a cube this only anti-aliases its own edge line; along a
		// melted neck, which has no edge, it is the outline itself.
		float d = nearest / uPixel;
		float fringe = mix(1.0 - smoothstep(0.65, 1.3, d), 1.0 - smoothstep(0.0, 0.6, d), owned);
		if (fringe <= 0.0) discard;
		gl_FragColor = vec4(uInk, fringe);
		return;
	}

	vec3 n = normalAt(at);
	float facing = dot(n, -dir);
	// Where a neck turns edge-on, carry the outline a pixel or so inside too.
	float outline = (1.0 - owned) * (1.0 - clamp(facing / (fwidth(facing) * uStrength + 1e-4), 0.0, 1.0));

	// Edges of whichever cube the point still belongs to, as wide as the boxes' ink. The distance to
	// the nearest edge is exact (UV derivatives break up along a raymarched edge), divided by how many
	// units a pixel covers across this face to keep it a hairline.
	float edges = 0.0;
	for (int i = 0; i < ${CUBES.length}; i++) {
		// Only a cube's own surface: in a melted neck the surface pulls away from every cube.
		float own = 1.0 - smoothstep(0.0, uPixel * 0.3, abs(cube(at, i)));
		if (own <= 0.0) continue;
		vec3 gap = uCubes[i].w - abs(at - uCubes[i].xyz);
		// Of the distances to the three face planes, the smallest is the face we are on; the middle
		// one is the distance to that face's nearest edge, measured to the middle of its rounding.
		float edge = gap.x + gap.y + gap.z - min(gap.x, min(gap.y, gap.z)) - max(gap.x, max(gap.y, gap.z));
		edge = max(0.0, edge - ROUND * 0.29);
		edges = max(edges, own * (1.0 - clamp(edge / (uPixel * uStrength), 0.0, 1.0)));
	}
	// Where the page cuts the cubes, only the rim is inked: the line where a cube meets the page.
	float cut = onPage ? 1.0 - clamp(-melted(at) / (uPixel * uStrength), 0.0, 1.0) : 0.0;

	gl_FragColor = vec4(mix(vec3(1.0), uInk, max(max(outline, edges), cut)), 1.0);
}`;

/** @param {import('./stage.js').Stage} stage @returns {import('./stage.js').Icon} */
export function createBookIcon(stage) {
	const book = new Group();
	stage.pivot.add(book);

	// The spine runs along x through the origin at page level; both halves reach out towards +z.
	const bottom = new Group();
	bottom.add(stage.box([SPINE, HALF, WIDE], [0, -HALF / 2, WIDE / 2]));
	const top = new Group();
	top.add(stage.box([SPINE, HALF, WIDE], [0, HALF / 2, WIDE / 2]));
	book.add(bottom, top);

	// The cubes live in a box of space above the gutter; its front faces start the rays.
	const room = stage.own(new BoxGeometry(SPINE + 0.2, 0.72, 0.5));
	room.translate(0, 0.35, 0);
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
			top.rotation.x = -TURN * open.value;
			bottom.rotation.x = -TILT * open.value;
			// The page faces' normals into the air: the bottom half's top face and the top half's
			// underside, turned with their halves (closed, they face each other and leave no air).
			goo.uniforms.uPageBottom.value.set(0, Math.cos(bottom.rotation.x), Math.sin(bottom.rotation.x));
			goo.uniforms.uPageTop.value.set(0, -Math.cos(top.rotation.x), -Math.sin(top.rotation.x));
			stage.pivot.scale.setScalar(SCALE_CLOSED + (SCALE_OPEN - SCALE_CLOSED) * p);
			// Keep it centred: closed it lies to one side of the spine, open it straddles it, and risen
			// cubes add height.
			book.position.set(0, -0.12 * risen, -(WIDE / 2) * (1 - p));

			CUBES.forEach((c, i) => {
				const lift = lifts[i].value;
				const [x0, y0] = APART[i];
				const x = x0 + (at[i][0] - x0) * amount;
				const height = y0 + (at[i][1] - y0) * amount + BOB * Math.sin((2 * Math.PI * t) / c.bob + c.phase) * amount;
				// Up through the gutter: from just below the page to its hover height.
				cubes[i].set(x, -c.half + (height + c.half) * lift, 0, c.half);
			});
			// Sunk to a sliver in the gutter, the cubes are gone.
			gooMesh.visible = risen > 0.03;
			// One device pixel in book units, for hairline widths.
			goo.uniforms.uPixel.value = stage.pixel() / stage.pivot.scale.x;
			return moving || (lit && !reduced);
		}
	};
}
