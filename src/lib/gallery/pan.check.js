// Deterministic input-state checks: `node src/lib/gallery/pan.check.js`.
import { Pan } from './pan.js';

/** @param {unknown} condition @param {string} message */
const ok = (condition, message) => {
	if (!condition) throw new Error(`pan.check: ${message}`);
};

class FakeNode {
	/** @type {Record<string, string>} */
	dataset = {};
	style = {};
	/** @type {Map<string, (event: any) => void>} */
	listeners = new Map();
	/** @type {Set<number>} */
	captured = new Set();

	getBoundingClientRect() {
		return { left: 0, top: 0, width: 1000, height: 800 };
	}

	/** @param {string} type @param {(event: any) => void} listener */
	addEventListener(type, listener) {
		this.listeners.set(type, listener);
	}

	/** @param {string} type */
	removeEventListener(type) {
		this.listeners.delete(type);
	}

	/** @param {number} id */
	setPointerCapture(id) {
		this.captured.add(id);
	}

	/** @param {number} id */
	hasPointerCapture(id) {
		return this.captured.has(id);
	}

	/** @param {number} id */
	releasePointerCapture(id) {
		this.captured.delete(id);
	}

	/** @param {string} type @param {Record<string, unknown>} values */
	emit(type, values) {
		let prevented = false;
		// Browsers have already dropped capture when lostpointercapture is dispatched.
		if (type === 'lostpointercapture' && typeof values.pointerId === 'number') {
			this.captured.delete(values.pointerId);
		}
		this.listeners.get(type)?.({
			type,
			target: this,
			currentTarget: this,
			preventDefault: () => (prevented = true),
			...values
		});
		return prevented;
	}
}

let taps = 0;
const pan = new Pan({
	ontap: () => (taps += 1),
	reduced: () => true,
	limits: () => ({ x: 2000, y: 2000 })
});
const node = new FakeNode();
const detach = pan.attach(/** @type {any} */ (node));

node.emit('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 });
ok(node.captured.has(1), 'the initial press captures before the drag threshold');
node.emit('pointerdown', { pointerId: 2, button: 0, clientX: 200, clientY: 100 });
ok(pan.isPinching, 'the second pointer begins a pinch');
node.emit('pointermove', { pointerId: 2, clientX: 250, clientY: 100 });
ok(Math.abs(pan.zoom - 1.5) < 1e-9, 'pinch distance controls zoom from its baseline');
ok(Math.abs(pan.x - 200) < 1e-9 && Math.abs(pan.y - 150) < 1e-9, 'pinch midpoint stays anchored');

node.emit('pointerup', { pointerId: 2, clientX: 250, clientY: 100 });
ok(!pan.isPinching && pan.isDragging, 'lifting one finger continues as a rebased drag');
node.emit('pointermove', { pointerId: 1, clientX: 120, clientY: 115 });
ok(Math.abs(pan.x - 220) < 1e-9 && Math.abs(pan.y - 165) < 1e-9, 'post-pinch drag has no jump');
node.emit('pointerup', { pointerId: 1, clientX: 120, clientY: 115 });
ok(taps === 0, 'a pinch never opens a postcard');

node.emit('pointerdown', { pointerId: 3, button: 0, clientX: 100, clientY: 100 });
node.emit('lostpointercapture', { pointerId: 3, clientX: 100, clientY: 100 });
node.emit('pointerdown', { pointerId: 3, button: 0, clientX: 120, clientY: 120 });
ok(node.captured.has(3), 'lost capture clears state so a reused pointer id can start again');
node.emit('pointercancel', { pointerId: 3, clientX: 120, clientY: 120 });

const beforeWheel = pan.zoom;
ok(node.emit('wheel', { deltaX: 0, deltaY: -100, deltaMode: 0, ctrlKey: false, clientX: 500, clientY: 400 }), 'wheel prevents page zoom/scroll');
ok(pan.zoom > beforeWheel, 'vertical wheel zooms in');
ok(node.dataset.galleryZoom === pan.zoom.toFixed(4), 'canvas dataset mirrors zoom state');

node.emit('keydown', { key: '0' });
ok(pan.zoom === 1 && pan.x === 0 && pan.y === 0, 'zero recenters pan and zoom');

node.emit('pointerdown', { pointerId: 4, button: 0, clientX: 450, clientY: 400 });
ok(node.emit('gesturestart', { scale: 1, clientX: 500, clientY: 400 }), 'touch-backed Safari gesture start is still suppressed');
ok(node.emit('gesturechange', { scale: 1.5, clientX: 500, clientY: 400 }), 'touch-backed Safari gesture changes are suppressed');
ok(pan.zoom === 1, 'PointerEvents arbitrate Safari touch gestures without double zooming');
node.emit('pointerup', { pointerId: 4, clientX: 450, clientY: 400 });
ok(taps === 0, 'a Safari gesture overlapping PointerEvents cannot become a tap');

ok(node.emit('gesturestart', { scale: 1, clientX: 500, clientY: 400 }), 'Safari pinch start prevents page zoom');
node.emit('gesturechange', { scale: 1.5, clientX: 500, clientY: 400 });
ok(Math.abs(pan.zoom - 1.5) < 1e-9, 'Safari trackpad gesture controls gallery zoom');
node.emit('gestureend', { scale: 1.5 });

node.emit('keydown', { key: '0' });
node.emit('gesturestart', { scale: 1, clientX: 500, clientY: 400 });
node.emit('gesturechange', { scale: 1.2, clientX: 500, clientY: 400 });
const gestureZoom = pan.zoom;
node.emit('pointerdown', { pointerId: 5, button: 0, clientX: 450, clientY: 400 });
ok(node.emit('gesturechange', { scale: 2, clientX: 500, clientY: 400 }), 'an interrupted Safari gesture remains suppressed');
ok(pan.zoom === gestureZoom, 'PointerEvents take over a gesture that Safari reported first');
node.emit('pointerup', { pointerId: 5, clientX: 450, clientY: 400 });
ok(taps === 0, 'gesture-to-pointer arbitration suppresses the trailing tap');
node.emit('gestureend', { scale: 2 });

detach();

const offsetNode = new FakeNode();
const offsetPan = new Pan({
	reduced: () => true,
	limits: () => ({ x: 2000, y: 2000 }),
	offset: () => ({ x: 0, y: 72 })
});
const detachOffset = offsetPan.attach(/** @type {any} */ (offsetNode));
offsetNode.emit('wheel', { deltaX: 0, deltaY: -100, deltaMode: 0, ctrlKey: false, clientX: 500, clientY: 400 });
ok(Math.abs(offsetPan.y - (offsetPan.zoom - 1) * 72) < 1e-9, 'fixed composition offset stays anchored while zooming');
detachOffset();

console.log('pan ok');
