<script>
	import { resolve } from '$app/paths';
	import CardDeck from '$lib/landingPage/CardDeck.svelte';
</script>

<svelte:head>
	<title>Gordon Tu — Creative developer</title>
	<meta
		name="description"
		content="Maps, charts, and creatively coded interactive experiments by Gordon Tu."
	/>
</svelte:head>

<div class="landing">
	<a class="brand" href={resolve('/')} aria-label="Gordon Tu — home">
		<span class="brand__name">Gordon Tu</span>
		<span class="brand__role">Creative developer</span>
	</a>

	<h1 class="sr-only">Gordon Tu — creative developer</h1>

	<CardDeck />

	<div class="tagline" aria-hidden="true">
		<p>
			I build thoughtful digital experiences<br />
			with a love for data, design, and detail.
		</p>
		<span></span>
	</div>
</div>

<style>
	:global(.site-shell:has(.landing)) {
		--paper: #fefefe;
		--paper-elevated: #fff;
		--ink: #232326;
		--muted-ink: #666563;
		--accent: #c4923a;
		--wash-blush: rgb(255 255 255 / 0.88);
		--wash-sky: rgb(255 255 255 / 0.82);
		--wash-mint: rgb(255 255 255 / 0.78);
		--surface: rgb(255 255 255 / 0.94);
		--hairline: rgb(35 35 38 / 0.14);
		--shadow-soft: rgb(35 35 38 / 0.1);
		--sketch-line: rgb(35 35 38 / 0.74);
		--sketch-line-soft: rgb(35 35 38 / 0.34);
	}

	.landing {
		position: relative;
		min-height: 100svh;
		color: var(--ink);
	}

	.brand {
		position: absolute;
		z-index: 40;
		top: clamp(2rem, 5.2svh, 3rem);
		left: clamp(1.5rem, 3.4vw, 3.6rem);
		display: grid;
		gap: 0.7rem;
		width: max-content;
		color: var(--ink);
		font-family: var(--font-ui);
		text-decoration: none;
		text-transform: uppercase;
	}

	.brand__name {
		font-size: clamp(0.95rem, 1.2vw, 1.22rem);
		font-weight: 560;
		letter-spacing: 0.43em;
		line-height: 1;
	}

	.brand__role {
		font-size: clamp(0.54rem, 0.63vw, 0.64rem);
		font-weight: 460;
		letter-spacing: 0.5em;
		line-height: 1;
	}

	.brand:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 7px;
	}

	.tagline {
		position: absolute;
		z-index: 30;
		bottom: clamp(2.35rem, 4.6svh, 2.7rem);
		left: 50%;
		display: grid;
		justify-items: center;
		transform: translateX(-50%) rotate(-0.25deg);
		pointer-events: none;
	}

	.tagline p {
		width: max-content;
		margin: 0;
		color: var(--ink);
		font-family: var(--font-hand);
		font-size: clamp(0.76rem, 1.05vw, 1rem);
		font-variation-settings: 'INFM' 75;
		font-weight: 430;
		letter-spacing: 0.14em;
		line-height: 1.9;
		text-align: center;
	}

	.tagline span {
		width: 2rem;
		height: 2px;
		margin-top: clamp(0.85rem, 1.8svh, 1.1rem);
		background: var(--accent);
		transform: rotate(-1deg);
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
		.brand {
			top: 1.5rem;
			left: 1.25rem;
		}

		.tagline {
			position: relative;
			bottom: auto;
			left: auto;
			padding: 1.5rem 1rem 2rem;
			transform: rotate(-0.25deg);
		}

		.tagline p {
			width: auto;
			font-size: 0.72rem;
			letter-spacing: 0.08em;
		}
	}
</style>
