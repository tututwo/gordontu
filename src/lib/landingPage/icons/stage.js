import {
	BoxGeometry,
	Color,
	Group,
	Mesh,
	OrthographicCamera,
	Scene,
	ShaderMaterial,
	SRGBColorSpace,
	Vector3,
	WebGLRenderer
} from 'three';

/**
 * What every Category link icon shares, kept from the uikit-expt card it started as: one small
 * WebGL canvas, an orthographic camera spanning four times the 70 px frame (so a lit icon, doubled,
 * can spill past its brackets), the object turned 45° about X and Y, and white boxes inked along
 * their edges in screen space, in black, lit or not. Like the reference, the ink uniform holds three's
 * linear values and the shaders write them out unconverted, which is what gives the lines their depth.
 *
 * Every line is one weight, `LINE`, like the Basis Theory icons the set follows: a face inks its
 * side of each edge, half the line where the face across the edge is in view too (an edge seen
 * between two faces), all of it where that face turns away (a silhouette). A face too narrow on
 * screen to show its two edges apart with white between shows one line: its silhouette, the edge
 * nearer us giving way to it. So a plate reads as two clean lines or one, never as a filled band.
 */

/** The camera spans 280 reference px: four times the 70 px frame, so a lit icon at double size fits. */
const HALF_VIEW = 140;
/** The one line weight, in CSS px. */
const LINE = 1;
const black = new Color().setHSL(0, 0, 0.09, SRGBColorSpace);

/**
 * For a box (a scaled unit cube): its position in the cube, its face's normal, and for each axis
 * whether the face on its + side faces us, how wide the faces across that axis's edges are on
 * screen, and how wide this face is across them, in device px. All constant over a face.
 */
const vertexShader = /* glsl */ `
uniform float uPixel;
varying vec2 vUv;
varying vec3 vBox;
varying vec3 vNormal;
varying vec3 vFacing;
varying vec3 vNear;
varying vec3 vOwn;

// An axis of the box on screen, in device px.
vec2 onScreen(vec3 axis) {
	return (modelViewMatrix * vec4(axis, 0.0)).xy / uPixel;
}

// How far v reaches across a line running along "along".
float across(vec2 v, vec2 along) {
	return abs(v.x * along.y - v.y * along.x) / max(length(along), 1e-6);
}

void main() {
	vUv = uv;
	vBox = position;
	vNormal = normal;
	vec3 n = abs(normal);
	vec2 depth = onScreen(n);
	mat3 axes = mat3(1.0);
	for (int a = 0; a < 3; a++) {
		// The edges across axis a run along the third axis (meaningless when a is the normal's).
		vec2 edge = onScreen(vec3(1.0) - n - axes[a]);
		vNear[a] = across(depth, edge);
		vOwn[a] = across(onScreen(axes[a]), edge);
		vFacing[a] = normalize(normalMatrix[a]).z;
	}
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/**
 * The line helpers, for any surface: `inside` covers a pixel `d` px inside a face by a line
 * `width` px wide along its border; `centred` by a whole line centred where `d` is 0; `share` is
 * how much of an edge's line a face draws.
 */
export const lineGlsl = /* glsl */ `
uniform float uLine;

// How much of the pixel d px in from an edge (counting only its part on this side of the edge)
// lies within a line width px wide along it.
float inside(float d, float width) {
	float lo = max(d - 0.5, 0.0);
	return clamp((min(d + 0.5, width) - lo) / max(d + 0.5 - lo, 1e-3), 0.0, 1.0);
}

float centred(float d) {
	return clamp(0.5 * uLine - abs(d) + 0.5, 0.0, 1.0);
}

// Distance in device px to where d is 0.
float pixels(float d) {
	return d / max(length(vec2(dFdx(d), dFdy(d))), 1e-6);
}

// Wide enough, on screen, to show both its edges' lines with white between.
float wide(float px) {
	return smoothstep(1.5 * uLine, 2.5 * uLine, px);
}

// This face's part of an edge's line: all of it on a silhouette (the face across, front <= 0,
// turns away); half where both faces are in view and wide; where the face across is narrow it merges
// into that face's silhouette, and this face tops the line up to its weight; where this face is
// narrow it leaves the line to its own silhouette. Where the face across lies against another mesh
// (glued 1) the other side draws the other half; pressed flat to a mesh just like it (glued 2), the
// two read as one and there is no line.
float share(float front, float near, float own, float glued) {
	float seen = wide(near) * wide(own) * 0.5 * uLine + (1.0 - wide(near)) * max(0.0, uLine - near);
	float seam = 0.5 * uLine;
	return glued < 1.0 ? mix(front > 0.0 ? seen : uLine, seam, glued) : mix(seam, 0.0, glued - 1.0);
}`;

/**
 * After `lineGlsl`, for a box (see `vertexShader`): `boxInk` inks a face at its four edges.
 * `uGlued` marks the faces ([−x −y −z], [+x +y +z]) that lie against another mesh (see `share`).
 */
export const boxGlsl = /* glsl */ `
uniform vec3 uGlued[2];
varying vec3 vBox;
varying vec3 vNormal;
varying vec3 vFacing;
varying vec3 vNear;
varying vec3 vOwn;

float boxInk() {
	vec3 rate = sqrt(dFdx(vBox) * dFdx(vBox) + dFdy(vBox) * dFdy(vBox));
	float ink = 0.0;
	for (int a = 0; a < 3; a++) {
		if (abs(vNormal[a]) > 0.5) continue;
		float side = sign(vBox[a]);
		float glued = side > 0.0 ? uGlued[1][a] : uGlued[0][a];
		float d = (0.5 - abs(vBox[a])) / max(rate[a], 1e-6);
		ink = max(ink, inside(d, share(side * vFacing[a], vNear[a], vOwn[a], glued)));
	}
	return ink;
}`;

const edgeFragment = /* glsl */ `
uniform vec3 uInk;
${lineGlsl}
${boxGlsl}

void main() {
	gl_FragColor = vec4(mix(vec3(1.0), uInk, boxInk()), 1.0);
}`;

/** @param {HTMLCanvasElement} canvas */
export function createStage(canvas) {
	const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
	const camera = new OrthographicCamera(-HALF_VIEW, HALF_VIEW, HALF_VIEW, -HALF_VIEW, 1, 1000);
	camera.position.z = 500;

	const scene = new Scene();
	/** Rotated like the reference's <Content>; icons scale it to their size in reference px. */
	const pivot = new Group();
	pivot.rotation.set(Math.PI / 4, Math.PI / 4, 0);
	scene.add(pivot);

	/** Shared by every material on this stage. */
	const ink = { value: black };
	/** The line weight and the reference px one device pixel covers, kept by `measure`. */
	const line = { value: LINE };
	const pixel = { value: 1 };
	const measure = () => {
		line.value = LINE * renderer.getPixelRatio();
		pixel.value = (2 * HALF_VIEW) / (camera.zoom * (canvas.width || 2 * HALF_VIEW));
	};
	/** @type {{ dispose(): void }[]} */
	const owned = [];
	const unitBox = new BoxGeometry(1, 1, 1);
	owned.push(unitBox);

	/**
	 * A ShaderMaterial on this stage's ink and line weight, over the box vertex shader unless given one.
	 * @param {string} fragmentShader
	 * @param {Record<string, { value: unknown }>} [uniforms]
	 * @param {Partial<import('three').ShaderMaterialParameters>} [options]
	 */
	function material(fragmentShader, uniforms = {}, options = {}) {
		const made = new ShaderMaterial({
			vertexShader,
			fragmentShader,
			...options,
			uniforms: { uInk: ink, uLine: line, uPixel: pixel, uGlued: { value: [new Vector3(), new Vector3()] }, ...uniforms }
		});
		owned.push(made);
		return made;
	}

	const edge = material(edgeFragment);

	return {
		pivot,
		material,

		/** A box material of its own, for boxes whose `uGlued` faces differ. */
		inked: () => material(edgeFragment),

		/**
		 * A box of the given size at the given centre. The ink is measured on screen whatever the
		 * scale, so sizes can be animated every frame.
		 * @param {[number, number, number]} size
		 * @param {[number, number, number]} [at]
		 * @param {import('three').Material | import('three').Material[]} [look]
		 */
		box(size, at = [0, 0, 0], look = edge) {
			const mesh = new Mesh(unitBox, look);
			mesh.scale.set(...size);
			mesh.position.set(...at);
			return mesh;
		},

		/** @template {{ dispose(): void }} T @param {T} thing @returns {T} */
		own(thing) {
			owned.push(thing);
			return thing;
		},

		/**
		 * Magnify the drawing about the canvas centre; done by the camera, so lines stay hairlines.
		 * @param {number} zoom
		 */
		setZoom(zoom) {
			if (camera.zoom === zoom) return;
			camera.zoom = zoom;
			camera.updateProjectionMatrix();
			measure();
		},

		/** How many reference px one device pixel of the canvas covers at the current zoom. */
		pixel() {
			return pixel.value;
		},

		/** Match the drawing buffer to the canvas's CSS size and the screen's current density. */
		resize() {
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
			measure();
		},

		render() {
			renderer.render(scene, camera);
		},

		/**
		 * Compile every material now, off the main thread where the browser allows, including those on
		 * meshes hidden until the link lights up, so neither the first hover nor the landing's own
		 * animations stall on a shader compile.
		 */
		warm() {
			renderer.compileAsync(scene, camera).catch(() => {});
		},

		dispose() {
			for (const thing of owned) thing.dispose();
			renderer.dispose();
			// dispose() keeps the context alive until GC; three landing visits would pile up contexts.
			renderer.forceContextLoss();
		}
	};
}

/** @typedef {ReturnType<typeof createStage>} Stage */

/**
 * What the Category link hands an icon each frame.
 * @typedef {{ lit: boolean, zoom: number, reduced: boolean }} IconState
 *   lit: hovered or focused; zoom: the link's magnification, 1 at rest and 2 lit; reduced:
 *   prefers-reduced-motion — show the lit end state still.
 */

/**
 * An icon advances its own motion by `dt` ms, poses its meshes, and says whether it needs another
 * frame (still settling, or looping while lit).
 * @typedef {{ frame(dt: number, state: IconState): boolean }} Icon
 */

/** Hermite ease of `x` between `a` and `b`, clamped. @param {number} a @param {number} b @param {number} x */
export function smoothstep(a, b, x) {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
}
