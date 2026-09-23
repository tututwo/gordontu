import {
	Box3,
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
 * The Category link icons, drawn the way uikit-expt.vercel.app draws its card icons (repo
 * github.com/leweyse/uikit-expt at 6f34d27, the deployed commit):
 * white boxes whose UV borders are inked by a screen-space `fwidth` edge shader, fitted into the
 * frame's content box like uikit's <Content>, and viewed orthographically. All sizes are in the
 * reference card's pixels (its frame renders 70 units wide); the canvas spans 140 units so a spinning icon can
 * spill past its frame the way it does there.
 */

/** @typedef {'cubes' | 'columns' | 'cube'} Shape */

/** @type {Record<Shape, { boxes: { size: [number, number, number], at: [number, number, number] }[], scale: number }>} */
const shapes = {
	// uikit-expt `Cubes`, shown at `transformScale={1.1}`.
	cubes: {
		boxes: /** @type {[number, number, number][]} */ ([
			[-1, 0, 0],
			[1, 0, 0],
			[0, 0, 1],
			[0, 0, -1],
			[0, 1, 0],
			[0, -1, 0]
		]).map((at) => ({ size: [1, 1, 1], at })),
		scale: 1.1
	},
	// uikit-expt `Columns`, shown at `transformScale={0.75}`.
	columns: {
		boxes: [0, 1, 2].map((i) => ({ size: [0.175, 1, 1], at: [i * 0.3, 0, 0] })),
		scale: 0.75
	},
	// ponytail: placeholder third icon (the reference only has two); swap for the real one.
	cube: { boxes: [{ size: [1, 1, 1], at: [0, 0, 0] }], scale: 0.75 }
};

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = /* glsl */ `
uniform vec3 uEdgeColor;
uniform float uStrength;

varying vec2 vUv;

float edgeFactor(vec2 p, float strength) {
	vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p) / strength;
	return min(grid.x, grid.y);
}

void main() {
	float a = edgeFactor(vUv, uStrength);
	vec3 c = mix(vec3(uEdgeColor), vec3(1.), a);
	gl_FragColor = vec4(c, 1.0);
}`;

// The reference's shadcn theme colours. Like there, the uniform holds three's linear values and the
// shader writes them out unconverted, which is what gives its edges their deep ink and violet.
const neutral = new Color().setHSL(0, 0, 0.09, SRGBColorSpace);
const violet = new Color().setHSL(262.1 / 360, 0.833, 0.578, SRGBColorSpace);

const HALF_VIEW = 70;
const TO_RAD = Math.PI / 180;

/** @param {HTMLCanvasElement} canvas @param {Shape} shape */
export function createWireframeIcon(canvas, shape) {
	const def = shapes[shape];
	const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	const camera = new OrthographicCamera(-HALF_VIEW, HALF_VIEW, HALF_VIEW, -HALF_VIEW, 1, 1000);
	camera.position.z = 500;

	const material = new ShaderMaterial({
		uniforms: { uEdgeColor: { value: neutral.clone() }, uStrength: { value: 1.5 } },
		vertexShader,
		fragmentShader
	});

	// pivot = the <Content> element's own transform (rotation, transformScale) about its centre;
	// fit = uikit's childrenMatrix, which centres the bounding box and scales it into the content box.
	const pivot = new Group();
	const fit = new Group();
	pivot.scale.setScalar(def.scale);
	pivot.add(fit);

	/** @type {BoxGeometry[]} */
	const geometries = [];
	for (const { size, at } of def.boxes) {
		const geometry = new BoxGeometry(...size);
		geometries.push(geometry);
		const mesh = new Mesh(geometry, material);
		mesh.position.set(...at);
		fit.add(mesh);
	}

	const bounds = new Box3().setFromObject(fit);
	const size = bounds.getSize(new Vector3());
	const centre = bounds.getCenter(new Vector3());

	const scene = new Scene();
	scene.add(pivot);

	return {
		/** Match the drawing buffer to the canvas's CSS size (it follows the headline's font size). */
		resize() {
			renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
		},

		/**
		 * @param {{ angle: number, inner: number, lit: boolean }} state
		 *   angle: the spin in degrees (the reference adds 45 to both X and Y);
		 *   inner: the content box's side in reference pixels; lit: violet edges.
		 */
		render({ angle, inner, lit }) {
			const a = (angle + 45) * TO_RAD;
			pivot.rotation.set(a, a, 0);
			// keepAspectRatio: z follows y, so a non-square box (Columns) stretches in x to fill the square.
			fit.scale.set(inner / size.x, inner / size.y, inner / size.y);
			fit.position.copy(centre).negate().multiply(fit.scale);
			material.uniforms.uEdgeColor.value.copy(lit ? violet : neutral);
			renderer.render(scene, camera);
		},

		dispose() {
			for (const geometry of geometries) geometry.dispose();
			material.dispose();
			renderer.dispose();
		}
	};
}
