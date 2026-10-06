<script>
	import { browser } from '$app/environment';
	import Garden from '$lib/garden/Garden.svelte';
	import { layoutCells } from '$lib/garden/layout.js';
	import { projects } from '$lib/project/project.js';

	/**
	 * The Garden alone, for working on it and for screenshots: it grows on blank paper at the garden
	 * pose; `?still` shows it grown at once; `?enter` plays the whole entry from a stand-in page
	 * painted here. Leaving starts it again.
	 */

	const cells = layoutCells(projects);
	const query = browser ? new URLSearchParams(location.search) : new URLSearchParams();
	let run = $state(0);

	/** A stand-in for the page's picture: white, with a headline, the tabs and grey paragraphs in Geist. */
	async function paint() {
		await document.fonts.ready;
		const dpr = Math.min(devicePixelRatio, 2);
		const canvas = document.createElement('canvas');
		canvas.width = innerWidth * dpr;
		canvas.height = innerHeight * dpr;
		const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
		ctx.scale(dpr, dpr);
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, innerWidth, innerHeight);
		const width = Math.min(600, innerWidth - 40);
		const left = (innerWidth - width) / 2;
		let y = Math.max(80, innerHeight * 0.12) + 25;
		ctx.fillStyle = '#171717';
		ctx.font = '450 25px "Geist Variable", sans-serif';
		for (const line of ['I’m Gordon.  ◕‿◕  I make your data easier to', 'understand and use through ▱ maps, ▤ data', 'visualization, and ▢ web tools designed with', 'taste and built with ingenuity.']) {
			ctx.fillText(line, left, y);
			y += 50;
		}
		y += 30;
		ctx.fillRect(left, y, width, 1);
		y += 60;
		ctx.font = '400 17.5px "Geist Variable", sans-serif';
		ctx.fillStyle = '#666';
		ctx.fillText('about    projects    writing    contact', left, y);
		ctx.fillStyle = '#171717';
		ctx.fillRect(left, y + 8, 42, 1);
		y += 60;
		ctx.font = '400 20px "Geist Variable", sans-serif';
		ctx.fillStyle = '#666';
		const words = 'I design and build maps, charts and small tools for newsrooms, universities and studios. Most of what I make starts from a messy spreadsheet and ends as something a reader can hold in their head. '
			.repeat(3)
			.split(' ');
		let line = '';
		for (const word of words) {
			if (ctx.measureText(line + word).width > width) {
				ctx.fillText(line, left, y);
				y += 30;
				line = '';
			}
			line += word + ' ';
		}
		return canvas;
	}
</script>

<svelte:head>
	<title>Garden</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if browser}
	{#key run}
		{#await query.has('enter') ? paint() : null then picture}
			<Garden {cells} {picture} still={query.has('still')} dev onleave={() => run++} />
		{/await}
	{/key}
{/if}
