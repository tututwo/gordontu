/**
 * Drift for the landing Blob field: three soft discs cruise across the whole viewport, bounce off
 * its edges, and collide at their solid inner cores. Pure math in CSS px with a y-up origin
 * (bottom-left, the shader's frame) — no DOM, no Svelte; `blobDrift.check.js` proves the invariants.
 */

/** Cruising speed per second as a fraction of min(width, height). */
export const SPEED = 0.02;
/** Fastest extra velocity from a throw or poke, as a fraction of min(width, height) per second. */
export const MAX_KICK = 2.5;
/** A blob bounces when this fraction of its radius meets an edge: the dense paint, not the last speckle. */
export const EDGE = 0.75;
/** Blob cores collide here; their feathered paint can still overlap into a metaball-like neck. */
export const COLLISION_EDGE = 0.5;
/** Hard impacts above this viewport-relative speed flash and shed paint. */
const HARD = 0.25;
/** Fixed number of short-lived paint droplets shared by every blob. */
export const DROPS = 9;
/** Seconds before a paint droplet has shrunk away. */
const DROP_LIFE = 5;
/** Colour borrowed from another blob per scale-relative impact speed. */
const MIX_RATE = 0.05;
/** Most colour a blob can borrow in one contact. */
export const MIX_CAP = 0.1;
/** Most borrowed colour a blob can carry across all contacts. */
const MIX_TOTAL = 0.5;
/** Minimum viewport-relative speed for a blob to enter a corner pocket. */
const SINK_SPEED = 0.35;
/** Extra corner tolerance as a fraction of the blob radius. */
const POCKET = 0.15;
/** Seconds spent shrinking into a pocket. */
export const SINK_TIME = 0.35;
/** Seconds spent growing back at the seed position. */
export const GROW_TIME = 0.5;
/** Longest step integrated at once; a background tab's first frame back is not a jump. */
const MAX_DT = 0.05;
/** Fixed physics slice; keeps the contact spring stable and fast bodies from tunnelling. */
const SUBSTEP = 0.008;
/** A held centre advances at most this share of the smallest core radius per physics slice. */
const HELD_TRAVEL = 0.5;
/** Nominal response window for the critically damped spring that trails a held blob behind its target. */
const HOLD_RESPONSE = 0.08;
/** Nominal response window for the spring that pushes overlapping blob cores apart. */
const CONTACT_RESPONSE = 0.1;
/** Contact damping ratio; below one leaves a small, organic rebound. */
const CONTACT_DAMPING = 0.6;
/** Share of extra throw/poke velocity retained when a blob reflects off a viewport edge. */
const WALL_RESTITUTION = 0.7;
/** Time constant for the velocity vector used only by the renderer's squash/stretch. */
const STRETCH_TAU = 0.06;
/** Time constant in seconds for extra throw/poke velocity to decay. */
const KICK_TAU = 0.7;
/** Time constant in seconds for the held pointer-velocity estimate. */
const VEL_TAU = 0.05;
/** Poke speed at the press, as a fraction of the viewport scale per second. */
const POKE = 0.5;
/** Distance where a poke fades to zero, as a fraction of the viewport scale. */
const POKE_REACH = 0.5;
/**
 * @typedef {object} Seed
 * @property {[number, number]} home  x, y as fractions of the viewport, origin bottom-left
 * @property {number} radius  fraction of min(width, height)
 */

/**
 * @typedef {object} Blob
 * @property {number} x
 * @property {number} y
 * @property {number} r
 * @property {number} vx  unit direction; scaled by SPEED in step()
 * @property {number} vy
 * @property {number} kx  decaying extra velocity in CSS px/s
 * @property {number} ky
 * @property {number} ux  total current velocity in CSS px/s, for rendering effects
 * @property {number} uy
 * @property {number} sx  smoothed render velocity in CSS px/s
 * @property {number} sy
 * @property {number} flash  hard-impact highlight, 0..1
 * @property {number[]} mix  temporary weights borrowed from the other seed colours
 * @property {number} sink  seconds through the sink/respawn timeline, or -1 while free
 */

/**
 * @param {Seed[]} seeds
 * @param {{ random?: () => number }} [options]  inject `random` for a deterministic run
 */
export function createDrift(seeds, { random = Math.random } = {}) {
	let width = 0;
	let height = 0;
	let scale = 1;
	// Headings fan out evenly from one random spin so the three never set off the same way.
	const spin = random() * Math.PI * 2;
	/** @type {Blob[]} */
	const blobs = seeds.map((_, i) => {
		const heading = spin + (i / seeds.length) * Math.PI * 2;
		return {
			x: 0,
			y: 0,
			r: 1,
			vx: Math.cos(heading),
			vy: Math.sin(heading),
			kx: 0,
			ky: 0,
			ux: 0,
			uy: 0,
			sx: 0,
			sy: 0,
			flash: 0,
			mix: seeds.map(() => 0),
			sink: -1
		};
	});
	const drops = Array.from({ length: DROPS }, () => ({
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		r: 0,
		r0: 0,
		life: 0,
		parent: 0
	}));
	const touching = new Uint8Array(blobs.length * blobs.length);
	/** @type {number[]} */
	const sunk = [];
	const pockets = [0, 0, 0, 0];
	let nextDrop = 0;
	let held = -1;
	let ox = 0;
	let oy = 0;
	let tx = 0;
	let ty = 0;
	let ptx = 0;
	let pty = 0;
	let hvx = 0;
	let hvy = 0;
	let hsx = 0;
	let hsy = 0;

	/**
	 * Shed a few reusable paint droplets through a broad fan.
	 * @param {number} x
	 * @param {number} y
	 * @param {number} angle
	 * @param {number} impact
	 * @param {number} parent
	 * @param {number} count
	 */
	function splash(x, y, angle, impact, parent, count) {
		for (; count > 0; count--) {
			const a = angle + (random() - 0.5) * 2.6;
			const speed = impact * (0.4 + 0.4 * random());
			Object.assign(drops[nextDrop++ % DROPS], {
				x,
				y,
				vx: Math.cos(a) * speed,
				vy: Math.sin(a) * speed,
				r: 0,
				r0: blobs[parent].r * (0.08 + 0.07 * random()),
				life: DROP_LIFE,
				parent
			});
		}
	}

	/**
	 * Clamp anything past an edge and reflect only an outward total velocity. Free blobs keep their
	 * cruise speed plus 70% of any scalar excess, so opposing cruise/kick vectors cannot add energy.
	 * @param {Blob} blob
	 * @param {number} i
	 */
	function bounce(blob, i) {
		if (blob.sink >= 0) return;
		// A viewport narrower than the blob just pins it to the middle instead of flapping.
		const rx = Math.min(EDGE * blob.r, width / 2);
		const ry = Math.min(EDGE * blob.r, height / 2);
		const [ux, uy] = velocity(blob, i);
		let reflectX = false;
		let reflectY = false;
		if (blob.x < rx) {
			blob.x = rx;
			reflectX = ux < 0;
		} else if (blob.x > width - rx) {
			blob.x = width - rx;
			reflectX = ux > 0;
		}
		if (blob.y < ry) {
			blob.y = ry;
			reflectY = uy < 0;
		} else if (blob.y > height - ry) {
			blob.y = height - ry;
			reflectY = uy > 0;
		}
		if (!reflectX && !reflectY) return;
		if (i === held) {
			if (reflectX) hsx *= -WALL_RESTITUTION;
			if (reflectY) hsy *= -WALL_RESTITUTION;
			return;
		}
		const speed = Math.hypot(ux, uy);
		const impact = Math.hypot(reflectX ? ux : 0, reflectY ? uy : 0);
		if (impact > HARD * scale) {
			const nx = reflectX ? (blob.x === rx ? 1 : -1) : 0;
			const ny = reflectY ? (blob.y === ry ? 1 : -1) : 0;
			blob.flash = Math.max(blob.flash, Math.min(1, impact / scale));
			splash(
				blob.x - nx * EDGE * blob.r,
				blob.y - ny * EDGE * blob.r,
				Math.atan2(ny, nx),
				impact,
				i,
				3 + Math.floor(random() * 3)
			);
		}
		if (
			Math.min(blob.x - rx, width - rx - blob.x) < POCKET * blob.r &&
			Math.min(blob.y - ry, height - ry - blob.y) < POCKET * blob.r &&
			speed > SINK_SPEED * scale
		) {
			blob.sink = 0;
			blob.kx = blob.ky = 0;
			sunk.push(i);
			return;
		}
		const cruise = SPEED * scale;
		const retained = speed > cruise ? cruise + (speed - cruise) * WALL_RESTITUTION : speed;
		const retention = speed > 1e-9 ? retained / speed : 1;
		setVelocity(blob, (reflectX ? -ux : ux) * retention, (reflectY ? -uy : uy) * retention);
	}

	/** @param {Blob} blob @param {number} x @param {number} y Add a capped extra velocity. */
	function kick(blob, x, y) {
		blob.kx += x;
		blob.ky += y;
		const speed = Math.hypot(blob.kx, blob.ky);
		const limit = MAX_KICK * scale;
		if (speed > limit) {
			blob.kx *= limit / speed;
			blob.ky *= limit / speed;
		}
	}

	/**
	 * Store a total velocity as a unit cruise heading plus a collinear decaying kick. Re-aiming the
	 * cruise matters after a collision: once the kick fades, the blobs must not steer back together.
	 * @param {Blob} blob
	 * @param {number} x
	 * @param {number} y
	 */
	function setVelocity(blob, x, y) {
		const cruise = SPEED * scale;
		const speed = Math.hypot(x, y);
		if (speed < 1e-9) {
			// A perfectly inelastic result rests for this instant, then eases back to its old cruise.
			blob.kx = -blob.vx * cruise;
			blob.ky = -blob.vy * cruise;
			blob.ux = 0;
			blob.uy = 0;
			return;
		}
		const nx = x / speed;
		const ny = y / speed;
		const limited = Math.min(speed, (SPEED + MAX_KICK) * scale);
		const extra = limited - cruise;
		blob.vx = nx;
		blob.vy = ny;
		blob.kx = nx * extra;
		blob.ky = ny * extra;
		blob.ux = nx * limited;
		blob.uy = ny * limited;
	}

	/** @param {Blob} blob @param {number} i Current total velocity, including a held pointer. */
	function velocity(blob, i) {
		return i === held
			? [hsx, hsy]
			: [blob.vx * SPEED * scale + blob.kx, blob.vy * SPEED * scale + blob.ky];
	}

	/** @param {number} dt Keep physical velocity current and ease the renderer's stretch axis toward it. */
	function refreshVelocities(dt) {
		const stretchEase = 1 - Math.exp(-dt / STRETCH_TAU);
		blobs.forEach((blob, i) => {
			[blob.ux, blob.uy] = velocity(blob, i);
			blob.sx += (blob.ux - blob.sx) * stretchEase;
			blob.sy += (blob.uy - blob.sy) * stretchEase;
		});
		pockets.fill(0);
		blobs.forEach((blob) => {
			if (blob.sink >= 0) return;
			const fast = Math.min(
				1,
				Math.max(0, Math.hypot(blob.ux, blob.uy) / (SINK_SPEED * scale) - 0.5) * 2
			);
			if (!fast) return;
			for (let corner = 0; corner < 4; corner++) {
				const near =
					1 -
					Math.hypot(
						blob.x - (corner % 2) * width,
						blob.y - (corner >> 1) * height
					) /
						(2 * blob.r);
				pockets[corner] = Math.max(pockets[corner], fast * Math.max(0, near));
			}
		});
	}

	/**
	 * Exact critically damped state after dt for one axis.
	 * @param {number} position
	 * @param {number} speed
	 * @param {number} target
	 * @param {number} dt
	 * @param {number} response
	 * @returns {[number, number]}
	 */
	function springAxis(position, speed, target, dt, response) {
		const decay = Math.exp(-response * dt);
		const offset = position - target;
		const slope = speed + response * offset;
		return [
			target + (offset + slope * dt) * decay,
			(speed - response * slope * dt) * decay
		];
	}

	/**
	 * Conservative component-speed bound for the exact spring over [0, dt]. Its extrema occur at
	 * either endpoint or where acceleration is zero; combining both axis bounds limits path travel.
	 * @param {number} position
	 * @param {number} speed
	 * @param {number} target
	 * @param {number} dt
	 * @param {number} response
	 */
	function springAxisSpeedBound(position, speed, target, dt, response) {
		const slope = speed + response * (position - target);
		/** @param {number} t */
		const at = (t) => Math.abs((speed - response * slope * t) * Math.exp(-response * t));
		let bound = Math.max(Math.abs(speed), at(dt));
		if (Math.abs(slope) > 1e-12) {
			const extremum = (slope + speed) / (response * slope);
			if (extremum > 0 && extremum < dt) bound = Math.max(bound, at(extremum));
		}
		return bound;
	}

	/**
	 * Let overlapping cores compress and push off through a spring-damper. Radius-squared mass makes
	 * smaller paint daubs yield more; a held blob has infinite mass, but contributes its real motion.
	 * @param {number} dt
	 */
	function collide(dt) {
		const response = (2 * Math.PI) / CONTACT_RESPONSE;
		for (let i = 0; i < blobs.length; i++) {
			for (let j = i + 1; j < blobs.length; j++) {
				const a = blobs[i];
				const b = blobs[j];
				const pair = i * blobs.length + j;
				if (a.sink >= 0 || b.sink >= 0) {
					touching[pair] = 0;
					continue;
				}
				const contact = COLLISION_EDGE * (a.r + b.r);
				let dx = b.x - a.x;
				let dy = b.y - a.y;
				let distance = Math.hypot(dx, dy);
				if (distance >= contact) {
					touching[pair] = 0;
					continue;
				}

				const [avx, avy] = velocity(a, i);
				const [bvx, bvy] = velocity(b, j);
				if (distance > 1e-9) {
					dx /= distance;
					dy /= distance;
				} else {
					// At one centre, point against relative travel (where the pair came from).
					const rvx = bvx - avx;
					const rvy = bvy - avy;
					const relativeSpeed = Math.hypot(rvx, rvy);
					dx = relativeSpeed > 1e-9 ? -rvx / relativeSpeed : (i + j) % 2 ? 1 : -1;
					dy = relativeSpeed > 1e-9 ? -rvy / relativeSpeed : 0;
					distance = 0;
				}

				const approach = (bvx - avx) * dx + (bvy - avy) * dy;
				if (!touching[pair]) {
					touching[pair] = 1;
					const impact = Math.max(0, -approach);
					const amount = Math.min(MIX_CAP, (MIX_RATE * impact) / scale);
					const roomA = Math.max(0, MIX_TOTAL - a.mix.reduce((sum, weight) => sum + weight, 0));
					const roomB = Math.max(0, MIX_TOTAL - b.mix.reduce((sum, weight) => sum + weight, 0));
					a.mix[j] += Math.min(amount, roomA);
					b.mix[i] += Math.min(amount, roomB);
					if (impact > HARD * scale) {
						const flash = Math.min(1, impact / scale);
						a.flash = Math.max(a.flash, flash);
						b.flash = Math.max(b.flash, flash);
						const x = a.x + dx * COLLISION_EDGE * a.r;
						const y = a.y + dy * COLLISION_EDGE * a.r;
						const tangent = Math.atan2(dy, dx) + Math.PI / 2;
						splash(x, y, tangent, impact, i, 2 + Math.floor(random() * 2));
						splash(x, y, tangent + Math.PI, impact, j, 2 + Math.floor(random() * 2));
					}
				}
				const relativeAcceleration =
					response * response * (contact - distance) - 2 * CONTACT_DAMPING * response * approach;
				// A contact can push, never pull two bodies back together once they are parting quickly.
				if (relativeAcceleration <= 0) continue;

				const invA = i === held ? 0 : 1 / (a.r * a.r);
				const invB = j === held ? 0 : 1 / (b.r * b.r);
				const inverseMass = invA + invB;
				if (!inverseMass) continue;
				if (invA) {
					setVelocity(
						a,
						avx - dx * relativeAcceleration * (invA / inverseMass) * dt,
						avy - dy * relativeAcceleration * (invA / inverseMass) * dt
					);
				}
				if (invB) {
					setVelocity(
						b,
						bvx + dx * relativeAcceleration * (invB / inverseMass) * dt,
						bvy + dy * relativeAcceleration * (invB / inverseMass) * dt
					);
				}
			}
		}
	}

	return {
		blobs,
		drops,
		sunk,
		pockets,

		/** @param {number} w @param {number} h CSS px */
		resize(w, h) {
			const first = width === 0;
			const widthScale = first ? 0 : w / width;
			const heightScale = first ? 0 : h / height;
			width = w;
			height = h;
			scale = Math.min(w, h);
			blobs.forEach((blob, i) => {
				// First layout places every blob at home; later resizes re-frame free blobs. A held
				// blob keeps its actual CSS-px position and lets the spring continue toward its target.
				blob.x = first ? seeds[i].home[0] * w : i === held ? blob.x : blob.x * widthScale;
				blob.y = first ? seeds[i].home[1] * h : i === held ? blob.y : blob.y * heightScale;
				blob.r = seeds[i].radius * scale;
				// A smaller responsive viewport also lowers the px/s cap.
				kick(blob, 0, 0);
				bounce(blob, i);
			});
			// Soft contacts resolve responsive overlaps over the opening frames, rather than popping here.
			refreshVelocities(0);
		},

		/** @param {number} x @param {number} y Return the nearest blob whose dense paint contains this point. */
		hit(x, y) {
			let nearest = -1;
			let nearestDistance = Infinity;
			blobs.forEach((blob, i) => {
				if (blob.sink >= 0) return;
				const distance = Math.hypot(x - blob.x, y - blob.y) / blob.r;
				if (distance < EDGE && distance < nearestDistance) {
					nearest = i;
					nearestDistance = distance;
				}
			});
			return nearest;
		},

		/** @param {number} i @param {number} x @param {number} y Hold without snapping to the pointer. */
		grab(i, x, y) {
			const blob = blobs[i];
			if (!blob || blob.sink >= 0) return;
			held = i;
			ox = blob.x - x;
			oy = blob.y - y;
			tx = ptx = x + ox;
			ty = pty = y + oy;
			hvx = 0;
			hvy = 0;
			hsx = blob.ux;
			hsy = blob.uy;
		},

		/** @param {number} x @param {number} y Update the held target; step() applies and samples it. */
		move(x, y) {
			if (held < 0) return;
			tx = x + ox;
			ty = y + oy;
		},

		/** Release the held blob, turning pointer velocity into a decaying kick. */
		release() {
			if (held < 0) return;
			const blob = blobs[held];
			held = -1;
			hsx = 0;
			hsy = 0;
			blob.kx = 0;
			blob.ky = 0;
			const speed = Math.hypot(hvx, hvy);
			if (speed >= 1) {
				blob.vx = hvx / speed;
				blob.vy = hvy / speed;
				const extra = speed - SPEED * scale;
				kick(blob, blob.vx * extra, blob.vy * extra);
			}
			hvx = 0;
			hvy = 0;
		},

		/** @param {number} x @param {number} y Push nearby blobs radially away from this point. */
		poke(x, y) {
			const reach = POKE_REACH * scale;
			if (reach <= 0) return;
			for (const blob of blobs) {
				if (blob.sink >= 0) continue;
				const dx = blob.x - x;
				const dy = blob.y - y;
				const distance = Math.hypot(dx, dy);
				const force = Math.max(0, 1 - distance / reach);
				if (force === 0) continue;
				const nx = distance ? dx / distance : blob.vx;
				const ny = distance ? dy / distance : blob.vy;
				kick(blob, nx * force * POKE * scale, ny * force * POKE * scale);
			}
		},

		/** @param {number} dt seconds */
		step(dt) {
			if (dt <= 0) return;
			const h = Math.min(dt, MAX_DT);
			const ease = 1 - Math.exp(-h / VEL_TAU);
			if (held >= 0) {
				hvx += ((tx - ptx) / h - hvx) * ease;
				hvy += ((ty - pty) / h - hvy) * ease;
			}

			let steps = Math.ceil(h / SUBSTEP);
			let holdTargetX = 0;
			let holdTargetY = 0;
			const holdResponse = (2 * Math.PI) / HOLD_RESPONSE;
			if (held >= 0) {
				const heldBlob = blobs[held];
				const rx = Math.min(EDGE * heldBlob.r, width / 2);
				const ry = Math.min(EDGE * heldBlob.r, height / 2);
				holdTargetX = Math.min(Math.max(tx, rx), width - rx);
				holdTargetY = Math.min(Math.max(ty, ry), height - ry);
				const speedBoundX = springAxisSpeedBound(
					heldBlob.x,
					hsx,
					holdTargetX,
					h,
					holdResponse
				);
				const speedBoundY = springAxisSpeedBound(
					heldBlob.y,
					hsy,
					holdTargetY,
					h,
					holdResponse
				);
				const smallestCore = blobs.reduce(
					(smallest, blob) =>
						blob.sink < 0 ? Math.min(smallest, COLLISION_EDGE * blob.r) : smallest,
					Infinity
				);
				if (smallestCore > 0) {
					const spatialSteps = Math.ceil(
						(Math.hypot(speedBoundX, speedBoundY) * h) / (HELD_TRAVEL * smallestCore)
					);
					steps = Math.max(steps, spatialSteps);
				}
			}
			const substep = h / steps;
			const decay = Math.exp(-substep / KICK_TAU);
			const cruise = SPEED * scale;
			for (let n = 0; n < steps; n++) {
				blobs.forEach((blob, i) => {
					if (blob.sink >= 0) return;
					if (i === held) {
						[blob.x, hsx] = springAxis(blob.x, hsx, holdTargetX, substep, holdResponse);
						[blob.y, hsy] = springAxis(blob.y, hsy, holdTargetY, substep, holdResponse);
					} else {
						const ux = blob.vx * cruise + blob.kx;
						const uy = blob.vy * cruise + blob.ky;
						blob.x += ux * substep;
						blob.y += uy * substep;
						blob.kx *= decay;
						blob.ky *= decay;
					}
				});
				collide(substep);
				blobs.forEach(bounce);
			}
			if (held >= 0) {
				ptx = tx;
				pty = ty;
			}
			const flashDecay = Math.exp(-h / 0.15);
			const mixDecay = Math.exp(-h / 10);
			blobs.forEach((blob, i) => {
				blob.flash *= flashDecay;
				blob.mix.forEach((weight, j) => (blob.mix[j] = weight * mixDecay));
				if (blob.sink < 0) return;
				const was = blob.sink;
				const full = seeds[i].radius * scale;
				blob.sink += h;
				if (blob.sink < SINK_TIME) {
					blob.r = full * (1 - blob.sink / SINK_TIME);
					const rx = Math.min(EDGE * blob.r, width / 2);
					const ry = Math.min(EDGE * blob.r, height / 2);
					blob.x = blob.x < width / 2 ? rx : width - rx;
					blob.y = blob.y < height / 2 ? ry : height - ry;
				} else if (blob.sink < SINK_TIME + GROW_TIME) {
					if (was < SINK_TIME) {
						blob.x = seeds[i].home[0] * width;
						blob.y = seeds[i].home[1] * height;
						const heading = random() * Math.PI * 2;
						blob.vx = Math.cos(heading);
						blob.vy = Math.sin(heading);
						blob.kx = blob.ky = 0;
					}
					blob.r = full * ((blob.sink - SINK_TIME) / GROW_TIME);
				} else {
					blob.r = full;
					blob.sink = -1;
				}
			});
			drops.forEach((drop) => {
				drop.life = Math.max(0, drop.life - h);
				drop.x += drop.vx * h;
				drop.y += drop.vy * h;
				drop.r = drop.r0 * (drop.life / DROP_LIFE);
			});
			refreshVelocities(h);
		}
	};
}
