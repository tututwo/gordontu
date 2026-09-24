// ponytail: same pointer / velocity-fit / click-suppression as wallMotion.js on two axes; kept separate on purpose.
const DECELERATION_RATE = 0.998; // per ms
const MAX_RELEASE_SPEED = 4; // px per ms
const POINTER_HISTORY_WINDOW = 110;
const DRAG_THRESHOLD = 8;
const NUDGE = 160;
const RUBBER = 0.35; // how much of an overscroll the finger actually gets
const RETURN_RATE = 0.99; // per ms, ease back inside after release

/** @param {number} value @param {number} minimum @param {number} maximum */
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

/** Minimum and maximum gallery scale. */
export const MIN_ZOOM = 0.55;
export const MAX_ZOOM = 2.5;

/** @param {number} zoom */
export const clampZoom = (zoom) => clamp(zoom, MIN_ZOOM, MAX_ZOOM);

/**
 * Keep the same world point under a moving screen-space anchor while zooming.
 * `pan`, `from`, and `to` are all measured from the viewport centre in CSS pixels.
 *
 * @param {{ x: number, y: number }} pan
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 * @param {number} ratio next zoom / starting zoom
 */
export function anchoredPan(pan, from, to, ratio) {
	return {
		x: to.x - ratio * (from.x - pan.x),
		y: to.y - ratio * (from.y - pan.y)
	};
}

/**
 * Normalise mouse wheels, precision trackpads, and ctrl+wheel trackpad pinches into a zoom ratio.
 * Exponential scaling makes equal wheel distances feel equal at every zoom level.
 *
 * @param {number} deltaY
 * @param {number} deltaMode WheelEvent.DOM_DELTA_PIXEL / LINE / PAGE
 * @param {boolean} ctrlKey Chromium/WebKit expose trackpad pinch as ctrl+wheel
 */
export function wheelZoomRatio(deltaY, deltaMode, ctrlKey) {
	const unit = deltaMode === 1 ? 0.05 : deltaMode === 2 ? 1 : 0.002;
	const exponent = clamp(-deltaY * unit * (ctrlKey ? 10 : 1), -0.5, 0.5);
	return 2 ** exponent;
}

/**
 * Drag / flick / wheel / pinch / arrow-key navigation of a bounded plane.
 *
 * Interface: `x`, `y` (screen px, +x right, +y down — the scene flips y), `zoom`,
 * `attach(node)`, `reset()`, `constrain()`, `nudge(dx, dy)`, and `stop()`.
 * Plain fields on purpose: the render loop samples them each frame, nothing else needs to react.
 */
export class Pan {
	x = 0;
	y = 0;
	zoom = 1;
	isDragging = false;
	isPinching = false;

	#ontap;
	#locked;
	#reduced;
	#limits;
	#offset;
	#onchange;

	#velocityX = 0;
	#velocityY = 0;
	#animationFrame = 0;
	#previousFrameTime = 0;

	/** @type {HTMLElement | undefined} */
	#node;
	/** @type {Map<number, { x: number, y: number }>} */
	#pointers = new Map();
	/** @type {number | undefined} */
	#pointerId;
	#dragStartX = 0;
	#dragStartY = 0;
	#dragStartPanX = 0;
	#dragStartPanY = 0;
	/** @type {{ x: number; y: number; time: number }[]} */
	#pointerHistory = [];
	#suppressTap = false;

	/** @type {number[]} */
	#pinchIds = [];
	#pinchStartDistance = 1;
	#pinchStartZoom = 1;
	#pinchStartPan = { x: 0, y: 0 };
	#pinchStartAnchor = { x: 0, y: 0 };
	#gestureActive = false;
	#gestureStartZoom = 1;

	/**
	 * @param {{
	 *   ontap?: (event: PointerEvent) => void,
	 *   locked?: () => boolean,
	 *   reduced?: () => boolean,
	 *   limits?: () => { x: number, y: number },
	 *   offset?: () => { x: number, y: number },
	 *   onchange?: () => void
	 * }} options
	 */
	constructor({
		ontap = () => {},
		locked = () => false,
		reduced = () => false,
		limits = () => ({ x: Infinity, y: Infinity }),
		offset = () => ({ x: 0, y: 0 }),
		onchange = () => {}
	} = {}) {
		this.#ontap = ontap;
		this.#locked = locked;
		this.#reduced = reduced;
		this.#limits = limits;
		this.#offset = offset;
		this.#onchange = onchange;
	}

	/** Hard clamp — for zoom, wheel, keyboard, and viewport changes. */
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

	/** Reset translation and scale to the gallery's home view. */
	reset() {
		this.stop();
		this.x = 0;
		this.y = 0;
		this.zoom = 1;
		this.#onchange();
	}

	/** Re-apply the current scene bounds, for example after resize or relayout. */
	constrain() {
		this.#clamp();
		this.#onchange();
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

	/** @param {number} clientX @param {number} clientY @param {number} nextZoom */
	#setZoom(clientX, clientY, nextZoom) {
		if (!this.#node) return false;
		const zoom = clampZoom(nextZoom);
		if (zoom === this.zoom) return false;
		const anchor = this.#relativePoint(this.#node, { x: clientX, y: clientY });
		const offset = this.#offset();
		const viewPan = { x: this.x + offset.x, y: this.y + offset.y };
		const nextPan = anchoredPan(viewPan, anchor, anchor, zoom / this.zoom);
		this.x = nextPan.x - offset.x;
		this.y = nextPan.y - offset.y;
		this.zoom = zoom;
		this.#clamp();
		return true;
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

	/** @param {HTMLElement} node @param {{ x: number, y: number }} point */
	#relativePoint(node, point) {
		const rect = node.getBoundingClientRect();
		return {
			x: point.x - rect.left - rect.width / 2,
			y: point.y - rect.top - rect.height / 2
		};
	}

	/** @param {HTMLElement} node @param {number} pointerId */
	#capture(node, pointerId) {
		try {
			if (!node.hasPointerCapture(pointerId)) node.setPointerCapture(pointerId);
		} catch {
			// The pointer can disappear between its event and capture on older mobile browsers.
		}
	}

	/** @param {HTMLElement} node @param {number} pointerId */
	#release(node, pointerId) {
		try {
			if (node.hasPointerCapture(pointerId)) node.releasePointerCapture(pointerId);
		} catch {
			// A cancelled pointer may already have released its implicit capture.
		}
	}

	/** @param {HTMLElement} node */
	#beginPinch(node) {
		const entries = [...this.#pointers.entries()];
		this.stop();
		this.#clamp();
		this.isPinching = true;
		this.isDragging = false;
		this.#suppressTap = true;
		this.#pointerId = undefined;
		this.#pointerHistory = [];
		this.#pinchIds = entries.map(([id]) => id);
		const [, a] = entries[0];
		const [, b] = entries[1];
		const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
		this.#pinchStartDistance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
		this.#pinchStartZoom = this.zoom;
		const offset = this.#offset();
		this.#pinchStartPan = { x: this.x + offset.x, y: this.y + offset.y };
		this.#pinchStartAnchor = this.#relativePoint(node, midpoint);
		for (const [id] of entries) this.#capture(node, id);
		node.style.cursor = 'grabbing';
		this.#onchange();
	}

	/** @param {HTMLElement} node */
	#movePinch(node) {
		const a = this.#pointers.get(this.#pinchIds[0]);
		const b = this.#pointers.get(this.#pinchIds[1]);
		if (!a || !b) return;
		const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
		const anchor = this.#relativePoint(node, midpoint);
		const distance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
		const zoom = clampZoom((this.#pinchStartZoom * distance) / this.#pinchStartDistance);
		const nextPan = anchoredPan(
			this.#pinchStartPan,
			this.#pinchStartAnchor,
			anchor,
			zoom / this.#pinchStartZoom
		);
		const offset = this.#offset();
		this.x = nextPan.x - offset.x;
		this.y = nextPan.y - offset.y;
		this.zoom = zoom;
		this.#clamp();
		this.#onchange();
	}

	/** Continue as a one-finger drag after either finger leaves a pinch. @param {HTMLElement} node */
	#finishPinch(node) {
		this.isPinching = false;
		this.#pinchIds = [];
		const remaining = [...this.#pointers.entries()][0];
		if (remaining) {
			const [id, point] = remaining;
			this.#pointerId = id;
			this.isDragging = true;
			this.#suppressTap = true;
			this.#dragStartX = point.x;
			this.#dragStartY = point.y;
			this.#dragStartPanX = this.x;
			this.#dragStartPanY = this.y;
			this.#pointerHistory = [{ x: point.x, y: point.y, time: performance.now() }];
			this.#capture(node, id);
			node.style.cursor = 'grabbing';
		} else {
			this.#pointerId = undefined;
			this.isDragging = false;
			this.#suppressTap = false;
			this.#pointerHistory = [];
			node.style.cursor = '';
		}
		this.#onchange();
	}

	/** @param {PointerEvent} event */
	#handlePointerDown = (event) => {
		if (event.button !== 0 || this.#locked() || this.#pointers.has(event.pointerId)) return;
		// Two pointers define the gesture; extra fingers cannot steal or restart it.
		if (this.#pointers.size >= 2) {
			this.#suppressTap = true;
			return;
		}
		this.#pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		const target = /** @type {HTMLElement} */ (event.currentTarget);
		// Capture from the press, not only after the drag threshold. Otherwise a pointer that
		// leaves the canvas before becoming a drag can release elsewhere and strand our state.
		this.#capture(target, event.pointerId);
		// Pointer events own touch pinches. Safari may emit GestureEvents for the same fingers;
		// cancelling the fallback here prevents both streams from changing zoom.
		const interruptedGesture = this.#gestureActive;
		this.#gestureActive = false;
		if (this.#pointers.size === 2) {
			event.preventDefault();
			this.#beginPinch(target);
			return;
		}

		// Pressing a coasting plane is a grab, not a tap — but the slow tail of an edge-return isn't a coast.
		this.#suppressTap = interruptedGesture || Math.hypot(this.#velocityX, this.#velocityY) > 0.1;
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
		if (!this.#pointers.has(event.pointerId)) return;
		this.#pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		const target = /** @type {HTMLElement} */ (event.currentTarget);
		if (this.isPinching) {
			event.preventDefault();
			this.#movePinch(target);
			return;
		}
		if (event.pointerId !== this.#pointerId) return;
		const dx = event.clientX - this.#dragStartX;
		const dy = event.clientY - this.#dragStartY;
		this.#recordPointerSample(event.clientX, event.clientY, performance.now());

		if (!this.isDragging) {
			if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
			this.isDragging = true;
			this.#suppressTap = true;
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
		if (!this.#pointers.has(event.pointerId)) return;
		const target = /** @type {HTMLElement} */ (event.currentTarget);
		this.#pointers.delete(event.pointerId);

		if (this.isPinching) {
			this.#suppressTap = true;
			this.#release(target, event.pointerId);
			this.#finishPinch(target);
			return;
		}

		const activePointerId = this.#pointerId;
		if (activePointerId === undefined || event.pointerId !== activePointerId) return;
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
		this.#release(target, activePointerId);

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
		if (event.target !== event.currentTarget || !this.#pointers.has(event.pointerId)) return;
		const target = /** @type {HTMLElement} */ (event.currentTarget);
		this.#pointers.delete(event.pointerId);
		if (this.isPinching) {
			this.#suppressTap = true;
			this.#finishPinch(target);
			return;
		}
		if (event.pointerId !== this.#pointerId) return;
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
		if (this.#gestureActive) return;
		this.stop();
		// Horizontal-dominant trackpad gestures still pan. Vertical wheel motion and
		// ctrl+wheel trackpad pinches zoom around the pointer.
		if (!event.ctrlKey && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
			const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerWidth : 1;
			this.x -= event.deltaX * unit;
			this.#clamp();
			this.#onchange();
			return;
		}
		if (
			this.#setZoom(
				event.clientX,
				event.clientY,
				this.zoom * wheelZoomRatio(event.deltaY, event.deltaMode, event.ctrlKey)
			)
		) {
			this.#onchange();
		}
	};

	/** Safari exposes Mac trackpad pinch as non-standard gesture events. @param {Event} event */
	#handleGestureStart = (event) => {
		event.preventDefault();
		if (this.#locked() || this.#pointers.size > 0) {
			if (this.#pointers.size > 0) this.#suppressTap = true;
			this.#gestureActive = false;
			return;
		}
		this.stop();
		this.#gestureActive = true;
		this.#gestureStartZoom = this.zoom;
	};

	/** @param {Event} event */
	#handleGestureChange = (event) => {
		event.preventDefault();
		if (this.#pointers.size > 0) {
			this.#suppressTap = true;
			this.#gestureActive = false;
			return;
		}
		if (!this.#gestureActive || this.#locked() || !this.#node) return;
		const gesture = /** @type {Event & { scale?: number, clientX?: number, clientY?: number }} */ (event);
		const rect = this.#node.getBoundingClientRect();
		const clientX = gesture.clientX ?? rect.left + rect.width / 2;
		const clientY = gesture.clientY ?? rect.top + rect.height / 2;
		if (this.#setZoom(clientX, clientY, this.#gestureStartZoom * (gesture.scale ?? 1))) this.#onchange();
	};

	/** @param {Event} event */
	#handleGestureEnd = (event) => {
		event.preventDefault();
		this.#gestureActive = false;
	};

	/** @param {KeyboardEvent} event */
	#handleKeydown = (event) => {
		if (this.#locked()) return;
		const zoomBy = { '+': 1.2, '=': 1.2, '-': 1 / 1.2, _: 1 / 1.2 }[event.key];
		if (zoomBy) {
			event.preventDefault();
			this.stop();
			const rect = /** @type {HTMLElement} */ (event.currentTarget).getBoundingClientRect();
			if (this.#setZoom(rect.left + rect.width / 2, rect.top + rect.height / 2, this.zoom * zoomBy)) this.#onchange();
			return;
		}
		if (event.key === '0') {
			event.preventDefault();
			this.reset();
			return;
		}
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
		this.#node = node;
		const listeners = new AbortController();
		const { signal } = listeners;
		node.addEventListener('pointerdown', this.#handlePointerDown, { signal });
		node.addEventListener('pointermove', this.#handlePointerMove, { signal });
		node.addEventListener('pointerup', this.#handlePointerEnd, { signal });
		node.addEventListener('pointercancel', this.#handlePointerEnd, { signal });
		node.addEventListener('lostpointercapture', this.#handleLostPointerCapture, { signal });
		node.addEventListener('wheel', this.#handleWheel, { signal, passive: false });
		node.addEventListener('gesturestart', this.#handleGestureStart, { signal, passive: false });
		node.addEventListener('gesturechange', this.#handleGestureChange, { signal, passive: false });
		node.addEventListener('gestureend', this.#handleGestureEnd, { signal, passive: false });
		node.addEventListener('keydown', this.#handleKeydown, { signal });
		return () => {
			this.stop();
			for (const pointerId of this.#pointers.keys()) this.#release(node, pointerId);
			this.isDragging = false;
			this.isPinching = false;
			this.#gestureActive = false;
			this.#pointerId = undefined;
			this.#pointers.clear();
			this.#pinchIds = [];
			this.#pointerHistory = [];
			node.style.cursor = '';
			if (this.#node === node) this.#node = undefined;
			listeners.abort();
		};
	};
}
