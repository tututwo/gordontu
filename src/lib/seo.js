/** Where the site lives: canonical URLs, structured data, the sitemap and llms.txt all start here. */
export const SITE = 'https://gordontu.com';

/**
 * Gordon as schema.org describes a person, for search engines and AI assistants. The home page carries
 * him whole; every Project names him as its creator by `@id`. sameAs ties his profiles to this site.
 */
export const person = {
	'@type': 'Person',
	'@id': `${SITE}/#person`,
	name: 'Gordon Tu',
	url: SITE,
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

/**
 * A JSON-LD <script> for `{@html}` in a page's head. `<` is escaped so no text in it (a Message, say)
 * can close the script early.
 * @param {Record<string, unknown>} data
 */
export const jsonLd = (data) =>
	`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replaceAll('<', '\\u003c')}</script>`;
