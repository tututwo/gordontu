import { REST } from './figure.js';

/** @typedef {import('./figure.js').Pose} Pose */

/** @param {Partial<Pose>} changes @returns {Pose} */
const pose = (changes) => ({ ...structuredClone(REST), ...changes });

/** The drawings' poses, ending_1 to ending_5, as the figure takes them. */
export const POSES = {
	1: pose({}),
	2: pose({
		armL: { up: 32, fore: -19, lift: 0.67, reach: 0.52, back: 0, cuff: 19, hand: 'relaxed', pocket: 0 },
		armR: { up: 36.5, fore: -19.5, lift: 0.67, reach: 0.57, back: 0, cuff: 24, hand: 'relaxed', pocket: 0 }
	}),
	3: pose({
		armL: { up: 11, fore: 5, lift: 0.9, reach: 0.8, back: 0, cuff: 1.5, hand: 'relaxed', pocket: 0 },
		armR: { up: 135, fore: 248.5, lift: 0.72, reach: 0.64, back: 0, cuff: 1.5, hand: 'scratch', pocket: 0 }
	}),
	4: pose({
		armL: { up: 157.5, fore: 268, lift: 1.42, reach: 1.1, back: 0, cuff: -22, hand: 'none', pocket: 0 },
		armR: { up: 157.5, fore: 268, lift: 1.42, reach: 1.1, back: 0, cuff: -22, hand: 'none', pocket: 0 },
		hitch: 1
	}),
	5: pose({
		armL: { up: 56, fore: 199, lift: 0.69, reach: 1.09, back: 0, cuff: -15, hand: 'wave', pocket: 0 },
		armR: { up: 8.7, fore: -6, lift: 1, reach: 0.88, back: 0, cuff: 13.5, hand: 'relaxed', pocket: 0 },
		mouth: 1
	})
};
