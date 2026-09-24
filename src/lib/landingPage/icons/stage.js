import {
	BoxGeometry,
	Color,
	Group,
	Mesh,
	OrthographicCamera,
	Scene,
	ShaderMaterial,
	SRGBColorSpace,
	WebGLRenderer
} from 'three';

/**
 * What every Category link icon shares, kept from the uikit-expt card it started as: one small
 * WebGL canvas, an orthographic camera spanning four times the 70 px frame (so a lit icon, doubled,
 * can spill past its brackets), the object turned 45° about X and Y, and white boxes whose
 * UV borders are inked by a screen-space `fwidth` shader. Ink switches from near-black to violet
 * at once when the link lights up. Like the reference, the ink uniform holds three's linear values
 * and the shaders write them out unconverted, which is what gives the lines their depth.
 */

/** The camera spans 280 reference px: four times the 70 px frame, so a lit icon at double size fits. */
const HALF_VIEW = 140;
const neutral = new Color().setHSL(0, 0, 0.09, SRGBColorSpace);
const violet = new Color().setHSL(262.1 / 360, 0.833, 0.578, SRGBColorSpace);

export const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** The reference's edge ink: 0 on a face's UV border, rising past 1 a `strength` of pixels in. */
export const edgeGlsl = /* glsl */ `
float edgeFactor(vec2 p, float strength) {
	vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p) / strength;
	return min(grid.x, grid.y);
}`;

const edgeFragment = /* glsl */ `
uniform vec3 uInk;
uniform float uStrength;
varying vec2 vUv;
${edgeGlsl}

void main() {
	gl_FragColor = vec4(mix(uInk, vec3(1.0), edgeFactor(vUv, uStrength)), 1.0);
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

	/** Shared by every material on this stage, so lighting up is one uniform write. */
	const ink = { value: neutral.clone() };
	/** @type {{ dispose(): void }[]} */
	const owned = [];
	const unitBox = new BoxGeometry(1, 1, 1);
	owned.push(unitBox);

	/**
	 * A ShaderMaterial on this stage's ink, over the standard `vUv` vertex shader unless given one.
	 * @param {string} fragmentShader
	 * @param {Record<string, { value: unknown }>} [uniforms]
	 * @param {Partial<import('three').ShaderMaterialParameters>} [options]
	 */
	function material(fragmentShader, uniforms = {}, options = {}) {
		const made = new ShaderMaterial({
			vertexShader,
			fragmentShader,
			...options,
			uniforms: { uInk: ink, uStrength: { value: 1.5 }, ...uniforms }
		});
		owned.push(made);
		return made;
	}

	const edge = material(edgeFragment);

	/**
	 * Another edge-inked material, for boxes that need their own render options.
	 * @param {Partial<import('three').ShaderMaterialParameters>} options
	 */
	const inked = (options) => material(edgeFragment, {}, options);

	return {
		pivot,
		camera,
		renderer,
		edge,
		inked,
		material,

		/**
		 * A box of the given size at the given centre. Scaling a unit box keeps each face's UVs 0–1,
		 * so the ink stays a hairline whatever the size, and sizes can be animated every frame.
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

		/** @param {boolean} lit */
		setLit(lit) {
			ink.value.copy(lit ? violet : neutral);
		},

		/**
		 * Magnify the drawing about the canvas centre; done by the camera, so lines stay hairlines.
		 * @param {number} zoom
		 */
		setZoom(zoom) {
			if (camera.zoom === zoom) return;
			camera.zoom = zoom;
			camera.updateProjectionMatrix();
		},

		/** How many reference px one device pixel of the canvas covers at the current zoom. */
		pixel() {
			return (2 * HALF_VIEW) / (camera.zoom * (canvas.width || 2 * HALF_VIEW));
		},

		/** Match the drawing buffer to the canvas's CSS size and the screen's current density. */
		resize() {
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
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
