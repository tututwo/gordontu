<script>
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>About — Gordon Tu</title>
	<meta name="description" content="About Gordon Tu, a design engineer working across charts, maps, and creative coding." />
</svelte:head>

<!-- ponytail: placeholder About page — heading and one line; write the real bio here when it exists. -->
<article class="page">
	<nav class="crumbs">
		<a href={resolve('/')}>Gordon Tu</a>
	</nav>

	<h1>About</h1>
	<p>Design engineer. Charts, maps, and creative coding. The full story is on its way.</p>
</article>

<style>
	.page {
		position: relative;
		z-index: 1;
		max-width: 60rem;
		margin: 0 auto;
		padding: clamp(1.25rem, 3vh, 2rem) clamp(1rem, 4vw, 2rem) 4rem;
		font-family: var(--font-ui);
	}

	.crumbs {
		margin-bottom: clamp(2rem, 6vh, 4rem);
	}

	a {
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 1.2rem;
		text-decoration: none;
	}

	a:hover {
		color: var(--accent);
	}

	a:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 4px;
	}

	h1 {
		margin: 0 0 1rem;
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 4vw, 3.4rem);
		font-weight: 440;
		letter-spacing: -0.03em;
		line-height: 1.05;
	}

	p {
		margin: 0;
		color: var(--muted-ink);
		font-size: 1.05rem;
		line-height: 1.6;
	}
</style>
