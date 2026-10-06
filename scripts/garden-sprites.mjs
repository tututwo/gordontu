#!/usr/bin/env node
// The Garden's Plants as WebP sprites: each species module's SVG (src/lib/garden/species/) rendered
// in headless Chrome and encoded to static/garden/<kind>.webp, which plants.js loads instead of
// rasterising SVG filters at runtime. Run it again after changing a drawing:
//
//   node scripts/garden-sprites.mjs
//
// Flowers are rendered 1024 px tall (twice what plants.js once drew), ground cover 768 px square
// without its ground (the drawing's one background <rect> in its `ground` colour), transparent, so
// plants.js lays it over the cell's wash. Each is kept under ~60 KB, re-rendered smaller if
// it is over. Needs Google Chrome and cwebp (brew install webp).
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COVERS, FLOWERS, species } from '../src/lib/garden/species/index.js';
import { svgs } from '../src/lib/garden/species/svgs.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../static/garden/', import.meta.url).pathname;
const BUDGET = 60 * 1024;
/** Sizes to try in turn (a flower's height, a cover's side), px, until one fits the budget. */
const SIZES = { flower: [1024, 768], cover: [768, 640, 512] };

const tmp = mkdtempSync(join(tmpdir(), 'garden-sprites-'));
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmp, 'profile')}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const cleanup = () => {
	chrome.kill('SIGKILL');
	// Chrome may still be writing its profile as it dies: retried, rather than left in the temp folder.
	rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
};
process.on('exit', cleanup);

let version;
for (let i = 0; i < 100 && !version; i++) {
	try {
		version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
	} catch {
		await new Promise((r) => setTimeout(r, 100));
	}
}
if (!version) throw new Error('Chrome did not start');

const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => ((ws.onopen = resolve), (ws.onerror = reject)));
let id = 0;
let sessionId;
const pending = new Map();
ws.onmessage = ({ data }) => {
	const message = JSON.parse(data);
	const call = pending.get(message.id);
	if (!call) return;
	pending.delete(message.id);
	message.error ? call.reject(new Error(message.error.message)) : call.resolve(message.result);
};
/** @returns {Promise<any>} */
const send = (method, params = {}) =>
	new Promise((resolve, reject) => {
		pending.set(++id, { resolve, reject });
		ws.send(JSON.stringify({ id, method, params, sessionId }));
	});

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }));
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
const { frameTree } = await send('Page.getFrameTree');

/** The SVG at a size, as a transparent PNG. @param {string} svg @param {number} width @param {number} height */
async function render(svg, width, height) {
	await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
	const sized = svg.replace(/<svg\b([^>]*)>/, (tag, attrs) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="${width}" height="${height}" style="display:block">`);
	await send('Page.setDocumentContent', { frameId: frameTree.frame.id, html: `<!doctype html><body style="margin:0;background:transparent">${sized}</body>` });
	await send('Runtime.evaluate', { expression: 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))', awaitPromise: true });
	const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } });
	return Buffer.from(data, 'base64');
}

for (const kind of [...FLOWERS, ...COVERS]) {
	const { width, height, ground: color } = species[kind];
	const flower = FLOWERS.includes(kind);
	let svg = svgs[kind];
	if (!flower) {
		// Its ground, the background <rect> in its ground colour, comes off: the cell's wash shows through.
		const ground = new RegExp(`<rect\\b[^>]*fill="${color}"[^>]*/>`, 'i');
		if (!ground.test(svg)) throw new Error(`${kind}: no ground <rect fill="${color}"/> to strip`);
		svg = svg.replace(ground, '');
	}
	const file = join(OUT, `${kind}.webp`);
	for (const size of SIZES[flower ? 'flower' : 'cover']) {
		const png = join(tmp, `${kind}.png`);
		writeFileSync(png, await render(svg, flower ? Math.round((size * width) / height) : size, size));
		execFileSync('cwebp', ['-quiet', '-q', '88', '-alpha_q', '90', '-m', '6', png, '-o', file]);
		const bytes = statSync(file).size;
		console.log(`${kind}: ${size} px, ${(bytes / 1024).toFixed(1)} KB`);
		if (bytes <= BUDGET) break;
	}
}
process.exit(0);
