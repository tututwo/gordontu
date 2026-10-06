import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * The Garden's look over the whole frame: a tilt-shift blur (sharp in a band across the middle, where
 * camera.js frames the Projects, softening toward the near and far edges, like a miniature), and
 * nothing else: no grade, vignette or grain, so the paper stays the page's white and its hairlines
 * the site's. The blur is a Gaussian in two passes, across and then down (three's tilt-shift
 * shaders' nine taps, but with a band in focus rather than a line); the second pass also encodes the
 * frame to sRGB on its way to the screen. `uAmount` fades it in with the camera's tilt, so the front
 * pose shows the page untouched. The scene renders linear into a half-float target with 4× MSAA; the
 * pass between needs none.
 */

/**
 * The blur's spread at the frame's top and bottom edges, as a fraction of its height, and the middle
 * of the band in focus (v, from the bottom): a little below the frame's middle, with the Projects'
 * cells (camera.js), the flowers standing on them reaching up through it.
 */
const BLUR = 0.006;
const FOCUS = 0.46;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** Nine taps along `step`, a pixel's blur radius apart, weighted as three's tilt-shift shaders do. */
const blurGlsl = /* glsl */ `
uniform float uAmount;
uniform vec2 uStep;

vec3 blur(sampler2D map, vec2 uv) {
	// How far from the band of focus toward the frame's edge, 0 to 1 on either side of it: sharp through
	// the first third of the way, so that the far row of Projects still reads, then softening to the edge.
	float off = uv.y > ${FOCUS.toFixed(2)} ? (uv.y - ${FOCUS.toFixed(2)}) / ${(1 - FOCUS).toFixed(2)} : (${FOCUS.toFixed(2)} - uv.y) / ${FOCUS.toFixed(2)};
	vec2 d = uStep * uAmount * smoothstep(0.3, 1.0, off) * ${(BLUR / 2.7).toFixed(5)};
	vec3 sum = texture2D(map, uv).rgb * 0.1633;
	sum += (texture2D(map, uv - d).rgb + texture2D(map, uv + d).rgb) * 0.1531;
	sum += (texture2D(map, uv - 2.0 * d).rgb + texture2D(map, uv + 2.0 * d).rgb) * 0.12245;
	sum += (texture2D(map, uv - 3.0 * d).rgb + texture2D(map, uv + 3.0 * d).rgb) * 0.0918;
	sum += (texture2D(map, uv - 4.0 * d).rgb + texture2D(map, uv + 4.0 * d).rgb) * 0.051;
	return sum;
}`;

const across = {
	uniforms: { tDiffuse: { value: null }, uAmount: { value: 0 }, uStep: { value: new Vector2() } },
	vertexShader,
	fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;
${blurGlsl}
void main() {
	gl_FragColor = vec4(uAmount > 0.0 ? blur(tDiffuse, vUv) : texture2D(tDiffuse, vUv).rgb, 1.0);
}`
};

const down = {
	uniforms: { tDiffuse: { value: null }, uAmount: { value: 0 }, uStep: { value: new Vector2() } },
	vertexShader,
	fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;
${blurGlsl}

void main() {
	gl_FragColor = vec4(uAmount > 0.0 ? blur(tDiffuse, vUv) : texture2D(tDiffuse, vUv).rgb, 1.0);
	#include <colorspace_fragment>
}`
};

/**
 * @param {import('three').WebGLRenderer} renderer
 * @param {import('three').Scene} scene
 * @param {import('three').Camera} camera
 */
export function createPost(renderer, scene, camera) {
	const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
	const composer = new EffectComposer(renderer, target);
	// Only the scene needs smoothing; the pass between draws a full-frame quad.
	composer.renderTarget2.samples = 0;
	const first = new ShaderPass(across);
	const second = new ShaderPass(down);
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(first);
	composer.addPass(second);
	const amount = { value: 0 };
	first.uniforms.uAmount = second.uniforms.uAmount = amount;

	return {
		/** How much of the look is on, 0 (the page) to 1 (the Garden). */
		amount,

		/** @param {number} width @param {number} height CSS px */
		resize(width, height) {
			composer.setPixelRatio(renderer.getPixelRatio());
			composer.setSize(width, height);
			// Steps of the same length on screen both ways: across, in uv, a height is height / width.
			first.uniforms.uStep.value.set(height / width, 0);
			second.uniforms.uStep.value.set(0, 1);
		},

		/**
		 * Compile the scene's shaders, for the target the scene is drawn into (compiled for the screen,
		 * they would be other programs, compiled again in the frame each is first drawn), off the main
		 * thread where the browser can; resolves once they are ready to draw with.
		 */
		compile() {
			const screen = renderer.getRenderTarget();
			renderer.setRenderTarget(target);
			const ready = renderer.compileAsync(scene, camera);
			renderer.setRenderTarget(screen);
			return ready;
		},

		/**
		 * Draw an object alone into the scene's target, unseen (the next frame's drawing clears it), so
		 * that the GPU builds what it needs to draw it there and then, rather than in the frame it first
		 * shows.
		 * @param {import('three').Object3D} object
		 */
		prime(object) {
			const screen = renderer.getRenderTarget();
			renderer.setRenderTarget(target);
			renderer.render(object, camera);
			renderer.setRenderTarget(screen);
		},

		render() {
			composer.render();
		},

		dispose() {
			composer.dispose();
			first.dispose();
			second.dispose();
			target.dispose();
		}
	};
}
