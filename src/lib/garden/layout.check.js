// The one runnable check for the Garden's layout: `node --test src/lib/garden/layout.check.js`.
// Plain throws on purpose — @types/node is not installed and svelte-check type-checks this file.
import { projects } from '../project/project.js';
import { COVER, GRID, layoutCells } from './layout.js';
import { species } from './species/index.js';

/** @param {unknown} condition @param {string} message */
const ok = (condition, message) => {
	if (!condition) throw new Error(`layout.check: ${message}`);
};

const cells = layoutCells(projects);
ok(cells.length === projects.length && projects.length <= GRID.cols * GRID.rows, 'one cell per Project, all on the sheet');
ok(cells.every((c, i) => c.index === i && c.col === i % GRID.cols && c.row === Math.floor(i / GRID.cols)), 'cells fill row by row, left to right');
ok(cells.every((c, i) => !i || cells[i - 1].project.date <= c.project.date), 'oldest first');
ok(cells.filter((c) => c.kind === 'flower').length === 9, 'the 9 Featured Projects are flowers');
ok(cells.every((c) => (c.kind === 'flower' ? c.species === c.project.plant : c.species === COVER[c.project.category])), 'flowers are their kind, the rest their category’s cover');
ok(new Set(cells.filter((c) => c.kind === 'flower').map((c) => c.species)).size === 9, 'each flower is a species of its own');
ok(cells.every((c) => species[c.species]), 'every Plant has a drawing');
// Reversed input, same garden.
ok(JSON.stringify(layoutCells([...projects].reverse())) === JSON.stringify(cells), 'the layout does not depend on the input order');
