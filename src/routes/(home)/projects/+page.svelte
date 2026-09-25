<script>
	import { resolve } from '$app/paths';
	import { allProjects, categorySlug, projects, toOptimizedImage } from '$lib/project/project.js';

	const featured = projects.filter((p) => p.featured);
</script>

<svelte:head>
	<title>Projects — Gordon Tu</title>
	<meta
		name="description"
		content="Selected projects by Gordon Tu: interactive maps, visual stories, and web tools."
	/>
</svelte:head>

<ul>
	{#each featured as { projectName, projectImgSource, category, slug, date, client } (slug)}
		<li>
			<a class="card" href={resolve('/[category]/[[slug]]', { category: categorySlug(category), slug })}>
				<img src={toOptimizedImage(projectImgSource)} alt="" loading="lazy" decoding="async" />
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

	/* One crop for every image, centred: the poster maps lose their printed headline, not the map. */
	img {
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

		img {
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
