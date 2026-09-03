// Run with `node src/lib/landingPage/blobDrift.check.js`: every blob stays bounded, keeps cruising,
// and exchanges momentum through deterministic soft-core contacts.
import { COLLISION_EDGE, createDrift, EDGE, MAX_KICK, SPEED } from './blobDrift.js';
import { landingBlobs as seeds } from './blobSeeds.js';

// Ambient contacts remain nearly round; hard throws deliberately compress farther for soft-body feel.
const MAX_CORE_COMPRESSION = 0.09;
const FAST_CORE_COMPRESSION = 0.5;

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
	if (!condition) throw new Error(message);
}

/** @param {number} seed */
function lcg(seed) {
	let s = seed >>> 0;
	return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

/** @param {import('./blobDrift.js').Blob[]} blobs @param {number} w @param {number} h @param {string} label */
function assertInside(blobs, w, h, label) {
	blobs.forEach((blob, i) => {
		const rx = Math.min(EDGE * blob.r, w / 2);
		const ry = Math.min(EDGE * blob.r, h / 2);
		assert(
			blob.x >= rx - 1e-6 && blob.x <= w - rx + 1e-6 && blob.y >= ry - 1e-6 && blob.y <= h - ry + 1e-6,
			`${label}: blob ${i} left the viewport (${blob.x.toFixed(1)}, ${blob.y.toFixed(1)})`
		);
	});
}

/**
 * @param {import('./blobDrift.js').Blob[]} blobs
 * @param {string} label
 * @param {number} [maxCompression]
 */
function assertCoresSeparated(blobs, label, maxCompression = MAX_CORE_COMPRESSION) {
	for (let i = 0; i < blobs.length; i++) {
		for (let j = i + 1; j < blobs.length; j++) {
			const distance = Math.hypot(blobs[j].x - blobs[i].x, blobs[j].y - blobs[i].y);
			const contact = COLLISION_EDGE * (blobs[i].r + blobs[j].r);
			assert(
				distance >= contact * (1 - maxCompression) - 1e-6,
				`${label}: blob cores ${i}/${j} overlapped by ${(contact - distance).toFixed(2)}px`
			);
		}
	}
}

/**
 * @param {import('./blobDrift.js').Blob[]} blobs
 * @param {number} scale
 * @param {string} label
 */
function assertVelocityState(blobs, scale, label) {
	const cruise = SPEED * scale;
	const maxKick = MAX_KICK * scale;
	for (const [i, blob] of blobs.entries()) {
		assert(Math.abs(Math.hypot(blob.vx, blob.vy) - 1) <= 1e-9, `${label}: blob ${i} heading lost unit length`);
		assert(Math.hypot(blob.kx, blob.ky) <= maxKick + 1e-6, `${label}: blob ${i} exceeded the kick cap`);
		assert(Number.isFinite(blob.sx) && Number.isFinite(blob.sy), `${label}: blob ${i} stretch velocity is not finite`);
		assert(
			Math.hypot(blob.ux - (blob.vx * cruise + blob.kx), blob.uy - (blob.vy * cruise + blob.ky)) <= 1e-6,
			`${label}: blob ${i} exposed stale total velocity`
		);
		assert(
			Math.hypot(blob.ux, blob.uy) <= cruise + maxKick + 1e-6,
			`${label}: blob ${i} exceeded the total speed cap`
		);
	}
}

/** @type {import('./blobDrift.js').Seed[]} */
const soloSeed = [{ home: [0.5, 0.5], radius: 0.12 }];
/** @type {import('./blobDrift.js').Seed[]} */
const pairSeeds = [
	{ home: [0.35, 0.5], radius: 0.1 },
	{ home: [0.65, 0.5], radius: 0.1 }
];
/** @type {import('./blobDrift.js').Seed[]} */
const unequalSeeds = [
	{ home: [0.3, 0.5], radius: 0.15 },
	{ home: [0.7, 0.5], radius: 0.075 }
];

// With no contact or input, subdivision preserves the original exact straight-line cruise.
{
	const w = 4000;
	const h = 1000;
	const drift = createDrift(soloSeed, { random: () => 0.125 });
	drift.resize(w, h);
	const expected = SPEED * Math.min(w, h) * 0.05;
	for (let frame = 0; frame < 100; frame++) {
		const before = { x: drift.blobs[0].x, y: drift.blobs[0].y };
		drift.step(0.05);
		if (frame === 0) {
			const stretchSpeed = Math.hypot(drift.blobs[0].sx, drift.blobs[0].sy);
			assert(stretchSpeed > 0 && stretchSpeed < SPEED * Math.min(w, h), 'stretch velocity was not smoothed');
		}
		assert(
			Math.abs(Math.hypot(drift.blobs[0].x - before.x, drift.blobs[0].y - before.y) - expected) <= 1e-9,
			'no-contact cruise changed speed'
		);
	}
}

// The held body follows the closed-form critical spring, and its render vector is one EMA behind.
{
	const drift = createDrift(soloSeed, { random: () => 0 });
	drift.resize(1000, 1000);
	const blob = drift.blobs[0];
	const start = blob.x;
	const target = start + 100;
	const initialSpeed = SPEED * 1000;
	const dt = 0.01;
	const response = (2 * Math.PI) / 0.08;
	const offset = start - target;
	const slope = initialSpeed + response * offset;
	const decay = Math.exp(-response * dt);
	const expectedX = target + (offset + slope * dt) * decay;
	const expectedSpeed = (initialSpeed - response * slope * dt) * decay;
	const expectedStretch = expectedSpeed * (1 - Math.exp(-dt / 0.06));
	drift.grab(0, start, blob.y);
	drift.move(target, blob.y);
	drift.step(dt);
	assert(Math.abs(blob.x - expectedX) <= 1e-9, 'held spring: position drifted from the exact solution');
	assert(Math.abs(blob.ux - expectedSpeed) <= 1e-9, 'held spring: velocity drifted from the exact solution');
	assert(Math.abs(blob.sx - expectedStretch) <= 1e-9, 'held spring: render velocity was not the 60ms EMA');
}

for (const [w, h] of [
	[1672, 941],
	[390, 844],
	[2560, 1440]
]) {
	for (const seed of [1, 2, 3]) {
		const label = `${w}x${h} seed ${seed}`;
		const drift = createDrift(seeds, { random: lcg(seed) });
		drift.resize(w, h);
		assertInside(drift.blobs, w, h, label);
		for (let frame = 0; frame < 60; frame++) {
			drift.step(1 / 60);
			assertInside(drift.blobs, w, h, `${label} opening settle`);
			assertVelocityState(drift.blobs, Math.min(w, h), `${label} opening settle`);
		}
		assertCoresSeparated(drift.blobs, `${label} initial layout settled`);
		const start = drift.blobs.map(({ x, y }) => ({ x, y }));
		const span = drift.blobs.map(() => 0);
		for (let frame = 0; frame < 120 * 60; frame++) {
			const before = drift.blobs.map(({ x, y }) => ({ x, y }));
			drift.step(1 / 60);
			assertInside(drift.blobs, w, h, label);
			assertCoresSeparated(drift.blobs, label);
			assertVelocityState(drift.blobs, Math.min(w, h), label);
			drift.blobs.forEach((blob, i) => {
				const moved = Math.hypot(blob.x - before[i].x, blob.y - before[i].y);
				// A collision can transfer speed between differently sized blobs, but never past the cap.
				assert(
					moved <= ((SPEED + MAX_KICK) * Math.min(w, h)) / 60 + 1e-6,
					`${label}: blob ${i} jumped ${moved.toFixed(2)}px`
				);
				span[i] = Math.max(span[i], Math.hypot(blob.x - start[i].x, blob.y - start[i].y));
			});
		}
		span.forEach((s, i) =>
			assert(s > 0.3 * Math.min(w, h), `${label}: blob ${i} barely travelled (${s.toFixed(1)}px)`)
		);
		// A resize re-frames positions immediately; soft contacts settle any new overlap over the fade-in.
		drift.resize(390, 844);
		assertInside(drift.blobs, 390, 844, `${label} after resize`);
		for (let frame = 0; frame < 60; frame++) {
			drift.step(1 / 60);
			assertInside(drift.blobs, 390, 844, `${label} resize settle`);
		}
		assertCoresSeparated(drift.blobs, `${label} after resize settled`);
		assertVelocityState(drift.blobs, 390, `${label} after resize`);
	}
}

// Interaction scenario: a fast throw stays bounded and settles, a pause sets a blob down, and a
// nearby poke produces a bounded shove. Keeping each part fresh makes failures deterministic.
{
	const w = 1672;
	const h = 941;
	const scale = Math.min(w, h);
	const dt = 1 / 60;
	const cruiseStep = (SPEED * scale) / 60;
	const maxStep = ((SPEED + MAX_KICK) * scale) / 60;

	const thrown = createDrift(soloSeed, { random: lcg(17) });
	thrown.resize(w, h);
	const start = { x: thrown.blobs[0].x, y: thrown.blobs[0].y };
	assert(
		Math.abs(Math.hypot(thrown.blobs[0].ux, thrown.blobs[0].uy) - SPEED * scale) <= 1e-9,
		'throw: initial render velocity was not the cruise'
	);
	assert(thrown.hit(start.x, start.y) === 0, 'throw: centre did not hit blob 0');
	assert(thrown.hit(start.x + EDGE * thrown.blobs[0].r, start.y) === -1, 'throw: dense-paint edge counted as a hit');
	thrown.grab(0, start.x, start.y);
	for (let frame = 1; frame <= 12; frame++) {
		thrown.move(start.x + 3 * scale * dt * frame, start.y);
		thrown.step(dt);
	}
	thrown.release();
	let settledLargest = 0;
	for (let frame = 0; frame < 660; frame++) {
		const before = thrown.blobs.map(({ x, y }) => ({ x, y }));
		thrown.step(dt);
		assertInside(thrown.blobs, w, h, 'throw');
		thrown.blobs.forEach((blob, i) => {
			const moved = Math.hypot(blob.x - before[i].x, blob.y - before[i].y);
			assert(moved <= maxStep + 1e-6, `throw: blob ${i} jumped ${moved.toFixed(2)}px`);
			if (i === 0 && frame === 0) {
				assert(moved > cruiseStep * 10, `throw: release only moved ${moved.toFixed(2)}px`);
				assert(blob.x > before[i].x, 'throw: release did not follow the rightward pointer velocity');
			}
			assert(
				Math.hypot(blob.ux - (blob.vx * SPEED * scale + blob.kx), blob.uy - (blob.vy * SPEED * scale + blob.ky)) <=
					1e-9,
				`throw: blob ${i} exposed stale total velocity`
			);
			if (i === 0 && frame >= 600) settledLargest = Math.max(settledLargest, moved);
		});
	}
	assert(
		Math.abs(settledLargest - cruiseStep) <= cruiseStep * 0.01,
		`throw: did not settle to cruise (${settledLargest.toFixed(4)}px vs ${cruiseStep.toFixed(4)}px)`
	);

	// Pointer-target velocity must survive a wall clamp: sampling the clamped centre would make this
	// release look stationary even though the pointer kept moving left.
	const pinned = createDrift(soloSeed, { random: lcg(19) });
	pinned.resize(w, h);
	const pinnedBlob = pinned.blobs[0];
	pinnedBlob.x = EDGE * pinnedBlob.r;
	const pinnedStart = { x: pinnedBlob.x, y: pinnedBlob.y };
	pinned.grab(0, pinnedStart.x, pinnedStart.y);
	for (let frame = 1; frame <= 12; frame++) {
		pinned.move(pinnedStart.x - 3 * scale * dt * frame, pinnedStart.y);
		pinned.step(dt);
	}
	pinned.release();
	assert(pinnedBlob.kx < -scale, 'throw: wall-pinned release lost its kick');
	pinned.step(dt);
	assertInside(pinned.blobs, w, h, 'wall-pinned throw');
	assert(pinnedBlob.ux > scale, 'throw: wall did not reflect total velocity');

	const placed = createDrift(soloSeed, { random: lcg(23) });
	placed.resize(w, h);
	const held = placed.blobs[0];
	placed.grab(0, held.x - 11, held.y + 7);
	placed.move(held.x + 49, held.y + 7);
	placed.step(dt);
	for (let frame = 0; frame < 30; frame++) placed.step(dt);
	placed.release();
	const beforePlace = { x: held.x, y: held.y };
	placed.step(dt);
	assertInside(placed.blobs, w, h, 'set down');
	const placedStep = Math.hypot(held.x - beforePlace.x, held.y - beforePlace.y);
	assert(
		Math.abs(placedStep - cruiseStep) <= 1e-9,
		`set down: next step was ${placedStep.toFixed(6)}px instead of cruise`
	);

	const poked = createDrift(soloSeed, { random: lcg(31) });
	poked.resize(w, h);
	const target = poked.blobs[0];
	poked.poke(target.x - 0.1 * scale, target.y);
	const beforePoke = { x: target.x, y: target.y };
	poked.step(dt);
	assertInside(poked.blobs, w, h, 'poke');
	const pokedStep = Math.hypot(target.x - beforePoke.x, target.y - beforePoke.y);
	assert(pokedStep > cruiseStep, `poke: next step was only ${pokedStep.toFixed(4)}px`);

	const centred = createDrift(soloSeed, { random: lcg(37) });
	centred.resize(w, h);
	const centredTarget = centred.blobs[0];
	centred.poke(centredTarget.x, centredTarget.y);
	assert(Number.isFinite(centredTarget.kx) && Number.isFinite(centredTarget.ky), 'poke: centre fallback was not finite');
	assert(Math.hypot(centredTarget.kx, centredTarget.ky) > 0, 'poke: centre fallback did not shove');
	centred.step(dt);
	assertInside(centred.blobs, w, h, 'centre poke');

	const resizedHeld = createDrift(soloSeed, { random: () => 0 });
	resizedHeld.resize(1000, 1000);
	const resizedHeldBlob = resizedHeld.blobs[0];
	resizedHeld.grab(0, resizedHeldBlob.x, resizedHeldBlob.y);
	resizedHeld.move(700, 500);
	resizedHeld.step(dt);
	const heldBeforeResize = { x: resizedHeldBlob.x, y: resizedHeldBlob.y };
	resizedHeld.resize(1200, 1000);
	assert(
		Math.hypot(resizedHeldBlob.x - heldBeforeResize.x, resizedHeldBlob.y - heldBeforeResize.y) <= 1e-9,
		'held resize: resize snapped the blob to its pointer target'
	);
	resizedHeld.step(dt);
	assert(resizedHeldBlob.x > heldBeforeResize.x && resizedHeldBlob.x < 700, 'held resize: spring did not keep catching up');
	resizedHeld.move(-500, 500);
	resizedHeld.step(0.05);
	const offscreenSpringSpeed = Math.hypot(resizedHeldBlob.ux, resizedHeldBlob.uy);
	assertInside(resizedHeld.blobs, 1200, 1000, 'offscreen hold');
	for (let frame = 0; frame < 20; frame++) {
		resizedHeld.step(dt);
		assertInside(resizedHeld.blobs, 1200, 1000, 'offscreen hold settle');
	}
	assert(
		Math.hypot(resizedHeldBlob.ux, resizedHeldBlob.uy) < offscreenSpringSpeed * 0.001,
		'offscreen hold: clamped spring velocity did not decay'
	);
}

// Collision scenarios: ambient head-on contact, a glancing throw, a held push, a maximum-speed
// crossing attempt, coincident centres, and contact beside a wall. Positions are set after resize
// so each fixture isolates one response.
{
	const w = 1000;
	const h = 1000;
	const scale = 1000;
	const cruise = SPEED * scale;
	const dt = 1 / 60;

	const headOn = createDrift(pairSeeds, { random: () => 0 });
	headOn.resize(w, h);
	const [headA, headB] = headOn.blobs;
	Object.assign(headA, { x: 449.5, y: 500, vx: 1, vy: 0, kx: 0, ky: 0 });
	Object.assign(headB, { x: 550.5, y: 500, vx: -1, vy: 0, kx: 0, ky: 0 });
	headOn.step(0.05);
	assert(headA.ux < 0 && headB.ux > 0, 'head-on: approaching core velocities did not reverse');
	assertCoresSeparated(headOn.blobs, 'head-on');
	assertInside(headOn.blobs, w, h, 'head-on');
	assertVelocityState(headOn.blobs, scale, 'head-on');
	for (let frame = 0; frame < 600; frame++) {
		headOn.step(dt);
		assertCoresSeparated(headOn.blobs, 'head-on settling');
		assertInside(headOn.blobs, w, h, 'head-on settling');
		assertVelocityState(headOn.blobs, scale, 'head-on settling');
	}
	for (const [i, blob] of headOn.blobs.entries()) {
		assert(
			Math.abs(Math.hypot(blob.ux, blob.uy) - cruise) <= cruise * 0.01,
			`head-on: blob ${i} did not settle to cruise`
		);
	}

	const glancing = createDrift(pairSeeds, { random: () => 0 });
	glancing.resize(w, h);
	const [thrower, glancee] = glancing.blobs;
	Object.assign(thrower, { x: 140, y: 460, vx: 1, vy: 0, kx: 0, ky: 0 });
	Object.assign(glancee, { x: 600, y: 500, vx: -1, vy: 0, kx: 0, ky: 0 });
	glancing.grab(0, thrower.x, thrower.y);
	for (let frame = 1; frame <= 6; frame++) {
		glancing.move(140 + frame * 20, 460);
		glancing.step(dt);
	}
	glancing.release();
	let glanced = false;
	for (let frame = 0; frame < 60; frame++) {
		glancing.step(dt);
		assertCoresSeparated(glancing.blobs, 'glancing throw', FAST_CORE_COMPRESSION);
		assertInside(glancing.blobs, w, h, 'glancing throw');
		assertVelocityState(glancing.blobs, scale, 'glancing throw');
		if (thrower.uy < -1 && glancee.uy > 1) glanced = true;
	}
	assert(glanced, 'glancing throw: contact did not transfer opposing transverse velocities');

	const pushed = createDrift(pairSeeds, { random: () => 0 });
	pushed.resize(w, h);
	const [pusher, pushedBlob] = pushed.blobs;
	Object.assign(pusher, { x: 250, y: 500, vx: 1, vy: 0, kx: 0, ky: 0 });
	Object.assign(pushedBlob, { x: 400, y: 500, vx: 1, vy: 0, kx: 0, ky: 0 });
	pushed.grab(0, pusher.x, pusher.y);
	pushed.move(350, 500);
	pushed.step(0.05);
	assert(pusher.x > 250 && pusher.x < 350, 'held push: blob did not trail its pointer target');
	assert(pusher.ux > 0 && pusher.sx > 0, 'held push: spring motion did not drive held stretch');
	assert(pushedBlob.x > 400, 'held push: free blob was not moved out of the held path');
	assert(pushedBlob.ux > cruise * 10, 'held push: free blob did not inherit the pointer motion');
	assertCoresSeparated(pushed.blobs, 'held push', FAST_CORE_COMPRESSION);
	assertInside(pushed.blobs, w, h, 'held push');
	assert(
		Math.hypot(pushedBlob.kx, pushedBlob.ky) <= MAX_KICK * scale + 1e-6,
		'held push: free blob exceeded the kick cap'
	);
	for (let frame = 0; frame < 30; frame++) pushed.step(dt);
	assert(Math.abs(pusher.x - 350) <= 1e-6, 'held push: held spring did not converge to its target');

	// A far pointer update makes the exact hold spring much faster than one core per 8 ms. Spatial
	// subdivision must still sample the glancing contact instead of letting the held blob ghost through.
	const targetJump = createDrift(pairSeeds, { random: () => 0 });
	targetJump.resize(4000, 1000);
	const [jumpingBlob, jumpedBlob] = targetJump.blobs;
	Object.assign(jumpingBlob, { x: 500, y: 450, vx: 1, vy: 0, kx: 0, ky: 0 });
	Object.assign(jumpedBlob, { x: 1500, y: 500, vx: -1, vy: 0, kx: 0, ky: 0 });
	targetJump.grab(0, jumpingBlob.x, jumpingBlob.y);
	targetJump.move(3500, 550);
	targetJump.step(0.05);
	assert(jumpedBlob.x > 1550 && jumpedBlob.y > 520, 'held target jump tunneled without moving the free blob');
	assert(
		Math.hypot(jumpedBlob.ux, jumpedBlob.uy) > cruise * 50,
		'held target jump did not transfer clear contact momentum'
	);
	assertInside(targetJump.blobs, 4000, 1000, 'held target jump');
	assert(
		Number.isFinite(jumpedBlob.ux) && Math.hypot(jumpedBlob.kx, jumpedBlob.ky) <= MAX_KICK * scale + 1e-6,
		'held target jump produced an invalid free-body velocity'
	);

	const crossing = createDrift(pairSeeds, { random: () => 0 });
	crossing.resize(w, h);
	const [fastA, fastB] = crossing.blobs;
	Object.assign(fastA, { x: 425, y: 500, vx: 1, vy: 0, kx: MAX_KICK * scale, ky: 0 });
	Object.assign(fastB, { x: 575, y: 500, vx: -1, vy: 0, kx: -MAX_KICK * scale, ky: 0 });
	crossing.step(0.05);
	assert(fastA.x < fastB.x, 'max-speed collision tunneled through the opposing blob');
	assert(fastA.ux < 0 && fastB.ux > 0, 'max-speed collision did not reverse the normal velocities');
	assertCoresSeparated(crossing.blobs, 'max-speed collision', FAST_CORE_COMPRESSION);
	assertInside(crossing.blobs, w, h, 'max-speed collision');
	assertVelocityState(crossing.blobs, scale, 'max-speed collision');

	const coincident = createDrift(pairSeeds, { random: () => 0 });
	coincident.resize(w, h);
	const [sameA, sameB] = coincident.blobs;
	Object.assign(sameA, { x: 500, y: 500, vx: 1, vy: 0, kx: 0, ky: 0 });
	Object.assign(sameB, { x: 500, y: 500, vx: 1, vy: 0, kx: 0, ky: 0 });
	for (let frame = 0; frame < 30; frame++) coincident.step(dt);
	assertCoresSeparated(coincident.blobs, 'coincident centres');
	assertInside(coincident.blobs, w, h, 'coincident centres');
	assertVelocityState(coincident.blobs, scale, 'coincident centres');
	for (const [i, blob] of coincident.blobs.entries()) {
		assert(Number.isFinite(blob.x) && Number.isFinite(blob.y), `coincident centres: blob ${i} became non-finite`);
	}

	const wallContact = createDrift(pairSeeds, { random: () => 0 });
	wallContact.resize(w, h);
	const [wallBlob, incomingBlob] = wallContact.blobs;
	Object.assign(wallBlob, { x: EDGE * wallBlob.r, y: 500, vx: -1, vy: 0, kx: 0, ky: 0 });
	Object.assign(incomingBlob, {
		x: EDGE * wallBlob.r + 101,
		y: 500,
		vx: -1,
		vy: 0,
		kx: -0.5 * scale,
		ky: 0
	});
	wallContact.step(0.05);
	assertCoresSeparated(wallContact.blobs, 'wall contact');
	assertInside(wallContact.blobs, w, h, 'wall contact');
	assertVelocityState(wallContact.blobs, scale, 'wall contact');
	// The contact spring can keep compressing briefly after the first wall reflection.
	wallContact.step(0.05);
	assert(wallBlob.ux > 0, 'wall contact: pinned blob did not rebound into the viewport');

	const wallStretch = createDrift(soloSeed, { random: () => 0 });
	wallStretch.resize(w, h);
	const wallStretchBlob = wallStretch.blobs[0];
	Object.assign(wallStretchBlob, {
		x: w - EDGE * wallStretchBlob.r - 20,
		y: 500,
		vx: 1,
		vy: 0,
		kx: scale,
		ky: 0
	});
	wallStretch.step(dt);
	assert(wallStretchBlob.sx > 0, 'wall stretch: incoming stretch never formed');
	wallStretch.step(0.008);
	assert(wallStretchBlob.ux < 0, 'wall stretch: throw did not rebound');
	assert(wallStretchBlob.sx > 0, 'wall stretch: render axis snapped on impact');
	assert(
		Math.abs(wallStretchBlob.kx) > 0.65 * scale && Math.abs(wallStretchBlob.kx) < 0.7 * scale,
		'wall stretch: reflection did not retain 70% of the decayed throw'
	);

	const slowedWall = createDrift(soloSeed, { random: () => 0 });
	slowedWall.resize(w, h);
	const slowedWallBlob = slowedWall.blobs[0];
	Object.assign(slowedWallBlob, {
		x: w - EDGE * slowedWallBlob.r - 0.01,
		y: 500,
		vx: 1,
		vy: 0,
		kx: -cruise / 2,
		ky: 0
	});
	slowedWall.step(0.008);
	assert(slowedWallBlob.ux < 0, 'negative-kick wall: slowed outward blob did not reflect');
	assert(
		Math.abs(slowedWallBlob.ux) <= cruise + 1e-6,
		'negative-kick wall: reflection injected speed above ambient cruise'
	);
	assertInside(slowedWall.blobs, w, h, 'negative-kick wall');

	const opposedWall = createDrift(soloSeed, { random: () => 0 });
	opposedWall.resize(w, h);
	const opposedWallBlob = opposedWall.blobs[0];
	Object.assign(opposedWallBlob, {
		x: w - EDGE * opposedWallBlob.r - 0.01,
		y: 500,
		vx: -1,
		vy: 0,
		kx: cruise + 2,
		ky: 0
	});
	opposedWall.step(0.008);
	assert(opposedWallBlob.ux < 0, 'opposed wall: outward total velocity did not reflect');
	assert(
		Math.abs(opposedWallBlob.ux) <= cruise + 1e-6,
		'opposed wall: reflecting inward cruise plus outward poke injected speed'
	);
	assertInside(opposedWall.blobs, w, h, 'opposed wall');

	const unequal = createDrift(unequalSeeds, { random: () => 0 });
	unequal.resize(w, h);
	const [largeBlob, smallBlob] = unequal.blobs;
	Object.assign(largeBlob, { x: 443.25, y: 500, vx: 1, vy: 0, kx: 0, ky: 0 });
	Object.assign(smallBlob, { x: 556.75, y: 500, vx: -1, vy: 0, kx: 0, ky: 0 });
	unequal.step(0.05);
	assert(smallBlob.ux > largeBlob.ux, 'unequal mass: the smaller blob did not yield more');
	assertCoresSeparated(unequal.blobs, 'unequal mass');
	assertVelocityState(unequal.blobs, scale, 'unequal mass');

	const separating = createDrift(pairSeeds, { random: () => 0 });
	separating.resize(w, h);
	const [leftBlob, rightBlob] = separating.blobs;
	Object.assign(leftBlob, { x: 455, y: 500, vx: -1, vy: 0, kx: -300, ky: 0 });
	Object.assign(rightBlob, { x: 545, y: 500, vx: 1, vy: 0, kx: 300, ky: 0 });
	separating.step(dt);
	const allowedSeparatingSpeed = cruise + 300 * Math.exp(-dt / 0.7);
	assert(
		Math.abs(Math.abs(leftBlob.ux) - allowedSeparatingSpeed) <= 1e-6,
		'separating overlap: left speed changed beyond ordinary kick decay'
	);
	assert(
		Math.abs(Math.abs(rightBlob.ux) - allowedSeparatingSpeed) <= 1e-6,
		'separating overlap: right speed changed beyond ordinary kick decay'
	);
	assertVelocityState(separating.blobs, scale, 'separating overlap');
}

console.log('blobDrift check passed');
