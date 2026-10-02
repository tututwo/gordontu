// Run with: node tests/intro.test.js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../src/app.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'The pre-paint Intro script exists');
const script = match[1];
const day = 24 * 60 * 60 * 1000;
const start = Date.UTC(2026, 9, 1);
const stored = new Map();
/** @type {Pick<Storage, 'getItem' | 'setItem'>} */
const storage = { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };

function visit({ now = start, pathname = '/', reduced = false, localStorage = storage } = {}) {
	/** @type {{ intro?: string }} */
	const dataset = {};
	/** @type {() => void} */
	let fallback = () => assert.fail('The failsafe was not scheduled');
	runInNewContext(script, {
		document: { documentElement: { dataset } },
		location: { pathname },
		matchMedia: () => ({ matches: reduced }),
		Date: { now: () => now },
		localStorage,
		setTimeout: (/** @type {() => void} */ callback, /** @type {number} */ delay) => {
			assert.equal(delay, 6000);
			fallback = callback;
		}
	});
	return { dataset, fallback };
}

const first = visit();
assert.equal(first.dataset.intro, 'hold', 'First visit plays the Intro');
assert.equal(stored.get('intro-seen'), String(start), 'Recorded before playback finishes');
for (const pathname of ['/', '/about', '/projects', '/writing', '/contact']) {
	assert.equal(visit({ pathname, now: start + day - 1 }).dataset.intro, undefined, 'Repeat visits skip it');
}
assert.equal(stored.get('intro-seen'), String(start), 'Repeat visits do not extend the wait');
assert.equal(visit({ now: start + day }).dataset.intro, 'hold', 'Plays again after 24 hours');
first.fallback();
assert.equal(first.dataset.intro, undefined, 'Failed hydration releases the page');
first.dataset.intro = 'drawing';
first.fallback();
assert.equal(first.dataset.intro, 'drawing', 'Fallback leaves active playback alone');

stored.clear();
assert.equal(visit({ reduced: true }).dataset.intro, undefined);
assert.equal(visit({ pathname: '/maps' }).dataset.intro, undefined);
assert.equal(stored.size, 0, 'Excluded visits do not consume the Intro');
stored.set('intro-seen', 'invalid');
assert.equal(visit().dataset.intro, 'hold', 'Invalid old data does not prevent playback');
for (const method of ['getItem', 'setItem']) {
	stored.clear();
	const localStorage = { ...storage, [method]: () => { throw new Error('Storage blocked'); } };
	assert.equal(visit({ localStorage }).dataset.intro, undefined, 'Blocked storage leaves the page visible');
}
console.log('Intro checks passed');
