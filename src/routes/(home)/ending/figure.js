/**
 * Gordon, head to toe, for the demo's ending: one figure in the line of static/demo/ending/ending_1.png
 * (its model sheet, whose pixels are this file's units), posed by a handful of numbers so that GSAP can
 * carry him from one drawing's pose to the next. `draw(pose)` gives the paths to paint, back to front.
 * The parts that turn with him are views.js's; the arms and legs are worked out here, in the round.
 */
import { blend, head as headView, LOOKING_UP_NECK, view } from './views.js';

const INK = '#22140f';
const SKIN = '#fbd5b9';
const HAIR = '#301c1b';
const PANTS = '#37241f';
const WHITE = '#fff';
/** The drawing's line, and the glasses' finer one (as ending_1 has them), and an eye's dot. */
const LINE = 4.2;
const RIM = 2.8;
const DOT = 8.4;

/** @typedef {[number, number] | [number, number, number]} Point  the third item is how sharp a corner it is, 0–1 */
/** @typedef {[number, number]} Vec */

const f = (/** @type {number} */ n) => Math.round(n * 10) / 10;

/**
 * A smooth path through points (Catmull–Rom, as cubic Béziers); a point's third item makes it a
 * corner, as sharp as it is.
 * @param {Point[]} points
 * @param {boolean} [closed]
 */
export function curve(points, closed = false) {
	const n = points.length;
	const at = (/** @type {number} */ i) => points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
	let d = `M${f(points[0][0])} ${f(points[0][1])}`;
	for (let i = 0; i < (closed ? n : n - 1); i++) {
		const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
		const k1 = (1 - (p1[2] ?? 0)) / 6;
		const k2 = (1 - (p2[2] ?? 0)) / 6;
		d += `C${f(p1[0] + (p2[0] - p0[0]) * k1)} ${f(p1[1] + (p2[1] - p0[1]) * k1)} ${f(p2[0] - (p3[0] - p1[0]) * k2)} ${f(p2[1] - (p3[1] - p1[1]) * k2)} ${f(p2[0])} ${f(p2[1])}`;
	}
	return closed ? `${d}Z` : d;
}

/** @param {Point[]} points @param {(p: Vec) => Vec} map @returns {Point[]} */
const each = (points, map) => points.map((p) => /** @type {Point} */ ([...map([p[0], p[1]]), p[2] ?? 0]));
/** @param {number} deg */
const rad = (deg) => (deg * Math.PI) / 180;
/** Points turned `deg` (clockwise on screen) about `about`. @param {Point[]} points @param {number} deg @param {Vec} about */
const turn = (points, deg, [cx, cy]) => {
	const c = Math.cos(rad(deg));
	const s = Math.sin(rad(deg));
	return each(points, ([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
/** @param {Point[]} points @param {Vec} by */
const move = (points, [dx, dy]) => each(points, ([x, y]) => [x + dx, y + dy]);
const mirror = (/** @type {Point[]} */ points, axis = 532) => each(points, ([x, y]) => [2 * axis - x, y]);
/** @param {Vec} a @param {Vec} b @param {number} k @returns {Vec} */
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
/** @param {Vec} a @param {Vec} b @param {number} t @returns {Vec} */
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** @param {Vec} v @returns {Vec} */
const unit = ([x, y]) => {
	const l = Math.hypot(x, y) || 1;
	return [x / l, y / l];
};
const dot = (/** @type {Vec} */ a, /** @type {Vec} */ b) => a[0] * b[0] + a[1] * b[1];
/** @param {Point} p @returns {Vec} */
const xy = (p) => [p[0], p[1]];
/** @param {Point | Vec} p @returns {Point} */
const corner = (p) => [p[0], p[1], 1];
const clamp01 = (/** @type {number} */ v) => Math.max(0, Math.min(1, v));

/** The head turns about the top of the neck. @type {Vec} */
const NECK = [533, 402];
/** Seen from this high (degrees of `pitch`), his face is the one drawn from above (views.js). */
export const TOP_PITCH = 46;
/**
 * The arms, fitted to ending_1's: how long the upper arm and the forearm are, the sleeve's width at
 * the shoulder, the elbow and the cuff, how much its cloth bows out, and how round its shoulder is.
 */
export const ARMS = { upper: 157.8, fore: 118, sleeve: [41.4, 60.5, 55.3], puff: 2.5, cap: 13.4 };
const THIGH = 202;
const SHIN = 202;
/** A shoe's sole, as a foot lifted behind him shows it, from the heel (at the ankle) down to the toe. @type {Point[]} */
const SOLE = [
	[-30, -4, 1],
	[-38, 10],
	[-42, 35],
	[-42, 65],
	[-39, 95],
	[-32, 122],
	[-20, 140],
	[-2, 148],
	[16, 145],
	[30, 133],
	[38, 110],
	[40, 80],
	[39, 50],
	[36, 20],
	[30, -4, 1]
];
/** Its grey rubber, and the treads across it. @type {Point[]} */
const TREAD = [
	[-27, 8],
	[-33, 38],
	[-33, 72],
	[-29, 104],
	[-20, 127],
	[-4, 138],
	[12, 135],
	[25, 122],
	[31, 96],
	[32, 62],
	[30, 32],
	[24, 8]
];
/** @type {Point[][]} */
const TREADS = [22, 40, 58, 76, 94, 112, 128].map((y) => {
	const half = 22 - Math.abs(y - 70) / 8;
	return [
		[-half, y],
		[half, y]
	];
});

/*
 * Hands, as the drawings have them: each traced about its wrist (the middle of its cuff), for the arm
 * (`side`) and at the forearm's angle (`at`, degrees) it was drawn with, and carried to any other.
 */
/** @type {Record<string, { side: 'l' | 'r', at: number, wrist: Vec, outline: Point[], lines: Point[][], marks?: Point[][] }>} */
const DRAWN = {
	// ending_3's left hand, hanging.
	relaxed: {
		side: 'l',
		at: 0,
		wrist: [376, 742],
		outline: [
			[356, 742],
			[354, 762],
			[353, 782],
			[354, 800],
			[359, 816],
			[367, 828],
			[379, 835],
			[393, 838],
			[399, 835, 1],
			[397, 828],
			[401, 823, 1],
			[404, 806],
			[403, 784],
			[401, 764],
			[398, 742]
		],
		lines: [
			[
				[386, 797],
				[386, 812],
				[390, 821],
				[397, 825]
			],
			[
				[361, 808],
				[366, 826]
			],
			[
				[369, 808],
				[374, 824]
			]
		]
	},
	// ending_5's right hand, waving, its palm to you, and the two strokes it waves (see `lines`).
	wave: {
		side: 'l',
		at: -160.3,
		wrist: [368, 444],
		marks: [
			[
				[298, 338],
				[302, 322],
				[312, 310]
			],
			[
				[312, 348],
				[316, 336],
				[324, 327]
			]
		],
		outline: [
			[346, 440],
			[342, 420],
			[341, 400],
			[342, 380],
			[343, 360],
			[345, 348],
			[350, 342],
			[355, 346],
			[356, 360],
			[357, 372, 1],
			[358, 345],
			[360, 330],
			[365, 325],
			[370, 330],
			[371, 350],
			[372, 368, 1],
			[374, 335],
			[377, 322],
			[382, 318],
			[387, 322],
			[388, 340],
			[387, 366, 1],
			[389, 340],
			[392, 330],
			[397, 327],
			[402, 333],
			[402, 350],
			[400, 376, 1],
			[408, 374],
			[414, 372],
			[416, 380],
			[410, 392],
			[402, 404],
			[395, 418],
			[391, 432],
			[390, 443]
		],
		lines: []
	},
	// ending_3's left hand, scratching the back of his neck.
	scratch: {
		side: 'r',
		at: 111.2,
		wrist: [664, 400],
		outline: [
			[682, 377],
			[660, 364],
			[638, 353],
			[618, 344],
			[596, 344],
			[578, 356],
			[572, 374],
			[578, 388],
			[600, 391],
			[626, 398],
			[652, 412]
		],
		lines: [
			[
				[606, 368],
				[614, 370],
				[622, 372]
			]
		]
	}
};
// A fist with its forefinger out, pointing (ending_8), drawn here for the right hand hanging down.
DRAWN.point = {
	side: 'l',
	at: 0,
	wrist: [0, 0],
	outline: [
		[-17, -2],
		[-20, 16],
		[-19, 33],
		[-13, 45],
		[-2, 50],
		[5, 51, 0.6],
		[7, 70],
		[9, 88],
		[15, 92],
		[20, 87],
		[19, 69],
		[18, 51, 0.6],
		[22, 36],
		[21, 16],
		[17, -2]
	],
	lines: [
		[
			[-13, 30],
			[-3, 33],
			[5, 34]
		],
		[
			[-14, 40],
			[-4, 42]
		],
		[
			[19, 17],
			[12, 28],
			[8, 36]
		]
	]
};
/** Each drawn hand as it would sit on the left arm hanging down, about its wrist. */
const HANDS = Object.fromEntries(
	Object.entries(DRAWN).map(([name, { side, at, wrist, outline, lines }]) => {
		/** @param {Point[]} pts */
		const home = (pts) => {
			const back = turn(move(pts, [-wrist[0], -wrist[1]]), -at, [0, 0]);
			return side === 'l' ? back : mirror(back, 0);
		};
		return [name, { outline: home(outline), lines: lines.map(home), marks: (DRAWN[name].marks ?? []).map(home) }];
	})
);

/**
 * The pose, all numbers GSAP can tween (and the hands' names, which it sets). He turns `yaw` degrees
 * round (0 facing you, 90 to your right, 180 away), his head to `look`. Arms: `up` is the upper arm's
 * angle out from hanging (degrees), `fore` the forearm's, measured the same way; `lift` and `reach` how
 * much of each shows face on (the rest reaches forward), `back` how far the upper arm swings behind
 * him (degrees, as it does with a hand in a pocket), `cuff` how the sleeve's end slants (degrees, as
 * into a pocket), `hand` which hand is drawn (`none` for none), and `pocket` how much of it shows
 * through the pocket's opening. Legs: `swing` forward from the hip, `knee` bent back from the thigh.
 */
export const REST = {
	yaw: 0,
	look: 0,
	armL: { up: 10, fore: -16.4, lift: 1, reach: 0.72, back: 12, cuff: 36, hand: 'none', pocket: 1 },
	armR: { up: 10, fore: -16.4, lift: 1, reach: 0.7, back: 12, cuff: 36, hand: 'none', pocket: 1 },
	legL: { swing: 0, knee: 0 },
	legR: { swing: 0, knee: 0 },
	/** Where he stands (moved from ending_1's place), how big, as he walks away, and his bob as he steps. */
	at: { x: 0, y: 0, scale: 1, bob: 0 },
	/** How far the shirt rides up (0–1), as the arms go up. */
	hitch: 0,
	/** The head's tilt (degrees, clockwise) about the neck, and its nod: -1 looking right up (as the avatar does), 0 ahead. */
	tilt: 0,
	nod: 0,
	/** Where the eyes look, in units of the drawing (x right, y down). */
	eyeX: 0,
	eyeY: 0,
	/** 0 open, 1 shut. */
	blink: 0,
	/** -1 worried, 0 as drawn, 1 smiling. */
	mouth: 0,
	/** The worried brows' share (they show under the fringe). */
	worry: 0,
	sweat: 0,
	glasses: 1,
	/** The strokes a waving hand makes. */
	lines: 0,
	/** Breathing: 0 out, 1 in. */
	breath: 0,
	/** How far the camera has risen over him, looking down (degrees; see `camera`). */
	pitch: 0,
	/** How much of him shows: his body, and his head (with the neck and collar). */
	shown: { body: 1, head: 1 }
};

/** @typedef {typeof REST} Pose */
/**
 * A path to paint. From above, one with an `anchor` faces the camera about it (see `camera`), and one
 * `withHead` goes that far with the head (the collar, which his upturned chin sits on).
 * @typedef {{ key: string, d: string, fill?: string, stroke?: string, width?: number, opacity?: number, anchor?: Vec, withHead?: number }} Layer
 */

/**
 * An upper arm, forearm, thigh or shin as the page shows it: `deg` out from hanging on its side (`o`,
 * -1 his right, 1 his left), `k` of its `length` showing face on (the rest reaching forward), seen
 * `yaw` round, where forward shows and out does not.
 * @param {number} length @param {number} deg @param {number} k @param {number} o @param {number} yaw @returns {Vec}
 */
function segment(length, deg, k, o, yaw, back = 0) {
	const c = Math.min(1, k);
	const l = length * Math.max(1, k);
	const out = o * Math.sin(rad(deg)) * l * c;
	const down = Math.cos(rad(deg)) * l * c;
	const ahead = l * Math.sqrt(1 - c * c);
	// Swung `back` degrees behind him (what shows side on).
	const forward = ahead * Math.cos(rad(back)) - down * Math.sin(rad(back));
	return [out * Math.cos(rad(yaw)) + forward * Math.sin(rad(yaw)), down * Math.cos(rad(back)) + ahead * Math.sin(rad(back))];
}

/**
 * A sleeve or trouser leg, as two lengths of cloth, the lower laid over the upper: the upper from
 * `from`, rounded off at `mid`; the lower from `mid` (rounded behind it) to `to`, cut off square there,
 * or slanted (`slant`, degrees). `widths` at each of the three; `side` is the outer side as it hangs
 * (-1 left, 1 right); each length bows out a little (`puff`). The lower's rounded end shows only inside
 * the bend, as a crease, as far round as the joint is bent.
 * @param {Vec} from @param {Vec} mid @param {Vec} to @param {readonly number[]} widths @param {number} side
 * @param {number} [puff] @param {number} [slant]
 */
function limb(from, mid, to, widths, side, puff = 0, slant = 0) {
	const u = unit(add(mid, from, -1));
	const v = unit(add(to, mid, -1));
	/** @type {(d: Vec) => Vec} */
	const outward = (d) => [side * d[1], -side * d[0]];
	const nu = outward(u);
	const nv = outward(v);
	const [a, b, c] = widths.map((w) => w / 2);
	const l1 = Math.hypot(mid[0] - from[0], mid[1] - from[1]);
	const l2 = Math.hypot(to[0] - mid[0], to[1] - mid[1]);
	/** A point on the upper's edge (`sign` 1 outer, -1 inner), `t` of the way down it. */
	const onUpper = (/** @type {number} */ t, /** @type {number} */ sign) => add(add(from, u, l1 * t), nu, sign * (a + (b - a) * t + puff * Math.sin(Math.PI * t)));
	const onLower = (/** @type {number} */ t, /** @type {number} */ sign) => add(add(mid, v, l2 * t), nv, sign * (b + (c - b) * t + puff * Math.sin(Math.PI * t)));
	/** Half round `mid`, `r` out, from `p` by way of `q` to -`p`. @param {Vec} p @param {Vec} q @param {number} r @returns {Point[]} */
	const round = (p, q, r) => [0, 1, 2, 3, 4].map((i) => add(mid, add(add([0, 0], p, Math.cos((i * Math.PI) / 4)), q, Math.sin((i * Math.PI) / 4)), r));
	const cs = Math.cos(rad(slant));
	const sn = Math.sin(rad(slant));
	/** @type {Vec} */
	const ns = [nv[0] * cs - side * nv[1] * sn, nv[1] * cs + side * nv[0] * sn];
	// Inside the bend (the side it turns to), a crease: the lower's rounded end, as far round as it is bent.
	const k = dot(add(v, u, -1), nu) > 0 ? 1 : -1;
	const bend = Math.acos(Math.max(-1, Math.min(1, dot(u, v))));
	const sweep = Math.min(rad(85), bend * 0.9);
	/** @type {Vec} */
	const inside = [k * nv[0], k * nv[1]];
	const crease = /** @type {Point[]} */ (
		sweep < rad(6) ? [] : [0, 1, 2, 3].map((i) => add(mid, add(add([0, 0], inside, Math.cos((i / 3) * sweep)), v, -Math.sin((i / 3) * sweep)), b))
	);
	return {
		/** The upper length: out along its outer edge, round its end, back along its inner edge. */
		upper: /** @type {Point[]} */ ([onUpper(0, 1), onUpper(0.5, 1), ...round(nu, u, b), onUpper(0.5, -1), onUpper(0, -1)]),
		/** The lower, from the joint: its outer edge, the cut end, its inner edge back to the joint. */
		lower: /** @type {Point[]} */ ([onLower(0, 1), onLower(0.5, 1), corner(add(to, ns, c)), corner(add(to, ns, -c)), onLower(0.5, -1), onLower(0, -1)]),
		/** The lower's end behind the joint, to fill it in. */
		back: round(/** @type {Vec} */ ([-nv[0], -nv[1]]), /** @type {Vec} */ ([-v[0], -v[1]]), b * 0.9),
		crease,
		onUpper,
		u,
		v
	};
}

/**
 * The part of a line from its start up to where it first crosses from outside the shirt into it
 * (`x` past `side`, on a side -1 left or 1 right), cut there.
 * @param {Point[]} line @param {number} side @param {number} s
 */
function untilSide(line, side, s) {
	const inside = (/** @type {Point} */ p) => (p[0] - side) * s < 0;
	if (inside(line[0])) return [line[0]];
	for (let i = 1; i < line.length; i++) {
		const [a, b] = [line[i - 1], line[i]];
		if (!inside(a) && inside(b)) {
			const t = (side - a[0]) / (b[0] - a[0]);
			return [...line.slice(0, i), mix(xy(a), xy(b), t)];
		}
	}
	return line;
}

/**
 * Seen from above (`pitch` degrees, the camera risen and looking down at him), his body falls away from
 * you, shorter and smaller towards his feet, while his head, turned up to you, stays face on, closer and
 * a little bigger, sitting on his shoulders. `pitch` 0 is ending_1's camera.
 * @param {number} pitch
 */
export function camera(pitch) {
	const sin = Math.sin(rad(pitch));
	const cos = Math.cos(rad(pitch));
	// How far off the camera is (in the drawing's units), closing in as it rises, and how far his
	// upturned face is in front of his shoulders: fitted to the drawing from above, a close, wide shot in
	// which his shoulders show beside his face and his feet are small under his chin.
	const t = clamp01(pitch / TOP_PITCH);
	const far = 325 / Math.max(0.01, t);
	const depth = 50;
	// Under his shirt, his legs are drawn shorter still, as the drawing from above has them.
	const drop = (/** @type {number} */ y) => {
		const dy = y - NECK[1];
		return dy > HEM ? HEM + (dy - HEM) * (1 - 0.5 * t) : dy;
	};
	/** How much smaller a point this far down him is, being further off. @param {number} y */
	const shrink = (y) => far / (far + drop(y) * sin);
	/** A point of him, `z` in front of his middle (towards you). @param {Vec} p @param {number} [z] @returns {Vec} */
	const body = ([x, y], z = 0) => {
		const k = shrink(y);
		return [NECK[0] + (x - NECK[0]) * k, NECK[1] + (drop(y) * cos + z * sin) * k];
	};
	/**
	 * A point of a part that faces the camera however high it is (a shoe, whose top it sees from
	 * above), drawn about its `anchor` at the size there.
	 * @param {Vec} p @param {Vec} anchor @param {number} z @returns {Vec}
	 */
	const upright = ([x, y], anchor, z) => {
		const [ax, ay] = body(anchor, z);
		const k = shrink(anchor[1]);
		return [ax + (x - anchor[0]) * k, ay + (y - anchor[1]) * k];
	};
	const centre = HEAD_CENTRE;
	const scale = far / (far + (centre[1] - NECK[1]) * sin);
	const cy = NECK[1] + ((centre[1] - NECK[1]) * cos + depth * sin) * scale;
	/** @param {Vec} p @returns {Vec} */
	const head = ([x, y]) => [centre[0] + (x - centre[0]) * scale, cy + (y - centre[1]) * scale];
	return { body, upright, head, scale };
}
/** The middle of his head, which it turns and scales about. @type {Vec} */
const HEAD_CENTRE = [533, 292];
/** How far his shirt's hem is below the top of his neck. */
const HEM = 347;

/**
 * How far in front of his middle (towards you) a point of a part of him is, which shows as the camera
 * rises: his belly most, his arms as they hang towards his hands, his legs less towards his feet.
 * @param {string} key @param {number} y
 */
function depth(key, y) {
	const part = key.split('-')[0];
	const down = clamp01((y - 450) / 300);
	if (part === 'shirt') return 50 * down;
	if (['upper', 'fore', 'crease', 'hand', 'finger', 'wave'].includes(part)) return 30 * down;
	if (['waist', 'thigh', 'knee', 'shin', 'pocket', 'shoe', 'lace', 'sole', 'tread'].includes(part)) return 30 - 15 * clamp01((y - 690) / 524);
	return 0;
}

/**
 * Every point of a path (as `curve` writes them, absolute pairs) carried by `map`.
 * @param {string} d @param {(p: Vec) => Vec} map
 */
const mapPath = (d, map) => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => map([Number(x), Number(y)]).map(f).join(' '));

/**
 * Where a point of his face (as drawn facing you) is, as he holds his head now: tilted, and seen from
 * where the camera is. For things that land on it, as his glasses do.
 * @param {Pose} pose @param {Vec} p @returns {Vec}
 */
export function onFace(pose, p) {
	const [q] = turn([p], pose.tilt, NECK);
	return camera(pose.pitch).head([q[0], q[1]]);
}

/** His face as he holds his head: turned, looking up, and seen from above as the camera rises. @param {Pose} pose */
export const faceOf = (pose) => headView(pose.look, Math.max(0, -pose.nod), clamp01(pose.pitch / TOP_PITCH));

/**
 * The paths to paint, back to front, in two groups: his body, and his head with the neck and collar
 * under it, so each can be shown on its own.
 * @param {Pose} pose @returns {{ body: Layer[], head: Layer[] }}
 */
export function draw(pose) {
	const layers = paint(pose);
	const view = camera(pose.pitch);
	if (pose.pitch) {
		const headStart = layers.findIndex((l) => l.key === 'face');
		layers.forEach((l, i) => {
			const { anchor, withHead = 0 } = l;
			/** @type {(p: Vec) => Vec} */
			const onBody = anchor ? (p) => view.upright(p, anchor, depth(l.key, anchor[1])) : (p) => view.body(p, depth(l.key, p[1]));
			l.d = mapPath(l.d, i >= headStart ? view.head : withHead ? (p) => mix(onBody(p), view.head(p), withHead) : onBody);
		});
	}
	const split = layers.findIndex((l) => l.key === 'neck');
	return { body: layers.slice(0, split), head: layers.slice(split) };
}

/** @param {Pose} pose @returns {Layer[]} */
function paint(pose) {
	const ink = { stroke: INK, width: LINE };
	const body = view(pose.yaw);
	// Breathing in, his head, neck and collar rise a little, and his shoulders a little less.
	const rise = pose.breath * 3;
	if (rise) {
		for (const key of /** @type {const} */ (['neck', 'collarL', 'collarR'])) body[key] = body[key].map(([x, y, k]) => [x, y - rise, k ?? 0]);
		for (const key of /** @type {const} */ (['shoulderL', 'shoulderR', 'baseL', 'baseR'])) body[key] = [body[key][0], body[key][1] - rise * 0.7];
	}
	// Looking up, his neck and collar are the avatar's.
	const up = Math.max(0, -pose.nod);
	if (up) for (const key of /** @type {const} */ (['neck', 'collarL', 'collarR'])) body[key] = blend(body[key], LOOKING_UP_NECK[key], up);
	const face = faceOf(pose);
	const cos = Math.cos(rad(pose.yaw));
	/** Facing you or away, the arms hang at his sides; turned, they hang in front of him and behind. */
	const sideways = Math.abs(cos) < 0.55;
	/** Which of his sides is on your left: his right while he faces you. */
	const facing = cos >= 0 ? 1 : -1;
	/** @type {Layer[]} */
	const out = [];
	/** Layers behind the shirt, between its fill and its line, and over it. @type {Layer[][]} */
	const [behind, under, over] = [[], [], []];

	// Trousers: the waist, then a leg from each hip, the nearer over the farther, then the shoes.
	out.push({ key: 'waist', d: curve(/** @type {Point[]} */ (body.waist), true), fill: PANTS, ...ink });
	const legs = /** @type {const} */ ([
		['r', pose.legR, body.hipR, 1],
		['l', pose.legL, body.hipL, -1]
	]);
	for (const [side, leg, hip, o] of legs) {
		const s = o * facing;
		const knee = add(/** @type {Vec} */ (hip), segment(THIGH, 1.5, 1, o, pose.yaw, -leg.swing));
		const ankle = add(knee, segment(SHIN, 1.5, 1, o, pose.yaw, leg.knee - leg.swing));
		const cloth = limb(/** @type {Vec} */ (hip), knee, ankle, body.leg, s);
		// Open at the top, where the waist carries on; the inner edges part below the crotch.
		const up = (/** @type {Point} */ p) => add(xy(p), cloth.u, -80);
		out.push({ key: `thigh-${side}`, d: curve([corner(up(cloth.upper[0])), ...cloth.upper, corner(up(cloth.upper[cloth.upper.length - 1]))], true), fill: PANTS });
		out.push({ key: `thigh-line-${side}`, d: curve([up(cloth.upper[0]), ...cloth.upper.filter((p, i) => i < 3 || p[1] > 880)]), ...ink });
		out.push({ key: `shin-${side}`, d: curve([...cloth.back, ...cloth.lower.slice(0, -1)], true), fill: PANTS });
		out.push({ key: `shin-line-${side}`, d: curve(cloth.lower), ...ink });
		if (cloth.crease.length) out.push({ key: `knee-${side}`, d: curve(cloth.crease), ...ink });
		// A foot lifted behind him, seen from behind, shows its sole: the shoe turns into it.
		const lifted = clamp01((leg.knee - 15) / 35) * clamp01(-cos * 1.4);
		const tilt = (Math.atan2(ankle[0] - knee[0], ankle[1] - knee[1]) * -180) / Math.PI;
		const sole = (/** @type {Point[]} */ pts) => turn(side === 'l' ? pts : mirror(pts, 0), tilt * 0.6, [0, 0]);
		/** @type {Point[]} */
		const shoe = blend(/** @type {Point[]} */ (side === 'l' ? body.shoe : body.shoeR), sole(SOLE), lifted);
		out.push({ key: `shoe-${side}`, d: curve(move(shoe, ankle)), fill: WHITE, ...ink, anchor: ankle });
		if (lifted > 0) {
			out.push({ key: `sole-${side}`, d: curve(move(sole(TREAD), ankle), true), fill: '#b9b6b3', opacity: lifted, anchor: ankle });
			TREADS.forEach((line, i) => out.push({ key: `tread-${side}${i}`, d: curve(move(sole(line), ankle)), ...ink, width: 4, opacity: lifted, anchor: ankle }));
		}
		/** @type {Point[][]} */ (side === 'l' ? body.laces : body.lacesR).forEach((line, i) =>
			out.push({ key: `lace-${side}${i}`, d: curve(move(line, ankle)), ...ink, opacity: (1 - lifted) * (1 - clamp01(pose.pitch / TOP_PITCH)), anchor: ankle })
		);
	}
	// A hand in its pocket shows through the opening.
	for (const [side, arm, opening] of /** @type {const} */ ([
		['l', pose.armL, body.pocketL],
		['r', pose.armR, body.pocketR]
	]))
		if (arm.pocket > 0) out.push({ key: `pocket-${side}`, d: curve(/** @type {Point[]} */ (opening), true), fill: SKIN, ...ink, opacity: arm.pocket });

	// The shirt, and the sleeves. Facing you (or away), each sleeve comes off the collar round its
	// shoulder, its upper arm under the shirt's sides (which its underside runs into), its forearm over
	// them. Turned, the near arm hangs in front of him, its top lost in the shoulder, the far one behind.
	const hem = body.shirt.map(([x, y, k], i) => /** @type {Point} */ ([x, y - (i >= 4 && i <= 12 ? pose.hitch * (14 + 10 * Math.sin(((i - 4) / 8) * Math.PI)) : pose.hitch * 14 * Math.max(0, (y - 600) / 118)), k ?? 0]));
	for (const [side, arm, o] of /** @type {const} */ ([
		['l', pose.armL, -1],
		['r', pose.armR, 1]
	])) {
		const s = o * facing;
		/** @type {Vec} */
		const shoulder = /** @type {Vec} */ (side === 'l' ? body.shoulderL : body.shoulderR);
		const elbow = add(shoulder, segment(ARMS.upper, arm.up, arm.lift, o, pose.yaw, arm.back));
		const wrist = add(elbow, segment(ARMS.fore, arm.fore, arm.reach, o, pose.yaw));
		const sleeve = limb(shoulder, elbow, wrist, ARMS.sleeve, s, ARMS.puff, arm.cuff);
		/** @type {Layer[]} */
		const upperLayers = [];
		/** @type {Layer[]} */
		const lowerLayers = [];
		if (!sideways) {
			/** @type {Vec} */
			const base = /** @type {Vec} */ (side === 'l' ? body.baseL : body.baseR);
			// Over the shoulder, from the collar to the sleeve's outer edge: bowed while the arm is down,
			// and straight onto the edge, level with the collar, once it is raised past it.
			const start = xy(sleeve.upper[0]);
			const behindBy = dot(add(base, start, -1), sleeve.u);
			const edge = add(start, sleeve.u, Math.max(0, behindBy));
			const chord = unit(add(edge, base, -1));
			const up = [/** @type {Vec} */ ([-chord[1], chord[0]]), /** @type {Vec} */ ([chord[1], -chord[0]])].sort((a, b) => dot(b, [s * 0.5, -1]) - dot(a, [s * 0.5, -1]))[0];
			const cap = add(mix(base, edge, 0.5), up, ARMS.cap * clamp01(-behindBy / 30));
			const upper = [base, cap, edge, ...sleeve.upper.slice(1)];
			// The underside runs back into the shirt's side, or on to meet it under the arm.
			const sideX = /** @type {number} */ (side === 'l' ? body.sideL : body.sideR);
			const underside = untilSide(sleeve.upper.slice(6), sideX, s);
			const joined = underside.length === sleeve.upper.slice(6).length ? [...underside, /** @type {Vec} */ ([sideX, 532])] : underside;
			upperLayers.push({ key: `upper-${side}`, d: curve([...upper, add(shoulder, [-s * 10, -10])], true), fill: WHITE });
			upperLayers.push({ key: `upper-line-${side}`, d: curve([...upper.slice(0, 8), ...joined]), ...ink });
		} else {
			// Its top is lost in the shoulder: the edges start a way down it.
			const top = [sleeve.onUpper(0.3, 1), sleeve.onUpper(0.3, -1)];
			upperLayers.push({ key: `upper-${side}`, d: curve([add(shoulder, [0, -30]), ...sleeve.upper], true), fill: WHITE });
			upperLayers.push({ key: `upper-line-${side}`, d: curve([top[0], ...sleeve.upper.slice(1, -1), top[1]]), ...ink });
		}
		lowerLayers.push({ key: `fore-${side}`, d: curve([...sleeve.back, ...sleeve.lower.slice(0, -1)], true), fill: WHITE });
		lowerLayers.push({ key: `fore-line-${side}`, d: curve(sleeve.lower), ...ink });
		if (sleeve.crease.length) lowerLayers.push({ key: `crease-${side}`, d: curve(sleeve.crease), ...ink });
		const hand = HANDS[arm.hand];
		// While it is going into (or coming out of) a pocket, the hand fades as the pocket's skin shows.
		const handShown = 1 - arm.pocket;
		if (hand && handShown > 0) {
			const dir = unit(add(wrist, elbow, -1));
			const angle = (Math.atan2(-dir[0], dir[1]) * 180) / Math.PI;
			const shape = (/** @type {Point[]} */ pts) => turn(move(s < 0 ? pts : mirror(pts, 0), wrist), angle, wrist);
			lowerLayers.push({ key: `hand-${side}`, d: curve(shape(hand.outline)), fill: SKIN, ...ink, opacity: handShown });
			hand.lines.forEach((l, i) => lowerLayers.push({ key: `finger-${side}${i}`, d: curve(shape(l)), ...ink, opacity: handShown }));
			if (pose.lines > 0) hand.marks.forEach((l, i) => lowerLayers.push({ key: `wave-${side}${i}`, d: curve(shape(l)), ...ink, opacity: pose.lines }));
		}
		// Turned, his right arm (and hand) is the near one while he faces your right.
		const near = side === 'l' ? pose.yaw > 0 && pose.yaw < 180 : false;
		if (!sideways) under.push(...upperLayers), over.push(...lowerLayers);
		else (near ? over : behind).push(...upperLayers, ...lowerLayers);
	}
	out.push(...behind);
	out.push({ key: 'shirt', d: curve([...hem, .../** @type {Point[]} */ (body.shoulders)], true), fill: WHITE });
	out.push(...under.filter((l) => l.fill), ...under.filter((l) => !l.fill));
	out.push({ key: 'shirt-line', d: curve(hem), ...ink });
	out.push(...over);

	// The neck and collar, then the head.
	const neck = /** @type {Point[]} */ (body.neck);
	out.push({ key: 'neck', d: curve(neck, true), fill: SKIN });
	out.push({ key: 'neck-line', d: curve(neck.slice(1, -1)), ...ink });
	// From above, his collar's points are the drawing's, either side of his chin.
	const above = clamp01(pose.pitch / TOP_PITCH);
	for (const [side, collar, top] of /** @type {const} */ ([
		['l', body.collarL, COLLAR_ABOVE_L],
		['r', body.collarR, COLLAR_ABOVE_R]
	]))
		out.push({ key: `collar-${side}`, d: curve(above ? blend(collar, top, above) : /** @type {Point[]} */ (collar), true), fill: WHITE, ...ink, withHead: above });
	const front = clamp01((30 - pose.yaw) / 20) * (1 - above) * (1 - up);
	if (front > 0)
		for (const [key, line] of /** @type {const} */ ([
			['lapel-l', LAPEL_L],
			['lapel-r', LAPEL_R],
			['fold-l', FOLD_L],
			['fold-r', FOLD_R]
		]))
			out.push({ key, d: curve(move(line, [0, -rise])), ...ink, opacity: front });

	const head = (/** @type {Point[]} */ points) => move(turn(points, pose.tilt, NECK), [0, -rise]);
	// Under his chin the neck carries on; seen from above, it is hidden under his head, which then has a
	// chin of its own: the point of the open collar, its sides straight.
	const chinShown = clamp01(pose.pitch / 25);
	const skull = /** @type {Point[]} */ (face.skull).map((p, i, all) => /** @type {Point} */ (i === 0 || i === all.length - 1 ? [p[0], p[1], chinShown] : p));
	const chin = /** @type {Point} */ ([face.chin[0], face.chin[1], chinShown]);
	out.push({ key: 'face', d: curve(head([...skull, chin]), true), fill: SKIN });
	out.push({ key: 'face-line', d: curve(head(skull)), ...ink });
	if (chinShown > 0) out.push({ key: 'chin', d: curve(head([skull[skull.length - 1], chin, skull[0]])), ...ink, opacity: chinShown });
	// The ears, over the face where they meet it, so they join it without a line; the far one only while
	// it shows.
	const farEar = clamp01((50 - pose.look) / 20) + clamp01((pose.look - 130) / 20);
	for (const [side, ear, opacity] of /** @type {const} */ ([
		['l', face.earL, 1],
		['r', face.earR, farEar]
	])) {
		if (opacity <= 0) continue;
		const rim = /** @type {Point[]} */ (ear);
		const inner = add(mix(xy(rim[0]), xy(rim[rim.length - 1]), 0.5), unit(add([537, 330], mix(xy(rim[0]), xy(rim[rim.length - 1]), 0.5), -1)), 9);
		out.push({ key: `ear-${side}`, d: curve(head([...rim, inner]), true), fill: SKIN, opacity });
		out.push({ key: `ear-line-${side}`, d: curve(head(rim)), ...ink, opacity });
	}
	const seen = clamp01((130 - pose.look) / 20);
	if (pose.worry > 0 && seen > 0)
		for (const [side, brow] of /** @type {const} */ ([
			['l', face.browL],
			['r', face.browR]
		]))
			out.push({ key: `brow-${side}`, d: curve(head(/** @type {Point[]} */ (brow))), stroke: INK, width: 3, opacity: pose.worry * seen });
	out.push({ key: 'hair', d: curve(head(/** @type {Point[]} */ ([...face.bowl, ...face.fringe])), true), fill: HAIR, stroke: HAIR, width: 1.5 });
	const [gx, gy] = [pose.eyeX, pose.eyeY];
	for (const [side, eye, opacity] of /** @type {const} */ ([
		['l', face.eyeL, seen],
		['r', face.eyeR, seen * clamp01((50 - pose.look) / 15)]
	])) {
		if (opacity <= 0) continue;
		const [x, y] = /** @type {Vec} */ (eye);
		const half = 0.01 + 5.5 * pose.blink;
		out.push({ key: `eye-${side}`, d: curve(head([[x + gx - half, y + gy], [x + gx + half, y + gy]])), stroke: INK, width: DOT - (DOT - 3) * pose.blink, opacity });
	}
	if (seen > 0) {
		const [mx, my, mw] = /** @type {number[]} */ (face.mouth);
		const smile = pose.mouth;
		out.push({
			key: 'mouth',
			d: curve(head([[mx - mw - smile * 3, my - smile * 3], [mx, my + smile * 5], [mx + mw + smile * 3, my - smile * 3]])),
			stroke: INK,
			width: 2.6,
			opacity: seen
		});
	}
	const sweat = pose.sweat * clamp01((30 - pose.look) / 20);
	if (sweat > 0) out.push({ key: 'sweat', d: curve(head(/** @type {Point[]} */ (face.sweat))), stroke: INK, width: LINE, opacity: sweat });
	if (pose.glasses > 0 && seen > 0) {
		const lens = (/** @type {number[]} */ [cx, cy, rx, ry]) =>
			curve(head(Array.from({ length: 16 }, (_, i) => /** @type {Point} */ ([cx + rx * Math.cos((i / 16) * Math.PI * 2), cy + ry * Math.sin((i / 16) * Math.PI * 2)]))), true);
		const g = { stroke: INK, width: RIM };
		const opacity = pose.glasses * seen;
		const farLens = clamp01((100 - pose.look) / 10);
		out.push({ key: 'lens-l', d: lens(/** @type {number[]} */ (face.lensL)), ...g, opacity });
		out.push({ key: 'lens-r', d: lens(/** @type {number[]} */ (face.lensR)), ...g, opacity: opacity * farLens });
		out.push({ key: 'bridge', d: curve(head(/** @type {Point[]} */ (face.bridge))), ...g, opacity });
		out.push({ key: 'temple-l', d: curve(head(/** @type {Point[]} */ (face.templeL))), ...g, opacity });
		out.push({ key: 'temple-r', d: curve(head(/** @type {Point[]} */ (face.templeR))), ...g, opacity: opacity * clamp01((50 - pose.look) / 15) });
	}
	return out;
}

/** The collar from above, as its drawing has it (in its pixels, 4x, carried onto the head as views.js's FROM_ABOVE is). */
const aboveCollar = (/** @type {number[][]} */ pts) =>
	/** @type {Point[]} */ (pts.map(([x, y, k]) => [537 + ((x - 491.5) * 220) / 623, 172.8 + ((y - 52) * 220) / 623, k ?? 0]));
const COLLAR_ABOVE_L = aboveCollar([[392, 692], [338, 670], [344, 688], [350, 706], [356, 724], [362, 741], [367, 754], [372, 763, 1], [386, 756], [403, 747], [420, 739, 1], [424, 727], [428, 714]]);
const COLLAR_ABOVE_R = aboveCollar([[612, 692], [666, 670], [660, 688], [654, 706], [648, 724], [642, 741], [637, 754], [632, 763, 1], [618, 756], [601, 747], [584, 739, 1], [580, 727], [576, 714]]);

/** Under each flap of the collar, its lapel, and the curl of its band against the neck (as ending_1 has them). @type {Point[]} */
const LAPEL_L = [
	[493, 448],
	[503, 447],
	[510, 450],
	[514.5, 454.5]
];
/** @type {Point[]} */
const LAPEL_R = [
	[573, 448],
	[561, 447],
	[555, 450],
	[551.5, 454]
];
/** @type {Point[]} */
const FOLD_L = [
	[506, 405],
	[498, 410],
	[494.5, 417],
	[495.5, 423],
	[501, 426]
];
/** @type {Point[]} */
const FOLD_R = [
	[566, 405],
	[572, 410],
	[574, 417],
	[572.5, 423],
	[568, 426]
];
