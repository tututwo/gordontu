<script>
	import ProjectCard from './ProjectCard.svelte';
	import { WallMotion } from './wallMotion.svelte.js';

	/** @type {{ projects?: import('$lib/project/project.js').Project[] }} */
	let { projects = [] } = $props();

	let stageWidth = $state(1200);
	let isMobile = $derived(stageWidth <= 720);
	let cardWidth = $derived(
		isMobile
			? Math.min(stageWidth * 0.7, 280)
			: Math.min(390, Math.max(320, stageWidth * 0.233))
	);
	let step = $derived(cardWidth * (isMobile ? 1.08 : 1));
	let visibleCount = $derived(isMobile ? 5 : 9);

	const motion = new WallMotion({
		step: () => step,
		isMobile: () => isMobile,
		count: () => projects.length
	});

	let activeVirtualIndex = $derived(Math.round(-motion.offset));
	let activeProject = $derived(projects[mod(activeVirtualIndex, projects.length)]);
	let visibleCards = $derived.by(() => {
		if (projects.length === 0) return [];

		const offset = motion.offset;
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
			const variationSeed = projects[projectIndex].seed;
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
</script>

<div class="wall-wrap">
	<div
		class={['wall-stage', { dragging: motion.isDragging, coasting: motion.isMoving && !motion.isDragging }]}
		role="region"
		aria-roledescription="carousel"
		aria-label="Infinite project wall. Drag or flick horizontally, or use the left and right arrow keys."
		aria-describedby="wall-instructions"
		tabindex="-1"
		bind:clientWidth={stageWidth}
		{@attach motion.attach}
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
						onfocus={() => motion.focusCard(card.virtualIndex)}
					/>
				</div>
			{/each}
		</div>

		<p class="sr-only" aria-live="polite" aria-atomic="true">
			{#if activeProject && !motion.isMoving}Current project: {activeProject.projectName}{/if}
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
		-webkit-touch-callout: none;
		-webkit-user-select: none;
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
