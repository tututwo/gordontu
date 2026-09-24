import { Group } from 'three';
import { Spring } from '../spring.js';
import { boxGlsl, lineGlsl, smoothstep } from './stage.js';

/**
 * interactive maps: a folded map. At rest it is a closed tri-fold, one plain portrait cuboid. Lit,
 * it unfolds as a Z-fold into three panels zigzagging like a folding screen, turning to face you as
 * it opens; then topographic contours wipe in left to right on the printed side — isolines of one
 * noise field laid across all three panels, so each line carries on over the folds — and the field
 * keeps flowing left to right until the map folds again.
 */

/**
 * Panel width, height, thickness folded (opening, the panels thin to sheets, each edge one line);
 * open zigzag angle; turn of the whole map about the vertical, folded and open. Folded it is turned
 * away enough to show a side; opening, it turns to face you square, the one angle where the zigzag
 * reads as the familiar folded-map silhouette.
 */
const W = 0.62;
const H = 1;
const T = 0.05;
const BETA = (28 * Math.PI) / 180;
const YAW_FOLDED = (22 * Math.PI) / 180;
const YAW_OPEN = (45 * Math.PI) / 180;

/**
 * Reference px per unit, folded and open: folded it stands about as tall as the old icons did;
 * open it eases down so the spread sits inside the lit brackets (82 px) instead of touching the
 * label's bar.
 */
const SCALE_FOLDED = 64;
const SCALE_OPEN = 54;

/**
 * The fold completes over the first 4% of the spring's travel home, before its slow tail, so the
 * closing map lands flat and is drawn as one block rather than three panels a pixel apart.
 */
const TAIL = 0.04;
/** Contours start once the panels are mostly open, and wipe back out before the fold closes. */
const WIPE_FROM = 0.75;
/** Flow speed of the field, map units per ms (about 3–4 px a second on screen). */
const FLOW = 0.00018;

/** Open this far, the panels have parted, and thinned to sheets. */
const PARTED = 0.1;
const SHEET = 0.5;

const contourFragment = /* glsl */ `
uniform vec3 uInk;
uniform float uPanel;
uniform float uTime;
uniform float uWipe;
varying vec2 vUv;
${lineGlsl}
${boxGlsl}

vec2 hash(vec2 p) {
	p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Gradient noise, roughly -0.7..0.7.
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
		mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + 1.0), f - 1.0), u.x),
		u.y
	);
}

void main() {
	float edge = boxInk();

	// Paper space: x runs on from panel to panel, so a contour continues over each fold.
	vec2 paper = vec2((uPanel + vUv.x) * ${W.toFixed(3)}, vUv.y * ${H.toFixed(3)});
	// One octave (more makes pinhead rings) over a gentle slope, so the lines are long wavy bands
	// with the odd closed ring; the whole field flows +x.
	float height = noise((paper - vec2(uTime * ${FLOW}, 0.0)) * 1.45) + 0.7 * paper.y;
	float level = height * 5.0;
	// Lines as wide and as dark as the edges.
	float lines = centred(abs(fract(level - 0.5) - 0.5) / length(vec2(dFdx(level), dFdy(level))));

	// A neatline margin inside every panel border keeps contours off the edges, and the reveal is a
	// left-to-right wipe across the paper rather than a fade.
	vec2 room = min(vUv, 1.0 - vUv) * vec2(${W.toFixed(3)}, ${H.toFixed(3)});
	float margin = step(0.07, min(room.x, room.y));
	float wipe = step(paper.x, uWipe * ${(3 * W + 0.1).toFixed(3)});

	// The printed side is -x.
	float printed = step(vNormal.x, -0.5);
	float ink = max(edge, lines * margin * wipe * printed);
	gl_FragColor = vec4(mix(vec3(1.0), uInk, ink), 1.0);
}`;

/** @param {import('./stage.js').Stage} stage @returns {import('./stage.js').Icon} */
export function createMapIcon(stage) {
	const map = new Group();
	stage.pivot.add(map);

	const printed = [0, 1, 2].map((panel) =>
		stage.material(contourFragment, {
			uPanel: { value: panel },
			uTime: { value: 0 },
			uWipe: { value: 0 }
		})
	);
	// Panel k hangs from hinge k at its -z end and holds hinge k + 1 at its +z end; each side of a
	// hinge draws half its line.
	const glued = printed.map((face, k) => {
		const [minus, plus] = /** @type {import('three').Vector3[]} */ (face.uniforms.uGlued.value);
		minus.z = k > 0 ? 1 : 0;
		plus.z = k < 2 ? 1 : 0;
		return [minus, plus];
	});
	const panels = printed.map((face) => {
		const mesh = stage.box([T, H, W], [0, 0, 0], face);
		map.add(mesh);
		return mesh;
	});
	// Folded, the three panels are drawn as the one block they look like: their seams would sit a
	// pixel apart and smear into a dark bar.
	const block = stage.box([3 * T, H, W]);
	map.add(block);

	const open = new Spring(0);
	let time = 0;

	/**
	 * Z-fold chain: panel k hangs from hinge k and points along yaw a_k. Folded (p = 0) the
	 * directions are 0, π, 0 so the panels lie on top of each other, stacked back by a thickness
	 * each; open (p = 1) they zigzag +β, -β, +β. The chain is kept centred as it grows.
	 * @param {number} p
	 */
	function pose(p) {
		const angles = [BETA * p, Math.PI * (1 - p) - BETA * p, BETA * p];
		const hinges = [[0, 0]];
		for (const a of angles) {
			const [x, z] = hinges[hinges.length - 1];
			hinges.push([x + W * Math.sin(a), z + W * Math.cos(a)]);
		}
		const mid = [(hinges[0][0] + hinges[3][0]) / 2, (hinges[0][1] + hinges[3][1]) / 2];
		map.rotation.y = YAW_FOLDED + (YAW_OPEN - YAW_FOLDED) * p;
		stage.pivot.scale.setScalar(SCALE_FOLDED + (SCALE_OPEN - SCALE_FOLDED) * p);
		const thick = Math.max(1e-4, T * (1 - smoothstep(0, SHEET, p)));
		// Just folded, the panels lie flat on one another (0 on 1's +x, 1's -x on 2's -x, the middle
		// one turned round) and read as the block: no seams between them.
		const pressed = 2 * (1 - smoothstep(0, PARTED, p));
		glued[0][1].x = glued[1][0].x = glued[1][1].x = glued[2][0].x = pressed;
		panels.forEach((mesh, k) => {
			const a = angles[k];
			const stack = k * thick * Math.max(0, 1 - p);
			mesh.scale.x = thick;
			mesh.position.set(
				hinges[k][0] + (W / 2) * Math.sin(a) + stack - mid[0],
				0,
				hinges[k][1] + (W / 2) * Math.cos(a) - mid[1]
			);
			mesh.rotation.y = a;
			mesh.visible = p > 0;
		});
		block.position.set(T - mid[0], 0, W / 2 - mid[1]);
		block.visible = p <= 0;
	}

	return {
		frame(dt, { lit, reduced }) {
			const goal = lit ? 1 : 0;
			if (open.target !== goal) open.to(goal);
			if (reduced) open.set(goal);
			const moving = open.advance(dt);
			const wipe = smoothstep(WIPE_FROM, 1, open.value);
			// Reduced motion: one still, open frame (the field as it stands at 1.2 s).
			if (reduced) time = 1200;
			else if (wipe > 0) time += dt;
			pose(Math.max(0, (open.value - TAIL) / (1 - TAIL)));
			for (const face of printed) {
				face.uniforms.uTime.value = time;
				face.uniforms.uWipe.value = wipe;
			}
			return moving || (lit && !reduced);
		}
	};
}
