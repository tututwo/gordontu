<script>
	import PostcardGallery from '$lib/gallery/PostcardGallery.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.category.label} — Gordon Tu</title>
	<meta name="description" content={data.category.description} />
</svelte:head>

<div class="wash" aria-hidden="true"></div>

<PostcardGallery projects={data.projects} category={data.category} />

<style>
	.wash {
		position: fixed;
		inset: 0;
		z-index: 0;
		background: #f3f0eb;
		pointer-events: none;
	}
</style>
