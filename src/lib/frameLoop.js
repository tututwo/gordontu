/**
 * A per-frame loop for the motion the site integrates itself (the springs, the gallery's coast and
 * flip) and for the canvases it draws on demand. GSAP describes the timed motion, as tweens and
 * timelines these loops seek; the loops stay on requestAnimationFrame rather than GSAP's ticker,
 * which skips frames on 240 Hz screens, starts a frame late after it has slept, and would run
 * out of step with svelte/motion's springs.
 *
 * `step(dt, now)` gets the frame's timestamp and the ms since the previous frame; the first `dt`
 * counts from `start()` and may be slightly negative, so callers clamp it. The loop runs while
 * `step` returns true.
 *
 * @param {(dt: number, now: number) => boolean} step
 */
export function frameLoop(step) {
	let last = 0;
	let frame = 0;

	/** @param {number} now */
	function tick(now) {
		frame = 0;
		const dt = now - last;
		last = now;
		// `step` may have started the loop again itself (a render that wakes its own scene).
		if (step(dt, now) && !frame) frame = requestAnimationFrame(tick);
	}

	return {
		start() {
			if (frame) return;
			last = performance.now();
			frame = requestAnimationFrame(tick);
		},
		stop() {
			cancelAnimationFrame(frame);
			frame = 0;
		},
		get running() {
			return frame !== 0;
		}
	};
}
