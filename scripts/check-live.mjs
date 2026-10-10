#!/usr/bin/env node
// Loads every Live piece (each Project's projectLink under gordontu.com/…/live/) in headless Chrome,
// waits a few seconds, and lists any request answered 4xx/5xx and any console error or uncaught
// exception. Exits 1 if it found any, so it can gate a deploy:
//
//   node scripts/check-live.mjs
//
// PostHog is blocked so the check never shows up as a visit. Needs Google Chrome.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { projects } from '../src/lib/project/project.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const WAIT = 6000;
const links = projects.map((p) => p.projectLink).filter((link) => /^https:\/\/gordontu\.com\/.+\/live\/$/.test(link ?? ''));

const tmp = mkdtempSync(join(tmpdir(), 'check-live-'));
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmp, 'profile')}`, '--no-first-run', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
process.on('exit', () => {
	chrome.kill('SIGKILL');
	rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

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
const pending = new Map();
/** CDP events by session, for the page being checked. @type {Map<string, (message: any) => void>} */
const listeners = new Map();
ws.onmessage = ({ data }) => {
	const message = JSON.parse(data);
	if (message.method) return listeners.get(message.sessionId)?.(message);
	const call = pending.get(message.id);
	if (!call) return;
	pending.delete(message.id);
	message.error ? call.reject(new Error(message.error.message)) : call.resolve(message.result);
};
/** @returns {Promise<any>} */
const send = (method, params = {}, sessionId) =>
	new Promise((resolve, reject) => {
		pending.set(++id, { resolve, reject });
		ws.send(JSON.stringify({ id, method, params, sessionId }));
	});

let failed = 0;
for (const link of links) {
	const problems = [];
	const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
	const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
	listeners.set(sessionId, ({ method, params }) => {
		if (method === 'Network.responseReceived' && params.response.status >= 400)
			problems.push(`${params.response.status} ${params.response.url}`);
		else if (method === 'Runtime.consoleAPICalled' && params.type === 'error')
			problems.push(`console.error: ${params.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`);
		else if (method === 'Runtime.exceptionThrown')
			problems.push(`exception: ${params.exceptionDetails.exception?.description ?? params.exceptionDetails.text}`);
		// The browser's own errors (CSP, failed module loads…); a 4xx/5xx is already listed above.
		else if (method === 'Log.entryAdded' && params.entry.level === 'error' && params.entry.source !== 'network')
			problems.push(`${params.entry.source}: ${params.entry.text}`);
	});
	await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
	await send('Network.enable', {}, sessionId);
	await send('Network.setBlockedURLs', { urls: ['*posthog.com*'] }, sessionId);
	await send('Runtime.enable', {}, sessionId);
	await send('Log.enable', {}, sessionId);
	await send('Page.navigate', { url: link }, sessionId);
	await new Promise((r) => setTimeout(r, WAIT));
	await send('Target.closeTarget', { targetId });
	listeners.delete(sessionId);

	if (problems.length) failed++;
	console.log(`${problems.length ? '✗' : '✓'} ${link}`);
	for (const problem of new Set(problems)) console.log(`    ${problem}`);
}

console.log(failed ? `\n${failed} of ${links.length} Live pieces have problems` : `\nAll ${links.length} Live pieces load cleanly`);
process.exit(failed ? 1 : 0);
