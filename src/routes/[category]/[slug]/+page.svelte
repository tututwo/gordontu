<script>
	import { resolve } from '$app/paths';
	import { toOptimizedImage } from '$lib/project/project.js';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	let date = $derived(
		new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
			new Date(`${data.project.date}T00:00:00`)
		)
	);
	let optimized = $derived(toOptimizedImage(data.project.projectImgSource));

	/** @param {Event} event */
	function handleImageError(event) {
		const image = /** @type {HTMLImageElement} */ (event.currentTarget);
		if (!image.src.endsWith(data.project.projectImgSource)) image.src = data.project.projectImgSource;
	}
</script>

<svelte:head>
	<title>{data.project.projectName} — {data.category.label} — Gordon Tu</title>
	<meta name="description" content="{data.project.projectName}, a {data.category.label} project by Gordon Tu." />
</svelte:head>

<!-- ponytail: placeholder project page — fields only, no design yet. Redesign here when the content exists. -->
<article class="project">
	<nav class="crumbs">
		<a href={resolve('/')}>Gordon Tu</a>
		<span aria-hidden="true">/</span>
		<a href={resolve('/[category]', { category: data.category.slug })}>← Back to {data.category.label}</a>
	</nav>

	<h1>{data.project.projectName}</h1>
	<p class="meta">
		<span>{date}</span>
		<span aria-hidden="true">·</span>
		<span>{data.category.label}</span>
		<span aria-hidden="true">·</span>
		<span>{data.project.tools.join(', ')}</span>
	</p>

	<img src={optimized} alt="" onerror={handleImageError} />

	<p class="actions">
		<a href={data.project.projectLink} target="_blank" rel="external noreferrer">Open project ↗</a>
	</p>
</article>

<style>
	.project {
		position: relative;
		z-index: 1;
		max-width: 60rem;
		margin: 0 auto;
		padding: clamp(1.25rem, 3vh, 2rem) clamp(1rem, 4vw, 2rem) 4rem;
		font-family: var(--font-ui);
	}

	.crumbs {
		display: flex;
		gap: 0.6rem;
		margin-bottom: clamp(2rem, 6vh, 4rem);
		font-size: 0.95rem;
		color: var(--muted-ink);
	}

	.crumbs a:first-child {
		font-family: var(--font-display);
		font-size: 1.2rem;
		color: var(--ink);
	}

	a {
		color: var(--ink);
		text-decoration: none;
	}

	a:hover,
	a:focus-visible {
		color: var(--accent);
		outline: none;
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 4vw, 3.4rem);
		font-weight: 440;
		letter-spacing: -0.03em;
		line-height: 1.05;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1rem 0 2rem;
		color: var(--muted-ink);
	}

	img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--hairline);
		border-radius: 0.6rem;
		background: var(--paper-elevated);
		box-shadow: var(--shadow-material);
	}

	.actions {
		margin: 1.5rem 0 0;
		font-family: var(--font-hand);
		font-size: 1.05rem;
	}
</style>
