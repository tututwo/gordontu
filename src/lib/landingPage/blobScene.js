import * as THREE from 'three';
import { createDrift } from './blobDrift.js';

/**
 * @typedef {object} BlobSeed
 * @property {string} color  `#rrggbb`, treated as a display (sRGB) value
 * @property {[number, number]} home  x, y as viewport fractions, origin bottom-left
 * @property {number} radius  fraction of min(width, height)
 */

const vertexShader = /* glsl */ `
	void main() {
		gl_Position = vec4(position, 1.0);
	}
`;

/** @param {number} count */
const fragmentShader = (count) => /* glsl */ `
	precision highp float;
	#define COUNT ${count}

	uniform vec3 uBlobs[COUNT];    // x, y, radius in device px, origin bottom-left
	uniform vec3 uColors[COUNT];   // sRGB 0..1, written out as-is
	uniform vec3 uStretch[COUNT];  // xy: unit velocity direction, z: area-preserving stretch
	uniform vec2 uWave[2];         // slowly rotating wave vectors shared by every outline
	uniform vec2 uPhase[COUNT];    // per-blob phase of each wave, advanced by JS
	uniform float uFalloff;        // super-Gaussian steepness: bigger = tighter core, shorter rim
	uniform float uGrain;          // film-grain amplitude on the alpha, strongest across the rim
	uniform float uGrainSize;      // stipple cell in device px, so grain reads the same on 1x and 3x

	// Sin-free hash (Dave Hoskins): no lattice or precision streaks on mobile GPUs.
	float hash12(vec2 p) {
		vec3 p3 = fract(vec3(p.xyx) * 0.1031);
		p3 += dot(p3, p3.yzx + 33.33);
		return fract((p3.x + p3.y) * p3.z);
	}

	void main() {
		vec2 p = gl_FragCoord.xy;
		// Screen-fixed grain: the paper's tooth stays put while the paint drifts across it.
		float n = hash12(floor(p / max(uGrainSize, 1.0)));
		vec4 acc = vec4(0.0);   // premultiplied, painted back to front

		for (int i = 0; i < COUNT; i++) {
			// Blob-local space, radius == 1. Two plane waves sampled on the unit circle act as a
			// low-frequency noise of (angle, time): a ±8% radius wobble, no atan needed.
			vec2 q = (p - uBlobs[i].xy) / max(uBlobs[i].z, 1.0);
			// Longer along the velocity, thinner across it, same area: a thrown blob smears like a
			// paint drop, while the tiny cruise stretch stays visually round.
			float s = 1.0 + uStretch[i].z;
			q = q * s + uStretch[i].xy * dot(q, uStretch[i].xy) * (1.0 / s - s);
			float w = 0.6 * sin(dot(uWave[0], q) + uPhase[i].x) + 0.4 * sin(dot(uWave[1], q) + uPhase[i].y);
			float d2 = dot(q, q) * (1.0 + 0.32 * w);
			// Flat-topped super-Gaussian exp(-k d^6), fitted to the reference: solid to ~0.45r, half
			// alpha at ~0.66r, airbrushed out to ~0 at r.
			float g = exp(-uFalloff * d2 * d2 * d2);
			// Film grain on the alpha: ~±4% in the core, ~±7% across the rim, vanishing with g so the
			// paper around a blob stays clean.
			float a = g * (1.0 + (n - 0.5) * uGrain * (1.2 - g));
			// Plain "over": a later blob paints on top of an earlier one, nothing bridges or bulges.
			acc = acc * (1.0 - a) + vec4(uColors[i] * a, a);
		}

		gl_FragColor = acc;
	}
`;

/** @param {string} hex `#rrggbb` → sRGB components, no colour management */
function srgb(hex) {
	const n = parseInt(hex.slice(1), 16);
	return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/**
 * The three.js half of the landing Blob field: one full-screen quad, one fragment shader, and a
 * CPU drift that feeds blob centres in as uniforms. Plain object, no Svelte reactivity.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ blobs: BlobSeed[], reduced: () => boolean, onready: () => void }} options
 *   `reduced` is sampled every frame; `onready` fires once the first frame is on screen.
 */
export function createBlobScene(canvas, { blobs, reduced, onready }) {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		alpha: true,
		antialias: false,
		powerPreference: 'low-power'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const scene = new THREE.Scene();
	const drift = createDrift(blobs);

	const uniforms = {
		uBlobs: { value: blobs.map(() => new THREE.Vector3()) },
		uColors: { value: blobs.map((blob) => srgb(blob.color)) },
		uStretch: { value: blobs.map(() => new THREE.Vector3()) },
		uWave: { value: [new THREE.Vector2(), new THREE.Vector2()] },
		uPhase: { value: blobs.map(() => new THREE.Vector2()) },
		uFalloff: { value: 8.3 },
		uGrain: { value: 0.62 },
		uGrainSize: { value: 1 }
	};
	const geometry = new THREE.PlaneGeometry(2, 2);
	const material = new THREE.ShaderMaterial({
		uniforms,
		vertexShader,
		fragmentShader: fragmentShader(blobs.length),
		// The shader writes premultiplied colour straight into the transparent buffer; any blend op
		// would multiply by alpha a second time and muddy the feathered edges.
		blending: THREE.NoBlending,
		depthTest: false,
		depthWrite: false
	});
	scene.add(new THREE.Mesh(geometry, material));

	let frame = 0;
	let last = 0;
	let ready = false;
	let disposed = false;
	let px = NaN;
	let py = NaN;
	let cursor = '';
	/** @type {number | undefined} */
	let pointerId;

	/** @param {string} next */
	function setCursor(next) {
		if (next !== cursor) document.body.style.cursor = cursor = next;
	}

	/** @param {PointerEvent} event @returns {[number, number]} */
	function point(event) {
		return [event.clientX, canvas.clientHeight - event.clientY];
	}

	/** @param {PointerEvent} event */
	function onpointerdown(event) {
		if (reduced() || event.button !== 0 || pointerId !== undefined) return;
		const target = event.target instanceof Element ? event.target : null;
		if (target?.closest('a, button')) return;
		const [x, y] = point(event);
		const i = event.pointerType === 'touch' ? -1 : drift.hit(x, y);
		if (i < 0) {
			drift.poke(x, y);
			return;
		}
		drift.grab(i, x, y);
		pointerId = event.pointerId;
		event.preventDefault();
		try {
			target?.setPointerCapture(event.pointerId);
		} catch {
			// The pointer may already have ended before capture is established.
		}
	}

	/** @param {PointerEvent} event */
	function onpointermove(event) {
		if (event.pointerType === 'touch') return;
		[px, py] = point(event);
		if (event.pointerId === pointerId) drift.move(px, py);
	}

	/** @param {PointerEvent} event */
	function onpointerup(event) {
		if (event.pointerId !== pointerId) return;
		pointerId = undefined;
		drift.release();
	}

	/** @param {number} now */
	function render(now) {
		const dpr = renderer.getPixelRatio();
		const t = now / 1000;
		// Per-frame constants hoisted off the fragment shader: the outline waves rotate slowly and
		// each blob's phase drifts, which is what keeps the wobble alive without a time uniform.
		uniforms.uWave.value[0].set(Math.cos(t * 0.11), Math.sin(t * 0.11)).multiplyScalar(2.6);
		uniforms.uWave.value[1].set(Math.cos(1.9 - t * 0.07), Math.sin(1.9 - t * 0.07)).multiplyScalar(4.1);
		drift.blobs.forEach((blob, i) => {
			uniforms.uBlobs.value[i].set(blob.x * dpr, blob.y * dpr, blob.r * dpr);
			const speed = Math.hypot(blob.sx, blob.sy);
			const stretch = Math.min(0.35, speed / (10 * blob.r));
			uniforms.uStretch.value[i].set(
				speed ? blob.sx / speed : 0,
				speed ? blob.sy / speed : 0,
				stretch
			);
			uniforms.uPhase.value[i].set(i * 2.1 + t * 0.23, -i * 1.7 - t * 0.17);
		});
		renderer.render(scene, camera);
		if (!ready) {
			ready = true;
			onready();
		}
	}

	/** @param {number} now */
	function tick(now) {
		frame = 0;
		if (disposed) return;
		const dt = last ? (now - last) / 1000 : 0;
		last = now;
		drift.step(dt);
		setCursor(reduced() ? '' : pointerId !== undefined ? 'grabbing' : drift.hit(px, py) < 0 ? '' : 'grab');
		render(now);
		if (!reduced()) frame = requestAnimationFrame(tick);
	}

	function wake() {
		if (disposed || frame) return;
		last = 0;
		if (reduced()) render(performance.now());
		else frame = requestAnimationFrame(tick);
	}

	function resize() {
		const width = canvas.clientWidth || 1;
		const height = canvas.clientHeight || 1;
		// Re-read the ratio: dragging the window between 1x and 2x displays changes it without a
		// CSS-size change.
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(width, height, false);
		uniforms.uGrainSize.value = Math.max(1, Math.round(renderer.getPixelRatio()));
		drift.resize(width, height);
		// setSize clears the buffer after this frame's tick already drew, so paint again now rather
		// than show one blank frame; a stopped loop (reduced motion) is simply woken.
		if (frame) render(performance.now());
		else wake();
	}

	let resizePending = 0;
	const observer = new ResizeObserver(() => {
		if (!resizePending) resizePending = requestAnimationFrame(() => ((resizePending = 0), resize()));
	});
	try {
		// Fires on device-pixel-ratio changes too, where supported.
		observer.observe(canvas, { box: 'device-pixel-content-box' });
	} catch {
		observer.observe(canvas);
	}
	// A restored context has an empty buffer; with reduced motion nothing else would repaint it.
	canvas.addEventListener('webglcontextrestored', wake);
	window.addEventListener('pointerdown', onpointerdown);
	window.addEventListener('pointermove', onpointermove);
	window.addEventListener('pointerup', onpointerup);
	window.addEventListener('pointercancel', onpointerup);
	window.addEventListener('lostpointercapture', onpointerup);
	resize();

	return {
		/** Restart rendering, e.g. after the reduced-motion preference flips. */
		wake,
		dispose() {
			disposed = true;
			observer.disconnect();
			canvas.removeEventListener('webglcontextrestored', wake);
			window.removeEventListener('pointerdown', onpointerdown);
			window.removeEventListener('pointermove', onpointermove);
			window.removeEventListener('pointerup', onpointerup);
			window.removeEventListener('pointercancel', onpointerup);
			window.removeEventListener('lostpointercapture', onpointerup);
			setCursor('');
			if (frame) cancelAnimationFrame(frame);
			if (resizePending) cancelAnimationFrame(resizePending);
			geometry.dispose();
			material.dispose();
			renderer.dispose();
			// Release the GL context now instead of when the detached canvas is collected.
			renderer.forceContextLoss();
		}
	};
}
