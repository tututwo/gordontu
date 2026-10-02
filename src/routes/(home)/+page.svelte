<script>
	import About from '$lib/landingPage/About.svelte';
	import { jsonLd, person } from '$lib/seo.js';
</script>

<svelte:head>
	<title>Gordon Tu — Design engineer: maps, data visualization, generative art</title>
	<meta
		name="description"
		content="I’m Gordon Tu, a design engineer and cartographer in the Bay Area. I design and build interactive maps, data visualization and generative art, with AI in my workflow."
	/>
	<meta property="og:title" content="Gordon Tu — Design engineer: maps, data visualization, generative art" />
	<meta
		property="og:description"
		content="I design and build interactive maps, data visualization and generative art, with AI in my workflow."
	/>
	<meta property="og:image" content="https://gordontu.com/og.png" />
	{@html jsonLd(person)}
</svelte:head>

<About />
