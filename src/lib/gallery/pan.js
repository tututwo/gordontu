// ponytail: threshold / capture / velocity-fit / click-suppression are copied from
// src/lib/landingPage/wallMotion.svelte.js and generalised to two axes; extract a shared
// module once the wall stops changing. Inertia is exponential decay (no step to snap to).
const DECELERATION_RATE = 0.998; // per ms
const MAX_RELEASE_SPEED = 4; // px per ms
const POINTER_HISTORY_WINDOW = 110;
const DRAG_THRESHOLD = 8;
const NUDGE = 160;
const RUBBER = 0.35; // how much of an overscroll the finger actually gets
const RETURN_RATE = 0.99; // per ms, ease back inside after release

/** @param {number} value @param {number} minimum @param {number} maximum */
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

/**
 * Drag / flick / wheel / arrow-key panning of a bounded plane.
 *
 * Interface: `x`, `y` (screen px, +x right, +y down — the scene flips y), `attach(node)`,
 * `stop()`. Options: `ontap(event)` for a press that never became a drag, `locked()` to
 * ignore input (card open), `reduced()` to skip inertia, `limits()` for the half-extents the
 * position is clamped to, `onchange()` to wake the renderer.
 * Plain fields on purpose: the render loop samples them each frame, nothing else needs to react.
 */
export class Pan {
	x = 0;
	y = 0;
	isDragging = false;

	#ontap;
	#locked;
	#reduced;
	#limits;
	#onchange;

	#velocityX = 0;
	#velocityY = 0;
	#animationFrame = 0;
	#previousFrameTime = 0;

	/** @type {number | undefined} */
	#pointerId;
	#dragStartX = 0;
	#dragStartY = 0;
	#dragStartPanX = 0;
	#dragStartPanY = 0;
	/** @type {{ x: number; y: number; time: number }[]} */
	#pointerHistory = [];
	#suppressTap = false;

	/**
	 * @param {{
	 *   ontap?: (event: PointerEvent) => void,
	 *   locked?: () => boolean,
	 *   reduced?: () => boolean,
	 *   limits?: () => { x: number, y: number },
	 *   onchange?: () => void
	 * }} options
	 */
	constructor({
		ontap = () => {},
		locked = () => false,
		reduced = () => false,
		limits = () => ({ x: Infinity, y: Infinity }),
		onchange = () => {}
	} = {}) {
		this.#ontap = ontap;
		this.#locked = locked;
		this.#reduced = reduced;
		this.#limits = limits;
		this.#onchange = onchange;
	}

	/** Hard clamp — for wheel and keyboard, which have no finger to rubber-band against. */
	#clamp() {
		const { x, y } = this.#limits();
		this.x = clamp(this.x, -x, x);
		this.y = clamp(this.y, -y, y);
	}

	/**
	 * Rubber band: past an edge the finger still moves the plane, just with growing resistance,
	 * so the plane never feels like it hit a wall. @param {number} value @param {number} limit
	 */
	static #rubber(value, limit) {
		const over = Math.abs(value) - limit;
		if (over <= 0) return value;
		return Math.sign(value) * (limit + over * RUBBER);
	}

	/** Ease the plane back inside after a release out of bounds; kills momentum in that direction. @param {number} dt ms */
	#settleEdges(dt) {
		const { x, y } = this.#limits();
		const homeX = clamp(this.x, -x, x);
		const homeY = clamp(this.y, -y, y);
		const pull = 1 - RETURN_RATE ** dt;
		let outside = false;
		if (homeX !== this.x) {
			this.#velocityX = 0;
			this.x = Math.abs(homeX - this.x) < 0.5 ? homeX : this.x + (homeX - this.x) * pull;
			outside ||= this.x !== homeX;
		}
		if (homeY !== this.y) {
			this.#velocityY = 0;
			this.y = Math.abs(homeY - this.y) < 0.5 ? homeY : this.y + (homeY - this.y) * pull;
			outside ||= this.y !== homeY;
		}
		return outside;
	}

	stop() {
		if (this.#animationFrame) cancelAnimationFrame(this.#animationFrame);
		this.#animationFrame = 0;
		this.#velocityX = 0;
		this.#velocityY = 0;
	}

	/** @param {number} dx @param {number} dy */
	nudge(dx, dy) {
		if (this.#locked()) return;
		if (this.#reduced()) {
			this.x += dx;
			this.y += dy;
			this.#clamp();
			this.#onchange();
			return;
		}
		// An impulse that coasts exactly (dx, dy) under the same decay as a flick.
		this.#velocityX += dx * (1 - DECELERATION_RATE);
		this.#velocityY += dy * (1 - DECELERATION_RATE);
		this.#startCoast();
	}

	#startCoast() {
		if (this.#animationFrame) return;
		this.#previousFrameTime = performance.now();
		this.#animationFrame = requestAnimationFrame(this.#coast);
	}

	/** @param {number} time */
	#coast = (time) => {
		this.#animationFrame = 0;
		const dt = clamp(time - this.#previousFrameTime, 0, 100);
		this.#previousFrameTime = time;
		const decay = DECELERATION_RATE ** dt;
		// Exact integral of v·decay^t over the frame — frame-rate independent.
		const travel = (1 - decay) / (1 - DECELERATION_RATE);
		this.x += this.#velocityX * travel;
		this.y += this.#velocityY * travel;
		this.#velocityX *= decay;
		this.#velocityY *= decay;
		const outside = this.#settleEdges(dt);
		this.#onchange();
		if (!outside && Math.hypot(this.#velocityX, this.#velocityY) < 0.02) {
			this.#velocityX = 0;
			this.#velocityY = 0;
			return;
		}
		this.#animationFrame = requestAnimationFrame(this.#coast);
	};

	/** @param {number} x @param {number} y @param {number} time */
	#recordPointerSample(x, y, time) {
		this.#pointerHistory.push({ x, y, time });
		const cutoff = time - POINTER_HISTORY_WINDOW;
		while (this.#pointerHistory.length > 2 && this.#pointerHistory[1].time < cutoff) {
			this.#pointerHistory.shift();
		}
		while (this.#pointerHistory.length > 8) this.#pointerHistory.shift();
	}

	/** Least-squares slope of the recent samples, px per ms. @param {'x' | 'y'} axis */
	#releaseVelocity(axis) {
		const history = this.#pointerHistory;
		if (history.length < 2) return 0;
		// A pause before lifting means "place it", not "throw it".
		if (performance.now() - history[history.length - 1].time > POINTER_HISTORY_WINDOW) return 0;
		const averageTime = history.reduce((sum, sample) => sum + sample.time, 0) / history.length;
		const averageValue = history.reduce((sum, sample) => sum + sample[axis], 0) / history.length;
		let covariance = 0;
		let timeVariance = 0;
		for (const sample of history) {
			const centeredTime = sample.time - averageTime;
			covariance += centeredTime * (sample[axis] - averageValue);
			timeVariance += centeredTime * centeredTime;
		}
		return timeVariance > 0 ? covariance / timeVariance : 0;
	}

	/** @param {PointerEvent} event */
	#handlePointerDown = (event) => {
		if (event.button !== 0 || this.#locked()) return;
		// A second pointer during a drag is ignored; a press while merely "held" (a lost pointerup,
		// a second finger) takes over rather than deadlocking input.
		if (this.#pointerId !== undefined && this.isDragging) return;
		// Pressing a coasting plane is a grab, not a tap — but the slow tail of an edge-return isn't a coast.
		this.#suppressTap = Math.hypot(this.#velocityX, this.#velocityY) > 0.1;
		this.stop();
		this.#pointerId = event.pointerId;
		this.#dragStartX = event.clientX;
		this.#dragStartY = event.clientY;
		this.#dragStartPanX = this.x;
		this.#dragStartPanY = this.y;
		this.#pointerHistory = [{ x: event.clientX, y: event.clientY, time: performance.now() }];
	};

	/** @param {PointerEvent} event */
	#handlePointerMove = (event) => {
		if (event.pointerId !== this.#pointerId) return;
		const dx = event.clientX - this.#dragStartX;
		const dy = event.clientY - this.#dragStartY;
		this.#recordPointerSample(event.clientX, event.clientY, performance.now());

		if (!this.isDragging) {
			if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
			this.isDragging = true;
			this.#suppressTap = true;
			const target = /** @type {HTMLElement} */ (event.currentTarget);
			target.setPointerCapture(event.pointerId);
			target.style.cursor = 'grabbing';
			// Re-base at the threshold crossing so the hysteresis distance isn't a one-frame jump.
			this.#dragStartX = event.clientX;
			this.#dragStartY = event.clientY;
			this.#dragStartPanX = this.x;
			this.#dragStartPanY = this.y;
			return;
		}

		event.preventDefault();
		this.#dragTo(dx, dy);
		this.#onchange();
	};

	/** Follow the finger, rubber-banding past the plane's edges. @param {number} dx @param {number} dy */
	#dragTo(dx, dy) {
		const { x, y } = this.#limits();
		this.x = Pan.#rubber(this.#dragStartPanX + dx, x);
		this.y = Pan.#rubber(this.#dragStartPanY + dy, y);
	}

	/** @param {PointerEvent} event */
	#handlePointerEnd = (event) => {
		const activePointerId = this.#pointerId;
		if (activePointerId === undefined || event.pointerId !== activePointerId) return;
		const target = /** @type {HTMLElement} */ (event.currentTarget);
		const wasDragging = this.isDragging;
		const wasCancelled = event.type === 'pointercancel';

		if (wasDragging && !wasCancelled) {
			// The up event contributes position only, never a velocity sample.
			this.#dragTo(event.clientX - this.#dragStartX, event.clientY - this.#dragStartY);
		}

		const speedX = this.#releaseVelocity('x');
		const speedY = this.#releaseVelocity('y');
		const speed = Math.hypot(speedX, speedY);
		const scale = speed > MAX_RELEASE_SPEED ? MAX_RELEASE_SPEED / speed : 1;

		this.isDragging = false;
		this.#pointerId = undefined;
		this.#pointerHistory = [];
		target.style.cursor = '';
		if (target.hasPointerCapture(activePointerId)) target.releasePointerCapture(activePointerId);

		if (wasDragging) {
			// A cancelled drag keeps its momentum too — the browser reclassifying the gesture
			// shouldn't feel like the plane hit a wall. The coast also eases an overscroll home.
			if (this.#reduced()) {
				this.#clamp();
			} else {
				this.#velocityX = speedX * scale;
				this.#velocityY = speedY * scale;
				this.#startCoast();
			}
			this.#onchange();
		} else if (!this.#suppressTap && !wasCancelled) {
			this.#ontap(event);
		}
		this.#suppressTap = false;
	};

	/** @param {PointerEvent} event */
	#handleLostPointerCapture = (event) => {
		if (event.pointerId !== this.#pointerId || event.target !== event.currentTarget) return;
		const target = /** @type {HTMLElement} */ (event.currentTarget);
		this.isDragging = false;
		this.#pointerId = undefined;
		this.#pointerHistory = [];
		this.#suppressTap = false;
		target.style.cursor = '';
	};

	/** @param {WheelEvent} event */
	#handleWheel = (event) => {
		if (this.#locked()) return;
		event.preventDefault();
		const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
		this.stop();
		this.x -= event.deltaX * unit;
		this.y -= event.deltaY * unit;
		this.#clamp();
		this.#onchange();
	};

	/** @param {KeyboardEvent} event */
	#handleKeydown = (event) => {
		const step = {
			ArrowLeft: [NUDGE, 0],
			ArrowRight: [-NUDGE, 0],
			ArrowUp: [0, NUDGE],
			ArrowDown: [0, -NUDGE]
		}[event.key];
		if (!step) return;
		event.preventDefault();
		this.nudge(step[0], step[1]);
	};

	/** @param {HTMLElement} node */
	attach = (node) => {
		node.addEventListener('pointerdown', this.#handlePointerDown);
		node.addEventListener('pointermove', this.#handlePointerMove);
		node.addEventListener('pointerup', this.#handlePointerEnd);
		node.addEventListener('pointercancel', this.#handlePointerEnd);
		node.addEventListener('lostpointercapture', this.#handleLostPointerCapture);
		node.addEventListener('wheel', this.#handleWheel, { passive: false });
		node.addEventListener('keydown', this.#handleKeydown);
		return () => {
			this.stop();
			this.isDragging = false;
			this.#pointerId = undefined;
			this.#pointerHistory = [];
			node.removeEventListener('pointerdown', this.#handlePointerDown);
			node.removeEventListener('pointermove', this.#handlePointerMove);
			node.removeEventListener('pointerup', this.#handlePointerEnd);
			node.removeEventListener('pointercancel', this.#handlePointerEnd);
			node.removeEventListener('lostpointercapture', this.#handleLostPointerCapture);
			node.removeEventListener('wheel', this.#handleWheel);
			node.removeEventListener('keydown', this.#handleKeydown);
		};
	};
}
