<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import ProjectCard from './ProjectCard.svelte';

	/** @type {{ projects?: import('$lib/project/project.js').Project[] }} */
	let { projects = [] } = $props();

	const AUTOPLAY_DELAY = 1100;
	const AUTOPLAY_SPEED = 18;
	const DAMPING_RATIO = 0.82;
	const RESPONSE = 0.4;
	const ANGULAR_FREQUENCY = (Math.PI * 2) / RESPONSE;
	const MAX_FRAME_DELTA = 1 / 30;
	const POINTER_HISTORY_WINDOW = 100;
	const DRAG_THRESHOLD = 8;

	let position = $state(0);

	let stageWidth = $state(1200);
	let isDragging = $state(false);
	let isHovered = $state(false);
	let hasFocusWithin = $state(false);
	let isPausedByUser = $state(false);
	let suppressClick = $state(false);

	let animationFrame = 0;
	let previousFrameTime = 0;
	/** @type {'idle' | 'spring' | 'autoplay'} */
	let motionMode = 'idle';
	let motionTarget = 0;
	let motionVelocity = 0;
	let autoplayReady = false;
	/** @type {number | undefined} */
	let autoplayStartTimer;

	/** @type {number | undefined} */
	let pointerId;
	let dragStartX = 0;
	let dragStartPosition = 0;
	/** @type {{ x: number; time: number }[]} */
	let pointerHistory = [];
	/** @type {number | undefined} */
	let clickResetTimer;

	let step = $derived(
		stageWidth < 720
			? Math.max(286, stageWidth * 0.78)
			: Math.min(414, Math.max(350, stageWidth * 0.255))
	);
	let visibleCount = $derived(stageWidth < 720 ? 5 : 9);
	let activeVirtualIndex = $derived(Math.round(-position / step));
	let activeProject = $derived(projects[mod(activeVirtualIndex, projects.length)]);
	let isAutoPlaying = $derived(
		stageWidth >= 720 &&
			!prefersReducedMotion.current &&
			!isPausedByUser &&
			!isDragging &&
			!isHovered &&
			!hasFocusWithin &&
			projects.length > 1
	);
	let visibleCards = $derived.by(() => {
		if (projects.length === 0) return [];

		const half = Math.floor(visibleCount / 2);
		const center = Math.round(-position / step);
		return Array.from({ length: visibleCount }, (_, slot) => {
			const virtualIndex = center + slot - half;
			const projectIndex = mod(virtualIndex, projects.length);
			const x = virtualIndex * step + position;
			const distance = Math.abs(x) / step;
			const direction = Math.sign(x);
			const scale = Math.max(0.69, 1.09 - distance * 0.125);
			const translateZ = 74 - Math.min(distance * 86, 245);
			const rotateY = clamp((-x / Math.max(stageWidth, 1)) * 66, -29, 29);
			const naturalTilt = (((projectIndex * 17) % 11) - 5) * 0.34;
			const rotateZ = naturalTilt + direction * Math.min(distance * 0.55, 1.6);

			return {
				virtualIndex,
				project: projects[projectIndex],
				distance,
				transform: `translate3d(calc(-50% + ${x}px), -50%, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
				opacity: clamp(1.12 - distance * 0.17, 0.24, 1),
				active: virtualIndex === activeVirtualIndex
			};
		});
	});

	$effect(() => {
		const shouldAutoplay = isAutoPlaying;
		const shouldReduceMotion = prefersReducedMotion.current;
		autoplayReady = false;
		clearAutoplayDelay();

		if (!shouldAutoplay) {
			if (motionMode === 'autoplay' || (shouldReduceMotion && motionMode === 'spring')) {
				cancelMotion();
			}
			return;
		}

		autoplayStartTimer = window.setTimeout(() => {
			autoplayStartTimer = undefined;
			autoplayReady = true;
			startAutoplay();
		}, AUTOPLAY_DELAY);

		return () => {
			clearAutoplayDelay();
			autoplayReady = false;
			if (motionMode === 'autoplay') cancelMotion();
		};
	});

	/** @param {number} value @param {number} length */
	function mod(value, length) {
		if (!length) return 0;
		return ((value % length) + length) % length;
	}

	/** @param {number} value @param {number} minimum @param {number} maximum */
	function clamp(value, minimum, maximum) {
		return Math.min(Math.max(value, minimum), maximum);
	}

	/** @param {number} initialVelocity @param {number} [decelerationRate] */
	function project(initialVelocity, decelerationRate = 0.998) {
		return (initialVelocity / 1000) * (decelerationRate / (1 - decelerationRate));
	}

	/** @param {number} value */
	function nearestStep(value) {
		return Math.round(value / step) * step;
	}

	function clearAutoplayDelay() {
		if (autoplayStartTimer === undefined) return;
		window.clearTimeout(autoplayStartTimer);
		autoplayStartTimer = undefined;
	}

	function stopFrameDriver() {
		if (animationFrame) cancelAnimationFrame(animationFrame);
		animationFrame = 0;
		previousFrameTime = 0;
	}

	function cancelMotion() {
		stopFrameDriver();
		motionMode = 'idle';
		motionVelocity = 0;
	}

	function requestNextFrame() {
		if (!animationFrame) animationFrame = requestAnimationFrame(updateMotion);
	}

	function startAutoplay() {
		if (!autoplayReady || !isAutoPlaying || motionMode !== 'idle') return;
		motionMode = 'autoplay';
		motionVelocity = -AUTOPLAY_SPEED;
		previousFrameTime = performance.now();
		requestNextFrame();
	}

	/** @param {number} target @param {number} initialVelocity */
	function startSpring(target, initialVelocity) {
		stopFrameDriver();
		motionMode = 'spring';
		motionTarget = target;
		motionVelocity = initialVelocity;
		previousFrameTime = performance.now();
		requestNextFrame();
	}

	/** @param {number} time */
	function updateMotion(time) {
		animationFrame = 0;
		const deltaSeconds = Math.min(
			Math.max((time - previousFrameTime) / 1000, 0),
			MAX_FRAME_DELTA
		);
		previousFrameTime = time;

		if (motionMode === 'spring') {
			const acceleration =
				-(ANGULAR_FREQUENCY ** 2) * (position - motionTarget) -
				2 * DAMPING_RATIO * ANGULAR_FREQUENCY * motionVelocity;
			motionVelocity += acceleration * deltaSeconds;
			position += motionVelocity * deltaSeconds;

			if (Math.abs(position - motionTarget) < 0.5 && Math.abs(motionVelocity) < 2) {
				position = motionTarget;
				motionVelocity = 0;
				motionMode = 'idle';
				startAutoplay();
			}
		} else if (motionMode === 'autoplay' && isAutoPlaying) {
			motionVelocity = -AUTOPLAY_SPEED;
			position += motionVelocity * deltaSeconds;
		} else {
			motionMode = 'idle';
			motionVelocity = 0;
		}

		if (motionMode !== 'idle') requestNextFrame();
	}

	function pauseAtCurrentPosition() {
		autoplayReady = false;
		clearAutoplayDelay();
		cancelMotion();
	}

	/** @param {number} value */
	function setPositionInstantly(value) {
		pauseAtCurrentPosition();
		position = value;
	}

	/** @param {number} x @param {number} time */
	function recordPointerSample(x, time) {
		pointerHistory.push({ x, time });
		const cutoff = time - POINTER_HISTORY_WINDOW;

		while (pointerHistory.length > 2 && pointerHistory[1].time < cutoff) {
			pointerHistory.shift();
		}
		while (pointerHistory.length > 8) pointerHistory.shift();
	}

	function getReleaseVelocity() {
		if (pointerHistory.length < 2) return 0;
		const first = pointerHistory[0];
		const last = pointerHistory[pointerHistory.length - 1];
		const elapsedSeconds = (last.time - first.time) / 1000;
		return elapsedSeconds > 0 ? (last.x - first.x) / elapsedSeconds : 0;
	}

	/** @param {PointerEvent} event */
	function handlePointerDown(event) {
		if (isDragging || event.button !== 0 || projects.length < 2) return;
		pauseAtCurrentPosition();
		pointerId = event.pointerId;
		isDragging = true;
		suppressClick = false;
		dragStartX = event.clientX;
		dragStartPosition = position;
		pointerHistory = [{ x: event.clientX, time: performance.now() }];
		const target = /** @type {HTMLDivElement} */ (event.currentTarget);
		target.setPointerCapture(event.pointerId);
	}

	/** @param {PointerEvent} event */
	function handlePointerMove(event) {
		if (!isDragging || event.pointerId !== pointerId) return;
		const now = performance.now();
		const delta = event.clientX - dragStartX;
		recordPointerSample(event.clientX, now);

		if (Math.abs(delta) > DRAG_THRESHOLD) {
			suppressClick = true;
			event.preventDefault();
		}

		position = dragStartPosition + delta;
	}

	/** @param {PointerEvent} event */
	function handlePointerEnd(event) {
		const activePointerId = pointerId;
		if (!isDragging || activePointerId === undefined || event.pointerId !== activePointerId) return;
		const wasCancelled = event.type === 'pointercancel';
		if (!wasCancelled) {
			const finalDelta = event.clientX - dragStartX;
			position = dragStartPosition + finalDelta;
			if (Math.abs(finalDelta) > DRAG_THRESHOLD) suppressClick = true;
			recordPointerSample(event.clientX, performance.now());
		}
		const releaseVelocity = wasCancelled ? 0 : getReleaseVelocity();
		isDragging = false;
		const target = /** @type {HTMLDivElement} */ (event.currentTarget);
		if (target.hasPointerCapture(activePointerId)) {
			target.releasePointerCapture(activePointerId);
		}

		if (suppressClick) {
			const projectedPosition = position + project(releaseVelocity);
			const targetPosition = nearestStep(
				prefersReducedMotion.current ? position : projectedPosition
			);

			if (prefersReducedMotion.current) {
				setPositionInstantly(targetPosition);
			} else {
				startSpring(targetPosition, releaseVelocity);
			}
		} else if (position !== dragStartPosition) {
			setPositionInstantly(dragStartPosition);
		}

		if (clickResetTimer !== undefined) window.clearTimeout(clickResetTimer);
		clickResetTimer = window.setTimeout(() => (suppressClick = false), 0);
		pointerHistory = [];
		pointerId = undefined;
	}

	/** @param {number} direction */
	function moveBy(direction) {
		setPositionInstantly(nearestStep(position) + direction * step);
	}

	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		const wall = /** @type {HTMLDivElement} */ (event.currentTarget);
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			wall.focus({ preventScroll: true });
			moveBy(-1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			wall.focus({ preventScroll: true });
			moveBy(1);
		} else if (event.key === 'Home') {
			event.preventDefault();
			wall.focus({ preventScroll: true });
			setPositionInstantly(0);
		}
	}

	function toggleMotion() {
		pauseAtCurrentPosition();
		isPausedByUser = !isPausedByUser;
	}

	function handlePointerEnter() {
		isHovered = true;
		pauseAtCurrentPosition();
	}

	function handlePointerLeave() {
		isHovered = false;
	}

	function handleFocusIn() {
		hasFocusWithin = true;
		pauseAtCurrentPosition();
	}

	/** @param {FocusEvent} event */
	function handleFocusOut(event) {
		const target = /** @type {HTMLDivElement} */ (event.currentTarget);
		if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;

		// A focused virtual card can leave the keyed list during reconciliation.
		// Defer the state write so it does not happen inside Svelte's derived update.
		queueMicrotask(() => {
			hasFocusWithin = false;
		});
	}

	/** @param {number} virtualIndex */
	function focusCard(virtualIndex) {
		if (isDragging) return;
		setPositionInstantly(-virtualIndex * step);
	}

	/** @param {HTMLDivElement} node */
	function dragSurface(node) {
		node.addEventListener('pointerdown', handlePointerDown);
		node.addEventListener('pointermove', handlePointerMove);
		node.addEventListener('pointerup', handlePointerEnd);
		node.addEventListener('pointercancel', handlePointerEnd);
		node.addEventListener('pointerenter', handlePointerEnter);
		node.addEventListener('pointerleave', handlePointerLeave);
		node.addEventListener('focusin', handleFocusIn);
		node.addEventListener('focusout', handleFocusOut);
		node.addEventListener('keydown', handleKeydown);

		return () => {
			clearAutoplayDelay();
			cancelMotion();
			if (clickResetTimer !== undefined) window.clearTimeout(clickResetTimer);
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerup', handlePointerEnd);
			node.removeEventListener('pointercancel', handlePointerEnd);
			node.removeEventListener('pointerenter', handlePointerEnter);
			node.removeEventListener('pointerleave', handlePointerLeave);
			node.removeEventListener('focusin', handleFocusIn);
			node.removeEventListener('focusout', handleFocusOut);
			node.removeEventListener('keydown', handleKeydown);
		};
	}
</script>

<div class="wall-wrap">
	<div
		class={['wall-stage', { dragging: isDragging }]}
		role="region"
		aria-roledescription="carousel"
		aria-label="Infinite project wall. Drag horizontally or use the left and right arrow keys."
		aria-describedby="wall-instructions"
		tabindex="-1"
		bind:clientWidth={stageWidth}
		{@attach dragSurface}
	>
		<p id="wall-instructions" class="sr-only">
			Drag the wall horizontally. Use the left and right arrow keys to move one project at a time.
		</p>

		<div class="wall-scene">
			{#each visibleCards as card (card.virtualIndex)}
				<div
					class="card-positioner"
					style:transform={card.transform}
					style:opacity={card.opacity}
					style:z-index={100 - Math.round(card.distance * 10)}
				>
					<ProjectCard
						project={card.project}
						active={card.active}
						tabindex={card.distance > 3.2 ? -1 : 0}
						onfocus={() => focusCard(card.virtualIndex)}
						shouldSuppressClick={() => suppressClick}
					/>
				</div>
			{/each}
		</div>

		{#if activeProject}
			<p class="sr-only" aria-live={isAutoPlaying ? 'off' : 'polite'}>
				Current project: {activeProject.projectName}
			</p>
		{/if}
	</div>

	{#if stageWidth >= 720 && !prefersReducedMotion.current}
		<button
			class="motion-toggle"
			type="button"
			aria-pressed={isPausedByUser}
			onclick={toggleMotion}
		>
			{isPausedByUser ? 'Play motion' : 'Pause motion'}
		</button>
	{/if}
</div>

<style>
	.wall-wrap {
		position: relative;
		opacity: 1;
		transition: opacity 180ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
	}

	@starting-style {
		.wall-wrap {
			opacity: 0;
		}
	}

	.wall-stage {
		position: relative;
		width: 100%;
		height: clamp(24rem, 26vw, 27rem);
		perspective: 1350px;
		perspective-origin: 50% 46%;
		cursor: grab;
		outline: none;
		touch-action: pan-y;
		user-select: none;
	}

	.wall-stage:focus-visible::after {
		position: absolute;
		z-index: 150;
		right: 1.4rem;
		bottom: 0.2rem;
		padding: 0.32rem 0.55rem;
		border: 1px solid var(--hairline, rgb(29 29 31 / 0.1));
		border-radius: 999px;
		box-shadow: 0 0.35rem 1rem var(--shadow-soft, rgb(0 0 0 / 0.1));
		color: var(--ink, #1d1d1f);
		background: var(--surface, rgb(255 255 255 / 0.72));
		backdrop-filter: blur(16px) saturate(160%);
		content: '←  drag or use arrow keys  →';
		font-family: var(--font-hand, 'Shantell Sans Variable', cursive);
		font-size: 0.72rem;
	}

	.wall-stage.dragging {
		cursor: grabbing;
	}

	.motion-toggle {
		position: absolute;
		z-index: 160;
		right: clamp(1.5rem, 4vw, 4rem);
		bottom: -0.15rem;
		padding: 0.35rem 0.5rem;
		border: 0;
		border-bottom: 1px solid var(--hairline, rgb(29 29 31 / 0.1));
		color: var(--muted-ink, #6e6e73);
		background: var(--surface, rgb(255 255 255 / 0.72));
		backdrop-filter: blur(16px) saturate(160%);
		font-family: var(
			--font-ui,
			-apple-system,
			BlinkMacSystemFont,
			'SF Pro Text',
			'Helvetica Neue',
			Arial,
			sans-serif
		);
		font-size: 0.68rem;
		letter-spacing: 0.025em;
		cursor: pointer;
		transition: transform var(--press-out-duration, 160ms)
			var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
	}

	.motion-toggle:focus-visible {
		color: var(--ink, #1d1d1f);
		border-bottom-color: var(--accent, #0071e3);
		outline: 2px solid var(--accent, #0071e3);
		outline-offset: 4px;
	}

	.motion-toggle:active:not(:focus-visible) {
		transform: scale(0.97);
		transition-duration: var(--press-in-duration, 100ms);
	}

	@media (hover: hover) and (pointer: fine) {
		.motion-toggle:hover {
			color: var(--ink, #1d1d1f);
			border-bottom-color: var(--ink, #1d1d1f);
		}
	}

	.wall-scene {
		position: absolute;
		inset: 0;
		transform-style: preserve-3d;
	}

	.card-positioner {
		position: absolute;
		top: 52.5%;
		left: 50%;
		width: clamp(18.75rem, 22.2vw, 23.2rem);
		height: clamp(19.5rem, 21.2vw, 22rem);
		transform-origin: center;
		transform-style: preserve-3d;
		backface-visibility: hidden;
		will-change: transform, opacity;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 720px) {
		.wall-stage {
			height: 23rem;
			perspective: 1050px;
		}

		.card-positioner {
			width: min(78vw, 20.5rem);
			height: min(22rem, 87vw);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wall-wrap {
			transition-duration: 120ms;
		}

		.motion-toggle {
			transition: none;
		}

		.motion-toggle,
		.motion-toggle:active {
			transform: none;
		}

		.card-positioner {
			will-change: auto;
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		.wall-stage:focus-visible::after,
		.motion-toggle {
			background: var(--surface-solid, #fbfbfd);
			backdrop-filter: none;
		}
	}

	@media (prefers-contrast: more) {
		.wall-stage:focus-visible::after,
		.motion-toggle {
			border: 1px solid var(--ink, #1d1d1f);
		}
	}
</style>
