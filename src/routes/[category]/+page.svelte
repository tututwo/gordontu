<script>
	import PostcardGallery from '$lib/gallery/PostcardGallery.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.category.label} — Gordon Tu</title>
	<meta name="description" content={data.category.description} />
</svelte:head>

<!-- Placeholder background: a tint per section. Swap this div for a component (three effect, map) later. -->
<div class="wash" data-category={data.category.slug} aria-hidden="true"></div>

<PostcardGallery projects={data.projects} category={data.category} />

<style>
	/* Below the layout's ambient washes and paper texture (z -3…-1) but above the paper colour. */
	.wash {
		position: fixed;
		inset: 0;
		z-index: -4;
		pointer-events: none;
	}

	.wash[data-category='maps'] {
		background: var(--wash-sky);
	}

	.wash[data-category='charts'] {
		background: var(--wash-blush);
	}

	.wash[data-category='creative-code'] {
		background: var(--wash-mint);
	}
</style>
