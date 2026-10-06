<script>
	import { resolve } from '$app/paths';
	import { categoryLabel, formatDate } from '$lib/project/project.js';
	import { SITE } from '$lib/seo.js';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const project = $derived(data.project);
	const label = $derived(categoryLabel(project.category));
	const title = $derived(`${project.projectName} — Case study by Gordon Tu`);
	const image = $derived(new URL(project.projectImgSource, SITE).href);
	/** Client · date · tools, as the postcard's back has them. */
	const line = $derived([project.client ?? 'Personal', formatDate(project.date), project.tools.join(', ')].join(' · '));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={project.message} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={project.message} />
	<meta property="og:image" content={image} />
	<!-- A placeholder until the Case study is written: not for search results yet. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- The Case study's placeholder (CONTEXT.md), in the landing's column and type: what the postcard's
     back says, and one line on what is to come. -->
<article class="case-study">
	<p class="text-eyebrow">{label}</p>
	<h1 class="text-heading-32">{project.projectName}</h1>
	<p class="line text-copy-14">{line}</p>
	<img src={project.projectImgSource} alt="{project.projectName}, {label.toLowerCase()} by Gordon Tu" decoding="async" />
	{#if project.message}<p class="message text-copy-16">{project.message}</p>{/if}
	<p class="soon text-copy-13">The case study is being written.</p>
	<nav class="text-copy-14" aria-label="Project">
		<a href={resolve('/[category]/[[slug]]', { category: project.category, slug: project.slug })}>← Its postcard</a>
		{#if project.projectLink}<a href={project.projectLink} rel="external">Open project →</a>{/if}
	</nav>
</article>

<style>
	.case-study {
		display: grid;
		justify-items: start;
		max-width: 37.5rem;
		margin: 0 auto;
		padding: max(5rem, 12vh) 1.25rem 5rem;
		color: var(--color-stone);
	}

	h1 {
		margin-top: var(--spacing-12);
		color: var(--color-obsidian);
	}

	.line {
		margin-top: var(--spacing-8);
	}

	/* The cover in its own proportions, as the postcard is. */
	img {
		width: 100%;
		height: auto;
		margin-top: var(--spacing-32);
	}

	.message {
		margin-top: var(--spacing-24);
		color: var(--color-obsidian);
	}

	.soon {
		margin-top: var(--spacing-16);
	}

	nav {
		display: flex;
		gap: var(--spacing-24);
		margin-top: var(--spacing-32);
	}

	/* Padding grows the tap target to 44px without moving the text. */
	a {
		padding: 0.625rem 0;
		color: var(--color-stone);
		text-decoration: none;
		transition: color 160ms var(--ease-out);
	}

	a:hover {
		color: var(--color-obsidian);
	}
</style>
