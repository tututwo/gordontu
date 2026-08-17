<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.category.label} — Gordon Tu</title>
	<meta name="description" content="{data.category.label} projects by Gordon Tu." />
</svelte:head>

<section class="hero" aria-labelledby="category-title">
	<h1 id="category-title">{data.category.label}</h1>
	<p>{data.projects.length} projects · full page coming soon.</p>
</section>

<!-- Later: import ProjectWall from '$lib/landingPage/ProjectWall.svelte' and render
     <ProjectWall projects={data.projects} /> here. -->

<style>
	.hero {
		position: relative;
		z-index: 20;
		display: grid;
		justify-items: center;
		padding: clamp(2rem, 4.6vh, 2.75rem) 1.25rem 0;
		text-align: center;
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(3rem, 3.45vw, 3.7rem);
		font-optical-sizing: auto;
		font-weight: 440;
		letter-spacing: -0.035em;
		line-height: 0.99;
	}

	p {
		margin: clamp(1.25rem, 2.7vh, 1.65rem) 0 0;
		color: var(--muted-ink);
		font-size: clamp(0.94rem, 1.08vw, 1.08rem);
		font-weight: 390;
		letter-spacing: -0.018em;
		line-height: 1.42;
	}

	@media (max-width: 720px) {
		h1 {
			font-size: clamp(2.45rem, 11vw, 3.1rem);
			line-height: 1;
		}
	}
</style>
