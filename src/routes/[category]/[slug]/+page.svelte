<script>
	import { resolve } from '$app/paths';
	import { toOptimizedImage } from '$lib/project/project.js';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	let date = $derived(new Date(`${data.project.date}T00:00:00`).toLocaleDateString('en', { month: 'long', year: 'numeric' }));
</script>

<svelte:head>
	<title>{data.project.projectName} — {data.category.label} — Gordon Tu</title>
	<meta name="description" content="{data.project.projectName}, a {data.category.label} project by Gordon Tu." />
</svelte:head>

<!-- ponytail: placeholder project page — fields only, in the landing's column and type. Redesign here when the content exists. -->
<article class="project">
	<nav>
		<a href={resolve('/')}>Gordon Tu</a>
		<span aria-hidden="true">/</span>
		<a href={resolve('/[category]', { category: data.category.slug })}>{data.category.label}</a>
	</nav>

	<h1>{data.project.projectName}</h1>

	<dl>
		<div>
			<dt>Client</dt>
			<dd>{data.project.client ?? 'Self-initiated'}</dd>
		</div>
		<div>
			<dt>Date</dt>
			<dd>{date}</dd>
		</div>
		<div>
			<dt>Tools</dt>
			<dd>{data.project.tools.join(', ')}</dd>
		</div>
	</dl>

	<img src={toOptimizedImage(data.project.projectImgSource)} alt="" />

	<a class="open" href={data.project.projectLink} target="_blank" rel="external noreferrer">Open project ↗</a>
</article>

<style>
	/* The landing's column (routes/(home)/+layout.svelte), edge for edge: 30em of text inside 1em of
	   padding, every size in em of one rem-based value. */
	.project {
		max-width: 32em;
		margin: 0 auto;
		padding: max(4em, 12vh) 1em 4em;
		font-size: 1.25rem;
	}

	a {
		color: inherit;
		text-decoration: none;
		transition: color 160ms var(--ease-out);
	}

	a:hover {
		color: var(--ink);
	}

	a:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}

	a:active {
		opacity: 0.55;
	}

	/* Set like the landing's tab nav; padding grows the tap target to 44px without moving the text. */
	nav {
		display: flex;
		gap: 0.75em;
		color: var(--muted-ink);
		font-size: 0.8em;
		line-height: 1.5;
	}

	nav a {
		margin: -0.625em 0;
		padding: 0.625em 0;
	}

	h1 {
		margin: 1.2em 0 0;
		font-size: 1em;
		font-weight: 400;
		letter-spacing: -0.015em;
		line-height: 1.4;
	}

	/* The labels of the landing's Project cards. */
	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75em 2.5em;
		margin: 1.2em 0 0;
		font-size: 0.8em;
	}

	dt {
		color: var(--muted-ink);
		font-size: 0.6875em;
		letter-spacing: 0.08em;
		line-height: 1.6;
		text-transform: uppercase;
	}

	dd {
		margin: 0;
		font-size: 0.875em;
		line-height: 1.5;
	}

	/* The image as it was made, like the landing's Project card images but uncropped. */
	img {
		display: block;
		width: 100%;
		margin-top: 1.9em;
		background: #f4f4f4;
		outline: 1px solid rgb(0 0 0 / 0.06);
		outline-offset: -1px;
	}

	.open {
		display: inline-block;
		margin-top: 0.7em;
		padding: 0.625em 0;
		color: var(--muted-ink);
		font-size: 0.8em;
	}
</style>
