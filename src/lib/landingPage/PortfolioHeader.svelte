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

	const buttonShape = [
		{
			type: 'rectangle',
			x: 3,
			y: 5,
			width: 154,
			height: 42,
			options: {
				seed: 912,
				stroke: '#292a27',
				strokeWidth: 1.4,
				fill: '#292a27',
				fillStyle: 'solid',
				roughness: 1.45,
				bowing: 1
			}
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
		<a href="https://www.linkedin.com/in/gordon-tu-675a43255/" target="_blank" rel="noreferrer">
			LinkedIn
		</a>
		<a class="github-link" href="https://github.com/tututwo" target="_blank" rel="noreferrer">
			<RoughSvg class="button-shape" width={160} height={52} shapes={buttonShape} />
			<span>GitHub</span>
		</a>
	</div>
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
		padding: 1.45rem clamp(1.25rem, 3.5vw, 3.7rem) 0.75rem;
		font-family: 'Libre Franklin Variable', sans-serif;
	}

	.brand {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		gap: 0.72rem;
		color: var(--ink, #30312d);
		font-family: 'Shantell Sans Variable', cursive;
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
		color: var(--ink, #30312d);
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

	.category-nav button {
		opacity: 0.66;
		transition: opacity 150ms ease;
	}

	.category-nav button:hover,
	.category-nav button:focus-visible,
	.category-nav button.active {
		opacity: 1;
	}

	.category-nav button:focus-visible,
	.outbound-links a:focus-visible,
	.brand:focus-visible {
		outline: 2px solid #30312d;
		outline-offset: 5px;
	}

	.category-nav :global(.active-line) {
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
		gap: clamp(1.3rem, 2.2vw, 2.4rem);
	}

	.github-link {
		display: grid;
		min-width: 8.8rem;
		height: 2.8rem;
		place-items: center;
		color: #f8f4e9 !important;
	}

	.github-link :global(.button-shape) {
		position: absolute;
		z-index: -1;
		inset: -0.2rem -0.55rem;
		width: calc(100% + 1.1rem);
		height: calc(100% + 0.4rem);
	}

	.github-link span {
		position: relative;
		z-index: 1;
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

		.category-nav button,
		.outbound-links a {
			font-size: 0.62rem;
		}

		.outbound-links > a:first-child {
			display: none;
		}

		.github-link {
			min-width: 5.9rem;
			height: 2.35rem;
		}
	}
</style>
