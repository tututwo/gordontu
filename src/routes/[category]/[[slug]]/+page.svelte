<script>
	import PostcardGallery from '$lib/gallery/PostcardGallery.svelte';
	import { categoryLabel } from '$lib/project/project.js';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<svelte:head>
	{#if data.opened}
		<title>{data.opened.projectName} — {data.category.label} — Gordon Tu</title>
		<meta name="description" content="{data.opened.projectName} — {categoryLabel(data.opened.category)} by Gordon Tu." />
	{:else}
		<title>{data.category.label} — Gordon Tu</title>
		<meta name="description" content={data.category.description} />
	{/if}
</svelte:head>

<PostcardGallery projects={data.projects} category={data.category} opened={data.opened} />
