import { prefersReducedMotion } from 'svelte/motion';

const DECELERATION_RATE = 0.998;
const DAMPING_RATIO = 0.88;
const RESPONSE = 0.5;
const ANGULAR_FREQUENCY = (Math.PI * 2) / RESPONSE;
const MAX_FRAME_DELTA = 1 / 30;
const MAX_ELAPSED_TIME = 0.1;
const MAX_RELEASE_SPEED = 8;
const POINTER_HISTORY_WINDOW = 110;
const DRAG_THRESHOLD = 8;

/** @param {number} value @param {number} minimum @param {number} maximum */
function clamp(value, minimum, maximum) {
	return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Drag, flick, spring, and keyboard motion along one axis of "cards". Born as the landing Project
 * wall's controller (removed in ADR-0003); today it drives the Postcard gallery's flip.
 *
 * Interface: `offset` (position in project units), `isDragging`, `isMoving`,
 * `attach(node)` (stage attachment), `focusCard(virtualIndex)`, `moveBy(±1)` (spring one step).
 * Everything else — spring integration, velocity estimation, pointer capture,
 * post-drag click suppression — is implementation.
 *
 * ponytail: integrator stays hand-rolled — svelte/motion's Spring is parameterized
 * differently and this feel is device-tuned; swap only after testing on real touch.
 */
export class WallMotion {
	// Track position in project units so a responsive step change cannot shift the active project.
	offset = $state(0);
	isDragging = $state(false);
	isMoving = $state(false);

	#step;
	#isMobile;
	#count;
	#bounds;

	#animationFrame = 0;
	#previousFrameTime = 0;
	/** @type {'idle' | 'spring'} */
	#motionMode = 'idle';
	#motionTarget = 0;
	#motionVelocity = 0;
	#dragFrame = 0;
	/** @type {number | undefined} */
	#pendingDragOffset;

	/** @type {number | undefined} */
	#pointerId;
	#dragStartX = 0;
	#dragStartOffset = 0;
	/** @type {{ x: number; time: number }[]} */
	#pointerHistory = [];
	#suppressClick = false;

	/**
	 * @param {{
	 *   step: () => number,
	 *   isMobile: () => boolean,
	 *   count: () => number,
	 *   bounds?: () => { min: number, max: number }
	 * }} options
	 *   Getters so the motion tracks the wall's responsive layout. Omit `bounds` for an
	 *   infinite wall; give it and the offset rubber-bands at the edges and settles inside.
	 */
	constructor({ step, isMobile, count, bounds }) {
		this.#step = step;
		this.#isMobile = isMobile;
		this.#count = count;
		this.#bounds = bounds;
	}

	/** @param {number} virtualIndex */
	focusCard(virtualIndex) {
		if (this.#pointerId !== undefined) return;
		this.#setOffsetInstantly(this.#clampToBounds(-virtualIndex));
	}

	/** @param {number} value */
	#clampToBounds(value) {
		const bounds = this.#bounds?.();
		return bounds ? clamp(value, bounds.min, bounds.max) : value;
	}

	/** Beyond the bounds the pointer moves the deck at a third of its speed. @param {number} clientX */
	#dragOffsetFor(clientX) {
		const raw = this.#dragStartOffset + (clientX - this.#dragStartX) / this.#step();
		const inside = this.#clampToBounds(raw);
		return inside + (raw - inside) * 0.3;
	}

	#stopFrameDriver() {
		if (this.#animationFrame) cancelAnimationFrame(this.#animationFrame);
		this.#animationFrame = 0;
		this.#previousFrameTime = 0;
	}

	#finishMotion() {
		this.#stopFrameDriver();
		this.#motionMode = 'idle';
		this.#motionVelocity = 0;
		this.isMoving = this.isDragging;
	}

	#requestNextFrame() {
		if (!this.#animationFrame) this.#animationFrame = requestAnimationFrame(this.#updateMotion);
	}

	/** @param {number} target @param {number} initialVelocity */
	#startSpring(target, initialVelocity) {
		this.#stopFrameDriver();
		this.#motionMode = 'spring';
		this.#motionTarget = target;
		this.#motionVelocity = initialVelocity;
		this.#previousFrameTime = performance.now();
		this.isMoving = true;
		this.#requestNextFrame();
	}

	/** @param {number} time */
	#updateMotion = (time) => {
		this.#animationFrame = 0;
		let remainingSeconds = Math.min(
			Math.max((time - this.#previousFrameTime) / 1000, 0),
			MAX_ELAPSED_TIME
		);
		this.#previousFrameTime = time;

		if (this.#motionMode !== 'spring') {
			this.#finishMotion();
			return;
		}

		while (remainingSeconds > 0) {
			const deltaSeconds = Math.min(remainingSeconds, MAX_FRAME_DELTA);
			const acceleration =
				-(ANGULAR_FREQUENCY ** 2) * (this.offset - this.#motionTarget) -
				2 * DAMPING_RATIO * ANGULAR_FREQUENCY * this.#motionVelocity;
			this.#motionVelocity += acceleration * deltaSeconds;
			this.offset += this.#motionVelocity * deltaSeconds;
			remainingSeconds -= deltaSeconds;

			if (
				Math.abs(this.offset - this.#motionTarget) < 0.0015 &&
				Math.abs(this.#motionVelocity) < 0.008
			) {
				this.offset = this.#motionTarget;
				this.#finishMotion();
				return;
			}
		}

		this.#requestNextFrame();
	};

	/** @param {number} velocityPerSecond */
	#projectRelease(velocityPerSecond) {
		return (velocityPerSecond / 1000) * (DECELERATION_RATE / (1 - DECELERATION_RATE));
	}

	/** @param {number} velocityPerSecond */
	#releaseTarget(velocityPerSecond) {
		const maximumTravel = this.#isMobile() ? 2 : 4;
		const projectedTravel = clamp(
			this.#projectRelease(velocityPerSecond),
			-maximumTravel,
			maximumTravel
		);
		return this.#clampToBounds(Math.round(this.offset + projectedTravel));
	}

	/** @param {number} value */
	#queueDragOffset(value) {
		this.#pendingDragOffset = value;
		if (!this.#dragFrame) this.#dragFrame = requestAnimationFrame(this.#flushDragOffset);
	}

	#flushDragOffset = () => {
		if (this.#dragFrame) cancelAnimationFrame(this.#dragFrame);
		this.#dragFrame = 0;
		if (this.#pendingDragOffset === undefined) return;
		this.offset = this.#pendingDragOffset;
		this.#pendingDragOffset = undefined;
	};

	#cancelDragFrame() {
		if (this.#dragFrame) cancelAnimationFrame(this.#dragFrame);
		this.#dragFrame = 0;
		this.#pendingDragOffset = undefined;
	}

	/** @param {number} value */
	#setOffsetInstantly(value) {
		this.#finishMotion();
		this.offset = value;
	}

	/** Ease onto the nearest step instead of teleporting — hard cuts read as glitches. */
	#settleToNearest() {
		const target = this.#clampToBounds(Math.round(this.offset));
		if (prefersReducedMotion.current || target === this.offset) {
			this.#setOffsetInstantly(target);
		} else {
			this.#startSpring(target, 0);
		}
	}

	/** @param {number} x @param {number} time */
	#recordPointerSample(x, time) {
		this.#pointerHistory.push({ x, time });
		const cutoff = time - POINTER_HISTORY_WINDOW;

		while (this.#pointerHistory.length > 2 && this.#pointerHistory[1].time < cutoff) {
			this.#pointerHistory.shift();
		}
		while (this.#pointerHistory.length > 8) this.#pointerHistory.shift();
	}

	#getReleaseVelocity() {
		const history = this.#pointerHistory;
		if (history.length < 2) return 0;
		// A pause before lifting means "place it", not "throw it".
		if (performance.now() - history[history.length - 1].time > POINTER_HISTORY_WINDOW) return 0;

		const averageTime = history.reduce((sum, sample) => sum + sample.time, 0) / history.length;
		const averageX = history.reduce((sum, sample) => sum + sample.x, 0) / history.length;
		let covariance = 0;
		let timeVariance = 0;

		for (const sample of history) {
			const centeredTime = sample.time - averageTime;
			covariance += centeredTime * (sample.x - averageX);
			timeVariance += centeredTime * centeredTime;
		}

		return timeVariance > 0 ? (covariance / timeVariance) * (1000 / this.#step()) : 0;
	}

	/**
	 * Consumed on the click itself rather than reset on a timer — on touch, the click
	 * can be dispatched a task later than pointerup, which a timer loses the race to.
	 * @param {MouseEvent} event
	 */
	#handleClickCapture = (event) => {
		if (!this.#suppressClick) return;
		this.#suppressClick = false;
		event.preventDefault();
	};

	/** @param {PointerEvent} event */
	#handlePointerDown = (event) => {
		if (this.#pointerId !== undefined || event.button !== 0 || this.#count() < 2) return;
		// Pressing a coasting wall is a grab, not a click — swallow the click it produces.
		this.#suppressClick = this.isMoving;
		this.#finishMotion();
		this.#cancelDragFrame();
		this.#pointerId = event.pointerId;
		this.#dragStartX = event.clientX;
		this.#dragStartOffset = this.offset;
		this.#pointerHistory = [{ x: event.clientX, time: performance.now() }];
	};

	/** @param {PointerEvent} event */
	#handlePointerMove = (event) => {
		if (event.pointerId !== this.#pointerId) return;
		const now = performance.now();
		const delta = event.clientX - this.#dragStartX;
		this.#recordPointerSample(event.clientX, now);

		if (!this.isDragging) {
			if (Math.abs(delta) <= DRAG_THRESHOLD) return;
			this.isDragging = true;
			this.isMoving = true;
			this.#suppressClick = true;
			const target = /** @type {HTMLDivElement} */ (event.currentTarget);
			target.setPointerCapture(event.pointerId);
			// Re-base at the threshold crossing so the accumulated hysteresis distance
			// isn't applied as a one-frame jump — tracking starts 1:1 from the grab.
			this.#dragStartX = event.clientX;
			this.#dragStartOffset = this.offset;
			return;
		}

		event.preventDefault();
		this.#queueDragOffset(this.#dragOffsetFor(event.clientX));
	};

	/** @param {PointerEvent} event */
	#handlePointerEnd = (event) => {
		const activePointerId = this.#pointerId;
		if (activePointerId === undefined || event.pointerId !== activePointerId) return;
		const wasDragging = this.isDragging;
		const wasCancelled = event.type === 'pointercancel';
		const target = /** @type {HTMLDivElement} */ (event.currentTarget);

		if (wasDragging) {
			// The up event contributes position only, never a velocity sample — it often
			// repeats the last move's x a few frames later, which reads as a stop and
			// erases a real flick. (pointercancel coordinates are unreliable; skip them.)
			if (!wasCancelled) this.#pendingDragOffset = this.#dragOffsetFor(event.clientX);
			this.#flushDragOffset();
		} else {
			this.#cancelDragFrame();
		}

		const releaseVelocity = clamp(
			this.#getReleaseVelocity(),
			-MAX_RELEASE_SPEED,
			MAX_RELEASE_SPEED
		);
		this.isDragging = false;
		this.#pointerId = undefined;
		if (target.hasPointerCapture(activePointerId)) target.releasePointerCapture(activePointerId);

		if (wasDragging) {
			// A cancelled drag keeps its momentum too — the browser reclassifying the
			// gesture as a scroll shouldn't feel like the wall hit a wall.
			if (prefersReducedMotion.current) {
				this.#setOffsetInstantly(Math.round(this.offset));
			} else {
				this.#startSpring(this.#releaseTarget(releaseVelocity), releaseVelocity);
			}
		} else {
			// Releasing a grabbed wall settles onto the nearest step; an idle press is
			// already on-step, so this is a no-op for plain clicks.
			this.#settleToNearest();
		}

		this.#pointerHistory = [];
	};

	/** @param {PointerEvent} event */
	#handleLostPointerCapture = (event) => {
		if (event.pointerId !== this.#pointerId) return;
		// Touch pointers are implicitly captured by the pointerdown target (a card), so
		// promoting that capture to the stage fires a bubbled lostpointercapture from the
		// card. Only a capture loss on the stage itself should abort the drag.
		if (event.target !== event.currentTarget) return;
		const wasDragging = this.isDragging;
		this.#cancelDragFrame();
		this.isDragging = false;
		this.#pointerId = undefined;
		this.#pointerHistory = [];
		if (wasDragging) this.#settleToNearest();
		else this.#setOffsetInstantly(this.#dragStartOffset);
	};

	/** Spring one step; -1 = next, +1 = previous. @param {number} direction */
	moveBy(direction) {
		const target = this.#clampToBounds(Math.round(this.offset) + direction);
		if (prefersReducedMotion.current) this.#setOffsetInstantly(target);
		else this.#startSpring(target, 0);
	}

	/** @param {KeyboardEvent} event */
	#handleKeydown = (event) => {
		const wall = /** @type {HTMLDivElement} */ (event.currentTarget);
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			wall.focus({ preventScroll: true });
			this.moveBy(-1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			wall.focus({ preventScroll: true });
			this.moveBy(1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			wall.focus({ preventScroll: true });
			this.#setOffsetInstantly(0);
		}
	};

	/** @param {HTMLDivElement} node */
	attach = (node) => {
		node.addEventListener('pointerdown', this.#handlePointerDown);
		node.addEventListener('pointermove', this.#handlePointerMove);
		node.addEventListener('pointerup', this.#handlePointerEnd);
		node.addEventListener('pointercancel', this.#handlePointerEnd);
		node.addEventListener('lostpointercapture', this.#handleLostPointerCapture);
		node.addEventListener('keydown', this.#handleKeydown);
		// Post-drag clicks are swallowed here, on the stage, so cards need no click logic.
		node.addEventListener('click', this.#handleClickCapture, true);

		return () => {
			this.#cancelDragFrame();
			if (this.#pointerId !== undefined) {
				this.offset = this.isDragging ? Math.round(this.offset) : this.#dragStartOffset;
				this.isDragging = false;
				this.#pointerId = undefined;
				this.#pointerHistory = [];
			}
			this.#finishMotion();
			node.removeEventListener('pointerdown', this.#handlePointerDown);
			node.removeEventListener('pointermove', this.#handlePointerMove);
			node.removeEventListener('pointerup', this.#handlePointerEnd);
			node.removeEventListener('pointercancel', this.#handlePointerEnd);
			node.removeEventListener('lostpointercapture', this.#handleLostPointerCapture);
			node.removeEventListener('keydown', this.#handleKeydown);
			node.removeEventListener('click', this.#handleClickCapture, true);
		};
	};
}
