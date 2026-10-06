import {
	CanvasTexture,
	CustomBlending,
	DoubleSide,
	DstColorFactor,
	Group,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	ShaderMaterial,
	SRGBColorSpace,
	Vector3,
	ZeroFactor
} from 'three';
import { COVERS, FLOWERS, species as catalogue } from './species/index.js';

/**
 * The Plants: each species' sprite (static/garden/<kind>.webp, its SVG rendered by
 * scripts/garden-sprites.mjs) drawn once to a canvas and kept as a texture; a flower stands on
 * its cell's centre as a billboard turned to the camera's yaw (a paper cut-out on a diorama), with
 * its shadow lying on the paper to its right, the same drawing's silhouette laid down and blurred; ground
 * cover lies flat on its cell as a decal that shows through a circle growing from the centre, with
 * its cell's wash (paper.js).
 */

/**
 * @typedef {import('./species/index.js').Species} Species
 * @typedef {import('./layout.js').Cell} Cell
 * @typedef {object} Plant
 * @property {Cell} cell
 * @property {Group} node at the cell's centre; a flower's turns to the camera
 * @property {Mesh | null} mesh the billboard or the decal, once its texture is drawn
 * @property {Mesh | null} shadow
 * @property {{ value: number }} pop a flower's size, 0 to 1 (overshooting as it pops)
 * @property {{ value: number }} wash how far its cell's wash has grown, 0 to 1: ground cover shows through it
 * @property {number} hover eased 0..1
 * @property {number} hoverTarget
 * @property {number} scale world units per drawing unit (the cell side, varied a little by seed)
 * @property {number} height how high the flower's drawing reaches above its foot at full size, in cells
 * @property {string[]} petals the colours of its burst
 * @property {HTMLCanvasElement | null} canvas the drawing, for picking by its alpha
 */

/** A flower is this many cells wide. */
const FLOWER_WIDTH = 0.92;
/**
 * A flower's shadow is its silhouette lying on the paper beside its foot, as a low light from the
 * left would cast it: its height runs `LENGTH` times as long to the right, and a little toward the
 * viewer (`LEAN` per unit of height); its width becomes the streak's depth, `DEPTH` times as deep.
 */
const LENGTH = 1.9;
const LEAN = 0.06;
const DEPTH = 0.3;
/**
 * How dark a shadow is where the drawing is solid, as black's alpha in the display's terms (see
 * paper.js): enough to stand the flower up off the paper, no more.
 */
const SHADOW = 0.14;

/** Each species' sprite, fetched and decoded (off the main thread) once a page. @type {Map<string, Promise<HTMLImageElement>>} */
const sprites = new Map();

/** @param {string} kind */
function sprite(kind) {
	let loaded = sprites.get(kind);
	if (!loaded) {
		const image = new Image();
		image.src = `/garden/${kind}.webp`;
		loaded = image.decode().then(
			() => image,
			(error) => {
				sprites.delete(kind);
				throw new Error(`No ${image.src}`, { cause: error });
			}
		);
		sprites.set(kind, loaded);
	}
	return loaded;
}

/**
 * Start fetching every sprite, so they are in before the Garden opens (the home layout asks as the
 * Glasses are lifted). One that fails is asked for again by the Garden.
 */
export function prefetch() {
	for (const kind of [...FLOWERS, ...COVERS]) sprite(kind).catch(() => {});
}

/**
 * A sprite on a canvas of its size. A flower's is read back on every pointer move (see `solid`), so
 * kept in memory rather than on the GPU.
 * @param {HTMLImageElement} image @param {boolean} flower
 */
function draw(image, flower) {
	const canvas = document.createElement('canvas');
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	/** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { willReadFrequently: flower })).drawImage(image, 0, 0);
	return canvas;
}

/**
 * The drawing about 52 px tall, softened, as a silhouette in its alpha (the shadow's shader
 * colours it), fading toward its top: a shadow is darkest where the plant meets the paper.
 * @param {HTMLCanvasElement} drawing
 */
function silhouette(drawing) {
	const canvas = document.createElement('canvas');
	const k = 51.2 / drawing.height;
	canvas.width = Math.ceil(drawing.width * k);
	canvas.height = Math.ceil(drawing.height * k);
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	ctx.globalAlpha = 0.14;
	for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (dx * dx + dy * dy <= 5) ctx.drawImage(drawing, dx * 1.3, dy * 1.3, canvas.width, canvas.height);
	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = 'source-in';
	const fade = ctx.createLinearGradient(0, 0, 0, canvas.height);
	fade.addColorStop(0, 'rgba(255,255,255,0.6)');
	fade.addColorStop(1, '#fff');
	ctx.fillStyle = fade;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	return canvas;
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const coverFragment = /* glsl */ `
uniform sampler2D map;
uniform float uReveal;
varying vec2 vUv;
void main() {
	if (length(vUv - 0.5) > uReveal * 0.72) discard;
	vec4 c = texture2D(map, vUv);
	if (c.a < 0.02) discard;
	gl_FragColor = c;
	#include <colorspace_fragment>
}`;

/**
 * A shadow is multiplied into what lies under it (the material's blending is dst × src), so it
 * darkens the paper, a wash and a ruling alike, as a real shadow would.
 */
const shadowFragment = /* glsl */ `
uniform sampler2D map;
varying vec2 vUv;
void main() {
	gl_FragColor = vec4(vec3(mix(1.0, pow(${(1 - SHADOW).toFixed(2)}, 2.2), texture2D(map, vUv).a)), 1.0);
}`;

/**
 * @param {Cell[]} cells
 * @param {{ center: (col: number, row: number) => { x: number, z: number }, side: number }} paper where the cells are
 * @param {{ yaw: number, anisotropy: number }} options `yaw` the camera's garden-pose turn, which the flowers face
 */
export function createPlants(cells, paper, { yaw, anisotropy }) {
	const group = new Group();
	const coverGeometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
	/** @type {{ dispose(): void }[]} */
	const owned = [coverGeometry];
	/** @type {Mesh[]} */
	const pickables = [];

	/** @type {Plant[]} */
	const plants = cells.map((cell) => {
		const node = new Group();
		if (cell.kind === 'flower') node.rotation.y = yaw;
		group.add(node);
		return {
			cell,
			node,
			mesh: null,
			shadow: null,
			pop: { value: 0 },
			wash: { value: 0 },
			hover: 0,
			hoverTarget: 0,
			scale: paper.side,
			height: 0,
			petals: catalogue[cell.species].petals,
			canvas: null
		};
	});

	/**
	 * Every plant on its cell, at the cell's size (a flower a little bigger or smaller by its seed);
	 * ground cover just over the paper and a shadow just over that, lifted by a little of the cell.
	 */
	function place() {
		for (const plant of plants) {
			const { x, z } = paper.center(plant.cell.col, plant.cell.row);
			plant.node.position.set(x, 0, z);
			const jitter = plant.cell.kind === 'flower' ? 1 + ((plant.cell.project.seed % 1000) / 1000 - 0.5) * 0.16 : 1;
			plant.scale = paper.side * jitter;
			if (plant.shadow) plant.shadow.position.y = paper.side * 0.022;
			else if (plant.mesh) plant.mesh.position.y = paper.side * 0.015;
		}
	}
	place();

	/**
	 * Each drawing once, however many Plants share it: its texture, and a flower's shadow, quads and
	 * reach. Kept as promises, so Plants that ask at once share one.
	 * @type {Map<string, Promise<{ species: Species, drawing: HTMLCanvasElement, texture: CanvasTexture, shadow: CanvasTexture | null, geometry: PlaneGeometry | null, shadowGeometry: PlaneGeometry | null, reach: number }>>}
	 */
	const drawn = new Map();

	/** @param {string} kind @param {boolean} flower */
	async function prepare(kind, flower) {
		const species = catalogue[kind];
		const drawing = draw(await sprite(kind), flower);
		const texture = new CanvasTexture(drawing);
		texture.colorSpace = SRGBColorSpace;
		texture.anisotropy = anisotropy;
		owned.push(texture);
		if (!flower) return { species, drawing, texture, shadow: null, geometry: null, shadowGeometry: null, reach: 0 };
		const shadow = new CanvasTexture(silhouette(drawing));
		shadow.colorSpace = SRGBColorSpace;
		// The drawing in cells, its foot (the anchor) at the origin, so it scales up from where it stands.
		const w = FLOWER_WIDTH;
		const h = (w * species.height) / species.width;
		const geometry = new PlaneGeometry(w, h).translate(0, (species.anchor - 0.5) * h, 0);
		// Its shadow: the same quad laid down on the paper, pointing away from the light.
		const shadowGeometry = new PlaneGeometry(w, h).translate(0, (species.anchor - 0.5) * h, 0);
		shadowGeometry.deleteAttribute('normal');
		shadowGeometry.applyMatrix4(new Matrix4().set(0, LENGTH, 0, 0, 0, 0, 0, 0, DEPTH, LEAN, 0, 0, 0, 0, 0, 1));
		owned.push(shadow, geometry, shadowGeometry);
		// How high it reaches: from its foot to its first row with any ink (where the label points).
		const ink = /** @type {CanvasRenderingContext2D} */ (drawing.getContext('2d')).getImageData(0, 0, drawing.width, drawing.height).data;
		let first = 3;
		while (first < ink.length && ink[first] <= 40) first += 4;
		const reach = (species.anchor - Math.floor(first / 4 / drawing.width) / drawing.height) * h;
		return { species, drawing, texture, shadow, geometry, shadowGeometry, reach };
	}

	/** @type {Promise<void> | null} */
	let drawing = null;

	/**
	 * Every Plant's drawing, and its meshes made from it. Each settles on its own: a Plant whose
	 * sprite fails (missing, or cut off) has no mesh, and the others grow without it.
	 */
	async function drawAll() {
		const settled = await Promise.allSettled(
			plants.map(async (plant) => {
				const { species: kind, kind: form } = plant.cell;
				const flower = form === 'flower';
				if (!drawn.has(kind)) drawn.set(kind, prepare(kind, flower));
				const art = await /** @type {NonNullable<ReturnType<typeof drawn.get>>} */ (drawn.get(kind));
				plant.canvas = art.drawing;
				if (flower && art.geometry && art.shadowGeometry) {
					plant.height = art.reach;
					const material = new MeshBasicMaterial({ map: art.texture, transparent: true, alphaTest: 0.02, side: DoubleSide });
					plant.mesh = new Mesh(art.geometry, material);
					const shade = new ShaderMaterial({
						vertexShader,
						fragmentShader: shadowFragment,
						uniforms: { map: { value: art.shadow } },
						transparent: true,
						depthWrite: false,
						side: DoubleSide,
						blending: CustomBlending,
						blendSrc: DstColorFactor,
						blendDst: ZeroFactor
					});
					plant.shadow = new Mesh(art.shadowGeometry, shade);
					// Every shadow lies under every flower, whatever their distances.
					plant.shadow.renderOrder = -1;
					owned.push(material, shade);
				} else {
					// Blended at its edges, as the flowers are, and drawn over the paper before any shadow, so
					// a flower's shadow falls across it too.
					const material = new ShaderMaterial({
						vertexShader,
						fragmentShader: coverFragment,
						uniforms: { map: { value: art.texture }, uReveal: { value: 0 } },
						transparent: true,
						depthWrite: false
					});
					plant.mesh = new Mesh(coverGeometry, material);
					plant.mesh.renderOrder = -1.5;
					owned.push(material);
				}
				plant.mesh.userData.plant = plant;
				plant.mesh.visible = false;
				plant.node.add(plant.mesh);
				if (plant.shadow) plant.node.add(plant.shadow);
				pickables.push(plant.mesh);
			})
		);
		// Said once a drawing: the Plants that share one fail with the same error.
		for (const error of new Set(settled.flatMap((result) => (result.status === 'rejected' ? [result.reason] : []))))
			console.warn('The Garden grows without a drawing:', error);
		place();
	}

	const anchor = new Vector3();
	/** How long the shadows are, times their full length (see `lay`). */
	let cast = 1;

	return {
		group,
		plants,
		pickables,

		/**
		 * Draw every Plant (the first call starts it; every call gets the same promise): its sprite,
		 * decoded off the main thread, onto a canvas and into a texture, a few ms a drawing.
		 */
		draw() {
			return (drawing ??= drawAll());
		},
		place,

		/** How long the flowers' shadows are, times their full length (garden.js `lay`). @param {number} length */
		lay(length) {
			cast = length;
		},

		/**
		 * Pose every plant for this frame: its size from `pop` (a flower) or its wash (ground cover),
		 * and its hover, eased: a flower lifts a few px and brightens, and its shadow stretches.
		 * @param {number} dt ms
		 */
		update(dt) {
			const ease = 1 - Math.exp(-Math.max(dt, 0) / 90);
			for (const plant of plants) {
				if (!plant.mesh) continue;
				plant.hover += (plant.hoverTarget - plant.hover) * ease;
				if (plant.shadow) {
					const s = plant.scale * plant.pop.value;
					plant.mesh.visible = plant.shadow.visible = s > 0.001;
					plant.mesh.scale.setScalar(Math.max(s, 1e-4));
					plant.mesh.position.y = plant.hover * plant.scale * 0.04;
					/** @type {MeshBasicMaterial} */ (plant.mesh.material).color.setScalar(1 + 0.12 * plant.hover);
					plant.shadow.scale.set(Math.max(s, 1e-4) * (1 + 0.15 * plant.hover) * cast, Math.max(s, 1e-4), Math.max(s, 1e-4));
				} else {
					plant.mesh.visible = plant.wash.value > 0.001;
					plant.mesh.scale.setScalar(plant.scale);
					/** @type {ShaderMaterial} */ (plant.mesh.material).uniforms.uReveal.value = plant.wash.value;
				}
			}
		},

		/** Where a plant's label points: the top of a flower, the middle of ground cover. @param {Plant} plant */
		anchor(plant) {
			return anchor.copy(plant.node.position).setY(plant.shadow ? plant.scale * (plant.height * plant.pop.value + plant.hover * 0.04) : 0);
		},

		/**
		 * Whether a hit on a plant's quad lands on its drawing, or within `slack` of it (a fraction of
		 * the drawing's width), rather than on the clear paper round it: a little slack so that the gaps
		 * in a drawing (between a rain-bell's bells and its stalk) still count, more for a finger.
		 * @param {Plant} plant @param {{ x: number, y: number } | null | undefined} uv @param {number} [slack]
		 */
		solid(plant, uv, slack = 0) {
			if (!plant.shadow || !plant.canvas || !uv) return true;
			const { width, height } = plant.canvas;
			const r = Math.round(slack * width);
			const x = Math.floor(uv.x * (width - 1));
			const y = Math.floor((1 - uv.y) * (height - 1));
			const ctx = /** @type {CanvasRenderingContext2D} */ (plant.canvas.getContext('2d'));
			const { data } = ctx.getImageData(x - r, y - r, 2 * r + 1, 2 * r + 1);
			for (let i = 3; i < data.length; i += 4) if (data[i] > 40) return true;
			return false;
		},

		dispose() {
			for (const thing of owned) thing.dispose();
		}
	};
}
