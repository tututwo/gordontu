import { error } from '@sveltejs/kit';
import { projects } from '$lib/project/project.js';

/** Only a Featured Project has a Case study (CONTEXT.md); any other slug here is a 404. */
const featured = projects.filter((p) => p.featured);

/** @type {import('./$types').EntryGenerator} */
export const entries = () => featured.map(({ category, slug }) => ({ category, slug }));

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const project = featured.find((p) => p.category === params.category && p.slug === params.slug);
	if (!project) error(404, 'No such case study');
	return { project };
}
