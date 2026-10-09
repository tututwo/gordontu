/*
 * Where each Project grows in the Garden (CONTEXT.md): the sheet's cells, filled in the order the
 * Projects were made, so the oldest stand at the far edge and the newest nearest the visitor.
 */

/** @typedef {import('../project/project.js').Project} Project */
/** @typedef {{ project: Project, col: number, row: number, kind: 'flower' | 'cover', species: string, index: number }} Cell */

/**
 * The cells on the sheet that can hold Projects (the paper may draw finer rulings): seven to a line,
 * so 28 Projects fill four lines exactly and the newer ones begin a fifth, nearest the visitor.
 */
export const GRID = { cols: 7, rows: 5 };

/** The ground cover each category's Projects grow as when they are not Featured. @type {Record<string, string>} */
export const COVER = { maps: 'clover', 'data-visualization': 'daisies', 'creative-code': 'forget-me-nots' };

/**
 * Projects → cells: a Featured Project is a flower of its own kind (`project.plant`), any other the
 * ground cover of its category; chronological by date (oldest first, ties by slug so the order never
 * depends on the input's), filling row by row from the far (top) row, left to right.
 * @param {Project[]} projects
 * @returns {Cell[]}
 */
export function layoutCells(projects) {
	return [...projects]
		.sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug))
		.slice(0, GRID.cols * GRID.rows)
		.map((project, index) => ({
			project,
			col: index % GRID.cols,
			row: Math.floor(index / GRID.cols),
			kind: project.featured ? 'flower' : 'cover',
			species: (project.featured && project.plant) || COVER[project.category],
			index
		}));
}
