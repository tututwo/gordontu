// Run with `node src/lib/landingPage/blobDrift.check.js`: every blob stays bounded, keeps cruising,
// and exchanges momentum through deterministic soft-core contacts.
import { COLLISION_EDGE, createDrift, EDGE, MAX_KICK, SPEED } from './blobDrift.js';
import { landingBlobs as seeds } from './blobSeeds.js';

/** Ambient contacts stay nearly round. */
const MAX_CORE_COMPRESSION = 0.09;

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

/** @param {import('./blobDrift.js').Blob[]} blobs @param {string} label */
function assertCoresSeparated(blobs, label) {
	for (let i = 0; i < blobs.length; i++) {
		for (let j = i + 1; j < blobs.length; j++) {
			const distance = Math.hypot(blobs[j].x - blobs[i].x, blobs[j].y - blobs[i].y);
			const contact = COLLISION_EDGE * (blobs[i].r + blobs[j].r);
			assert(
				distance >= contact * (1 - MAX_CORE_COMPRESSION) - 1e-6,
				`${label}: blob cores ${i}/${j} overlapped by ${(contact - distance).toFixed(2)}px`
			);
		}
	}
}

/** @param {import('./blobDrift.js').Blob[]} blobs @param {number} scale @param {string} label */
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
		assert(Math.hypot(blob.ux, blob.uy) <= cruise + maxKick + 1e-6, `${label}: blob ${i} exceeded the total speed cap`);
	}
}

/** @type {import('./blobDrift.js').Seed[]} */
const soloSeed = [{ home: [0.5, 0.5], radius: 0.12 }];
/** @type {import('./blobDrift.js').Seed[]} */
const pairSeeds = [
	{ home: [0.35, 0.5], radius: 0.1 },
	{ home: [0.65, 0.5], radius: 0.1 }
];

// With no contact or input, subdivision preserves the exact straight-line cruise.
{
	const w = 4000;
	const h = 1000;
	const drift = createDrift(soloSeed, { random: () => 0.125 });
	drift.resize(w, h);
	const expected = SPEED * Math.min(w, h) * 0.05;
	for (let frame = 0; frame < 100; frame++) {
		const before = { x: drift.blobs[0].x, y: drift.blobs[0].y };
		drift.step(0.05);
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

// The landing seeds stay inside, keep cruising, and never tunnel through each other for two
// minutes on a desktop and a phone, then survive a resize.
for (const [w, h] of [
	[1672, 941],
	[390, 844]
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

// Contact: head-on cores reverse and settle back to cruise; a far pointer jump on a held blob is
// subdivided finely enough to hit the blob in its path instead of ghosting through it.
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
}

console.log('blobDrift check passed');
