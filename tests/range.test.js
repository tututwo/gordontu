// Run with: node tests/range.test.js
import assert from 'node:assert/strict';
import { partial } from '../src/lib/server/range.js';

const file = Uint8Array.from({ length: 100 }, (_, i) => i).buffer;
const headers = new Headers({ 'Content-Type': 'video/mp4', 'Content-Length': '100', ETag: '"v1"' });

/** @param {string} range */
async function answer(range) {
	const response = partial(file, range, headers);
	const bytes = [...new Uint8Array(await response.arrayBuffer())];
	return { status: response.status, range: response.headers.get('Content-Range'), bytes };
}
/** @param {number} from @param {number} to */
const span = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// Safari asks for two bytes first, to learn the size, and won't play the video without this 206.
assert.deepEqual(await answer('bytes=0-1'), { status: 206, range: 'bytes 0-1/100', bytes: [0, 1] });
assert.deepEqual(await answer('bytes=0-'), { status: 206, range: 'bytes 0-99/100', bytes: span(0, 99) });
assert.deepEqual(await answer('bytes=98-'), { status: 206, range: 'bytes 98-99/100', bytes: [98, 99] });
assert.deepEqual(await answer('bytes=-2'), { status: 206, range: 'bytes 98-99/100', bytes: [98, 99] });
assert.deepEqual(await answer('bytes=-500'), { status: 206, range: 'bytes 0-99/100', bytes: span(0, 99) });
assert.deepEqual(await answer('bytes=90-1000'), { status: 206, range: 'bytes 90-99/100', bytes: span(90, 99) });

// Ranges that start past the end can't be served.
for (const range of ['bytes=100-', 'bytes=100-200', 'bytes=-0']) {
	assert.deepEqual(await answer(range), { status: 416, range: 'bytes */100', bytes: [] }, range);
}

// Anything that isn't one valid range gets the whole file.
for (const range of ['bytes=5-1', 'bytes=0-1,4-5', 'items=0-1', 'bytes=-', 'bytes=a-b']) {
	assert.deepEqual(await answer(range), { status: 200, range: null, bytes: span(0, 99) }, range);
}

// The file's own headers carry over, minus its full length.
const sliced = partial(file, 'bytes=0-1', headers).headers;
assert.equal(sliced.get('Content-Type'), 'video/mp4');
assert.equal(sliced.get('ETag'), '"v1"');
assert.equal(sliced.get('Content-Length'), null);

console.log('range: all checks pass');
