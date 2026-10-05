import {
	BufferAttribute,
	BufferGeometry,
	CircleGeometry,
	DoubleSide,
	DynamicDrawUsage,
	Euler,
	Group,
	InstancedMesh,
	LinearFilter,
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
 * The talk's stage (see beats.js): a drawing board with the avatar's sheet on it, seen from straight
 * above or from Hairline's 2:1 corner view, and what the talk does to that sheet. Its glasses lift
 * off as a second layer, the keyframes are dealt out beside it, a film strip slides out under them,
 * and the avatar's own mesh (avatarMesh.json) is laid over the drawing and bends it.
 *
 * Drawn the way Hairline's figures are (lucasmarkes.com/lab/hairline): one stroke weight in a few
 * strengths of ink on white, rounded plates, a board that is a silhouette and one crease, dashed
 * drops under what is lifted, dots for what is counted, and one bright stroke that says where to
 * look and goes to whatever the pointer picks. Nothing fades in: sheets slide out from under other
 * sheets, and lines are drawn on. The only colour is the drawings' own.
 *
 * The world is measured in the avatar's 134 px, x to the right, z towards the viewer, y up.
 */

const SIDE = 134;
const HALF = SIDE / 2;
/** A sheet: its corner, its thickness, the gap to the next one, and how far the board reaches past it. */
const CORNER = 6;
const THICK = 1.2;
const GAP = 22;
const PITCH = SIDE + GAP;
const MARGIN = 31;
const BOARD = { corner: 16, crease: 3, thick: 5 };
/** How high the glasses' layer lifts off the face. */
const LIFT = 46;
/** The film strip under the keyframes, and its six frames. */
const STRIP = { w: PITCH + SIDE, h: 56, frame: 40, frames: 6, z: PITCH + HALF + GAP + 28 };
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
/** How much of the stage's shorter side a pose's `span` fills. */
const FILL = 0.92;
/** Picked, a sheet rises this far, on Hairline's spring. */
const RISE = 3;
const SPRING = { tension: 100, friction: 18 };

const board = (/** @type {number} */ x, /** @type {number} */ z, /** @type {number} */ w, /** @type {number} */ h) => ({ px: x, pz: z, pw: w + 2 * MARGIN, ph: h + 2 * MARGIN });
const REST = { az: 0, el: 90, span: 216, tx: 0, ty: 0, tz: 0, lift: 0, rims: 0, keys: 0, strip: 0, wire: 0, up: 0, ...board(0, 0, SIDE, SIDE) };
const DEALT = { ...REST, span: 396, tx: PITCH / 2, tz: PITCH / 2, keys: 1, ...board(PITCH / 2, PITCH / 2, PITCH + SIDE, PITCH + SIDE) };
const REELED = PITCH + SIDE + GAP + STRIP.h;

/**
 * What the stage shows in each of the talk's scenes: where the camera is (`az` round and `el` up, in
 * degrees; `span` px of the world across the stage; `tx ty tz` what it looks at), how far the glasses
 * are lifted, how much of their rims, the keyframes, the strip and the mesh is out, how far the head
 * looks up, and the board (`px pz` its centre, `pw ph` its size).
 * @typedef {typeof REST} Pose
 * @type {Record<string, Pose>}
 */
export const POSES = {
	picture: REST,
	rings: { ...REST, rims: 1 },
	layers: { ...REST, rims: 1, az: 45, el: 30, span: 300, ty: 14, lift: LIFT },
	keys: DEALT,
	strip: { ...DEALT, span: 474, tz: (REELED - SIDE) / 2, strip: 1, ...board(PITCH / 2, (REELED - SIDE) / 2, PITCH + SIDE, REELED) },
	mesh: { ...REST, wire: 1 },
	bend: { ...REST, wire: 1, up: 1 }
};

const rad = (/** @type {number} */ degrees) => (degrees * Math.PI) / 180;
const clamp01 = (/** @type {number} */ x) => Math.min(1, Math.max(0, x));
const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) => a + (b - a) * t;

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

/** A closed outline at height `y`, as the segments a stroke draws. @param {number[][]} points @param {number} y @param {number} [dx] @param {number} [dz] */
function closed(points, y, dx = 0, dz = 0) {
	const pairs = new Float32Array(points.length * 6);
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

/** avatarMorph.js's crossing of the drawings, on a sheet with rounded corners. */
const fragmentShader = /* glsl */ `
uniform sampler2D uRestImage;
uniform sampler2D uUpImage;
uniform sampler2D uDownImage;
uniform float uUp;
uniform float uDown;
uniform float uCorner;
varying vec2 vRest;
varying vec2 vUp;
varying vec2 vDown;
varying vec2 vAt;

vec3 paper(sampler2D image, vec2 at) {
	vec4 colour = texture2D(image, at);
	return mix(vec3(1.0), colour.rgb, colour.a);
}

void main() {
	vec2 q = abs(vAt) - (${HALF}.0 - uCorner);
	if (length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) > uCorner) discard;
	vec3 colour = paper(uRestImage, vRest);
	colour = mix(colour, paper(uUpImage, vUp), smoothstep(0.2, 0.8, uUp));
	colour = mix(colour, paper(uDownImage, vDown), smoothstep(0.2, 0.8, uDown));
	gl_FragColor = vec4(colour, 1.0);
}`;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<'face' | 'glasses' | 'up' | 'down' | 'keyUp' | 'keyDown' | 'keyWonder', string>} urls
 *   the avatar's two layers, the poses its mesh was fitted to, and the keyframes as they were drawn
 * @param {Pose} pose the pose to draw, which the page's timeline moves
 * @param {(name: string | null) => void} read told what the pointer is over
 */
export async function createWorld(canvas, urls, pose, read) {
	const loader = new TextureLoader();
	const names = /** @type {(keyof typeof urls)[]} */ (Object.keys(urls));
	const loaded = await Promise.all(names.map((name) => loader.loadAsync(urls[name])));
	const textures = /** @type {Record<keyof typeof urls, import('three').Texture>} */ (Object.fromEntries(names.map((name, i) => [name, loaded[i]])));
	// The mesh samples its drawings as avatarMorph.js does: as they are, from the top left.
	for (const name of /** @type {const} */ (['face', 'up', 'down'])) {
		textures[name].flipY = false;
		textures[name].generateMipmaps = false;
		textures[name].minFilter = LinearFilter;
	}
	for (const name of /** @type {const} */ (['glasses', 'keyUp', 'keyDown', 'keyWonder'])) textures[name].colorSpace = SRGBColorSpace;

	// White and opaque, like the page under it, so the lines' soft edges are mixed with white here.
	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
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
	 * thickness, with a white or pictured face unless it brings its own.
	 * @param {import('three').Texture | null} [map] @param {number} [w] @param {number} [h]
	 */
	function sheet(map, w = SIDE, h = SIDE) {
		const group = new Group();
		const outline = ring(w, h, CORNER);
		const foot = strokes(outline.length, ink.edge, closed(outline, 0));
		const top = strokes(outline.length, ink.edge, closed(outline, THICK));
		group.add(foot, top);
		if (map !== undefined) {
			const geometry = own(new ShapeGeometry(new Shape(outline.map(([x, z]) => new Vector2(x, -z)))));
			const { position, uv } = geometry.attributes;
			for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) / w + 0.5, position.getY(i) / h + 0.5);
			const face = new Mesh(geometry, own(new MeshBasicMaterial({ map, ...white })));
			face.rotation.x = -Math.PI / 2;
			face.position.y = THICK;
			group.add(face);
		}
		return { group, top, rise: new Spring(0, SPRING) };
	}

	// The board: a silhouette and one crease, its far foot hidden behind its own top.
	const count = ring(1, 1, 0.1).length;
	const plinth = {
		top: strokes(count, ink.edge),
		crease: strokes(count, ink.lo),
		foot: strokes(count, ink.edge),
		sides: strokes(2, ink.edge),
		fill: new Mesh(own(new BufferGeometry()), own(new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide, ...white })))
	};
	plinth.fill.geometry.setAttribute('position', new BufferAttribute(new Float32Array((count + 1) * 3), 3));
	plinth.fill.geometry.setIndex(Array.from({ length: count }, (_, i) => [0, 1 + i, 1 + ((i + 1) % count)]).flat());
	plinth.fill.frustumCulled = false;
	scene.add(plinth.fill, plinth.foot, plinth.sides, plinth.crease, plinth.top);

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
					uCorner: { value: corner }
				}
			})
		);
	/** @param {ShaderMaterial} material */
	function drawing(material) {
		const face = new Mesh(morphGeometry, material);
		face.frustumCulled = false;
		return face;
	}

	const main = sheet();
	const face = drawing(morphing(CORNER));
	face.position.y = THICK;
	main.group.add(face);

	// The glasses, a layer of their own: the drawing's, and over them their rims in line.
	const glasses = new Group();
	const lens = new Mesh(own(new PlaneGeometry(SIDE, SIDE)), own(new MeshBasicMaterial({ map: textures.glasses, transparent: true, depthWrite: false })));
	lens.rotation.x = -Math.PI / 2;
	const film = strokes(count, ink.edge, closed(ring(SIDE, SIDE, CORNER), 0));
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
	const edges = [...new Set(Array.from({ length: mesh.triangles.length / 3 }, (_, t) => [0, 1, 2].map((k) => [mesh.triangles[3 * t + k], mesh.triangles[3 * t + ((k + 1) % 3)]].sort((a, b) => a - b).join()))
		.flat())]
		.map((pair) => pair.split(',').map(Number))
		.sort(([a, b], [c, d]) => far((at(a)[0] + at(b)[0]) / 2, (at(a)[1] + at(b)[1]) / 2) - far((at(c)[0] + at(d)[0]) / 2, (at(c)[1] + at(d)[1]) / 2));
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

	// The keyframes, dealt out beside the sheet from under it, nearest first.
	const keys = /** @type {const} */ ([
		['looking up', textures.keyUp, [PITCH, 0], 0],
		['looking down', textures.keyDown, [0, PITCH], 0.1],
		['wondering', textures.keyWonder, [PITCH, PITCH], 0.2]
	]).map(([name, map, slot, wait]) => ({ name, slot, wait, ...sheet(map) }));

	// The film strip: six frames of the head on its way up, and its sprocket holes.
	const strip = { name: 'seedance · test', slot: [PITCH / 2, STRIP.z], ...sheet(null, STRIP.w, STRIP.h) };
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

	scene.add(strip.group, ...keys.map((key) => key.group), main.group);

	/** What the pointer can pick in each scene, topmost first: a sheet where it rests, by its name. */
	const glassy = { name: 'glasses.png', slot: [0, 0], y: THICK + LIFT, w: SIDE, h: SIDE };
	const sheets = [
		{ name: 'at rest', slot: [0, 0], y: THICK, w: SIDE, h: SIDE, part: main },
		...keys.map((key) => ({ name: key.name, slot: key.slot, y: THICK, w: SIDE, h: SIDE, part: key }))
	];
	/** @type {Record<string, { name: string, slot: readonly number[], y: number, w: number, h: number, part?: { top: LineSegments2, rise: Spring } }[]>} */
	const pickable = {
		layers: [glassy, { ...sheets[0], name: 'face.png' }],
		keys: sheets,
		strip: [...sheets, { name: strip.name, slot: strip.slot, y: THICK, w: STRIP.w, h: STRIP.h, part: strip }]
	};
	/** Where the eye starts in each scene, until the pointer picks something. */
	const starts = /** @type {Record<string, object>} */ ({ rings: glassy, layers: glassy, strip: pickable.strip[4] });

	let name = 'picture';
	let width = 1;
	let height = 1;
	/** The pointer over the stage, in its px from the top left. @type {{ x: number, y: number } | null} */
	let pointer = null;
	/** What it picked. @type {object | null} */
	let picked = null;
	/** -1 looking up, 1 looking down: the pointer's, over the mesh, or else the pose's. */
	const pitch = new Spring(0, SPRING);
	const euler = new Euler(0, 0, 0, 'YXZ');
	const raycaster = new Raycaster();
	const ground = new Plane(new Vector3(0, 1, 0), 0);
	const hit = new Vector3();
	const ndc = new Vector2();

	/** Where the pointer is on the plane at height `y`, in the world. @param {number} y */
	function under(y) {
		if (!pointer) return null;
		raycaster.setFromCamera(ndc.set((pointer.x / width) * 2 - 1, 1 - (pointer.y / height) * 2), camera);
		ground.constant = -y;
		return raycaster.ray.intersectPlane(ground, hit);
	}

	/** Picks from where things rest, never from where they are, so nothing moves out from under the pointer. */
	function pick() {
		const before = picked;
		picked = null;
		let said = null;
		for (const option of pickable[name] ?? []) {
			const point = under(option.y);
			if (point && Math.abs(point.x - option.slot[0]) <= option.w / 2 && Math.abs(point.z - option.slot[1]) <= option.h / 2) {
				picked = option;
				said = option.name;
				break;
			}
		}
		let look = -pose.up;
		if (name === 'mesh' || name === 'bend') {
			const point = under(THICK);
			if (point) {
				const dx = point.x - (HEAD.x * SIDE - HALF);
				const dz = point.z - (HEAD.y * SIDE - HALF);
				look = Math.abs(dz) > HEAD.r * SIDE && Math.abs(dx) <= Math.abs(dz) * PLUMB ? Math.sign(dz) : 0;
				said = look ? (look < 0 ? 'looking up' : 'looking down') : null;
			}
		}
		if (look !== pitch.target) pitch.to(look);
		for (const { part } of sheets) part.rise.to(part === /** @type {any} */ (picked)?.part ? RISE : 0);
		strip.rise.to(strip === /** @type {any} */ (picked)?.part ? RISE : 0);
		if (picked !== before || said !== spoken) read((spoken = said));
	}
	/** @type {string | null} */
	let spoken = null;

	/** @param {number} dt ms */
	function settle(dt) {
		let moving = pitch.advance(dt);
		for (const part of [main, strip, ...keys]) moving = part.rise.advance(dt) || moving;
		return moving;
	}

	function paint() {
		// The camera: straight above, or round to the corner view.
		camera.left = -width / 2;
		camera.right = width / 2;
		camera.top = height / 2;
		camera.bottom = -height / 2;
		camera.zoom = (Math.min(width, height) * FILL) / pose.span;
		camera.quaternion.setFromEuler(euler.set(-rad(pose.el), rad(pose.az), 0));
		camera.position.set(0, 0, 1000).applyQuaternion(camera.quaternion);
		camera.position.x += pose.tx;
		camera.position.y += pose.ty;
		camera.position.z += pose.tz;
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld();
		pick();

		// The board, round whatever is out: its outline, its crease, its foot, and its two sides where
		// the outline turns away, which is what makes them a silhouette.
		const outline = ring(pose.pw, pose.ph, BOARD.corner);
		redraw(plinth.top, closed(outline, 0, pose.px, pose.pz));
		redraw(plinth.foot, closed(outline, -BOARD.thick, pose.px, pose.pz));
		redraw(plinth.crease, closed(ring(pose.pw - 2 * BOARD.crease, pose.ph - 2 * BOARD.crease, BOARD.corner - BOARD.crease), 0, pose.px, pose.pz));
		const fill = /** @type {BufferAttribute} */ (plinth.fill.geometry.attributes.position);
		fill.setXYZ(0, pose.px, 0, pose.pz);
		outline.forEach(([x, z], i) => fill.setXYZ(1 + i, x + pose.px, 0, z + pose.pz));
		fill.needsUpdate = true;
		const across = (/** @type {number[]} */ [x, z]) => x * Math.cos(rad(pose.az)) - z * Math.sin(rad(pose.az));
		const ends = [outline.reduce((a, b) => (across(b) < across(a) ? b : a)), outline.reduce((a, b) => (across(b) > across(a) ? b : a))];
		redraw(plinth.sides, ends.flatMap(([x, z]) => [x + pose.px, 0, z + pose.pz, x + pose.px, -BOARD.thick, z + pose.pz]));

		// The glasses' layer, and the drops under it.
		const lifted = pose.lift > 0.5;
		glasses.position.y = THICK + 0.15 + pose.lift;
		film.visible = drops.visible = lifted;
		if (lifted) {
			redraw(drops, corners.flatMap(([x, z]) => [x, THICK, z, x, THICK + pose.lift, z]));
			const { data } = /** @type {import('three').InterleavedBufferAttribute} */ (drops.geometry.attributes.instanceDistanceStart);
			data.array.set(corners.flatMap(() => [0, pose.lift]));
			data.needsUpdate = true;
		}
		// The rims are drawn on one after another: a rim, the bridge, the other rim.
		rims.forEach((line, i) => drawn(line, i === 1 ? 1 : 72, pose.rims * 2.4 - i * 0.7));

		// The one bright stroke: on what the pointer picked, or where this scene starts.
		const bright = picked ?? starts[name] ?? sheets[0];
		for (const line of rims) line.material = bright === glassy ? ink.hi : ink.edge;
		for (const option of pickable.strip) if (option.part) option.part.top.material = bright === option || (option.part === main && /** @type {any} */ (bright).part === main) ? ink.hi : ink.edge;

		// The keyframes slide out from under the sheet, and the strip from under them.
		main.group.position.y = main.rise.value;
		keys.forEach((key, i) => {
			const out = clamp01((pose.keys - key.wait) / 0.8);
			key.group.visible = out > 0;
			key.group.position.set(key.slot[0] * out, mix(-0.25 * (i + 1), 0, out) + key.rise.value, key.slot[1] * out);
		});
		strip.group.visible = pose.strip > 0;
		strip.group.position.set(strip.slot[0], mix(-0.9, 0, pose.strip) + strip.rise.value, mix(PITCH, strip.slot[1], pose.strip));

		// The head, and the mesh that bends it: every point between where it rests and where the pose has it.
		const up = Math.max(0, -pitch.value);
		const down = Math.max(0, pitch.value);
		const material = /** @type {ShaderMaterial} */ (face.material);
		material.uniforms.uUp.value = up;
		material.uniforms.uDown.value = down;
		const meshed = Math.round(edges.length * clamp01(pose.wire * 1.25));
		const pointed = Math.round(order.length * clamp01(pose.wire * 1.25 - 0.25));
		wire.geometry.instanceCount = meshed;
		halo.count = dots.count = pointed;
		wire.visible = meshed > 0;
		halo.visible = dots.visible = pointed > 0;
		if (meshed) {
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

		renderer.render(scene, camera);
	}

	let stale = true;
	const loop = frameLoop((dt) => {
		const moving = settle(Math.min(Math.max(dt, 0), 50));
		if (stale || moving) paint();
		stale = false;
		return moving;
	});
	/** Draws the pose as it is now, and goes on until the springs have settled. */
	function draw() {
		stale = true;
		loop.start();
	}

	return {
		draw,

		/** The scene the talk is in, which says what the pointer can pick. @param {string} scene */
		enter(scene) {
			name = scene;
			draw();
		},

		/** @param {number} w @param {number} h the stage's size in CSS px */
		resize(w, h) {
			width = Math.max(1, w);
			height = Math.max(1, h);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.setSize(width, height, false);
			draw();
		},

		/** The pointer over the stage, in px from its top left, or gone. @param {{ x: number, y: number } | null} to */
		point(to) {
			pointer = to;
			draw();
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
