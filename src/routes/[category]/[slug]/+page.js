import { error } from '@sveltejs/kit';
import { categories, categorySlug, projects } from '$lib/project/project.js';

/** @type {import('./$types').EntryGenerator} */
export const entries = () => projects.map((project) => ({ category: categorySlug(project.category), slug: project.slug }));

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const category = categories.find((c) => c.slug === params.category);
	if (!category) error(404, 'No such category');
	const project = projects.find((p) => p.category === category.value && p.slug === params.slug);
	if (!project) error(404, 'No such project');
	return { category, project };
}
