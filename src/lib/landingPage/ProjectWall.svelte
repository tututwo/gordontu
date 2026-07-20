<script>
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	import ProjectCard from './ProjectCard.svelte';

	/** @type {{ projects?: import('$lib/project/project.js').Project[] }} */
	let { projects = [] } = $props();

	const position = new Spring(0, {
		stiffness: 0.16,
		damping: 0.82,
		precision: 0.05
	});

	let stageWidth = $state(1200);
	let isDragging = $state(false);
	let isHovered = $state(false);
	let hasFocusWithin = $state(false);
	let isPausedByUser = $state(false);
	let suppressClick = $state(false);

	/** @type {number | undefined} */
	let pointerId;
	let dragStartX = 0;
	let dragStartPosition = 0;
	let lastPointerX = 0;
	let lastPointerTime = 0;
	let velocity = 0;
	/** @type {number | undefined} */
	let clickResetTimer;

	let step = $derived(
		stageWidth < 720
			? Math.max(286, stageWidth * 0.78)
			: Math.min(414, Math.max(350, stageWidth * 0.255))
	);
	let visibleCount = $derived(stageWidth < 720 ? 5 : 9);
	let activeVirtualIndex = $derived(Math.round(-position.current / step));
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
		const center = Math.round(-position.current / step);
		return Array.from({ length: visibleCount }, (_, slot) => {
			const virtualIndex = center + slot - half;
			const projectIndex = mod(virtualIndex, projects.length);
			const x = virtualIndex * step + position.current;
			const distance = Math.abs(x) / step;
			const direction = Math.sign(x);
			const scale = Math.max(0.69, 1.09 - distance * 0.125);
			const translateZ = 74 - Math.min(distance * 86, 245);
			const rotateY = clamp((-x / Math.max(stageWidth, 1)) * 66, -29, 29);
			const naturalTilt = (((projectIndex * 17) % 11) - 5) * 0.34;

			return {
				virtualIndex,
				project: projects[projectIndex],
				x,
				distance,
				scale,
				translateZ,
				rotateY,
				rotateZ: naturalTilt + direction * Math.min(distance * 0.55, 1.6),
				opacity: clamp(1.12 - distance * 0.17, 0.24, 1),
				active: virtualIndex === activeVirtualIndex
			};
		});
	});

	$effect(() => {
		if (!isAutoPlaying) return;

		let animationFrame = 0;
		let previousTime = performance.now();
		const startTimer = window.setTimeout(() => {
			/** @param {number} time */
			const move = (time) => {
				const elapsed = Math.min(time - previousTime, 32);
				previousTime = time;
				position.set(position.target - elapsed * 0.018);
				animationFrame = requestAnimationFrame(move);
			};

			animationFrame = requestAnimationFrame(move);
		}, 1100);

		return () => {
			window.clearTimeout(startTimer);
			if (animationFrame) cancelAnimationFrame(animationFrame);
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

	function pauseAtCurrentPosition() {
		position.set(position.current, { instant: true });
	}

	/** @param {PointerEvent} event */
	function handlePointerDown(event) {
		if (event.button !== 0 || projects.length < 2) return;
		pointerId = event.pointerId;
		isDragging = true;
		suppressClick = false;
		dragStartX = event.clientX;
		dragStartPosition = position.current;
		lastPointerX = event.clientX;
		lastPointerTime = performance.now();
		velocity = 0;
		pauseAtCurrentPosition();
		const target = /** @type {HTMLDivElement} */ (event.currentTarget);
		target.setPointerCapture(pointerId);
	}

	/** @param {PointerEvent} event */
	function handlePointerMove(event) {
		if (!isDragging || event.pointerId !== pointerId) return;
		const now = performance.now();
		const elapsed = Math.max(now - lastPointerTime, 1);
		const delta = event.clientX - dragStartX;
		const frameVelocity = (event.clientX - lastPointerX) / elapsed;
		velocity = velocity * 0.68 + frameVelocity * 0.32;
		lastPointerX = event.clientX;
		lastPointerTime = now;

		if (Math.abs(delta) > 6) {
			suppressClick = true;
			event.preventDefault();
		}

		position.set(dragStartPosition + delta, { instant: true });
	}

	/** @param {PointerEvent} event */
	function handlePointerEnd(event) {
		const activePointerId = pointerId;
		if (!isDragging || activePointerId === undefined || event.pointerId !== activePointerId) return;
		isDragging = false;
		const target = /** @type {HTMLDivElement} */ (event.currentTarget);
		if (target.hasPointerCapture(activePointerId)) {
			target.releasePointerCapture(activePointerId);
		}

		if (suppressClick && !prefersReducedMotion.current) {
			position.set(position.current + velocity * 245, { preserveMomentum: 320 });
		}

		window.clearTimeout(clickResetTimer);
		clickResetTimer = window.setTimeout(() => (suppressClick = false), 0);
		pointerId = undefined;
	}

	/** @param {number} direction */
	function moveBy(direction) {
		position.set(position.target + direction * step, {
			preserveMomentum: prefersReducedMotion.current ? 0 : 180
		});
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
			position.set(0);
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
		position.set(-virtualIndex * step, {
			preserveMomentum: prefersReducedMotion.current ? 0 : 140
		});
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
					style:--x={`${card.x}px`}
					style:--z={`${card.translateZ}px`}
					style:--rotate-y={`${card.rotateY}deg`}
					style:--rotate-z={`${card.rotateZ}deg`}
					style:--card-scale={card.scale}
					style:--card-opacity={card.opacity}
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
		border: 1px solid rgb(48 49 45 / 0.58);
		border-radius: 999px;
		color: #30312d;
		background: rgb(248 244 233 / 0.92);
		content: '←  drag or use arrow keys  →';
		font-family: 'Shantell Sans Variable', cursive;
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
		border-bottom: 1px solid rgb(48 49 45 / 0.58);
		color: #4c4d47;
		background: rgb(248 244 233 / 0.88);
		font-family: 'Shantell Sans Variable', cursive;
		font-size: 0.68rem;
		letter-spacing: 0.025em;
		cursor: pointer;
	}

	.motion-toggle:hover,
	.motion-toggle:focus-visible {
		color: #20211e;
		border-bottom-color: #20211e;
		outline: 1px solid #30312d;
		outline-offset: 4px;
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
		opacity: var(--card-opacity);
		transform: translate3d(calc(-50% + var(--x)), -50%, var(--z)) rotateY(var(--rotate-y))
			rotateZ(var(--rotate-z)) scale(var(--card-scale));
		transform-origin: center;
		transform-style: preserve-3d;
		backface-visibility: hidden;
		will-change: transform;
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
		.card-positioner {
			will-change: auto;
		}
	}
</style>
