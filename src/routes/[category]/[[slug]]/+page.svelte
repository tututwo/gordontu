<script>
	import PostcardGallery from '$lib/gallery/PostcardGallery.svelte';
	import { categoryLabel, formatDate } from '$lib/project/project.js';
	import { SITE, jsonLd, person } from '$lib/seo.js';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	// An open postcard is described under its own category, wherever it was opened (see +layout.svelte).
	const project = $derived(data.opened);
	const label = $derived(project ? categoryLabel(project.category) : data.category.label);
	const title = $derived(project ? `${project.projectName} — ${label} by Gordon Tu` : `${label} — Gordon Tu`);
	const description = $derived(project ? project.message : data.category.description);
	const image = $derived(project && new URL(project.projectImgSource, SITE).href);

	/** Home › category › Project, which search results show in place of the URL. */
	const crumbs = $derived([
		{ name: 'Gordon Tu', path: '/' },
		project ? { name: label, path: `/${project.category}` } : { name: label, path: `/${data.category.slug}` },
		...(project ? [{ name: project.projectName, path: `/${project.category}/${project.slug}` }] : [])
	]);

	const structured = $derived(
		jsonLd({
			'@graph': [
				{
					'@type': 'BreadcrumbList',
					itemListElement: crumbs.map(({ name, path }, i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path }))
				},
				project && {
					'@type': 'CreativeWork',
					name: project.projectName,
					description: project.message,
					url: SITE + crumbs[2].path,
					image,
					dateCreated: project.date,
					genre: label,
					keywords: project.tools.join(', '),
					creator: { '@type': 'Person', '@id': person['@id'], name: person.name, url: person.url },
					// Who it was made for, when it was commissioned.
					sourceOrganization: project.client && { '@type': 'Organization', name: project.client },
					// The piece itself, where it lives.
					sameAs: project.projectLink
				}
			].filter(Boolean)
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	{#if image}<meta property="og:image" content={image} />{/if}
	{@html structured}
</svelte:head>

<PostcardGallery projects={data.projects} category={data.category} opened={data.opened} />

{#if project}
	<!--
		The postcard's back in the page's own HTML. The back itself is drawn only once its card has
		landed, and search engines and AI assistants read this, not the canvas.
	-->
	<article class="sr-only">
		<h2>{project.projectName}</h2>
		<p>{formatDate(project.date)} · {label}</p>
		<p>{project.message}</p>
		<p>Client: {project.client ?? 'Personal'}. Tools: {project.tools.join(', ')}.</p>
		{#if project.projectLink}<a href={project.projectLink} rel="external">Open project</a>{/if}
		<img src={project.projectImgSource} alt="{project.projectName}, {label.toLowerCase()} by Gordon Tu" loading="lazy" />
	</article>
{/if}
