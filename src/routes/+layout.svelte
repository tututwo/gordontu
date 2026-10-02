<script>
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { peel } from '$lib/peel.js';
	import { SITE } from '$lib/seo.js';

	let { children } = $props();

	onNavigate(peel);

	// One URL per page for search engines: a postcard opened from /all counts as its category's.
	const opened = $derived(page.data.opened);
	const canonical = $derived(
		`${SITE}${opened ? `/${opened.category}/${opened.slug}` : page.url.pathname}`
	);
</script>

<svelte:head>
	{#if !page.error}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/if}
	<!-- Link previews (LinkedIn, X, iMessage, Slack); each page adds its own title, words and image. -->
	<meta property="og:site_name" content="Gordon Tu" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
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
