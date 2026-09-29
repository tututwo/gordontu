import { gsap } from 'gsap';
import { camera as seenFrom, faceOf, onFace, REST, TOP_PITCH } from './figure.js';
import { POSES } from './poses.js';

/**
 * The ending, as one paused GSAP timeline over `scene` (the figure's pose, the camera, and the few
 * things drawn round him), which the page seeks frame by frame. Times are in beats of the demo's music
 * (136 BPM), so the moves can land on its beats; `BEAT` is one, in seconds.
 */
export const BEAT = 0.44121;

/** @typedef {import('./figure.js').Pose} Pose */
/**
 * @typedef {{
 *   pose: Pose,
 *   camera: { x: number, y: number, zoom: number },
 *   page: { rest: number, avatar: number },
 *   held: { x: number, y: number, scale: number, spin: number, shown: number },
 *   star: { scale: number, spin: number },
 *   erase: { progress: number, tool: number },
 *   time: number
 * }} Scene
 */

/**
 * Where the opening starts, as the landing has him: the camera that puts the figure's head over the
 * avatar's, and the avatar's glasses, held up where you took them (in the figure's units).
 * @typedef {{ camera: { x: number, y: number, zoom: number }, held: { x: number, y: number, scale: number, spin: number } }} Start
 */

/** How the camera frames him from above: his upturned head and, under it, the rest of him. */
const ABOVE = { x: 537, y: 400, zoom: 2.35, pitch: TOP_PITCH };
/** The opening, from the landing to ending_1, is this many beats; the drawings' poses come after it. */
export const OPENING = 16;
/**
 * When the eraser runs over him (beats after the opening) and for how long: steadily, so a crumb shaken
 * loose at a point on its run is as old as the time since it got there.
 */
export const ERASE = { at: 29, beats: 5 };
/** The top of his head, which the camera keeps in the picture as it moves. */
const HEAD_TOP = [538.5, 171];
/** ending_1's camera: all of him, from in front. */
const FRONT = { x: 537, y: 724, zoom: 1 };
/** Looking up at you, without his glasses: worried, a bead of sweat on his cheek (the avatar's look). */
const UP = { nod: -1, worry: 1, sweat: 1, glasses: 0, mouth: -0.25 };
/** His arms hanging at his sides, as the drawing from above has them. */
const HANG = { up: 22, fore: -26, lift: 1, reach: 0.9, back: 0, cuff: 10, hand: 'relaxed', pocket: 0 };

/** @param {Scene} scene @param {Start} start */
export function ending(scene, start) {
	const tl = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' }, onUpdate: () => void (scene.time = tl.time()) });
	const { pose } = scene;
	/**
	 * The camera moving from one view to another over `beats` from beat `at`: its zoom eased on a log
	 * scale, so it grows (or shrinks) steadily, and his head's top gliding on the screen from where one
	 * has it to where the other does, so he never swings out of the picture.
	 * @param {{ x: number, y: number, zoom: number }} from @param {{ x: number, y: number, zoom: number }} to
	 * @param {number} at @param {number} beats
	 */
	const glide = (from, to, at, beats) =>
		tl.to({ p: 0 }, {
			p: 1,
			duration: b(beats),
			ease: 'sine.inOut',
			onUpdate() {
				const e = this.targets()[0].p;
				const zoom = Math.exp(Math.log(from.zoom) + (Math.log(to.zoom) - Math.log(from.zoom)) * e);
				const [fx, fy] = HEAD_TOP;
				const [ax, ay] = [(fx - from.x) * from.zoom, (fy - from.y) * from.zoom];
				const [bx, by] = [(fx - to.x) * to.zoom, (fy - to.y) * to.zoom];
				Object.assign(scene.camera, { x: fx - (ax + (bx - ax) * e) / zoom, y: fy - (ay + (by - ay) * e) / zoom, zoom });
			}
		}, b(at));
	const O = OPENING;
	const b = (/** @type {number} */ beats) => beats * BEAT;

	/**
	 * Carries an arm to where a pose has it, over `beats`, from beat `at`: its forearm in `bend` of the
	 * time, and its hand changing over to that pose's `swap` of the way through.
	 * @param {'armL' | 'armR'} arm @param {Pose} to @param {number} at @param {number} beats
	 * @param {{ ease?: string, swap?: number, bend?: number }} [how]
	 */
	const move = (arm, to, at, beats, { ease = 'sine.inOut', swap = 0.5, bend = 1 } = {}) => {
		const { hand, pocket, fore, ...rest } = /** @type {Pose['armL']} */ (to[arm]);
		tl.to(pose[arm], { ...rest, duration: b(beats), ease }, b(at));
		// The elbow can lead, bending before the arm has risen, as an arm does on its way up.
		tl.to(pose[arm], { fore, duration: b(beats * bend), ease }, b(at));
		// Into a pocket, the hand fades into the pocket's opening as the arm gets there, and is gone
		// once it is in; out of one, it fades out of it as the arm leaves (see figure.js's `pocket`).
		if (pocket) {
			tl.to(pose[arm], { pocket, duration: b(0.3), ease: 'none' }, b(at + beats * 0.8));
			tl.set(pose[arm], { hand }, b(at + beats * 0.8 + 0.3));
		} else {
			tl.set(pose[arm], { hand }, b(at + beats * swap));
			tl.to(pose[arm], { pocket, duration: b(0.3), ease: 'none' }, b(at + beats * 0.05));
		}
	};
	/**
	 * `to`, but with the arm's forearm angle measured `turns` whole turns further round (the same
	 * direction): a move to it turns the forearm the other way, across him rather than out to his side.
	 * Set it back after (`tl.set`), so the next move measures from the usual angle.
	 * @param {Pose} to @param {'armL' | 'armR'} arm @param {number} turns @returns {Pose}
	 */
	const across = (to, arm, turns) => /** @type {Pose} */ ({ ...to, [arm]: { ...to[arm], fore: to[arm].fore + 360 * turns } });
	/** @param {number} at */
	const blink = (at) => tl.to(pose, { blink: 1, duration: 0.06, ease: 'power1.in', yoyo: true, repeat: 1 }, b(at));

	// The landing: he looks up at his glasses, held up to his right. Everything starts as it is there.
	tl.set(scene.camera, { ...start.camera }, 0);
	tl.set(scene.page, { rest: 1, avatar: 1 }, 0);
	tl.set(scene.held, { ...start.held, shown: 0 }, 0);
	// (Nested objects are set in place: the tweens below hold on to them.)
	const first = { ...structuredClone(REST), ...UP, armL: HANG, armR: HANG, shown: { body: 0, head: 0 } };
	for (const [key, value] of Object.entries(first))
		if (typeof value === 'object') tl.set(/** @type {object} */ (pose[/** @type {keyof Pose} */ (key)]), { ...value }, 0);
		else tl.set(pose, { [key]: value }, 0);

	// The figure takes over from the avatar and its glasses, drawn just as they are, where they are.
	tl.set(scene.held, { shown: 1 }, b(0.75));
	tl.to(scene.page, { avatar: 0, duration: b(0.5), ease: 'none' }, b(0.75));
	tl.to(pose.shown, { head: 1, duration: b(0.5), ease: 'none' }, b(0.75));

	// The camera rises over him, looking down, and everything else fades away: he is left looking up at
	// you. His body comes into view as it tips over him; the glasses, held where they were, go by.
	tl.to(scene.page, { rest: 0, duration: b(2.25), ease: 'power1.inOut' }, b(0.75));
	glide(start.camera, ABOVE, 1, 6);
	tl.to(pose, { pitch: ABOVE.pitch, duration: b(5.5), ease: 'sine.inOut' }, b(1.5));
	tl.to(pose.shown, { body: 1, duration: b(1.5), ease: 'power1.inOut' }, b(2.75));
	tl.to(scene.held, { y: start.held.y - 160, spin: start.held.spin - 8, duration: b(5), ease: 'sine.inOut' }, b(1));
	blink(7.5);

	// The glasses drop back onto his face (where its lenses are), and he can breathe again.
	const landed = /** @type {Pose} */ ({ ...REST, ...UP, pitch: ABOVE.pitch });
	const { lensL, lensR } = faceOf(landed);
	const [x, y] = onFace(landed, [(lensL[0] + lensR[0]) / 2, (lensL[1] + lensR[1]) / 2]);
	const scale = seenFrom(ABOVE.pitch).scale;
	// From just out of the picture, above him: they fall, shrinking as they go (away from you, down to him).
	tl.set(scene.held, { x: x + 40, y: y - 400, scale: 1.9, spin: -18 }, b(8.5));
	tl.to(scene.held, { x, y, scale, spin: 0, duration: b(0.9), ease: 'power2.in' }, b(8.5));
	tl.set(scene.held, { shown: 0 }, b(9.4));
	tl.set(pose, { glasses: 1 }, b(9.4));
	tl.to(pose, { worry: 0, sweat: 0, mouth: 0, eyeX: 0, eyeY: -2, nod: -0.6, duration: b(0.75), ease: 'power2.out' }, b(9.4));
	blink(9.9);

	// And the camera comes back down in front of him, far enough off to see all of him: ending_1.
	glide(ABOVE, FRONT, 11, 4);
	tl.to(pose, { pitch: 0, nod: 0, tilt: 0, look: 0, eyeX: 0, eyeY: 0, duration: b(4), ease: 'sine.inOut' }, b(11));
	move('armL', POSES[1], 11.75, 2.5);
	move('armR', POSES[1], 11.85, 2.5);

	// All the while he breathes, slowly, in and out every four beats.
	tl.to(pose, { breath: 1, duration: b(2), ease: 'sine.inOut', yoyo: true, repeat: 17 }, b(O - 2));

	// 1: hands in his pockets. He blinks.
	blink(O + 1.2);

	// 2: out of the pockets: up and out of them, then they drop and hang, swinging a little.
	for (const arm of /** @type {const} */ (['armL', 'armR'])) {
		tl.to(pose[arm], { up: 14, fore: -6, reach: 1, back: 0, cuff: 8, duration: b(0.5), ease: 'sine.in' }, b(O + 2));
		tl.set(pose[arm], { hand: 'relaxed' }, b(O + 2.05));
		tl.to(pose[arm], { pocket: 0, duration: b(0.3), ease: 'none' }, b(O + 2.05));
		tl.to(pose[arm], { up: POSES[2][arm].up, fore: POSES[2][arm].fore, reach: POSES[2][arm].reach, cuff: 0, duration: b(1.25), ease: 'back.out(1.5)' }, b(O + 2.5));
	}
	// Now what: he looks down at his hands, and up again.
	tl.to(pose, { eyeX: 0, eyeY: 5, duration: b(0.5) }, b(O + 3.5)).to(pose, { eyeX: 0, eyeY: 0, duration: b(0.5) }, b(O + 4.5));

	// 3: a scratch at the back of his neck, looking away.
	// His hand comes up across his chest to the back of his neck, his elbow rising out to the side.
	move('armR', across(POSES[3], 'armR', -1), O + 6, 2, { swap: 0.65, bend: 0.75 });
	tl.set(pose.armR, { fore: POSES[3].armR.fore }, b(O + 8));
	move('armL', POSES[3], O + 6, 2);
	tl.to(pose, { tilt: 5, eyeX: -5, eyeY: 1, mouth: -0.4, duration: b(2) }, b(O + 6));
	tl.to(pose.armR, { fore: '+=9', duration: b(0.25), ease: 'sine.inOut', yoyo: true, repeat: 5 }, b(O + 8));

	// 4: hands behind his head, at ease.
	move('armR', POSES[4], O + 10, 1.5, { swap: 0.25 });
	move('armL', POSES[4], O + 10, 1.5, { swap: 0.7, bend: 0.7 });
	tl.to(pose, { tilt: -3, eyeX: 0, eyeY: -2, mouth: 0, hitch: 1, duration: b(1.5) }, b(O + 10));
	tl.to(pose, { tilt: 3, duration: b(1.5), ease: 'sine.inOut' }, b(O + 11.5));
	blink(O + 12.3);

	// 5: bye! a wave, smiling.
	move('armL', POSES[5], O + 14, 1.25, { swap: 0.35 });
	// The other hand comes down from behind his head past his ear, the forearm tipping towards you.
	const { reach: hang, ...drop } = POSES[5].armR;
	move('armR', across(/** @type {Pose} */ ({ ...POSES[5], armR: drop }), 'armR', 1), O + 14, 1.25, { swap: 0.35 });
	tl.to(pose.armR, { keyframes: [{ reach: 0.45, ease: 'sine.out' }, { reach: hang, ease: 'sine.in' }], duration: b(1.25) }, b(O + 14));
	tl.set(pose.armR, { fore: POSES[5].armR.fore }, b(O + 15.25));
	tl.to(pose, { tilt: 0, eyeX: 0, eyeY: 0, mouth: 1, hitch: 0, duration: b(1.25) }, b(O + 14));
	tl.to(pose.armL, { fore: '+=20', up: '+=4', duration: b(0.5), ease: 'sine.inOut', yoyo: true, repeat: 5 }, b(O + 15.25));
	tl.to(pose, { lines: 1, duration: b(0.25) }, b(O + 15.25)).to(pose, { lines: 0, duration: b(0.25) }, b(O + 17.75));

	// 6: hands back in his pockets as he turns to your right, his head leading. The waving forearm comes
	// down in front of him, turning towards you (the way round across him), then is set back to the
	// same angle measured the usual way.
	const { reach, ...down } = POSES[1].armL;
	move('armL', /** @type {Pose} */ ({ ...POSES[1], armL: { ...down, fore: 360 - 19 } }), O + 18.5, 1.5, { swap: 0.8 });
	tl.to(pose.armL, { keyframes: [{ reach: 0.35, ease: 'sine.out' }, { reach, ease: 'sine.in' }], duration: b(1.5) }, b(O + 18.5));
	tl.set(pose.armL, { fore: -19 }, b(O + 20.05));
	move('armR', POSES[1], O + 18.5, 1.5, { swap: 0.8 });
	tl.to(pose, { mouth: 0, duration: b(1) }, b(O + 18.5));
	tl.to(pose, { look: 90, duration: b(1.5) }, b(O + 18.75));
	tl.to(pose, { yaw: 90, duration: b(1.75) }, b(O + 19));
	blink(O + 21);

	// 7: he turns away and walks off, glancing back at you over his shoulder.
	tl.to(pose, { yaw: 135, duration: b(1.25) }, b(O + 22));
	tl.to(pose, { look: 70, tilt: -3, duration: b(1.25) }, b(O + 22));
	/** A step: the back foot lifts behind him, swings through and comes down, from beat `at`. */
	const step = (/** @type {'legL' | 'legR'} */ leg, /** @type {number} */ at) => {
		tl.to(pose[leg], { swing: 16, knee: 68, duration: b(0.5), ease: 'sine.out' }, b(at));
		tl.to(pose[leg], { swing: 0, knee: 0, duration: b(0.5), ease: 'sine.in' }, b(at + 0.5));
		tl.to(pose.at, { bob: 10, duration: b(0.5), ease: 'sine.out', yoyo: true, repeat: 1 }, b(at));
	};
	[22.5, 23.5, 24.5, 25.5, 26.5].forEach((at, i) => step(i % 2 ? 'legL' : 'legR', O + at));
	tl.to(pose.at, { scale: 0.9, y: -60, duration: b(5), ease: 'none' }, b(O + 22.5));
	// He faces the way he is going again, then looks up to his right, at a star.
	tl.to(pose, { look: 165, yaw: 178, tilt: 0, duration: b(1.5) }, b(O + 24.5));
	tl.to(pose, { look: 140, tilt: -4, duration: b(0.75) }, b(O + 25.75));

	// 8: and points up to it.
	move('armL', { ...POSES[1], armL: { up: 128, fore: 136, lift: 1, reach: 1, back: 0, cuff: 0, hand: 'point', pocket: 0 } }, O + 26, 1, { swap: 0.3, ease: 'back.out(1.6)' });
	tl.to(scene.star, { scale: 1, spin: 0, duration: b(1), ease: 'back.out(2.5)' }, b(O + 26.75));
	tl.to(scene.star, { scale: 1.25, duration: b(0.5), ease: 'sine.inOut', yoyo: true, repeat: 3 }, b(O + 27.75));

	// Then he is rubbed out, into the page; the star is last.
	tl.to(scene.erase, { tool: 1, duration: b(0.5), ease: 'power2.out' }, b(O + 28.5));
	tl.to(scene.erase, { progress: 1, duration: ERASE.beats * BEAT, ease: 'none' }, b(O + ERASE.at));
	tl.to(scene.erase, { tool: 0, duration: b(0.5), ease: 'power2.in' }, b(O + 34));
	tl.to(scene.star, { scale: 0, spin: 90, duration: b(1), ease: 'back.in(2)' }, b(O + 35));
	tl.set({}, {}, b(O + 36.5));
	return tl;
}
