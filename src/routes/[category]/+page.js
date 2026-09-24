import { error } from '@sveltejs/kit';
import { allProjects, categories, projects } from '$lib/project/project.js';

const galleries = [allProjects, ...categories];

/** @type {import('./$types').EntryGenerator} */
export const entries = () => galleries.map(({ slug }) => ({ category: slug }));

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const category = galleries.find((c) => c.slug === params.category);
	if (!category) error(404, 'No such category');
	return {
		category,
		projects: category === allProjects ? projects : projects.filter((p) => p.category === category.value)
	};
}
