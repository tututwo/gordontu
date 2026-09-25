// Run with `node src/lib/frameLoop.check.js`: the loop steps once per animation frame by the frames'
// own timestamps, counts its first step from start(), and stops when its step says so.
import { frameLoop } from './frameLoop.js';

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
	if (!condition) throw new Error(message);
}

/** @type {Map<number, FrameRequestCallback>} */
let queue = new Map();
let ids = 0;
let clock = 1000;
Object.assign(globalThis, {
	requestAnimationFrame: (/** @type {FrameRequestCallback} */ callback) => (queue.set(++ids, callback), ids),
	cancelAnimationFrame: (/** @type {number} */ id) => queue.delete(id)
});
performance.now = () => clock;
/** A frame at `at` ms: run what was requested before it. @param {number} at */
function frame(at) {
	const run = queue;
	queue = new Map();
	for (const callback of run.values()) callback(at);
}

/** @type {number[]} */
const steps = [];
const loop = frameLoop((dt) => (steps.push(dt), steps.length < 3));
loop.start();
loop.start();
assert(steps.length === 0 && queue.size === 1, 'start requests one frame and steps nothing yet');
assert(loop.running, 'started');

clock = 1003;
for (const at of [1005, 1021.7, 1038.4]) frame(at);
assert(steps[0] === 5, `first dt counts from start(), got ${steps[0]}`);
assert(Math.abs(steps[1] - 16.7) < 1e-9 && Math.abs(steps[2] - 16.7) < 1e-9, `dt between frame stamps, got ${steps}`);
assert(!loop.running && queue.size === 0, 'a false step ends the loop');

loop.start();
loop.stop();
frame(1055);
assert(steps.length === 3 && !loop.running, 'a stopped loop does not step');

// A step that starts its own loop again (a render waking its scene) runs once more, not twice.
let renders = 0;
const scene = frameLoop(() => (renders++ === 0 && scene.start(), false));
scene.start();
frame(1072);
frame(1088);
frame(1105);
assert(renders === 2, `woken from its own step it renders one more frame, got ${renders}`);

console.log('frameLoop ok');
