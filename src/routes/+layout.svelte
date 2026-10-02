<script>
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { peel } from '$lib/peel.js';

	let { children } = $props();

	onNavigate(peel);

	// One URL per page for search engines: a postcard opened from /all counts as its category's.
	const opened = $derived(page.data.opened);
	const canonical = $derived(
		`https://gordontu.com${opened ? `/${opened.category}/${opened.slug}` : page.url.pathname}`
	);
</script>

<svelte:head>
	{#if !page.error}<link rel="canonical" href={canonical} />{/if}
</svelte:head>

<div class="site-shell">
	<main>{@render children()}</main>
</div>

<style>
	.site-shell {
		position: relative;
		min-height: 100svh;
		/* Also hides the clipped-away parts of a headline word split round a lit icon (headlineFlow.js),
		   whose boxes can reach past the window: without it they would scroll the page sideways. */
		overflow-x: clip;
	}
</style>
