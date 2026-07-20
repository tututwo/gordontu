<script>
	import '../app.css';
	import Analytics from '$lib/Analytics.svelte';

	let { children } = $props();
</script>

<Analytics />
{@render children()}
