import {
	BufferAttribute,
	BufferGeometry,
	CircleGeometry,
	DoubleSide,
	DynamicDrawUsage,
	Euler,
	Group,
	InstancedMesh,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	OrthographicCamera,
	Plane,
	PlaneGeometry,
	Raycaster,
	Scene,
	ShaderMaterial,
	Shape,
	ShapeGeometry,
	SRGBColorSpace,
	TextureLoader,
	Vector2,
	Vector3,
	WebGLRenderer
} from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { frameLoop } from '$lib/frameLoop.js';
import mesh from '$lib/landingPage/avatarMesh.json';
import { Spring } from '$lib/landingPage/spring.js';

/**
 * The talk's world (see beats.js): a drawing board with the avatar's sheet on it, seen from straight
 * above, from Hairline's 2:1 corner view, or from underneath, and what the talk does to that sheet.
 * Its glasses lift off as a layer over dashed drops, or are carried off and set down under the
 * talk's line; the first sketch and the drawings Image 2 made are dealt out beside it; a film strip
 * slides out under them; the board turns over to show what is behind it; and the avatar's own mesh
 * (avatarMesh.json) is laid over the drawing and bends it, following the pointer as the avatar does.
 *
 * Drawn the way Hairline's figures are (lucasmarkes.com/lab/hairline): one stroke weight in a few
 * strengths of ink on white, rounded plates, a board that is a silhouette and one crease, dashed
 * drops under what is lifted, dots for what is counted, and one bright stroke that says where to
 * look and goes to whatever the pointer picks. Nothing fades in: sheets slide out from under other
 * sheets, and lines are drawn on. The only colour is the drawings' own.
 *
 * The canvas fills the page, so things can travel anywhere on it (the glasses, to the line), but
 * the camera frames each pose on the stage, the page's box for it. The world is measured in the
 * avatar's 134 px: x to the right, z towards the viewer, y up.
 */

const SIDE = 134;
const HALF = SIDE / 2;
/** A sheet: its corner, its thickness, the gap between two, and how far the board reaches past them. */
const CORNER = 6;
const THICK = 1.2;
const GAP = 22;
const PITCH = SIDE + GAP;
const MARGIN = 31;
const BOARD = { corner: 16, crease: 3, thick: 5 };
/** How high the glasses' layer lifts off the face, and how much bigger they are once carried off it. */
const LIFT = 46;
const HELD = 1.3;
/** The glasses in line, as the avatar draws them once they are off (Avatar.svelte): lenses, rim, bridge. */
const LENSES = [
	[50.2, 59.3],
	[81.8, 57.4]
];
const RIM = 10.4;
const BRIDGE = [
	[62.6, 58],
	[69.4, 57.6]
];
/** The head's centre and reach, of the drawing's side: past it, straight above or below, he looks there (Avatar.svelte). */
const HEAD = { x: 0.48, y: 0.37, r: 0.25 };
const PLUMB = Math.tan((75 * Math.PI) / 180);

/** Hairline's ink, without its cool cast: the bright stroke, the silhouette's, the dashes', the crease's. */
const INK = { hi: 0x171717, edge: 0xa3a3a3, mid: 0xbdbdbd, lo: 0xe0e0e0 };
/** The one stroke weight, in CSS px. */
const WEIGHT = 1;
/** How much of the stage a pose's frame fills. */
const FILL = 0.94;
/** Picked, a sheet rises this far, on Hairline's spring. */
const RISE = 3;
const SPRING = { tension: 100, friction: 18 };

/**
 * The sheets dealt out with the avatar's: which picture, what it is called, where it rests (its
 * centre) and its size, square and the avatar's size unless given. Most slide out from under the
 * avatar's sheet; the sketch is laid over it instead, slid in from `from` to the right.
 * @typedef {{ key: string, name: string, x: number, z: number, w?: number, h?: number, from?: number }} Slot
 */
/** The first sketch, laid over it. @type {Slot[]} */
const SKETCH = [{ key: 'sketch', name: 'the first sketch', x: 0, z: 0, w: 216, h: 154, from: 460 }];
/** Image 2's tries at him looking at his glasses, round it, where the keyframes are not. @type {Slot[]} */
const TRIES = [
	{ key: 'turn1', name: 'over the shoulder', x: -PITCH, z: -PITCH },
	{ key: 'turn2', name: 'in profile', x: 0, z: -PITCH },
	{ key: 'turn3', name: 'puzzled', x: PITCH, z: -PITCH },
	{ key: 'turn4', name: 'turned away', x: -PITCH, z: 0 },
	{ key: 'worried', name: 'worried', x: -PITCH, z: PITCH }
];
/** The three that made it, which with the avatar make a square. @type {Slot[]} */
const KEYS = [
	{ key: 'keyUp', name: 'looking up', x: PITCH, z: 0 },
	{ key: 'keyDown', name: 'looking down', x: 0, z: PITCH },
	{ key: 'keyWonder', name: 'wondering', x: PITCH, z: PITCH }
];
/** The film strip under the keyframes, and its six frames. */
const STRIP = { name: 'seedance · test', x: PITCH / 2, z: PITCH + HALF + GAP + 28, w: PITCH + SIDE, h: 56, frame: 40, frames: 6 };
/** What is under the board: the screenshot of TapNow, at the middle of the board the strip is on. */
const BACK = { x: PITCH / 2, z: (STRIP.z + STRIP.h / 2 - HALF) / 2, w: 520, h: 520 * (1174 / 2048) };

/** The board round a box of the world, a margin wide. */
const board = (/** @type {number} */ x0, /** @type {number} */ z0, /** @type {number} */ x1, /** @type {number} */ z1) => ({
	px: (x0 + x1) / 2,
	pz: (z0 + z1) / 2,
	pw: x1 - x0 + 2 * MARGIN,
	ph: z1 - z0 + 2 * MARGIN
});
/** The camera round a box of the world, with some air: by default, the board round it and a little more. */
const frame = (/** @type {number} */ x0, /** @type {number} */ z0, /** @type {number} */ x1, /** @type {number} */ z1, air = MARGIN + 6) => ({
	tx: (x0 + x1) / 2,
	tz: (z0 + z1) / 2,
	fw: x1 - x0 + 2 * air,
	fh: z1 - z0 + 2 * air
});

/**
 * Everything a pose sets, all numbers, so a timeline can move from one to the next: where the camera
 * is (`az` round and `el` up, in degrees, below the board when negative; `fw` by `fh` of the world in
 * frame; `tx ty tz` what it looks at), the board (`px pz` its centre, `pw ph` its size, `chrome` how
 * much of it and the avatar's sheet's edge is drawn), the avatar's sheet (`lift` its glasses' layer,
 * `carry` its glasses carried off to `gx gz` and held `gs` times their size, `rims` their line drawn
 * on, `blank` its picture gone,
 * `wire` its mesh, `up` the head looking up) and how far each lot of sheets is dealt out.
 */
const REST = {
	az: 0,
	el: 90,
	fw: 216,
	fh: 216,
	tx: 0,
	ty: 0,
	tz: 0,
	...board(-HALF, -HALF, HALF, HALF),
	chrome: 1,
	lift: 0,
	carry: 0,
	gx: 0,
	gz: 0,
	gs: HELD,
	rims: 0,
	blank: 0,
	wire: 0,
	up: 0,
	sketch: 0,
	tries: 0,
	keys: 0,
	strip: 0
};
/** @typedef {typeof REST} Pose */

const OUT = { x0: -PITCH - HALF, x1: PITCH + HALF };
const SQUARE = { x0: -HALF, z0: -HALF, x1: PITCH + HALF, z1: PITCH + HALF };
/** The camera and the board round a box of the world. */
const round = (/** @type {number} */ x0, /** @type {number} */ z0, /** @type {number} */ x1, /** @type {number} */ z1) => ({
	...frame(x0, z0, x1, z1),
	...board(x0, z0, x1, z1)
});
const STRIPPED = { ...REST, keys: 1, strip: 1, ...round(SQUARE.x0, SQUARE.z0, SQUARE.x1, STRIP.z + STRIP.h / 2) };
const MESHED = { ...REST, rims: 1, carry: 1, wire: 1, ...round(-HALF, -HALF, HALF, HALF) };
/** Under the board, a narrower margin round the screenshot, so it is seen as big as it can be. */
const UNDER = { x0: BACK.x - BACK.w / 2, z0: BACK.z - BACK.h / 2, x1: BACK.x + BACK.w / 2, z1: BACK.z + BACK.h / 2 };

/** What the stage shows in each of the talk's scenes on the world. @type {Record<string, Pose>} */
export const POSES = {
	picture: REST,
	rings: { ...REST, rims: 1 },
	layers: { ...REST, rims: 1, az: 45, el: 30, fw: 300, fh: 300, ty: 14, lift: LIFT },
	sketch: { ...REST, sketch: 1, ...round(-108, -77, 108, 77) },
	turns: { ...REST, tries: 1, keys: 1, ...round(OUT.x0, OUT.x0, OUT.x1, OUT.x1) },
	keys: { ...REST, keys: 1, ...round(SQUARE.x0, SQUARE.z0, SQUARE.x1, SQUARE.z1) },
	strip: STRIPPED,
	tapnow: {
		...STRIPPED,
		el: -90,
		...frame(UNDER.x0, UNDER.z0, UNDER.x1, UNDER.z1, 24),
		px: BACK.x,
		pz: BACK.z,
		pw: BACK.w + 28,
		ph: BACK.h + 28
	},
	mesh: MESHED,
	bend: { ...MESHED, up: 1 }
};

/**
 * The stage, in the canvas's px: its centre, where the camera puts what it looks at, and its size.
 * @typedef {{ cx: number, cy: number, w: number, h: number }} Stage
 */

/** The camera's scale for a pose on a stage, in px a unit of the world. @param {{ fw: number, fh: number }} pose @param {Stage} stage */
export const zoomOf = (pose, stage) => Math.min((stage.w * FILL) / pose.fw, (stage.h * FILL) / pose.fh);

/**
 * The camera, from above, that lays the avatar's sheet exactly over a box of the canvas, where a
 * panel of the page takes over from it (or hands back to it).
 * @param {{ x: number, y: number, w: number, h: number }} box @param {Stage} stage
 */
export function fit(box, stage) {
	const zoom = box.w / SIDE;
	return {
		fw: (stage.w * FILL) / zoom,
		fh: (stage.h * FILL) / zoom,
		tx: -(box.x + box.w / 2 - stage.cx) / zoom,
		tz: -(box.y + box.h / 2 - stage.cy) / zoom
	};
}

/**
 * Where a point of the canvas falls on the board, for a pose seen from above.
 * @param {{ fw: number, fh: number, tx: number, tz: number }} pose @param {Stage} stage @param {number} x @param {number} y
 */
export function under(pose, stage, x, y) {
	const zoom = zoomOf(pose, stage);
	return { x: pose.tx + (x - stage.cx) / zoom, z: pose.tz + (y - stage.cy) / zoom };
}

/**
 * Where the glasses, carried off, are held over a box of the canvas, for a pose seen from above:
 * their bridge at its middle, and as big as fills its height.
 * @param {{ x: number, y: number, w: number, h: number }} box @param {Pose} pose @param {Stage} stage
 */
export function holdAt(box, pose, stage) {
	const { x, z } = under(pose, stage, box.x + box.w / 2, box.y + box.h / 2);
	const scale = (box.h * 0.86) / ((2 * RIM + 1.5) * zoomOf(pose, stage));
	return { gx: x, gz: z, gs: Math.min(2.4, Math.max(0.6, scale)) };
}

const rad = (/** @type {number} */ degrees) => (degrees * Math.PI) / 180;
const clamp01 = (/** @type {number} */ x) => Math.min(1, Math.max(0, x));
const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;
const smooth = (/** @type {number} */ t) => t * t * (3 - 2 * t);

/**
 * A rounded rectangle about its centre, as [x, z] points, `n` steps round each corner.
 * @param {number} w @param {number} h @param {number} r
 */
function ring(w, h, r, n = 6) {
	const points = [];
	for (let quarter = 0; quarter < 4; quarter++) {
		const cx = (quarter === 0 || quarter === 3 ? 1 : -1) * (w / 2 - r);
		const cz = (quarter < 2 ? 1 : -1) * (h / 2 - r);
		for (let i = 0; i <= n; i++) {
			const a = ((quarter + i / n) * Math.PI) / 2;
			points.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
		}
	}
	return points;
}
const RING = ring(1, 1, 0.1).length;

/** A closed outline at height `y`, as the segments a stroke draws, into `pairs` if given. @param {number[][]} points @param {number} y */
function closed(points, y, dx = 0, dz = 0, pairs = new Float32Array(points.length * 6)) {
	points.forEach(([x, z], i) => {
		const [x1, z1] = points[(i + 1) % points.length];
		pairs.set([x + dx, y, z + dz, x1 + dx, y, z1 + dz], i * 6);
	});
	return pairs;
}

const vertexShader = /* glsl */ `
attribute vec2 aRest;
attribute vec2 aUp;
attribute vec2 aDown;
uniform float uUp;
uniform float uDown;
varying vec2 vRest;
varying vec2 vUp;
varying vec2 vDown;
varying vec2 vAt;

void main() {
	vec2 p = aRest + (aUp - aRest) * uUp + (aDown - aRest) * uDown;
	vRest = aRest;
	vUp = aUp;
	vDown = aDown;
	// Flat on the board, the drawing's top away from the viewer.
	vAt = (p - 0.5) * ${SIDE}.0;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(vAt.x, 0.0, vAt.y, 1.0);
}`;

/** avatarMorph.js's crossing of the drawings, on a sheet with rounded corners, which can go blank. */
const fragmentShader = /* glsl */ `
uniform sampler2D uRestImage;
uniform sampler2D uUpImage;
uniform sampler2D uDownImage;
uniform float uUp;
uniform float uDown;
uniform float uCorner;
uniform float uBlank;
varying vec2 vRest;
varying vec2 vUp;
varying vec2 vDown;
varying vec2 vAt;

void main() {
	vec2 q = abs(vAt) - (${HALF}.0 - uCorner);
	if (length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) > uCorner) discard;
	vec3 colour = texture2D(uRestImage, vRest).rgb;
	colour = mix(colour, texture2D(uUpImage, vUp).rgb, smoothstep(0.2, 0.8, uUp));
	colour = mix(colour, texture2D(uDownImage, vDown).rgb, smoothstep(0.2, 0.8, uDown));
	gl_FragColor = vec4(mix(colour, vec3(1.0), uBlank), 1.0);
}`;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, string>} urls the pictures: the avatar's two layers (`face`, `glasses`), the
 *   poses its mesh was fitted to (`up`, `down`), the screenshot under the board (`tapnow`), and one
 *   for each sheet dealt out beside it (the slots' keys)
 * @param {Pose} pose the pose to draw, which the page's timeline moves
 * @param {(name: string | null) => void} read told what the pointer is over
 */
export async function createWorld(canvas, urls, pose, read) {
	const loader = new TextureLoader();
	const names = Object.keys(urls);
	const loaded = await Promise.all(names.map((name) => loader.loadAsync(urls[name])));
	/** @type {Record<string, import('three').Texture>} */
	const textures = Object.fromEntries(names.map((name, i) => [name, loaded[i]]));
	// The mesh samples its drawings as avatarMorph.js does: as they are, from the top left; the rest
	// are pictures on sheets.
	for (const [name, texture] of Object.entries(textures)) {
		texture.anisotropy = 4;
		if (['face', 'up', 'down'].includes(name)) texture.flipY = false;
		else texture.colorSpace = SRGBColorSpace;
	}

	// White and opaque, like the page under it, so the lines' soft edges are mixed with white here.
	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
	renderer.setClearColor(0xffffff, 1);
	const scene = new Scene();
	const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 3000);
	/** @type {{ dispose(): void }[]} */
	const owned = [renderer, ...loaded];
	/** @template {{ dispose(): void }} T @param {T} thing @returns {T} */
	const own = (thing) => (owned.push(thing), thing);

	/** @param {number} color @param {object} [more] */
	const stroke = (color, more) => own(new LineMaterial({ color, linewidth: WEIGHT, alphaToCoverage: true, ...more }));
	const ink = { hi: stroke(INK.hi), edge: stroke(INK.edge), lo: stroke(INK.lo), dash: stroke(INK.mid, { dashed: true, dashSize: 2.4, gapSize: 2.4 }) };
	// The board's and the avatar's sheet's own, which fade where a panel of the page takes over.
	const chrome = {
		edge: stroke(INK.edge, { transparent: true, alphaToCoverage: false }),
		lo: stroke(INK.lo, { transparent: true, alphaToCoverage: false }),
		hi: stroke(INK.hi, { transparent: true, alphaToCoverage: false })
	};
	const white = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };

	/**
	 * A stroke of `count` segments, rewritten where they are (see `redraw`).
	 * @param {number} count @param {LineMaterial} material @param {Float32Array} [pairs]
	 */
	function strokes(count, material, pairs = new Float32Array(count * 6)) {
		const geometry = own(new LineSegmentsGeometry());
		geometry.setPositions(pairs);
		/** @type {import('three').InterleavedBufferAttribute} */ (geometry.attributes.instanceStart).data.setUsage(DynamicDrawUsage);
		const line = new LineSegments2(geometry, material);
		line.frustumCulled = false;
		return line;
	}
	/** @param {LineSegments2} line @param {ArrayLike<number>} pairs */
	function redraw(line, pairs) {
		const { data } = /** @type {import('three').InterleavedBufferAttribute} */ (line.geometry.attributes.instanceStart);
		data.array.set(pairs);
		data.needsUpdate = true;
	}
	/** Draws a stroke on, up to `t` of its length. @param {LineSegments2} line @param {number} count @param {number} t */
	const drawn = (line, count, t) => {
		line.geometry.instanceCount = Math.round(count * clamp01(t));
		line.visible = line.geometry.instanceCount > 0;
	};

	/**
	 * A sheet: a rounded plate lying on the board, its top edge and, under it, the line of its
	 * thickness, with a picture on its face if it has one.
	 * @param {import('three').Texture | null} map @param {number} [w] @param {number} [h] @param {LineMaterial} [edge]
	 */
	function sheet(map, w = SIDE, h = SIDE, edge = ink.edge) {
		const group = new Group();
		const outline = ring(w, h, CORNER);
		const foot = strokes(outline.length, edge, closed(outline, 0));
		const top = strokes(outline.length, edge, closed(outline, THICK));
		group.add(foot, top);
		if (map) {
			const geometry = own(new ShapeGeometry(new Shape(outline.map(([x, z]) => new Vector2(x, -z)))));
			const { position, uv } = geometry.attributes;
			for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) / w + 0.5, position.getY(i) / h + 0.5);
			const face = new Mesh(geometry, own(new MeshBasicMaterial({ map, ...white })));
			face.rotation.x = -Math.PI / 2;
			face.position.y = THICK;
			group.add(face);
		}
		return { group, top, foot, edge, rise: new Spring(0, SPRING) };
	}
	/** @typedef {ReturnType<typeof sheet>} Sheet */

	// The board: a silhouette and one crease, its far foot hidden behind its own top.
	const plinth = {
		top: strokes(RING, chrome.edge),
		crease: strokes(RING, chrome.lo),
		foot: strokes(RING, chrome.edge),
		sides: strokes(2, chrome.edge),
		fill: new Mesh(own(new BufferGeometry()), own(new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide, ...white })))
	};
	plinth.fill.geometry.setAttribute('position', new BufferAttribute(new Float32Array((RING + 1) * 3), 3));
	plinth.fill.geometry.setIndex(Array.from({ length: RING }, (_, i) => [0, 1 + i, 1 + ((i + 1) % RING)]).flat());
	plinth.fill.frustumCulled = false;
	scene.add(plinth.fill, plinth.foot, plinth.sides, plinth.crease, plinth.top);

	// Under the board, what is behind the scenes.
	const back = new Mesh(own(new PlaneGeometry(BACK.w, BACK.h)), own(new MeshBasicMaterial({ map: textures.tapnow })));
	back.rotation.x = Math.PI / 2;
	back.position.set(BACK.x, -BOARD.thick + 0.3, BACK.z);
	scene.add(back);

	// The avatar's sheet: its face is the avatar's own mesh, so the drawing can bend.
	const morphGeometry = own(new BufferGeometry());
	morphGeometry.setAttribute('position', new BufferAttribute(new Float32Array(mesh.names.length * 3), 3));
	for (const [name, data] of /** @type {const} */ ([['aRest', mesh.rest], ['aUp', mesh.up], ['aDown', mesh.down]])) {
		morphGeometry.setAttribute(name, new BufferAttribute(new Float32Array(data), 2));
	}
	morphGeometry.setIndex(mesh.triangles);
	/** @param {number} corner */
	const morphing = (corner) =>
		own(
			new ShaderMaterial({
				vertexShader,
				fragmentShader,
				side: DoubleSide,
				...white,
				uniforms: {
					uRestImage: { value: textures.face },
					uUpImage: { value: textures.up },
					uDownImage: { value: textures.down },
					uUp: { value: 0 },
					uDown: { value: 0 },
					uCorner: { value: corner },
					uBlank: { value: 0 }
				}
			})
		);
	/** @param {ShaderMaterial} material */
	function drawing(material) {
		const face = new Mesh(morphGeometry, material);
		face.frustumCulled = false;
		return face;
	}

	const main = sheet(null, SIDE, SIDE, chrome.edge);
	const face = drawing(morphing(CORNER));
	face.position.y = THICK;
	main.group.add(face);
	const faceUniforms = /** @type {ShaderMaterial} */ (face.material).uniforms;

	// The glasses, a layer of their own: the drawing's, and over them their rims in line.
	const glasses = new Group();
	const lensMaterial = own(new MeshBasicMaterial({ map: textures.glasses, transparent: true, depthWrite: false }));
	const lens = new Mesh(own(new PlaneGeometry(SIDE, SIDE)), lensMaterial);
	lens.rotation.x = -Math.PI / 2;
	const film = strokes(RING, ink.edge, closed(ring(SIDE, SIDE, CORNER), 0));
	/** A rim, drawn round from beside the bridge. @param {number[]} centre @param {number} from */
	const rim = ([cx, cz], from, steps = 72) =>
		closed(
			Array.from({ length: steps }, (_, i) => {
				const a = from + (i / steps) * 2 * Math.PI;
				return [cx - HALF + RIM * Math.cos(a), cz - HALF + RIM * Math.sin(a)];
			}),
			0.1
		);
	const rims = [
		strokes(72, ink.hi, rim(LENSES[0], 0)),
		strokes(1, ink.hi, new Float32Array([BRIDGE[0][0] - HALF, 0.1, BRIDGE[0][1] - HALF, BRIDGE[1][0] - HALF, 0.1, BRIDGE[1][1] - HALF])),
		strokes(72, ink.hi, rim(LENSES[1], Math.PI))
	];
	glasses.add(lens, film, ...rims);
	main.group.add(glasses);
	// About the bridge, so the held glasses are set down where the line's box is.
	const bridge = new Vector3((BRIDGE[0][0] + BRIDGE[1][0]) / 2 - HALF, 0, (BRIDGE[0][1] + BRIDGE[1][1]) / 2 - HALF);

	// Dashed drops from the lifted layer, at its left, right and nearest corners in the corner view.
	const tuck = HALF - CORNER * (1 - Math.SQRT1_2);
	const corners = [
		[-tuck, tuck],
		[tuck, -tuck],
		[tuck, tuck]
	];
	const drops = strokes(corners.length, ink.dash);
	drops.computeLineDistances();
	scene.add(drops);

	// The mesh over the drawing: its edges and its 87 points, out from the middle of the face.
	const centre = [HEAD.x, HEAD.y + 0.1];
	const far = (/** @type {number} */ x, /** @type {number} */ y) => Math.hypot(x - centre[0], y - centre[1]);
	const at = (/** @type {number} */ i) => /** @type {[number, number]} */ ([mesh.rest[2 * i], mesh.rest[2 * i + 1]]);
	const mid = (/** @type {number[]} */ [a, b]) => far((at(a)[0] + at(b)[0]) / 2, (at(a)[1] + at(b)[1]) / 2);
	const edges = [
		...new Set(
			Array.from({ length: mesh.triangles.length / 3 }, (_, t) =>
				[0, 1, 2].map((k) => [mesh.triangles[3 * t + k], mesh.triangles[3 * t + ((k + 1) % 3)]].sort((a, b) => a - b).join())
			).flat()
		)
	]
		.map((pair) => pair.split(',').map(Number))
		.sort((a, b) => mid(a) - mid(b));
	const order = mesh.names.map((_, i) => i).sort((a, b) => far(...at(a)) - far(...at(b)));
	const wire = strokes(edges.length, ink.edge);
	const disc = own(new CircleGeometry(1, 20).rotateX(-Math.PI / 2));
	const halo = new InstancedMesh(disc, own(new MeshBasicMaterial({ color: 0xffffff })), order.length);
	const dots = new InstancedMesh(disc, own(new MeshBasicMaterial({ color: INK.hi })), order.length);
	halo.frustumCulled = dots.frustumCulled = false;
	main.group.add(wire, halo, dots);
	const landmarks = new Float32Array(mesh.names.length * 2);
	const segments = new Float32Array(edges.length * 6);
	const spot = new Matrix4();

	/** A lot of sheets, each from under the avatar's (or from the right, over it) to its slot, nearest first. @param {Slot[]} slots */
	const lay = (slots) =>
		slots.map((slot, i) => ({
			...slot,
			w: slot.w ?? SIDE,
			h: slot.h ?? SIDE,
			from: slot.from ?? 0,
			wait: i * 0.07,
			depth: i + 1,
			...sheet(textures[slot.key], slot.w, slot.h)
		}));
	const lots = { sketch: lay(SKETCH), tries: lay(TRIES), keys: lay(KEYS) };

	// The film strip: six frames of the head on its way up, and its sprocket holes.
	const strip = { ...STRIP, wait: 0, depth: 0.5, from: 0, key: 'strip', ...sheet(null, STRIP.w, STRIP.h) };
	const step = (STRIP.w - 2 * CORNER) / STRIP.frames;
	for (let i = 0; i < STRIP.frames; i++) {
		const material = morphing(10);
		material.uniforms.uUp.value = i / (STRIP.frames - 1);
		const frame = drawing(material);
		frame.scale.setScalar(STRIP.frame / SIDE);
		frame.position.set((i - (STRIP.frames - 1) / 2) * step, THICK + 0.05, 0);
		strip.group.add(frame);
	}
	const holes = new InstancedMesh(disc, own(new MeshBasicMaterial({ color: INK.mid })), STRIP.frames * 6);
	for (let i = 0; i < holes.count; i++) {
		const column = Math.floor(i / 2);
		spot.makeScale(1.1, 1, 1.1).setPosition(-STRIP.w / 2 + CORNER + (column + 0.5) * (step / 3), THICK + 0.05, (i % 2 ? 1 : -1) * (STRIP.h / 2 - 4));
		holes.setMatrixAt(i, spot);
	}
	strip.group.add(holes);

	const dealt = [...lots.sketch, ...lots.tries, ...lots.keys];
	scene.add(strip.group, ...dealt.map((s) => s.group), main.group);

	/**
	 * What the pointer can pick in each scene, topmost first, by where it rests (never where it is now,
	 * so nothing moves out from under the pointer), and where the eye starts until it picks.
	 * @typedef {{ name: string, x: number, z: number, y: number, w: number, h: number, part?: Sheet | null }} Pickable
	 */
	/** @type {Pickable} */
	const glassy = { name: 'glasses.png', x: 0, z: 0, y: THICK + LIFT, w: SIDE, h: SIDE, part: null };
	/** @type {Pickable} */
	const avatar = { name: 'at rest', x: 0, z: 0, y: THICK, w: SIDE, h: SIDE, part: main };
	/** @param {(typeof dealt)} list @returns {Pickable[]} */
	const picks = (list) => list.map((s) => ({ name: s.name, x: s.x, z: s.z, y: THICK, w: s.w, h: s.h, part: s }));
	const stripped = { name: strip.name, x: strip.x, z: strip.z, y: THICK, w: strip.w, h: strip.h, part: strip };
	/** @type {Record<string, Pickable[]>} */
	const pickable = {
		layers: [glassy, { ...avatar, name: 'face.png' }],
		sketch: picks(lots.sketch),
		turns: [avatar, ...picks(lots.tries), ...picks(lots.keys)],
		keys: [avatar, ...picks(lots.keys)],
		strip: [avatar, ...picks(lots.keys), stripped]
	};
	/** @type {Record<string, Pickable | null>} */
	const starts = {
		picture: avatar,
		rings: glassy,
		layers: glassy,
		sketch: pickable.sketch[0],
		turns: avatar,
		keys: avatar,
		strip: stripped,
		tapnow: null,
		mesh: glassy,
		bend: glassy
	};

	let name = 'picture';
	let width = 1;
	let height = 1;
	/** @type {Stage} */
	let stage = { cx: 0.5, cy: 0.5, w: 1, h: 1 };
	let shown = true;
	/** The pointer over the canvas, in its px from the top left. @type {{ x: number, y: number } | null} */
	let pointer = null;
	/** What it picked. @type {Pickable | null} */
	let picked = null;
	/** @type {string | null} */
	let spoken = null;
	/** -1 looking up, 1 looking down: the pointer's, over the mesh, or else the pose's. */
	const pitch = new Spring(0, SPRING);
	/** Whether the pointer has the head (see `pick`): until it lets go and the head is back where the pose has it. */
	let looking = false;
	const euler = new Euler(0, 0, 0, 'YXZ');
	const target = new Vector3();
	const raycaster = new Raycaster();
	const ground = new Plane(new Vector3(0, 1, 0), 0);
	const hit = new Vector3();
	const ndc = new Vector2();

	/** Where the pointer is on the plane at height `y`. @param {number} y */
	function onPlane(y) {
		if (!pointer) return null;
		raycaster.setFromCamera(ndc.set((pointer.x / width) * 2 - 1, 1 - (pointer.y / height) * 2), camera);
		ground.constant = -y;
		return raycaster.ray.intersectPlane(ground, hit);
	}

	function pick() {
		const before = picked;
		picked = null;
		/** @type {string | null} */
		let said = null;
		for (const option of pickable[name] ?? []) {
			const point = onPlane(option.y);
			if (point && Math.abs(point.x - option.x) <= option.w / 2 && Math.abs(point.z - option.z) <= option.h / 2) {
				picked = option;
				said = option.name;
				break;
			}
		}
		// Over the mesh, the head looks at the pointer when it is straight above or below it.
		let look = null;
		if (name === 'mesh' || name === 'bend') {
			const point = onPlane(THICK);
			if (point && Math.abs(point.x) <= HALF + 40 && Math.abs(point.z) <= HALF + 60) {
				const dx = point.x - (HEAD.x * SIDE - HALF);
				const dz = point.z - (HEAD.y * SIDE - HALF);
				look = Math.abs(dz) > HEAD.r * SIDE && Math.abs(dx) <= Math.abs(dz) * PLUMB ? Math.sign(dz) : 0;
				said = look ? (look < 0 ? 'looking up' : 'looking down') : null;
			}
		}
		if (look !== null) {
			looking = true;
			if (look !== pitch.target) pitch.to(look);
		} else if (looking && pitch.target !== -pose.up) pitch.to(-pose.up);
		for (const s of [main, strip, ...dealt]) {
			const up = s === picked?.part ? RISE : 0;
			if (up !== s.rise.target) s.rise.to(up);
		}
		if (picked !== before || said !== spoken) read((spoken = said));
	}

	/** @param {number} dt ms */
	function settle(dt) {
		let moving = pitch.advance(dt);
		if (looking && !moving && pitch.target === -pose.up) looking = false;
		for (const s of [main, strip, ...dealt]) moving = s.rise.advance(dt) || moving;
		return moving;
	}

	const sidesPairs = new Float32Array(12);
	const fill = /** @type {BufferAttribute} */ (plinth.fill.geometry.attributes.position);
	let boardKey = '';
	/** The board, round whatever is out: its outline, its crease, its foot, and its two sides where the outline turns away. */
	function drawBoard() {
		const key = `${pose.px} ${pose.pz} ${pose.pw} ${pose.ph} ${pose.az}`;
		if (key === boardKey) return;
		boardKey = key;
		const outline = ring(pose.pw, pose.ph, BOARD.corner);
		redraw(plinth.top, closed(outline, 0, pose.px, pose.pz));
		redraw(plinth.foot, closed(outline, -BOARD.thick, pose.px, pose.pz));
		redraw(plinth.crease, closed(ring(pose.pw - 2 * BOARD.crease, pose.ph - 2 * BOARD.crease, BOARD.corner - BOARD.crease), 0, pose.px, pose.pz));
		fill.setXYZ(0, pose.px, 0, pose.pz);
		outline.forEach(([x, z], i) => fill.setXYZ(1 + i, x + pose.px, 0, z + pose.pz));
		fill.needsUpdate = true;
		const across = (/** @type {number[]} */ [x, z]) => x * Math.cos(rad(pose.az)) - z * Math.sin(rad(pose.az));
		const ends = [outline.reduce((a, b) => (across(b) < across(a) ? b : a)), outline.reduce((a, b) => (across(b) > across(a) ? b : a))];
		ends.forEach(([x, z], i) => sidesPairs.set([x + pose.px, 0, z + pose.pz, x + pose.px, -BOARD.thick, z + pose.pz], i * 6));
		redraw(plinth.sides, sidesPairs);
	}

	let wiredCount = -1;
	let wiredUp = NaN;
	let wiredDown = NaN;
	/** The mesh, every point between where it rests and where the pose has it. @param {number} up @param {number} down */
	function drawWire(up, down) {
		const meshed = Math.round(edges.length * clamp01(pose.wire * 1.25));
		const pointed = Math.round(order.length * clamp01(pose.wire * 1.25 - 0.25));
		wire.geometry.instanceCount = meshed;
		halo.count = dots.count = pointed;
		wire.visible = meshed > 0;
		halo.visible = dots.visible = pointed > 0;
		if (!meshed || (meshed === wiredCount && up === wiredUp && down === wiredDown)) return;
		[wiredCount, wiredUp, wiredDown] = [meshed, up, down];
		for (let i = 0; i < mesh.names.length; i++) {
			for (const k of [0, 1]) {
				const rest = mesh.rest[2 * i + k];
				landmarks[2 * i + k] = (rest + (mesh.up[2 * i + k] - rest) * up + (mesh.down[2 * i + k] - rest) * down - 0.5) * SIDE;
			}
		}
		edges.forEach(([a, b], i) => segments.set([landmarks[2 * a], THICK + 0.3, landmarks[2 * a + 1], landmarks[2 * b], THICK + 0.3, landmarks[2 * b + 1]], i * 6));
		redraw(wire, segments);
		order.forEach((landmark, i) => {
			halo.setMatrixAt(i, spot.makeScale(1.9, 1, 1.9).setPosition(landmarks[2 * landmark], THICK + 0.4, landmarks[2 * landmark + 1]));
			dots.setMatrixAt(i, spot.makeScale(1.1, 1, 1.1).setPosition(landmarks[2 * landmark], THICK + 0.5, landmarks[2 * landmark + 1]));
		});
		halo.instanceMatrix.needsUpdate = dots.instanceMatrix.needsUpdate = true;
	}

	/**
	 * A lot of sheets, `out` of the way to their slots, on top of the board only when it is seen from
	 * above: out from under the avatar's, or laid over it from the right.
	 * @param {(typeof dealt)} list @param {number} out @param {boolean} above
	 */
	function deal(list, out, above) {
		const last = list.length ? list[list.length - 1].wait : 0;
		for (const s of list) {
			const t = smooth(clamp01((out - s.wait) / (1 - last)));
			s.group.visible = above && t > 0.002;
			if (s.from) s.group.position.set(s.x + s.from * (1 - t), THICK + 1.2 + 0.4 * s.depth + s.rise.value, s.z);
			else s.group.position.set(s.x * t, mix(-0.25 * s.depth, 0, t) + s.rise.value, s.z * t);
		}
	}

	function paint() {
		if (!shown) return;
		// The camera: framing the pose on the stage, from above, round to the corner, or from under the board.
		// The frustum in the world's units, so what the camera looks at falls on the stage's centre.
		const zoom = zoomOf(pose, stage);
		camera.left = -stage.cx / zoom;
		camera.right = (width - stage.cx) / zoom;
		camera.top = stage.cy / zoom;
		camera.bottom = (stage.cy - height) / zoom;
		camera.quaternion.setFromEuler(euler.set(-rad(pose.el), rad(pose.az), 0));
		camera.position.set(0, 0, 1000).applyQuaternion(camera.quaternion).add(target.set(pose.tx, pose.ty, pose.tz));
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld();
		pick();
		const above = pose.el > 0;

		drawBoard();
		for (const material of Object.values(chrome)) material.opacity = pose.chrome;
		plinth.top.visible = plinth.foot.visible = plinth.crease.visible = plinth.sides.visible = pose.chrome > 0.01;
		back.visible = !above;

		// The avatar's sheet, and its glasses: on it, lifted off as a layer, or carried off and held.
		main.group.visible = above;
		main.group.position.y = main.rise.value;
		const carried = smooth(clamp01(pose.carry));
		glasses.position.set(mix(0, pose.gx - bridge.x * pose.gs, carried), THICK + 0.15 + pose.lift + carried * 8, mix(0, pose.gz - bridge.z * pose.gs, carried));
		glasses.scale.setScalar(mix(1, pose.gs, carried));
		lensMaterial.opacity = (1 - clamp01(pose.carry / 0.4)) * (1 - pose.blank);
		lens.visible = lensMaterial.opacity > 0.001;
		const lifted = above && pose.lift > 0.5 && pose.carry < 0.01;
		film.visible = drops.visible = lifted;
		if (lifted) {
			redraw(drops, corners.flatMap(([x, z]) => [x, THICK, z, x, THICK + pose.lift, z]));
			const { data } = /** @type {import('three').InterleavedBufferAttribute} */ (drops.geometry.attributes.instanceDistanceStart);
			data.array.set(corners.flatMap(() => [0, pose.lift]));
			data.needsUpdate = true;
		}
		// The rims are drawn on one after another: a rim, the bridge, the other rim.
		rims.forEach((line, i) => drawn(line, i === 1 ? 1 : 72, (pose.rims * 2.4 - i * 0.7) * (1 - pose.blank)));

		// The one bright stroke: on what the pointer picked, or where this scene starts.
		const bright = picked ?? starts[name] ?? null;
		for (const line of rims) line.material = bright === glassy ? ink.hi : ink.edge;
		main.top.material = bright?.part === main ? chrome.hi : chrome.edge;
		for (const s of [strip, ...dealt]) s.top.material = bright?.part === s ? ink.hi : s.edge;

		// The other sheets slide out from under the avatar's.
		deal(lots.sketch, pose.sketch, above);
		deal(lots.tries, pose.tries, above);
		deal(lots.keys, pose.keys, above);
		const reeled = smooth(clamp01(pose.strip));
		strip.group.visible = above && reeled > 0.002;
		strip.group.position.set(strip.x, mix(-0.9, 0, reeled) + strip.rise.value, mix(PITCH, strip.z, reeled));

		// The head, and the mesh that bends it.
		if (!looking) pitch.set(-pose.up);
		const up = Math.max(0, -pitch.value);
		const down = Math.max(0, pitch.value);
		faceUniforms.uUp.value = up;
		faceUniforms.uDown.value = down;
		faceUniforms.uBlank.value = pose.blank;
		drawWire(up, down);

		renderer.render(scene, camera);
	}

	// Everything to the GPU now, while it is all still visible, so no sheet stalls a frame the first time it is dealt.
	for (const texture of loaded) renderer.initTexture(texture);
	renderer.compile(scene, camera);

	const loop = frameLoop((dt) => {
		const moving = settle(Math.min(Math.max(dt, 0), 50));
		paint();
		return moving;
	});

	return {
		/** Draws the pose as it is now. */
		render: paint,

		/** The scene the talk is in, which says what the pointer can pick. @param {string} scene */
		enter(scene) {
			name = scene;
			paint();
			loop.start();
		},

		/** Whether the canvas is seen at all: unseen, nothing is drawn. @param {boolean} seen */
		show(seen) {
			if (seen === shown) return;
			shown = seen;
			if (seen) paint();
		},

		/**
		 * The canvas's size and the stage's box in it, in CSS px.
		 * @param {number} w @param {number} h @param {Stage} box
		 */
		resize(w, h, box) {
			stage = box;
			if (w !== width || h !== height) {
				width = Math.max(1, w);
				height = Math.max(1, h);
				renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
				renderer.setSize(width, height, false);
			}
			paint();
		},

		/** The pointer over the canvas, in its px from the top left, or gone. @param {{ x: number, y: number } | null} to */
		point(to) {
			pointer = to;
			loop.start();
		},

		dispose() {
			loop.stop();
			for (const thing of owned) thing.dispose();
			// dispose() keeps the context alive until GC (see icons/stage.js).
			renderer.forceContextLoss();
		}
	};
}

/** @typedef {Awaited<ReturnType<typeof createWorld>>} World */
