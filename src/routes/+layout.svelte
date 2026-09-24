<script>
	import '../app.css';

	let { children } = $props();
</script>

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
