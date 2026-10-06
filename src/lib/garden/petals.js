import { BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three';

/**
 * Petals and drops: one pool of points whose flight the vertex shader works out from a birth time, a
 * start and a velocity, so the burst where an arc lands costs the CPU a few attribute writes and nothing per
 * frame. A drop is a small outlined bead of water, a petal a small spinning oval in one of the plant's
 * colours; both come to rest on the paper and fade there within a couple of seconds, so the sheet
 * stays clear. At rest a petal drifts down now and then, swaying as it falls.
 */

const POOL = 640;
/** Gravity, in a desktop's world units (CSS px) a second squared; like every size here, scaled by the cell's size (`setUnit`). */
const GRAVITY = 900;

const vertexShader = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aVel;
attribute vec3 aColor;
attribute float aBirth, aSize, aKind, aSpin;
uniform float uTime, uScale, uUnit;
varying vec3 vColor;
varying float vKind, vAlpha, vAngle;

void main() {
	float t = uTime - aBirth;
	vColor = aColor;
	vKind = aKind;
	if (aBirth < 0.0 || t < 0.0) {
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		gl_PointSize = 0.0;
		vAlpha = 0.0;
		vAngle = 0.0;
		return;
	}
	// Drops fall under gravity; petals flutter down at a third of it; a drifting petal (kind 2) sinks at its own pace.
	float g = aKind == 2.0 ? 0.0 : ${GRAVITY.toFixed(1)} * uUnit * (aKind == 1.0 ? 0.35 : 1.0);
	float land = g > 0.0 ? (aVel.y + sqrt(max(aVel.y * aVel.y + 2.0 * g * aStart.y, 0.0))) / g : aStart.y / max(-aVel.y, 1e-3);
	float tt = min(t, land);
	vec3 p = aStart + aVel * tt - vec3(0.0, 0.5 * g * tt * tt, 0.0);
	if (aKind == 2.0) p.x += sin(tt * 2.2 + aSpin) * 14.0 * uUnit;
	if (t >= land) p.y = 4.0 * uUnit;
	float rest = t - land;
	float stay = 0.8 + fract(aSpin * 7.31) * 0.8;
	vAlpha = 1.0 - smoothstep(stay, stay + 0.6, rest);
	vAngle = aSpin * tt;
	vec4 mv = modelViewMatrix * vec4(p, 1.0);
	gl_PointSize = aSize * uScale / -mv.z;
	gl_Position = projectionMatrix * mv;
}`;

const fragmentShader = /* glsl */ `
uniform float uFade;
varying vec3 vColor;
varying float vKind, vAlpha, vAngle;

void main() {
	vec2 d = gl_PointCoord - 0.5;
	float c = cos(vAngle), s = sin(vAngle);
	d = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
	// Both are drawn like the Plants, in a thin ink outline: a drop is a round bead of pale water, a
	// petal a little oval in one of its flower's colours.
	float e = vKind == 0.0 ? dot(d, d) / 0.16 : d.x * d.x / 0.2 + d.y * d.y / 0.12;
	float rim = smoothstep(0.6, 0.72, e);
	vec3 rgb = mix(vColor, vec3(0.23, 0.17, 0.14), rim * 0.75);
	float a = (1.0 - smoothstep(0.9, 1.0, e)) * (vKind == 0.0 ? mix(0.65, 1.0, rim) : 1.0);
	if (a < 0.02) discard;
	gl_FragColor = vec4(rgb, a * vAlpha * uFade);
	#include <colorspace_fragment>
}`;

export function createPetals() {
	const geometry = new BufferGeometry();
	const start = new BufferAttribute(new Float32Array(POOL * 3), 3);
	const vel = new BufferAttribute(new Float32Array(POOL * 3), 3);
	const color = new BufferAttribute(new Float32Array(POOL * 3), 3);
	const birth = new BufferAttribute(new Float32Array(POOL).fill(-1), 1);
	const size = new BufferAttribute(new Float32Array(POOL), 1);
	const kind = new BufferAttribute(new Float32Array(POOL), 1);
	const spin = new BufferAttribute(new Float32Array(POOL), 1);
	// `position` is what three culls and sorts by; the shader places each point itself.
	geometry.setAttribute('position', start);
	geometry.setAttribute('aStart', start);
	geometry.setAttribute('aVel', vel);
	geometry.setAttribute('aColor', color);
	geometry.setAttribute('aBirth', birth);
	geometry.setAttribute('aSize', size);
	geometry.setAttribute('aKind', kind);
	geometry.setAttribute('aSpin', spin);
	const material = new ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uUnit: { value: 1 }, uFade: { value: 1 } },
		transparent: true,
		depthWrite: false
	});
	const points = new Points(geometry, material);
	points.frustumCulled = false;
	let next = 0;
	let u = 1;
	const tint = new Color();

	/**
	 * @param {number} x @param {number} y @param {number} z
	 * @param {number} vx @param {number} vy @param {number} vz
	 * @param {string} hex @param {number} at seconds @param {number} px @param {number} what 0 drop, 1 petal, 2 drifting petal
	 */
	function emit(x, y, z, vx, vy, vz, hex, at, px, what) {
		const i = next;
		next = (next + 1) % POOL;
		start.setXYZ(i, x, y, z);
		vel.setXYZ(i, vx, vy, vz);
		tint.set(hex);
		color.setXYZ(i, tint.r, tint.g, tint.b);
		birth.setX(i, at);
		size.setX(i, px);
		kind.setX(i, what);
		spin.setX(i, (Math.random() - 0.5) * 12);
		for (const attribute of [start, vel, color, birth, size, kind, spin]) attribute.needsUpdate = true;
	}

	return {
		points,

		/** How much of every petal and drop shows, 0 to 1 (the leave fades them all at once). */
		fade: material.uniforms.uFade,

		/** How many device px a point one world unit wide covers one world unit from the camera. @param {number} scale */
		setScale(scale) {
			material.uniforms.uScale.value = scale;
		},

		/** How big things are: the cell's side over a desktop's (135 world units). @param {number} unit */
		setUnit(unit) {
			u = material.uniforms.uUnit.value = unit;
		},

		/** @param {number} seconds */
		update(seconds) {
			material.uniforms.uTime.value = seconds;
		},

		/**
		 * The burst where an arc lands, at a cell's centre: petals in the plant's colours and a few drops, up and out.
		 * @param {number} x @param {number} z @param {string[]} colors @param {number} at seconds
		 */
		burst(x, z, colors, at) {
			for (let i = 0; i < 8; i++) {
				const a = Math.random() * Math.PI * 2;
				const r = (40 + Math.random() * 80) * u;
				emit(x, 4 * u, z, Math.cos(a) * r, (170 + Math.random() * 140) * u, Math.sin(a) * r, colors[i % colors.length], at, (13 + Math.random() * 6) * u, 1);
			}
			for (let i = 0; i < 6; i++) {
				const a = Math.random() * Math.PI * 2;
				const r = (30 + Math.random() * 90) * u;
				emit(x, 4 * u, z, Math.cos(a) * r, (200 + Math.random() * 180) * u, Math.sin(a) * r, '#f7fbff', at, (10 + Math.random() * 6) * u, 0);
			}
		},

		/**
		 * One petal let go from above a plant, drifting down.
		 * @param {number} x @param {number} z @param {string} color @param {number} at seconds
		 */
		drift(x, z, color, at) {
			emit(
				x + (Math.random() - 0.5) * 60 * u,
				(180 + Math.random() * 80) * u,
				z,
				(Math.random() - 0.5) * 20 * u,
				(-45 - Math.random() * 25) * u,
				(Math.random() - 0.5) * 20 * u,
				color,
				at,
				(11 + Math.random() * 5) * u,
				2
			);
		},


		/** No petals at all. */
		clear() {
			birth.array.fill(-1);
			birth.needsUpdate = true;
		},

		dispose() {
			geometry.dispose();
			material.dispose();
		}
	};
}
