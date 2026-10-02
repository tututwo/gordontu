import { allProjects, categories, projects } from '$lib/project/project.js';
import { SITE } from '$lib/seo.js';

// For search engines: every page worth indexing, at its canonical URL (see +layout.svelte), and each
// Project's image, for image search.
export const prerender = true;

/** @type {{ path: string, image?: string }[]} */
const pages = [
	...['/', '/about', '/projects', '/writing', '/contact', '/credits'].map((path) => ({ path })),
	...[allProjects, ...categories].map(({ slug }) => ({ path: `/${slug}` })),
	...projects.map(({ category, slug, projectImgSource }) => ({
		path: `/${category}/${slug}`,
		image: new URL(projectImgSource, SITE).href
	}))
];

/** @param {string} url */
const xml = (url) => url.replaceAll('&', '&amp;');

export function GET() {
	const urls = pages
		.map(({ path, image }) => {
			const picture = image ? `<image:image><image:loc>${xml(image)}</image:loc></image:image>` : '';
			return `<url><loc>${SITE}${path}</loc>${picture}</url>`;
		})
		.join('');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}</urlset>`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
}
