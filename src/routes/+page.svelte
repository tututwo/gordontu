<script>
	import { resolve } from '$app/paths';
	import CardDeck from '$lib/landingPage/CardDeck.svelte';
</script>

<svelte:head>
	<title>Gordon Tu — Maps, charts, and code creatively</title>
	<meta
		name="description"
		content="Maps, charts, and creatively coded interactive experiments by Gordon Tu."
	/>
</svelte:head>

<div class="landing">
	<a class="brand" href={resolve('/')} aria-label="Gordon Tu — home">
		<img src="/印章.svg" alt="" width="43" height="46" />
		<span>Gordon Tu</span>
	</a>

	<h1 class="sr-only">Gordon Tu — maps, charts, and code creatively</h1>

	<CardDeck />
</div>

<style>
	.landing {
		position: relative;
	}

	.brand {
		position: absolute;
		z-index: 30;
		top: 1.15rem;
		left: clamp(1rem, 3vw, 2.5rem);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ink);
		font-family: var(--font-hand);
		font-size: 0.86rem;
		font-variation-settings: 'INFM' 60;
		font-weight: 520;
		letter-spacing: 0.1em;
		text-decoration: none;
		text-transform: uppercase;
	}

	.brand img {
		display: block;
		width: 1.9rem;
		height: 2rem;
		object-fit: contain;
		opacity: 0.94;
	}

	.brand:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 5px;
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
</style>
