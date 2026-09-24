import { createBookIcon } from './book.js';
import { createMapIcon } from './map.js';
import { createStage } from './stage.js';
import { createToolsIcon } from './tools.js';

const icons = { map: createMapIcon, book: createBookIcon, tools: createToolsIcon };

/** @typedef {keyof typeof icons} Shape */

/**
 * One Category link icon on its own canvas. `frame` advances it by `dt` ms, draws it, and says
 * whether it wants another frame.
 * @param {HTMLCanvasElement} canvas
 * @param {Shape} shape
 */
export function createIcon(canvas, shape) {
	const stage = createStage(canvas);
	const icon = icons[shape](stage);
	stage.warm();
	return {
		resize: () => stage.resize(),
		/** @param {number} dt @param {import('./stage.js').IconState} state */
		frame(dt, state) {
			stage.setZoom(state.zoom);
			const moving = icon.frame(dt, state);
			stage.render();
			return moving;
		},
		dispose: () => stage.dispose()
	};
}
