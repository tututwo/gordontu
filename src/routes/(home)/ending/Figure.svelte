<script>
	import { draw } from './figure.js';

	/** @type {{ pose: import('./figure.js').Pose }} */
	let { pose } = $props();

	const layers = $derived(draw(pose));
</script>

{#snippet paths(/** @type {import('./figure.js').Layer[]} */ list)}
	{#each list as { key, d, fill, stroke, width, opacity } (key)}
		<path {d} fill={fill ?? 'none'} {stroke} stroke-width={width} {opacity} />
	{/each}
{/snippet}

<!-- Scaled about his feet, as he walks away. -->
<g class="figure" transform="translate({pose.at.x} {pose.at.y - pose.at.bob}) translate(537 1275) scale({pose.at.scale}) translate(-537 -1275)">
	{#if pose.shown.body > 0}<g opacity={pose.shown.body}>{@render paths(layers.body)}</g>{/if}
	{#if pose.shown.head > 0}<g opacity={pose.shown.head}>{@render paths(layers.head)}</g>{/if}
</g>

<style>
	path {
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
