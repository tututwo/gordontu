<script>
	import { resolve } from '$app/paths';
	import { categories, projects } from '$lib/project/project.js';

	/** Project category `value` → its URL `slug`. */
	const slugs = Object.fromEntries(categories.map((c) => [c.value, c.slug]));
</script>

<svelte:head>
	<title>Projects — Gordon Tu</title>
	<meta
		name="description"
		content="Every project by Gordon Tu: interactive maps, visual stories, and web tools."
	/>
</svelte:head>

<ul>
	{#each projects as { projectName, category, slug, date } (slug)}
		<li>
			<a href={resolve('/[category]/[slug]', { category: slugs[category], slug })}>{projectName}</a>
			<span>{date.slice(0, 4)}</span>
		</li>
	{/each}
</ul>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		gap: 1.5em;
		align-items: baseline;
		justify-content: space-between;
	}

	/* Keeps a wrapped title from running into the next one. */
	li + li {
		margin-top: 0.5em;
	}

	a {
		color: inherit;
		text-decoration: none;
		transition: color 160ms var(--ease-out);
	}

	a:hover {
		color: #000;
	}

	a:focus-visible {
		outline: 2px solid #000;
		outline-offset: 2px;
	}

	a:active {
		opacity: 0.55;
	}

	span {
		flex: none;
	}
</style>
