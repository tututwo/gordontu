<script>
	import PostcardGallery from '$lib/gallery/PostcardGallery.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.category.label} — Gordon Tu</title>
	<meta name="description" content={data.category.description} />
</svelte:head>

<PostcardGallery projects={data.projects} category={data.category} />
