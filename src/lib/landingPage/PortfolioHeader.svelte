<script>
	import { resolve } from '$app/paths';
	import RoughSvg from './RoughSvg.svelte';

	let { activeCategory = 'all', onselect = () => {} } = $props();

	const categories = [
		{ value: 'all', label: 'All' },
		{ value: 'charts', label: 'Charts' },
		{ value: 'maps', label: 'Maps' },
		{ value: 'code creatively', label: 'Creative code' }
	];

	const activeLine = [
		{
			type: 'curve',
			points: [
				[3, 9],
				[28, 7],
				[58, 10],
				[88, 6],
				[117, 8]
			],
			options: { seed: 142, strokeWidth: 1.35, roughness: 1.5, bowing: 1.4 }
		}
	];

	const socialFrames = {
		linkedin: [
			{
				type: 'rectangle',
				x: 6,
				y: 6,
				width: 40,
				height: 40,
				options: { seed: 1304, strokeWidth: 1.35, roughness: 1.55, bowing: 1.35 }
			},
			{
				type: 'rectangle',
				x: 4,
				y: 8,
				width: 43,
				height: 37,
				options: { seed: 1305, strokeWidth: 0.7, roughness: 1.8, bowing: 1.2 }
			}
		],
		github: [
			{
				type: 'ellipse',
				x: 26,
				y: 26,
				width: 43,
				height: 41,
				options: { seed: 2711, strokeWidth: 1.35, roughness: 1.55, bowing: 1.2 }
			},
			{
				type: 'ellipse',
				x: 25,
				y: 27,
				width: 39,
				height: 43,
				options: { seed: 2712, strokeWidth: 0.7, roughness: 1.75, bowing: 1.35 }
			}
		]
	};

	const socialIcons = {
		linkedin: [
			{
				type: 'ellipse',
				x: 5.8,
				y: 5.8,
				width: 2.7,
				height: 2.7,
				options: {
					seed: 6101,
					fill: 'var(--sketch-ink)',
					fillStyle: 'solid',
					strokeWidth: 1,
					roughness: 1.15
				}
			},
			{
				type: 'line',
				x1: 7.1,
				y1: 10.5,
				x2: 7.1,
				y2: 18.4,
				options: { seed: 6102, strokeWidth: 2.15, roughness: 1.05, bowing: 0.7 }
			},
			{
				type: 'line',
				x1: 11,
				y1: 10.7,
				x2: 11,
				y2: 18.4,
				options: { seed: 6103, strokeWidth: 2.05, roughness: 1.05, bowing: 0.65 }
			},
			{
				type: 'path',
				d: 'M 11 14.2 C 11.7 11.7, 13.2 10.5, 15.2 10.5 C 17.6 10.5, 18.2 12.1, 18.2 14.4 L 18.2 18.4',
				options: { seed: 6104, strokeWidth: 2.05, roughness: 1.05, bowing: 0.75 }
			}
		],
		github: [
			{
				type: 'path',
				d: 'M 7.1 9 C 6.2 6.8, 6.6 4.7, 7.7 3.2 C 9.6 3.5, 11 4.2, 12 5 C 13.6 4.6, 15.1 4.6, 16.5 5 C 17.8 4, 19.2 3.4, 20.5 3.4 C 21.2 5.6, 21.1 7.3, 20.2 9 C 21.5 10.2, 22.1 11.8, 22.1 13.5 C 22.1 18.1, 18.5 20.3, 13.6 20.3 C 8.3 20.3, 4.2 18.2, 4.2 13.5 C 4.2 11.7, 5.2 10.1, 7.1 9 Z',
				options: { seed: 7201, strokeWidth: 1.55, roughness: 1.15, bowing: 0.8 }
			},
			{
				type: 'curve',
				points: [
					[8.7, 19],
					[6.9, 20.2],
					[5.1, 18.6],
					[4, 17.1],
					[2.2, 17]
				],
				options: { seed: 7202, strokeWidth: 1.45, roughness: 1.25, bowing: 1 }
			},
			{
				type: 'ellipse',
				x: 10.4,
				y: 13.6,
				width: 1.15,
				height: 1.45,
				options: {
					seed: 7203,
					fill: 'var(--sketch-ink)',
					fillStyle: 'solid',
					strokeWidth: 0.75,
					roughness: 0.9
				}
			},
			{
				type: 'ellipse',
				x: 16.2,
				y: 13.6,
				width: 1.15,
				height: 1.45,
				options: {
					seed: 7204,
					fill: 'var(--sketch-ink)',
					fillStyle: 'solid',
					strokeWidth: 0.75,
					roughness: 0.9
				}
			}
		]
	};

	const headerDivider = [
		{
			type: 'curve',
			points: [
				[0, 6],
				[260, 7],
				[535, 5],
				[810, 7],
				[1085, 5],
				[1360, 7],
				[1600, 6]
			],
			options: { seed: 404, strokeWidth: 0.8, roughness: 1.3, bowing: 0.7 }
		}
	];
</script>

<header class="site-header">
	<a class="brand" href={resolve('/')} aria-label="Gordon Tu — home">
		<span class="seal-wrap" aria-hidden="true">
			<img src="/印章.svg" alt="" width="43" height="46" />
		</span>
		<span>Gordon Tu</span>
	</a>

	<nav class="category-nav" aria-label="Filter projects by category">
		{#each categories as category (category.value)}
			<button
				type="button"
				class={activeCategory === category.value ? 'active' : ''}
				aria-pressed={activeCategory === category.value}
				onclick={() => onselect(category.value)}
			>
				{category.label}
				{#if activeCategory === category.value}
					<RoughSvg class="active-line" width={120} height={16} shapes={activeLine} />
				{/if}
			</button>
		{/each}
	</nav>

	<div class="outbound-links">
		<a
			class="social-link linkedin-link"
			href="https://www.linkedin.com/in/gordon-tu-675a43255/"
			target="_blank"
			rel="noreferrer"
			aria-label="Gordon Tu on LinkedIn"
			title="LinkedIn"
		>
			<RoughSvg class="social-frame" width={52} height={52} shapes={socialFrames.linkedin} />
			<RoughSvg class="social-logo" width={24} height={24} shapes={socialIcons.linkedin} />
		</a>
		<a
			class="social-link github-link"
			href="https://github.com/tututwo"
			target="_blank"
			rel="noreferrer"
			aria-label="Gordon Tu on GitHub"
			title="GitHub"
		>
			<RoughSvg class="social-frame" width={52} height={52} shapes={socialFrames.github} />
			<RoughSvg class="social-logo" width={24} height={24} shapes={socialIcons.github} />
		</a>
	</div>

	<RoughSvg class="header-divider" width={1600} height={12} shapes={headerDivider} />
</header>

<style>
	.site-header {
		position: relative;
		z-index: 200;
		display: grid;
		width: 100%;
		grid-template-columns: minmax(12rem, 1fr) auto minmax(12rem, 1fr);
		align-items: center;
		gap: 2rem;
		padding: 1.3rem clamp(1.25rem, 3.5vw, 3.7rem) 0.9rem;
		border-bottom: 0;
		background: color-mix(in srgb, var(--paper) 92%, transparent);
		font-family: var(--font-ui);
	}

	.site-header :global(.header-divider) {
		--sketch-ink: var(--sketch-line-soft);

		position: absolute;
		left: 0;
		bottom: -0.3rem;
		width: 100%;
		height: 0.65rem;
		pointer-events: none;
	}

	.brand {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		gap: 0.72rem;
		color: var(--ink);
		font-family: var(--font-hand);
		font-size: 1.17rem;
		font-variation-settings: 'INFM' 60;
		font-weight: 520;
		letter-spacing: 0.065em;
		text-decoration: none;
		text-transform: uppercase;
	}

	.seal-wrap {
		display: grid;
		width: 3rem;
		height: 3rem;
		place-items: center;
	}

	.seal-wrap img {
		display: block;
		width: 2.7rem;
		height: 2.85rem;
		object-fit: contain;
		opacity: 0.94;
	}

	.category-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(1.4rem, 3.1vw, 3.45rem);
	}

	.category-nav button,
	.outbound-links a {
		position: relative;
		padding: 0.55rem 0;
		border: 0;
		color: var(--ink);
		background: transparent;
		font: inherit;
		font-size: 0.72rem;
		font-weight: 550;
		letter-spacing: 0.115em;
		text-decoration: none;
		text-transform: uppercase;
		white-space: nowrap;
		cursor: pointer;
	}

	.brand,
	.category-nav button,
	.outbound-links a {
		transform: scale(1);
		transform-origin: center;
		transition: transform var(--press-out-duration) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	.category-nav button {
		opacity: 0.66;
		font-family: var(--font-hand);
		font-variation-settings: 'INFM' 58;
		letter-spacing: 0.075em;
		transition: transform var(--press-out-duration) var(--ease-out);
	}

	.category-nav button:focus-visible,
	.category-nav button.active {
		opacity: 1;
	}

	.brand:active:not(:focus-visible),
	.category-nav button:active:not(:focus-visible),
	.outbound-links a:active:not(:focus-visible) {
		transform: scale(0.97);
		transition-duration: var(--press-in-duration);
	}

	.category-nav button:focus-visible,
	.outbound-links a:focus-visible,
	.brand:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 5px;
	}

	.category-nav :global(.active-line) {
		--sketch-ink: var(--accent);

		position: absolute;
		left: 50%;
		bottom: -0.18rem;
		width: calc(100% + 0.8rem);
		height: 0.55rem;
		transform: translateX(-50%);
		pointer-events: none;
	}

	.outbound-links {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.55rem;
	}

	.outbound-links .social-link {
		--sketch-ink: var(--sketch-line);

		position: relative;
		display: grid;
		width: 2.8rem;
		height: 2.8rem;
		padding: 0;
		place-items: center;
		color: var(--ink);
		border-radius: 48% 52% 46% 54%;
		background: color-mix(in srgb, var(--paper-elevated) 72%, transparent);
	}

	.linkedin-link {
		color: var(--accent-cool) !important;
	}

	.social-link :global(.social-frame) {
		position: absolute;
		inset: -0.2rem;
		width: calc(100% + 0.4rem);
		height: calc(100% + 0.4rem);
		pointer-events: none;
	}

	.social-link :global(.social-logo) {
		--sketch-ink: currentColor;

		position: relative;
		z-index: 1;
		display: block;
		width: 1.45rem;
		height: 1.45rem;
		overflow: visible;
		pointer-events: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.category-nav button:hover {
			opacity: 1;
		}

		.outbound-links .social-link:hover {
			--sketch-ink: var(--accent);

			transform: translateY(-1px) rotate(-2deg) scale(1.035);
		}

		.outbound-links .github-link:hover {
			transform: translateY(-1px) rotate(2deg) scale(1.035);
		}
	}

	@media (max-width: 980px) {
		.site-header {
			grid-template-columns: 1fr auto;
			gap: 1rem;
		}

		.category-nav {
			grid-column: 1 / -1;
			grid-row: 2;
			order: 3;
			gap: clamp(1rem, 5vw, 2.5rem);
		}

		.outbound-links {
			grid-column: 2;
			grid-row: 1;
		}
	}

	@media (max-width: 620px) {
		.site-header {
			padding: 0.8rem 1rem 0.35rem;
		}

		.brand {
			gap: 0.42rem;
			font-size: 0.89rem;
		}

		.seal-wrap,
		.seal-wrap img {
			width: 2.25rem;
			height: 2.35rem;
		}

		.category-nav {
			justify-content: flex-start;
			gap: 1.25rem;
			overflow-x: auto;
			padding: 0 0.15rem 0.25rem;
			scrollbar-width: none;
		}

		.category-nav::-webkit-scrollbar {
			display: none;
		}

		.category-nav button {
			font-size: 0.62rem;
		}

		.outbound-links .social-link {
			width: 2.75rem;
			height: 2.75rem;
		}

		.social-link :global(.social-logo) {
			width: 1.35rem;
			height: 1.35rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.brand,
		.category-nav button,
		.outbound-links a,
		.brand:active,
		.category-nav button:active,
		.outbound-links a:active {
			transform: none;
		}

		.brand,
		.outbound-links a {
			transition: none;
		}

		.category-nav button {
			transition: none;
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		.site-header {
			background: var(--surface-solid);
		}
	}

	@media (prefers-contrast: more) {
		.site-header {
			background: var(--surface-solid);
		}

		.site-header :global(.header-divider) {
			--sketch-ink: var(--ink);
		}

		.category-nav button {
			opacity: 0.82;
		}

		.category-nav button:focus-visible,
		.outbound-links a:focus-visible,
		.brand:focus-visible {
			outline-width: 3px;
		}
	}
</style>
