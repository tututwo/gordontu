import { allProjects, categories, projects } from '$lib/project/project.js';

// For search engines: every page worth indexing, at its canonical URL (see +layout.svelte).
export const prerender = true;

const pages = [
	'/',
	'/about',
	'/projects',
	'/writing',
	'/contact',
	'/credits',
	...[allProjects, ...categories].map(({ slug }) => `/${slug}`),
	...projects.map(({ category, slug }) => `/${category}/${slug}`)
];

export function GET() {
	const urls = pages.map((path) => `<url><loc>https://gordontu.com${path}</loc></url>`).join('');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
}
