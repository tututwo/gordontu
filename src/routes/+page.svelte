<script>
	import PortfolioHeader from '$lib/landingPage/PortfolioHeader.svelte';
	import ProjectWall from '$lib/landingPage/ProjectWall.svelte';
	import RoughSvg from '$lib/landingPage/RoughSvg.svelte';
	import { projects } from '$lib/project/project.js';
	import {
		underline,
		dragArrow,
		star,
		infinity,
		infiniteArrow,
		featureIcons
	} from '$lib/landingPage/sketches.js';

	let activeCategory = $state('all');

	let filteredProjects = $derived(
		activeCategory === 'all'
			? projects
			: projects.filter((project) => project.category === activeCategory)
	);

	const features = [
		{
			title: 'Data made visible',
			copy: 'Charts that turn complex systems into clear, memorable stories.',
			shapes: featureIcons.charts
		},
		{
			title: 'Maps with a point of view',
			copy: 'Spatial stories shaped through data, terrain, and careful craft.',
			shapes: featureIcons.maps
		},
		{
			title: 'Creative code in motion',
			copy: 'Interactive experiments built with Svelte, Three.js, D3, and GLSL.',
			shapes: featureIcons.creativeCode
		}
	];

	function selectCategory(/** @type {string} */ category) {
		activeCategory = category;
	}
</script>

<svelte:head>
	<title>Gordon Tu — Maps, charts, and code creatively</title>
	<meta
		name="description"
		content="Maps, charts, and creatively coded interactive experiments by Gordon Tu."
	/>
</svelte:head>

<main class="landing-shell">
	<svg class="paper-texture" aria-hidden="true" focusable="false">
		<filter id="paper-noise" x="0" y="0" width="100%" height="100%">
			<feTurbulence
				type="fractalNoise"
				baseFrequency="0.72"
				numOctaves="4"
				seed="18"
				stitchTiles="stitch"
				result="noise"
			/>
			<feColorMatrix
				in="noise"
				type="matrix"
				values="0.38 0 0 0 0.50  0 0.35 0 0 0.46  0 0 0.28 0 0.38  0 0 0 0.2 0"
			/>
		</filter>
		<rect width="100%" height="100%" filter="url(#paper-noise)"></rect>
	</svg>

	<PortfolioHeader {activeCategory} onselect={selectCategory} />

	<section class="hero" aria-labelledby="landing-title">
		<RoughSvg class="hero-spark" width={50} height={48} shapes={star} />
		<h1 id="landing-title">
			I make maps, charts,<br />
			and <span class="underlined">code creatively.<RoughSvg width={320} height={18} shapes={underline} /></span>
		</h1>
		<p>
			Selected data visualizations, maps, and interactive experiments<br />
			by Gordon Tu.
		</p>
	</section>

	<section class="project-wall-section" aria-label="Selected projects">
		<div class="annotation drag-annotation" aria-hidden="true">
			<span>Drag to unroll</span>
			<RoughSvg width={280} height={72} shapes={dragArrow} />
		</div>

		<div class="annotation wall-annotation" aria-hidden="true">
			<span>Project wall</span>
			<RoughSvg class="star" width={50} height={48} shapes={star} />
		</div>

		<div class="annotation infinite-annotation" aria-hidden="true">
			<span>{filteredProjects.length} projects</span>
			<RoughSvg class="infinity" width={78} height={45} shapes={infinity} />
			<RoughSvg class="infinite-arrow" width={225} height={48} shapes={infiniteArrow} />
		</div>

		{#key activeCategory}
			<ProjectWall projects={filteredProjects} />
		{/key}
	</section>

	<section class="features" aria-label="Portfolio disciplines">
		{#each features as feature, index (feature.title)}
			<article>
				<RoughSvg class="feature-icon" width={60} height={52} shapes={feature.shapes} />
				<div>
					<h2>{feature.title}</h2>
					<p>{feature.copy}</p>
				</div>
			</article>
			{#if index < features.length - 1}<span class="feature-divider" aria-hidden="true"></span>{/if}
		{/each}
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: var(--paper);
	}

	.landing-shell {
		position: relative;
		min-height: 100svh;
		overflow-x: clip;
		color: var(--ink);
		background: var(--paper);
		font-family: var(--font-ui);
		isolation: isolate;
	}

	.landing-shell::before,
	.landing-shell::after {
		position: fixed;
		inset: -18vmax;
		content: '';
		pointer-events: none;
		will-change: transform;
	}

	.landing-shell::before {
		z-index: -3;
		background:
			radial-gradient(circle at 16% 18%, var(--wash-blush), transparent 25rem),
			radial-gradient(circle at 84% 17%, var(--wash-sky), transparent 28rem);
		animation: ambient-drift-primary 26s var(--ease-in-out) -8s infinite;
	}

	.landing-shell::after {
		z-index: -2;
		background: radial-gradient(circle at 50% 82%, var(--wash-mint), transparent 34rem);
		animation: ambient-drift-secondary 34s var(--ease-in-out) -19s infinite;
	}

	.paper-texture {
		position: fixed;
		z-index: -1;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0.075;
		pointer-events: none;
		mix-blend-mode: multiply;
	}

	.hero {
		position: relative;
		z-index: 20;
		display: grid;
		justify-items: center;
		padding: clamp(2rem, 4.6vh, 2.75rem) 1.25rem 0;
		text-align: center;
	}

	.hero :global(.hero-spark) {
		--sketch-ink: var(--accent-sun);

		position: absolute;
		top: 1.25rem;
		left: calc(50% + min(25vw, 22rem));
		width: 2.4rem;
		height: 2.3rem;
		transform: rotate(9deg);
		pointer-events: none;
	}

	h1 {
		max-width: 47rem;
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(3rem, 3.45vw, 3.7rem);
		font-optical-sizing: auto;
		font-weight: 440;
		letter-spacing: -0.035em;
		line-height: 0.99;
	}

	.underlined {
		--sketch-ink: var(--accent);

		position: relative;
		display: inline-block;
		color: color-mix(in srgb, var(--accent) 78%, var(--ink));
		white-space: nowrap;
	}

	.underlined :global(svg) {
		position: absolute;
		left: 0;
		bottom: -0.13em;
		width: 100%;
		height: 0.32em;
		pointer-events: none;
	}

	.hero > p {
		margin: clamp(1.25rem, 2.7vh, 1.65rem) 0 0;
		color: var(--muted-ink);
		font-family: var(--font-ui);
		font-size: clamp(0.94rem, 1.08vw, 1.08rem);
		font-weight: 390;
		letter-spacing: -0.018em;
		line-height: 1.42;
	}

	.project-wall-section {
		position: relative;
		z-index: 10;
		margin-top: clamp(1rem, 2.5vh, 1.55rem);
	}

	.annotation {
		position: absolute;
		z-index: 140;
		color: var(--ink);
		font-family: var(--font-hand);
		font-size: clamp(0.86rem, 1.06vw, 1.02rem);
		font-variation-settings: 'INFM' 70;
		font-weight: 440;
		letter-spacing: 0.015em;
		line-height: 1.1;
		pointer-events: none;
	}

	.drag-annotation {
		top: -2.3rem;
		left: clamp(3rem, 10vw, 10.5rem);
		width: 17.5rem;
		opacity: 0;
		transform: translateX(-10px) rotate(-3deg);
		animation: drag-cue-reveal 400ms var(--ease-out) 350ms both;
	}

	.drag-annotation span {
		display: block;
		margin-left: 1.8rem;
	}

	.drag-annotation :global(svg) {
		display: block;
		width: 100%;
		height: 4.5rem;
	}

	.wall-annotation {
		top: 0.15rem;
		left: 50%;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		transform: translateX(-50%) rotate(1deg);
	}

	.wall-annotation::before,
	.wall-annotation::after {
		display: block;
		width: clamp(3rem, 9vw, 9.5rem);
		height: 1px;
		margin: 0 0.35rem;
		background: var(--sketch-line);
		content: '';
	}

	.wall-annotation :global(.star) {
		width: 2.25rem;
		height: 2.15rem;
	}

	.infinite-annotation {
		top: -2.9rem;
		right: clamp(4rem, 12vw, 12.5rem);
		display: grid;
		width: 14rem;
		justify-items: center;
		transform: rotate(2deg);
	}

	.infinite-annotation :global(.infinity) {
		width: 4.1rem;
		height: 2.2rem;
		margin-top: 1.1rem;
	}

	.infinite-annotation :global(.infinite-arrow) {
		width: 13.5rem;
		height: 2.8rem;
		margin-top: -0.35rem;
	}

	.features {
		position: relative;
		z-index: 30;
		display: grid;
		max-width: 72rem;
		grid-template-columns: 1fr auto 1fr auto 1fr;
		align-items: center;
		gap: clamp(1.4rem, 3.6vw, 3.2rem);
		margin: clamp(3.25rem, 6vh, 3.8rem) auto 0;
		padding: 0 1.5rem clamp(1.35rem, 3vh, 2rem);
	}

	.features article {
		--feature-ink: var(--accent);
		--sketch-ink: var(--feature-ink);

		display: grid;
		grid-template-columns: 3.2rem 1fr;
		align-items: start;
		gap: 0.85rem;
		transform: rotate(-0.25deg);
	}

	.features article:nth-of-type(2) {
		--feature-ink: var(--accent-cool);

		transform: translateY(0.18rem) rotate(0.3deg);
	}

	.features article:nth-of-type(3) {
		--feature-ink: var(--accent-sun);

		transform: translateY(-0.08rem) rotate(-0.18deg);
	}

	.features :global(.feature-icon) {
		width: 3.1rem;
		height: 2.75rem;
		margin-top: 0.05rem;
	}

	.features h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 520;
		line-height: 1.15;
	}

	.features p {
		max-width: 17rem;
		margin: 0.48rem 0 0;
		color: var(--muted-ink);
		font-family: var(--font-ui);
		font-size: 0.76rem;
		font-weight: 390;
		line-height: 1.55;
	}

	.feature-divider {
		position: relative;
		width: 1px;
		height: 4.15rem;
		background: var(--sketch-line-soft);
		transform: rotate(0.8deg);
	}

	.feature-divider::after {
		position: absolute;
		inset: 0 0 0 2px;
		width: 1px;
		background: color-mix(in srgb, var(--sketch-line-soft) 48%, transparent);
		content: '';
		transform: rotate(-1.4deg);
	}

	@keyframes drag-cue-reveal {
		from {
			opacity: 0;
			transform: translateX(-10px) rotate(-3deg);
		}

		to {
			opacity: 1;
			transform: translateX(0) rotate(-3deg);
		}
	}

	@keyframes drag-cue-opacity {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@keyframes ambient-drift-primary {
		0%,
		100% {
			transform: translate3d(-2.5%, -1.5%, 0) scale(1.02) rotate(-0.6deg);
		}

		48% {
			transform: translate3d(2.5%, 2%, 0) scale(1.07) rotate(0.8deg);
		}
	}

	@keyframes ambient-drift-secondary {
		0%,
		100% {
			transform: translate3d(1.5%, 2.25%, 0) scale(1.04) rotate(0.5deg);
		}

		40% {
			transform: translate3d(-2.25%, -1.75%, 0) scale(1.08) rotate(-0.7deg);
		}

		72% {
			transform: translate3d(0.5%, -3%, 0) scale(1.02) rotate(0.25deg);
		}
	}

	@media (max-width: 980px) {
		.hero {
			padding-top: 1.6rem;
		}

		.drag-annotation {
			left: 2rem;
		}

		.infinite-annotation {
			right: 2rem;
		}

		.features {
			grid-template-columns: 1fr;
			gap: 1.35rem;
			max-width: 36rem;
			margin-top: 1.2rem;
		}

		.feature-divider {
			display: none;
		}
	}

	@media (max-width: 720px) {
		.hero {
			padding: 1.45rem 1rem 0;
		}

		h1 {
			font-size: clamp(2.45rem, 11vw, 3.1rem);
			line-height: 1;
		}

		.hero :global(.hero-spark) {
			top: 0.7rem;
			left: auto;
			right: 0.7rem;
			width: 1.85rem;
			height: 1.8rem;
		}

		.hero > p {
			max-width: 24rem;
			font-size: 0.86rem;
		}

		.hero > p br {
			display: none;
		}

		.project-wall-section {
			margin-top: 2.2rem;
		}

		.wall-annotation {
			top: -1.25rem;
		}

		.wall-annotation::before,
		.wall-annotation::after {
			width: 2.4rem;
		}

		.drag-annotation,
		.infinite-annotation {
			display: none;
		}

		.features {
			margin-top: 2.8rem;
			padding-inline: 1.25rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.landing-shell::before,
		.landing-shell::after {
			animation: none;
			transform: none;
			will-change: auto;
		}

		.drag-annotation {
			transform: rotate(-3deg);
			animation: drag-cue-opacity 200ms var(--ease-out) 350ms both;
		}

		* {
			scroll-behavior: auto !important;
		}
	}
</style>
