import { BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector2 } from 'three';
import { Spring } from '../spring.js';

/**
 * web tools: a responsive browser window. At rest it is a blank landscape window standing upright,
 * a title bar across its top. Lit, two cards push out through the screen, then the window glides
 * narrower and taller — desktop to phone — and as it crosses the breakpoint the layout wraps: the
 * second card lifts clear, both cards spring to their new slots (a row becomes a column), and it
 * sets back down. While lit it breathes between the two widths every few seconds: the container
 * glides rigidly, the cards fill whatever room it has, and only the wrap snaps. On its way to phone
 * the window becomes one: its corners round off, the title bar gives way to a screen with an island
 * at its top and a home indicator at its foot.
 */

/**
 * Window: width (along the screen, z), height, card margin, corner radius, and the band at the top
 * and foot of the screen the cards keep clear of (a title bar; an island, a home indicator).
 */
const DESKTOP = { w: 0.9, h: 0.72, margin: 0.1, radius: 0.03, head: 0.17, foot: 0 };
const PHONE = { w: 0.47, h: 0.96, margin: 0.07, radius: 0.08, head: 0.13, foot: 0.12 };
const DEPTH = 0.08;
/** Cards: thickness; how far they stand proud of the screen lit, and sit behind it hidden. */
const CARD = 0.06;
const PROUD = 0.07;
const SUNK = -0.04;
/** While the layout wraps, the second card lifts further than a card's thickness to pass in front. */
const LIFT = 0.1;
/** Gaps between the cards in a row and in a column. */
const ROW_GAP = 0.12;
const COLUMN_GAP = 0.1;
/** The breakpoint in window width, with a little hysteresis so it never double-snaps. */
const BREAK = 0.68;
const HYSTERESIS = 0.02;

/** Reference px per unit: the window stands about as tall as the other icons, desktop or phone. */
const SCALE = 58;

/** @param {number} x */
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** @param {number} x */
const easeSine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);

/**
 * How narrow the window is (0 desktop, 1 phone) at `ms` since it lit up: a first squeeze once the
 * cards are out, then hold phone, widen, hold desktop, narrow — one wrap every 2.5 s.
 * @param {number} ms
 */
function squeezeAt(ms) {
	if (ms < 150) return 0;
	if (ms < 700) return easeInOut((ms - 150) / 550);
	const u = (ms - 700) % 5000;
	if (u < 1600) return 1;
	if (u < 2500) return 1 - easeSine((u - 1600) / 900);
	if (u < 4100) return 0;
	return easeSine((u - 4100) / 900);
}

/**
 * The two card slots, [centre y, centre z, height, width], filling the window's content box: a row
 * when there is room, a column when not. Fluid, so a slot can never hang off the window.
 * @param {number} w @param {number} h @param {number} margin @param {number} head @param {number} foot
 * @param {boolean} column
 */
function layout(w, h, margin, head, foot, column) {
	const top = h / 2 - head - margin;
	const bottom = -h / 2 + foot + margin;
	const left = -w / 2 + margin;
	const right = w / 2 - margin;
	if (column) {
		const cell = (top - bottom - COLUMN_GAP) / 2;
		return [
			[top - cell / 2, 0, cell, right - left],
			[bottom + cell / 2, 0, cell, right - left]
		];
	}
	const cell = (right - left - ROW_GAP) / 2;
	return [
		[(top + bottom) / 2, left + cell / 2, top - bottom, cell],
		[(top + bottom) / 2, right - cell / 2, top - bottom, cell]
	];
}

/**
 * The window as one slab: a rounded rectangle in the screen's plane (z along it, y up), extruded
 * through its depth (x). Built once from unit parts — each outline vertex knows its corner and its
 * direction round that corner — and sized in the vertex shader, so it can change width, height and
 * corner radius every frame and its corners stay round.
 */
function slabGeometry() {
	const SEGMENTS = 8;
	/** @type {[number, number, number, number][]} corner z, corner y, direction z, direction y */
	const ring = [];
	for (const [cz, cy, from] of [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]]) {
		for (let k = 0; k <= SEGMENTS; k++) {
			const a = ((from + k / SEGMENTS) * Math.PI) / 2;
			ring.push([cz, cy, Math.cos(a), Math.sin(a)]);
		}
	}
	/** @type {number[]} */
	const corner = [];
	/** @type {number[]} */
	const dir = [];
	/** @type {number[]} */
	const side = [];
	/** @type {number[]} */
	const wall = [];
	/** @param {number[]} v @param {number} x @param {number} w */
	const vertex = (v, x, w) => {
		corner.push(v[0], v[1]);
		dir.push(v[2], v[3]);
		side.push(x);
		wall.push(w);
	};
	const centre = [0, 0, 0, 0];
	ring.forEach((v, i) => {
		const next = ring[(i + 1) % ring.length];
		// The screen (-x) and the back (+x), fanned from the centre, each wound to face outwards.
		vertex(centre, -1, 0), vertex(v, -1, 0), vertex(next, -1, 0);
		vertex(centre, 1, 0), vertex(next, 1, 0), vertex(v, 1, 0);
		// The wall between them.
		vertex(v, -1, 1), vertex(v, 1, 1), vertex(next, -1, 1);
		vertex(next, -1, 1), vertex(v, 1, 1), vertex(next, 1, 1);
	});
	const geometry = new BufferGeometry();
	// three draws by `position`; where each vertex really goes is worked out in the shader.
	geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(side.length * 3), 3));
	geometry.setAttribute('aCorner', new Float32BufferAttribute(corner, 2));
	geometry.setAttribute('aDir', new Float32BufferAttribute(dir, 2));
	geometry.setAttribute('aSide', new Float32BufferAttribute(side, 1));
	geometry.setAttribute('aWall', new Float32BufferAttribute(wall, 1));
	return geometry;
}

const slabVertex = /* glsl */ `
uniform vec2 uHalf;
uniform float uRadius;
uniform float uDepth;
attribute vec2 aCorner;
attribute vec2 aDir;
attribute float aSide;
attribute float aWall;
varying vec3 vLocal;
varying float vWall;
varying vec3 vNormal;

void main() {
	vec2 p = aCorner * (uHalf - uRadius) + aDir * uRadius;
	vLocal = vec3(aSide * uDepth * 0.5, p.y, p.x);
	vWall = aWall;
	vNormal = normalize(normalMatrix * (aWall > 0.5 ? vec3(0.0, aDir.y, aDir.x) : vec3(aSide, 0.0, 0.0)));
	gl_Position = projectionMatrix * modelViewMatrix * vec4(vLocal, 1.0);
}`;

const slabFragment = /* glsl */ `
uniform vec3 uInk;
uniform float uStrength;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uDepth;
// How far below the top the title bar ends, and how much of the desktop (1) or phone (0) shows.
uniform float uTitle;
uniform float uDesktop;
varying vec3 vLocal;
varying float vWall;
varying vec3 vNormal;

float roundRect(vec2 p, vec2 size, float r) {
	vec2 q = abs(p) - size + r;
	return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Ink along where d is 0: full there, gone uStrength pixels away, like the boxes' edges.
float line(float d) {
	return 1.0 - clamp(abs(d) / (fwidth(d) * uStrength + 1e-6), 0.0, 1.0);
}

// Ink along a level stroke of the face (a distance with no sign has no derivative on the line, so the
// pixel is measured across it instead).
float stroke(vec2 p, vec2 centre, float reach) {
	float d = length(vec2(max(abs(p.x - centre.x) - reach, 0.0), p.y - centre.y));
	return 1.0 - clamp(d / (fwidth(p.y) * uStrength + 1e-6), 0.0, 1.0);
}

void main() {
	float ink;
	if (vWall > 0.5) {
		// The wall: its rims, and where it turns away round a corner, its outline.
		ink = line(uDepth * 0.5 - abs(vLocal.x));
		float facing = vNormal.z;
		ink = max(ink, 1.0 - clamp(abs(facing) / (fwidth(facing) * uStrength + 1e-6), 0.0, 1.0));
		// The title bar's seam carries on across the side.
		ink = max(ink, uDesktop * line(vLocal.y - (uHalf.y - uTitle)));
	} else {
		vec2 p = vLocal.zy;
		ink = line(roundRect(p, uHalf, uRadius));
		if (vLocal.x < 0.0) {
			// The screen side: a title bar across the top of a window...
			ink = max(ink, uDesktop * line(p.y - (uHalf.y - uTitle)));
			// ...or a phone's screen inside its bezel, an island at its top, a home indicator at its foot.
			float phone = 1.0 - uDesktop;
			float bezel = 0.03;
			ink = max(ink, phone * line(roundRect(p, uHalf - bezel, uRadius - bezel)));
			ink = max(ink, phone * line(roundRect(p - vec2(0.0, uHalf.y - bezel - 0.045), vec2(0.07, 0.02), 0.02)));
			ink = max(ink, phone * stroke(p, vec2(0.0, -uHalf.y + bezel + 0.035), 0.08));
		}
	}
	gl_FragColor = vec4(mix(vec3(1.0), uInk, ink), 1.0);
}`;

/** @param {import('./stage.js').Stage} stage @returns {import('./stage.js').Icon} */
export function createToolsIcon(stage) {
	const tool = new Group();
	// Turned so the screen faces the right-hand side, where the folded map faces the left.
	tool.rotation.y = Math.PI / 2;
	stage.pivot.add(tool);
	stage.pivot.scale.setScalar(SCALE);

	// The screen faces -x (the left visible side); z runs along it, y up. The window sits a hair
	// back in depth, so a card crossing the screen plane never flickers against it.
	const glass = stage.material(
		slabFragment,
		{
			uHalf: { value: new Vector2(DESKTOP.w / 2, DESKTOP.h / 2) },
			uRadius: { value: DESKTOP.radius },
			uDepth: { value: DEPTH },
			uTitle: { value: DESKTOP.head },
			uDesktop: { value: 1 }
		},
		{ vertexShader: slabVertex, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }
	);
	const slab = new Mesh(stage.own(slabGeometry()), glass);
	// Its real size is the shader's, so three cannot cull it by its geometry.
	slab.frustumCulled = false;
	const cards = [stage.box([CARD, 1, 1]), stage.box([CARD, 1, 1])];
	tool.add(slab, ...cards);

	/** 0 desktop → 1 phone; tracks the script while lit (rigid, no overshoot), glides home after. */
	const squeeze = new Spring(0, { tension: 400, friction: 40 });
	/** How far out each card stands, from sunk to proud. */
	const outs = cards.map(() => new Spring(SUNK, { tension: 900, friction: 36 }));
	/** The second card's extra lift while the layout wraps. */
	const lift = new Spring(0, { tension: 1600, friction: 64 });
	/** Each card's slot, on a spring that trails the window a little and clicks in with <1 px overshoot. */
	const slots = cards.map(() => [0, 0, 0, 0].map(() => new Spring(0, { tension: 576, friction: 34 })));
	/** The breakpoint's side, and the layout the cards are actually following (it lags a wrap by 50 ms). */
	let column = false;
	let shown = false;
	let wrapAt = -1;
	let clock = 0;
	let away = 0;
	let wasLit = false;
	let placed = false;

	return {
		frame(dt, { lit, reduced }) {
			if (lit && !wasLit) {
				// Picking up mid-leave: rejoin the first squeeze where the window already is.
				clock = squeeze.value > 0.05 ? 150 + 550 * squeeze.value : 0;
			}
			// Let go mid-glide, the window eases to a stop where it is while the cards sink.
			if (!lit && wasLit) squeeze.to(squeeze.value);
			wasLit = lit;
			if (lit) {
				clock += dt;
				away = 0;
			} else {
				away += dt;
			}

			// Cards out with a quick tick-tick (A, then B); home in the reverse order, without a bounce.
			let moving = false;
			outs.forEach((s, i) => {
				const goal = lit ? (clock >= i * 60 ? PROUD : SUNK) : away >= (1 - i) * 30 ? SUNK : s.target;
				if (s.target !== goal) {
					s.config.friction = goal === PROUD ? 36 : 60;
					s.to(goal);
				}
				if (reduced) s.set(lit ? PROUD : SUNK);
				moving = s.advance(dt) || moving;
			});

			// The window follows the script while lit; unlit, it waits for the cards to sink, then widens.
			const hidden = outs.every((s) => s.value <= 0);
			if (lit) {
				// Lit, it tracks the script closely, a new goal every frame.
				squeeze.from = squeeze.value;
				squeeze.target = squeezeAt(clock);
			} else if (hidden && squeeze.target !== 0) {
				// Unlit, once the cards have sunk it glides home and comes to rest.
				squeeze.to(0);
			}
			if (reduced) squeeze.set(lit ? 1 : 0);
			moving = squeeze.advance(dt) || moving;

			const t = Math.min(1, Math.max(0, squeeze.value));
			/** @param {'w' | 'h' | 'margin' | 'radius' | 'head' | 'foot'} key */
			const size = (key) => DESKTOP[key] + (PHONE[key] - DESKTOP[key]) * t;
			const w = size('w');
			const h = size('h');
			glass.uniforms.uHalf.value.set(w / 2, h / 2);
			glass.uniforms.uRadius.value = size('radius');
			// The title bar's line fades out over the first part of the glide, the phone's parts in over the last.
			glass.uniforms.uDesktop.value = 1 - Math.min(1, Math.max(0, (t - 0.25) / 0.5));

			// Crossing the breakpoint: lift the second card clear, and 50 ms later switch the layout.
			if (column ? w > BREAK + HYSTERESIS : w < BREAK - HYSTERESIS) {
				column = !column;
				if (hidden || reduced) shown = column;
				else {
					lift.to(LIFT);
					wrapAt = clock + 50;
				}
			}
			if (wrapAt >= 0 && (clock >= wrapAt || !lit)) {
				shown = column;
				wrapAt = -1;
			}
			const rects = layout(w, h, size('margin'), size('head'), size('foot'), shown);

			let settled = true;
			cards.forEach((card, i) => {
				slots[i].forEach((s, k) => {
					if (s.target !== rects[i][k]) s.to(rects[i][k]);
					// Hidden cards follow the window exactly; so does everything at first placement.
					if (!placed || reduced || outs[i].value <= SUNK + 0.001) s.set(rects[i][k]);
					moving = s.advance(dt) || moving;
					if (Math.abs(s.value - rects[i][k]) > 0.03) settled = false;
				});
			});
			// Set the lifted card back down once both are in their new slots.
			if (wrapAt < 0 && settled && lift.target !== 0) lift.to(0);
			if (reduced) lift.set(0);
			moving = lift.advance(dt) || moving;

			cards.forEach((card, i) => {
				const [cy, cz, ch, cw] = slots[i].map((s) => s.value);
				const out = outs[i].value + (i === 1 ? lift.value : 0);
				card.scale.set(CARD, Math.max(0.001, ch), Math.max(0.001, cw));
				// Sunk, a card is hidden outright: at 1x the window's depth offset can outreach the gap.
				card.visible = outs[i].value > SUNK + 0.001;
				card.position.set(-DEPTH / 2 - out + CARD / 2, cy, cz);
			});
			placed = true;

			return moving || (lit && !reduced);
		}
	};
}
