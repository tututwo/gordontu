// Run with `node src/lib/landingPage/spring.check.js`: the react-spring port settles like
// `config.default` (near-critical, ~0.6 s) and keeps its velocity across a retarget.
import { Spring } from './spring.js';

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
	if (!condition) throw new Error(message);
}

const s = new Spring(100);
s.to(0);
let t = 0;
let lowest = Infinity;
while (s.advance(16)) {
	t += 16;
	lowest = Math.min(lowest, s.value);
	assert(t < 2000, 'spring never settled');
}
assert(s.value === 0 && s.velocity === 0, 'settled spring rests exactly on its target');
assert(t > 300 && t < 900, `config.default settles in ~0.6 s, took ${t} ms`);
assert(lowest > -0.5, `near-critical damping barely overshoots, reached ${lowest}`);

// Frame size must not change the physics: 1 ms steps make 16 ms and 4 × 4 ms frames identical.
const a = new Spring(0);
const b = new Spring(0);
a.to(1);
b.to(1);
a.advance(16);
for (let i = 0; i < 4; i++) b.advance(4);
assert(Math.abs(a.value - b.value) < 1e-12, 'frame rate independent');

// A spring moving forward and retargeted behind it keeps going forward briefly.
const r = new Spring(300);
r.velocity = 0.072;
r.to(0);
r.advance(1);
assert(r.value > 300, 'carried velocity survives the retarget');

console.log('spring ok');
