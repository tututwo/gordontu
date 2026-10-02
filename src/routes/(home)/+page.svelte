<script>
	import About from '$lib/landingPage/About.svelte';

	const person = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: 'Gordon Tu',
		url: 'https://gordontu.com',
		jobTitle: 'Design engineer',
		description:
			'Design engineer and cartographer making interactive maps, data visualization and generative art, with AI in the workflow.',
		address: { '@type': 'PostalAddress', addressRegion: 'CA', addressCountry: 'US' },
		knowsAbout: [
			'Data visualization',
			'Cartography',
			'Interactive maps',
			'Generative art',
			'Creative coding',
			'Design engineering',
			'AI-assisted design',
			'D3.js',
			'Three.js',
			'GLSL',
			'Svelte',
			'QGIS',
			'Blender'
		],
		sameAs: [
			'https://www.linkedin.com/in/gordon-tu/',
			'https://github.com/tututwo',
			'https://observablehq.com/@tututwo',
			'https://x.com/_tuyukun'
		]
	};
</script>

<svelte:head>
	<title>Gordon Tu — Design engineer: maps, data visualization, generative art</title>
	<meta
		name="description"
		content="I’m Gordon Tu, a design engineer and cartographer in the Bay Area. I design and build interactive maps, data visualization and generative art, with AI in my workflow."
	/>
	<!-- Who he is, for search engines and AI assistants; sameAs ties his profiles to this site. -->
	{@html `<script type="application/ld+json">${JSON.stringify(person)}</script>`}
</svelte:head>

<About />
