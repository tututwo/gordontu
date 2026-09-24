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
				<span>
					<span class="title">{projectName}</span>
					<span class="label">Client</span>
					<span class="client">{client ?? 'Self-initiated'}</span>
				</span>
				<span class="year">{date.slice(0, 4)}</span>
			</a>
		</li>
	{/each}
</ul>

<a class="all" href={resolve('/[category]/[[slug]]', { category: allProjects.slug })}>
	View all {projects.length} projects →
</a>

<style>
	/* Cards reach 0.75em past the column so their contents line up with the headline above. */
	ul {
		margin: 0 -0.75em;
		padding: 0;
		list-style: none;
	}

	li {
		border-bottom: 1px solid #e3e3e3;
	}

	.card {
		position: relative;
		display: grid;
		grid-template-columns: 40% 1fr auto;
		gap: 0.75em 1.25em;
		align-items: start;
		padding: 0.75em;
		color: inherit;
		text-decoration: none;
	}

	/* The lit card's outline lies over the hairlines above and below it. */
	.card::after {
		position: absolute;
		z-index: 1;
		inset: -1px 0;
		border: 1px solid #838383;
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
		outline: 2px solid #000;
		outline-offset: -2px;
	}

	.card:active {
		opacity: 0.55;
	}

	/* One crop for every image, centred: the poster maps lose their printed headline, not the map. */
	img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		background: #f4f4f4;
		outline: 1px solid rgb(0 0 0 / 0.06);
		outline-offset: -1px;
	}

	.title,
	.label,
	.client {
		display: block;
	}

	.title {
		color: #000;
		line-height: 1.4;
	}

	.label {
		margin-top: 0.9em;
		color: #767676;
		font-size: 0.6875em;
		letter-spacing: 0.08em;
		line-height: 1.6;
		text-transform: uppercase;
	}

	.client {
		font-size: 0.875em;
		line-height: 1.5;
	}

	.year {
		color: #767676;
		font-size: 0.875em;
		line-height: 1.6;
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
		margin-top: 0.875em;
		padding: 0.625em 0;
		color: inherit;
		text-decoration: none;
		transition: color 160ms var(--ease-out);
	}

	.all:hover {
		color: #000;
	}

	.all:focus-visible {
		outline: 2px solid #000;
		outline-offset: 2px;
	}

	.all:active {
		opacity: 0.55;
	}
</style>
