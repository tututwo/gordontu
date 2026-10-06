import {
	CanvasTexture,
	Color,
	Group,
	Mesh,
	QuadraticBezierCurve3,
	ShaderMaterial,
	Sprite,
	SpriteMaterial,
	SRGBColorSpace,
	TubeGeometry,
	Vector3
} from 'three';

/**
 * The arcs: thin glassy tubes of light blue thrown from beyond the near edge, each a parabola to its
 * cell, drawn from its tail to its head over its flight with a bright drop at the head, then left to
 * linger and fade. A tube in world space, so it thins with distance like the lines on the paper. On
 * the white paper a clear core would vanish and leave two hairline rims, so the water is pale blue
 * all through, bluer toward its rims, with a glint of sky along its top: that reads as water in glass.
 */

const CORE = new Color('#d5e7f8');
const RIM = new Color('#6b9bd6');
const RADIUS = 1.9;

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal, vView;
void main() {
	vUv = uv;
	vec4 mv = modelViewMatrix * vec4(position, 1.0);
	vNormal = normalMatrix * normal;
	vView = -mv.xyz;
	gl_Position = projectionMatrix * mv;
}`;

const fragmentShader = /* glsl */ `
uniform float uHead, uAlpha;
uniform vec3 uCore, uRim;
varying vec2 vUv;
varying vec3 vNormal, vView;
void main() {
	if (vUv.x > uHead) discard;
	vec3 n = normalize(vNormal);
	vec3 v = normalize(vView);
	// Pale where it faces us, bluer and denser toward its rims; a glint where it catches the sky
	// (from above, a little to the left and behind the viewer).
	float rim = smoothstep(0.1, 0.85, 1.0 - abs(dot(n, v)));
	float glint = pow(max(dot(reflect(-normalize(vec3(-0.35, 0.85, 0.4)), n), v), 0.0), 24.0);
	vec3 rgb = mix(mix(uCore, uRim, rim), vec3(1.0), glint * 0.8);
	float a = uAlpha * max(mix(0.55, 0.95, rim), glint) * smoothstep(uHead, uHead - 0.03, vUv.x);
	gl_FragColor = vec4(rgb, a);
	#include <colorspace_fragment>
}`;

/** The drop at an arc's head: a small bright bead with a soft edge. */
function dropTexture() {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 32;
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
	const g = ctx.createRadialGradient(13, 12, 1, 16, 16, 15);
	g.addColorStop(0, 'rgba(255,255,255,1)');
	g.addColorStop(0.45, 'rgba(205,230,255,0.95)');
	g.addColorStop(0.8, 'rgba(158,200,240,0.5)');
	g.addColorStop(1, 'rgba(158,200,240,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 32, 32);
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	return texture;
}

/** @typedef {{ head: { value: number }, alpha: { value: number }, curve: QuadraticBezierCurve3, mesh: Mesh, drop: Sprite }} Arc */

export function createArcs() {
	const group = new Group();
	const bead = dropTexture();
	const dropMaterial = new SpriteMaterial({ map: bead, transparent: true, depthWrite: false });
	/** @type {Arc[]} */
	const arcs = [];
	const point = new Vector3();

	return {
		group,
		arcs,

		/**
		 * An arc from `from` to `to`, rising to about a quarter of the distance between them; drawn as
		 * `head` goes 0 to 1, gone as `alpha` goes to 0. `unit` sizes the tube and its drop: the cell's
		 * side over a desktop's.
		 * @param {Vector3} from @param {Vector3} to @param {number} unit
		 */
		throw(from, to, unit) {
			// ponytail: a tube and a material per arc, kept till dispose (28 per growth, which happens once
			// per visit); pool them if the Garden ever regrows while open.
			const apex = from.distanceTo(to) * 0.26 + 90 * unit;
			const control = from.clone().lerp(to, 0.5).setY(2 * apex);
			const curve = new QuadraticBezierCurve3(from.clone(), control, to.clone());
			const material = new ShaderMaterial({
				vertexShader,
				fragmentShader,
				uniforms: { uHead: { value: 0 }, uAlpha: { value: 1 }, uCore: { value: CORE }, uRim: { value: RIM } },
				transparent: true,
				depthWrite: false
			});
			const mesh = new Mesh(new TubeGeometry(curve, 48, RADIUS * unit, 8, false), material);
			mesh.frustumCulled = false;
			const drop = new Sprite(dropMaterial);
			drop.scale.setScalar(9 * unit);
			group.add(mesh, drop);
			/** @type {Arc} */
			const arc = { head: { value: 0 }, alpha: { value: 1 }, curve, mesh, drop };
			arcs.push(arc);
			return arc;
		},

		/** Pose every arc for this frame. */
		update() {
			for (const { head, alpha, curve, mesh, drop } of arcs) {
				const material = /** @type {ShaderMaterial} */ (mesh.material);
				material.uniforms.uHead.value = head.value;
				material.uniforms.uAlpha.value = alpha.value;
				mesh.visible = head.value > 0 && alpha.value > 0;
				// In flight, and not fading: an arc cut short by the leave takes its drop with it.
				drop.visible = head.value > 0 && head.value < 1 && alpha.value >= 1;
				if (drop.visible) drop.position.copy(curve.getPoint(head.value, point));
			}
		},

		/** All arcs gone at once (the still state). */
		clear() {
			for (const arc of arcs) {
				arc.head.value = 0;
				arc.alpha.value = 0;
			}
		},

		dispose() {
			for (const { mesh } of arcs) {
				mesh.geometry.dispose();
				/** @type {ShaderMaterial} */ (mesh.material).dispose();
			}
			// The drops' quad is three's own, shared by every Sprite and never disposed: each renderer that
			// draws one listens on it, so it would hold the Garden's renderer and canvas for good. Disposing
			// it lets go of them (a renderer that draws a Sprite again only uploads it again).
			arcs[0]?.drop.geometry.dispose();
			dropMaterial.dispose();
			bead.dispose();
		}
	};
}
