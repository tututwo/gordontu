import { error } from '@sveltejs/kit';
import { categories, projects } from '$lib/project/project.js';

/** @type {import('./$types').EntryGenerator} */
export const entries = () => categories.map(({ slug }) => ({ category: slug }));

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const category = categories.find((c) => c.slug === params.category);
	if (!category) error(404, 'No such category');
	return { category, projects: projects.filter((p) => p.category === category.value) };
}
