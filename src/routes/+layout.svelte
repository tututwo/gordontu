<script>
	import '../app.css';
	import Analytics from '$lib/Analytics.svelte';
	import { page } from '$app/state';
	import PortfolioHeader from '$lib/landingPage/PortfolioHeader.svelte';

	let { children } = $props();

	// The landing page is the card deck alone; the header only chaperones the inner pages.
	let isLanding = $derived(page.route.id === '/');
</script>

<Analytics />

<div class="site-shell">
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

	{#if !isLanding}
		<PortfolioHeader />
	{/if}

	<main>{@render children()}</main>
</div>

<style>
	.site-shell {
		position: relative;
		min-height: 100svh;
		overflow-x: clip;
		color: var(--ink);
		background: var(--paper);
		font-family: var(--font-ui);
		isolation: isolate;
	}

	.site-shell::before,
	.site-shell::after {
		position: fixed;
		inset: -18vmax;
		content: '';
		pointer-events: none;
		will-change: transform;
	}

	.site-shell::before {
		z-index: -3;
		background:
			radial-gradient(circle at 16% 18%, var(--wash-blush), transparent 25rem),
			radial-gradient(circle at 84% 17%, var(--wash-sky), transparent 28rem);
		animation: ambient-drift-primary 26s var(--ease-in-out) -8s infinite;
	}

	.site-shell::after {
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

	@media (prefers-reduced-motion: reduce) {
		.site-shell::before,
		.site-shell::after {
			animation: none;
			transform: none;
			will-change: auto;
		}

		:global(*) {
			scroll-behavior: auto !important;
		}
	}
</style>
