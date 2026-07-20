<script>
	import { prefersReducedMotion } from 'svelte/motion';
	import ProjectCard from './ProjectCard.svelte';

	/** @type {{ projects?: import('$lib/project/project.js').Project[] }} */
	let { projects = [] } = $props();

	const DECELERATION_RATE = 0.998;
	const DAMPING_RATIO = 0.88;
	const RESPONSE = 0.5;
	const ANGULAR_FREQUENCY = (Math.PI * 2) / RESPONSE;
	const MAX_FRAME_DELTA = 1 / 30;
	const MAX_ELAPSED_TIME = 0.1;
	const MAX_RELEASE_SPEED = 8;
	const POINTER_HISTORY_WINDOW = 110;
	const DRAG_THRESHOLD = 8;

	// Track position in project units so a responsive step change cannot shift the active project.
	let offset = $state(0);
	let stageWidth = $state(1200);
	let isDragging = $state(false);
	let isMoving = $state(false);
	let suppressClick = $state(false);

	let animationFrame = 0;
	let previousFrameTime = 0;
	/** @type {'idle' | 'spring'} */
	let motionMode = 'idle';
	let motionTarget = 0;
	let motionVelocity = 0;
	let dragFrame = 0;
	/** @type {number | undefined} */
	let pendingDragOffset;

	/** @type {number | undefined} */
	let pointerId;
	let dragStartX = 0;
	let dragStartOffset = 0;
	/** @type {{ x: number; time: number }[]} */
	let pointerHistory = [];
	/** @type {number | undefined} */
	let clickResetTimer;

	let isMobile = $derived(stageWidth <= 720);
	let cardWidth = $derived(
		isMobile
			? Math.min(stageWidth * 0.7, 280)
			: Math.min(390, Math.max(320, stageWidth * 0.233))
	);
	let step = $derived(cardWidth * (isMobile ? 1.08 : 1));
	let visibleCount = $derived(isMobile ? 5 : 9);
	let activeVirtualIndex = $derived(Math.round(-offset));
	let activeProject = $derived(projects[mod(activeVirtualIndex, projects.length)]);
	let visibleCards = $derived.by(() => {
		if (projects.length === 0) return [];

		const half = Math.floor(visibleCount / 2);
		const center = Math.round(-offset);
		const radius =
			isMobile
				? Math.max(stageWidth * 1.25, step * 4.2)
				: Math.max(stageWidth * 1.06, step * 4.25);
		const maxTheta = isMobile ? 0.78 : 0.86;

		return Array.from({ length: visibleCount }, (_, slot) => {
			const virtualIndex = center + slot - half;
			const projectIndex = mod(virtualIndex, projects.length);
			const relative = virtualIndex + offset;
			const distance = Math.abs(relative);
			const linearX = relative * step;
			// Ease into the cylindrical arc instead of hard-clamping its angle. This keeps
			// distant cards ordered while the center of the scroll still tracks the pointer 1:1.
			const theta = maxTheta * Math.tanh(linearX / (radius * maxTheta));
			const x = radius * Math.sin(theta);
			const curveDepth = Math.max(radius * (Math.cos(theta) - 1) * 0.9, -350);
			const translateZ = 82 + curveDepth;
			const rotateY = clamp(((-theta * 180) / Math.PI) * 1.32, -34, 34);
			const variationSeed = hashProject(projects[projectIndex].projectName);
			const naturalY = ((variationSeed % 17) - 8) * 0.64;
			const arcDrop = Math.min(distance * distance * 0.85, 6);
			const naturalTilt = (((variationSeed >>> 5) % 13) - 6) * 0.22;
			const edgeTilt = Math.sign(relative) * Math.min(distance * 0.18, 0.7);
			const naturalScale = 1 + (((variationSeed >>> 9) % 9) - 4) * 0.003;
			const scale = Math.max(0.86, 1.045 - distance * 0.047) * naturalScale;
			const foreshorten = Math.max(0.74, 1 - distance * 0.12);

			return {
				virtualIndex,
				project: projects[projectIndex],
				distance,
				transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${naturalY + arcDrop}px), ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${naturalTilt + edgeTilt}deg) scale3d(${scale * foreshorten}, ${scale}, 1)`,
				opacity: clamp(1.025 - distance * 0.06, 0.64, 1),
				active: virtualIndex === activeVirtualIndex
			};
		});
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

	/** @param {string} value */
	function hashProject(value) {
		let result = 0;
		for (let index = 0; index < value.length; index += 1) {
			result = (result * 31 + value.charCodeAt(index)) >>> 0;
		}
		return result;
	}

	/** @param {number} value */
	function nearestStep(value) {
		return Math.round(value);
	}

	function stopFrameDriver() {
		if (animationFrame) cancelAnimationFrame(animationFrame);
		animationFrame = 0;
		previousFrameTime = 0;
	}

	function finishMotion() {
		stopFrameDriver();
		motionMode = 'idle';
		motionVelocity = 0;
		isMoving = isDragging;
	}

	function requestNextFrame() {
		if (!animationFrame) animationFrame = requestAnimationFrame(updateMotion);
	}

	/** @param {number} target @param {number} initialVelocity */
	function startSpring(target, initialVelocity) {
		stopFrameDriver();
		motionMode = 'spring';
		motionTarget = target;
		motionVelocity = initialVelocity;
		previousFrameTime = performance.now();
		isMoving = true;
		requestNextFrame();
	}

	/** @param {number} time */
	function updateMotion(time) {
		animationFrame = 0;
		let remainingSeconds = Math.min(
			Math.max((time - previousFrameTime) / 1000, 0),
			MAX_ELAPSED_TIME
		);
		previousFrameTime = time;

		if (motionMode !== 'spring') {
			finishMotion();
			return;
		}

		while (remainingSeconds > 0) {
			const deltaSeconds = Math.min(remainingSeconds, MAX_FRAME_DELTA);
			const acceleration =
				-(ANGULAR_FREQUENCY ** 2) * (offset - motionTarget) -
				2 * DAMPING_RATIO * ANGULAR_FREQUENCY * motionVelocity;
			motionVelocity += acceleration * deltaSeconds;
			offset += motionVelocity * deltaSeconds;
			remainingSeconds -= deltaSeconds;

			if (Math.abs(offset - motionTarget) < 0.0015 && Math.abs(motionVelocity) < 0.008) {
				offset = motionTarget;
				finishMotion();
				return;
			}
		}

		requestNextFrame();
	}

	/** @param {number} velocityPerSecond */
	function projectRelease(velocityPerSecond) {
		return (velocityPerSecond / 1000) * (DECELERATION_RATE / (1 - DECELERATION_RATE));
	}

	/** @param {number} velocityPerSecond */
	function releaseTarget(velocityPerSecond) {
		const maximumTravel = isMobile ? 2 : 4;
		const projectedTravel = clamp(
			projectRelease(velocityPerSecond),
			-maximumTravel,
			maximumTravel
		);
		return nearestStep(offset + projectedTravel);
	}

	/** @param {number} value */
	function queueDragOffset(value) {
		pendingDragOffset = value;
		if (!dragFrame) dragFrame = requestAnimationFrame(flushDragOffset);
	}

	function flushDragOffset() {
		if (dragFrame) cancelAnimationFrame(dragFrame);
		dragFrame = 0;
		if (pendingDragOffset === undefined) return;
		offset = pendingDragOffset;
		pendingDragOffset = undefined;
	}

	function cancelDragFrame() {
		if (dragFrame) cancelAnimationFrame(dragFrame);
		dragFrame = 0;
		pendingDragOffset = undefined;
	}

	/** @param {number} value */
	function setOffsetInstantly(value) {
		finishMotion();
		offset = value;
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

		const averageTime =
			pointerHistory.reduce((sum, sample) => sum + sample.time, 0) / pointerHistory.length;
		const averageX =
			pointerHistory.reduce((sum, sample) => sum + sample.x, 0) / pointerHistory.length;
		let covariance = 0;
		let timeVariance = 0;

		for (const sample of pointerHistory) {
			const centeredTime = sample.time - averageTime;
			covariance += centeredTime * (sample.x - averageX);
			timeVariance += centeredTime * centeredTime;
		}

		return timeVariance > 0 ? (covariance / timeVariance) * (1000 / step) : 0;
	}

	function resetClickSuppression() {
		if (clickResetTimer !== undefined) window.clearTimeout(clickResetTimer);
		clickResetTimer = window.setTimeout(() => (suppressClick = false), 0);
	}

	/** @param {PointerEvent} event */
	function handlePointerDown(event) {
		if (pointerId !== undefined || event.button !== 0 || projects.length < 2) return;
		finishMotion();
		cancelDragFrame();
		pointerId = event.pointerId;
		suppressClick = false;
		dragStartX = event.clientX;
		dragStartOffset = offset;
		pointerHistory = [{ x: event.clientX, time: performance.now() }];
	}

	/** @param {PointerEvent} event */
	function handlePointerMove(event) {
		if (event.pointerId !== pointerId) return;
		const now = performance.now();
		const delta = event.clientX - dragStartX;
		recordPointerSample(event.clientX, now);

		if (!isDragging) {
			if (Math.abs(delta) <= DRAG_THRESHOLD) return;
			isDragging = true;
			isMoving = true;
			suppressClick = true;
			const target = /** @type {HTMLDivElement} */ (event.currentTarget);
			target.setPointerCapture(event.pointerId);
		}

		event.preventDefault();
		queueDragOffset(dragStartOffset + delta / step);
	}

	/** @param {PointerEvent} event */
	function handlePointerEnd(event) {
		const activePointerId = pointerId;
		if (activePointerId === undefined || event.pointerId !== activePointerId) return;
		const wasDragging = isDragging;
		const wasCancelled = event.type === 'pointercancel';
		const target = /** @type {HTMLDivElement} */ (event.currentTarget);

		if (!wasCancelled && wasDragging) {
			const finalDelta = event.clientX - dragStartX;
			pendingDragOffset = dragStartOffset + finalDelta / step;
			flushDragOffset();
			recordPointerSample(event.clientX, performance.now());
		} else {
			cancelDragFrame();
		}

		const releaseVelocity = clamp(getReleaseVelocity(), -MAX_RELEASE_SPEED, MAX_RELEASE_SPEED);
		isDragging = false;
		pointerId = undefined;
		if (target.hasPointerCapture(activePointerId)) target.releasePointerCapture(activePointerId);

		if (wasCancelled) {
			setOffsetInstantly(wasDragging ? nearestStep(offset) : dragStartOffset);
		} else if (wasDragging) {
			if (prefersReducedMotion.current) {
				setOffsetInstantly(nearestStep(offset));
			} else {
				startSpring(releaseTarget(releaseVelocity), releaseVelocity);
			}
		} else {
			setOffsetInstantly(dragStartOffset);
		}

		resetClickSuppression();
		pointerHistory = [];
	}

	/** @param {PointerEvent} event */
	function handleLostPointerCapture(event) {
		if (event.pointerId !== pointerId) return;
		const wasDragging = isDragging;
		cancelDragFrame();
		isDragging = false;
		pointerId = undefined;
		pointerHistory = [];
		setOffsetInstantly(wasDragging ? nearestStep(offset) : dragStartOffset);
		resetClickSuppression();
	}

	/** @param {number} direction */
	function moveBy(direction) {
		const target = nearestStep(offset) + direction;
		if (prefersReducedMotion.current) setOffsetInstantly(target);
		else startSpring(target, 0);
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
			setOffsetInstantly(0);
		}
	}

	/** @param {number} virtualIndex */
	function focusCard(virtualIndex) {
		if (pointerId !== undefined) return;
		setOffsetInstantly(-virtualIndex);
	}

	/** @param {HTMLDivElement} node */
	function dragSurface(node) {
		node.addEventListener('pointerdown', handlePointerDown);
		node.addEventListener('pointermove', handlePointerMove);
		node.addEventListener('pointerup', handlePointerEnd);
		node.addEventListener('pointercancel', handlePointerEnd);
		node.addEventListener('lostpointercapture', handleLostPointerCapture);
		node.addEventListener('keydown', handleKeydown);

		return () => {
			cancelDragFrame();
			if (pointerId !== undefined) {
				offset = isDragging ? nearestStep(offset) : dragStartOffset;
				isDragging = false;
				pointerId = undefined;
				pointerHistory = [];
			}
			finishMotion();
			if (clickResetTimer !== undefined) window.clearTimeout(clickResetTimer);
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerup', handlePointerEnd);
			node.removeEventListener('pointercancel', handlePointerEnd);
			node.removeEventListener('lostpointercapture', handleLostPointerCapture);
			node.removeEventListener('keydown', handleKeydown);
		};
	}
</script>

<div class="wall-wrap">
	<div
		class={['wall-stage', { dragging: isDragging, coasting: isMoving && !isDragging }]}
		role="region"
		aria-roledescription="carousel"
		aria-label="Infinite project wall. Drag or flick horizontally, or use the left and right arrow keys."
		aria-describedby="wall-instructions"
		tabindex="-1"
		bind:clientWidth={stageWidth}
		{@attach dragSurface}
	>
		<p id="wall-instructions" class="sr-only">
			Drag or flick the wall horizontally. Use the left and right arrow keys to move one project at a time.
		</p>

		<div class="wall-scene">
			{#each visibleCards as card (card.virtualIndex)}
				<div
					class={['card-positioner', { active: card.active }]}
					style:transform={card.transform}
					style:opacity={card.opacity}
					style:z-index={card.active ? 200 : 120 - Math.round(card.distance * 10)}
				>
					<ProjectCard
						project={card.project}
						active={card.active}
						tabindex={card.active ? 0 : -1}
						onfocus={() => focusCard(card.virtualIndex)}
						shouldSuppressClick={() => suppressClick}
					/>
				</div>
			{/each}
		</div>

		<p class="sr-only" aria-live="polite" aria-atomic="true">
			{#if activeProject && !isMoving}Current project: {activeProject.projectName}{/if}
		</p>
	</div>
</div>

<style>
	.wall-wrap {
		position: relative;
		isolation: isolate;
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
		height: clamp(24.5rem, 26vw, 28rem);
		perspective: 1720px;
		perspective-origin: 50% 45%;
		cursor: grab;
		outline: none;
		touch-action: pan-y;
		user-select: none;
	}

	.wall-stage::before {
		position: absolute;
		z-index: 0;
		bottom: 1.1rem;
		left: 50%;
		width: min(76vw, 70rem);
		height: 2.25rem;
		background: radial-gradient(ellipse, var(--wall-shadow), transparent 68%);
		content: '';
		opacity: 0.6;
		transform: translateX(-50%);
		pointer-events: none;
	}

	.wall-stage:focus-visible::after {
		position: absolute;
		z-index: 150;
		right: 1.4rem;
		bottom: 0.2rem;
		padding: 0.32rem 0.55rem;
		border: 1px solid var(--hairline, rgb(41 41 35 / 0.14));
		border-radius: 48% 52% 45% 55%;
		box-shadow: 0 0.35rem 1rem var(--shadow-soft, rgb(87 65 38 / 0.12));
		color: var(--ink, #292923);
		background: var(--surface, rgb(255 250 240 / 0.78));
		content: '←  drag, flick, or use arrow keys  →';
		font-family: var(--font-hand, 'Shantell Sans Variable', cursive);
		font-size: 0.72rem;
		transform: rotate(-0.6deg);
	}

	.wall-stage.dragging {
		cursor: grabbing;
	}

	.wall-scene {
		position: absolute;
		z-index: 1;
		inset: 0;
		transform-style: preserve-3d;
	}

	.card-positioner {
		position: absolute;
		top: 50%;
		left: 50%;
		width: clamp(20rem, 23.3vw, 24.375rem);
		height: clamp(18rem, 20.85vw, 22rem);
		transform-origin: center;
		transform-style: preserve-3d;
		backface-visibility: hidden;
		will-change: auto;
	}

	.wall-stage.dragging .card-positioner,
	.wall-stage.coasting .card-positioner {
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
			height: 22.75rem;
			perspective: 1180px;
			perspective-origin: 50% 47%;
		}

		.wall-stage::before {
			bottom: 0.45rem;
			width: 88vw;
		}

		.card-positioner {
			width: min(70vw, 17.5rem);
			height: min(17.5rem, 67vw);
		}

		.card-positioner:not(.active) {
			pointer-events: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wall-wrap {
			transition-duration: 120ms;
		}

		.card-positioner {
			will-change: auto;
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		.wall-stage:focus-visible::after {
			background: var(--surface-solid, #fffaf0);
		}
	}

	@media (prefers-contrast: more) {
		.wall-stage:focus-visible::after {
			border: 1px solid var(--ink, #292923);
		}
	}
</style>
