<script>
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} — Gordon Tu</title>
</svelte:head>

<section class="hero">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Something went wrong.'}</p>
</section>

<style>
	.hero {
		display: grid;
		justify-items: center;
		padding: clamp(2rem, 4.6vh, 2.75rem) 1.25rem 0;
		text-align: center;
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(3rem, 3.45vw, 3.7rem);
		font-weight: 440;
		letter-spacing: -0.035em;
		line-height: 0.99;
	}

	p {
		margin: 1.25rem 0 0;
		color: var(--muted-ink);
	}
</style>
