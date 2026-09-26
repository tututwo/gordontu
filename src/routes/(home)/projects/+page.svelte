<script>
	import { resolve } from '$app/paths';
	import { prefersReducedMotion } from 'svelte/motion';
	import { allProjects, categorySlug, projects, toOptimizedImage } from '$lib/project/project.js';

	const featured = projects.filter((p) => p.featured);

	/** The card whose video lies over its image, while it plays. */
	let playing = $state('');

	/**
	 * A mouse over a card plays its video from the start. A finger keeps the image (its tap goes
	 * straight through to the postcard), and so does reduced motion.
	 * @param {PointerEvent & { currentTarget: HTMLElement }} event
	 */
	function play(event) {
		const video = event.currentTarget.querySelector('video');
		if (!video || event.pointerType === 'touch' || prefersReducedMotion.current) return;
		video.currentTime = 0;
		video.play().catch(() => {}); // the mouse left before it started
	}

	/** Leaving pauses it, and the image fades back. @param {PointerEvent & { currentTarget: HTMLElement }} event */
	function stop(event) {
		event.currentTarget.querySelector('video')?.pause();
	}
</script>

<svelte:head>
	<title>Projects — Gordon Tu</title>
	<meta
		name="description"
		content="Selected projects by Gordon Tu: interactive maps, visual stories, and web tools."
	/>
</svelte:head>

<ul>
	{#each featured as { projectName, projectImgSource, projectVideoSource, category, slug, date, client } (slug)}
		<li>
			<a
				class="card"
				href={resolve('/[category]/[[slug]]', { category: categorySlug(category), slug })}
				onpointerenter={play}
				onpointerleave={stop}
			>
				<img src={toOptimizedImage(projectImgSource)} alt="" loading="lazy" decoding="async" />
				{#if projectVideoSource}
					<video
						src={projectVideoSource}
						class:shown={playing === slug}
						muted
						loop
						playsinline
						preload="none"
						aria-hidden="true"
						onplaying={() => (playing = slug)}
						onpause={() => (playing = '')}
					></video>
				{/if}
				<span class="words">
					<span class="title text-heading-16">{projectName}</span>
					<span class="label text-eyebrow">Client</span>
					<span class="client text-copy-14">{client ?? 'Self-initiated'}</span>
				</span>
				<span class="year text-label-12-mono">{date.slice(0, 4)}</span>
			</a>
		</li>
	{/each}
</ul>

<a class="all" href={resolve('/[category]/[[slug]]', { category: allProjects.slug })}>
	View all {projects.length} projects →
</a>

<style>
	/* Cards reach 12px past the column so their contents line up with the headline above. */
	ul {
		margin: 0 calc(-1 * var(--spacing-12));
		padding: 0;
		list-style: none;
	}

	li {
		border-bottom: 1px solid var(--color-hairline);
	}

	/* Image, words, and the year at the right edge on the title's baseline. */
	.card {
		position: relative;
		display: grid;
		grid-template-columns: 40% 1fr auto;
		gap: var(--spacing-12) var(--spacing-20);
		align-items: baseline;
		padding: var(--spacing-12);
		color: inherit;
		text-decoration: none;
	}

	/* The lit card's outline lies over the hairlines above and below it. */
	.card::after {
		position: absolute;
		z-index: 1;
		inset: -1px 0;
		border: 1px solid var(--color-graphite);
		content: '';
		opacity: 0;
		pointer-events: none;
		transition: opacity 160ms var(--ease-out);
	}

	@media (hover: hover) {
		.card:hover::after {
			opacity: 1;
		}
	}

	.card:focus-visible {
		outline-offset: -2px;
	}

	.card:active {
		opacity: 0.55;
	}

	/* One crop for every image, centred: the poster maps lose their printed headline, not the map.
	   A Project's video shares the image's cell, over it. */
	img,
	video {
		grid-area: 1 / 1;
		display: block;
		align-self: start;
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		background: var(--color-paper-white);
		outline: 1px solid var(--color-gray-alpha-200);
		outline-offset: -1px;
	}

	/* Shown only once it plays, so a loading video never blanks the image; clicks go to the card. */
	video {
		opacity: 0;
		pointer-events: none;
		transition: opacity 160ms var(--ease-out);
	}

	video.shown {
		opacity: 1;
	}

	.title,
	.label,
	.client {
		display: block;
	}

	.title {
		color: var(--color-obsidian);
	}

	.label {
		margin-top: var(--spacing-12);
	}

	.client {
		color: var(--color-charcoal);
	}

	/* On a phone the image takes the full width, and the words sit under it. */
	@media (max-width: 34em) {
		.card {
			grid-template-columns: 1fr auto;
		}

		img,
		video {
			grid-column: 1 / -1;
		}
	}

	/* Padding grows the tap target to 44px without moving the text. */
	.all {
		display: inline-block;
		margin-top: var(--spacing-14);
		padding: 0.625rem 0;
		color: inherit;
		text-decoration: none;
		transition: color 160ms var(--ease-out);
	}

	.all:hover {
		color: var(--color-obsidian);
	}

	.all:active {
		opacity: 0.55;
	}
</style>
