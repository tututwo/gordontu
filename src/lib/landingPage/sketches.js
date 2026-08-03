// The site's hand-drawn sketch vocabulary — every RoughSvg shape set lives here.
// Static sets are plain data; the card frames are seeded per Project (see project.js).

export const underline = [
	{
		type: 'curve',
		points: [
			[4, 9],
			[52, 7],
			[105, 10],
			[160, 7],
			[218, 11],
			[274, 8]
		],
		options: { seed: 411, strokeWidth: 1.55, roughness: 1.55, bowing: 1.65 }
	}
];

export const dragArrow = [
	{
		type: 'curve',
		points: [
			[8, 58],
			[18, 42],
			[75, 38],
			[145, 32],
			[220, 24],
			[266, 18]
		],
		options: { seed: 81, strokeWidth: 1.45, roughness: 1.4 }
	},
	{
		type: 'linearPath',
		points: [
			[244, 7],
			[268, 18],
			[248, 34]
		],
		options: { seed: 82, strokeWidth: 1.45, roughness: 1.2 }
	}
];

export const star = [
	{
		type: 'path',
		d: 'M 25 2 L 30 18 L 47 17 L 34 27 L 40 44 L 25 34 L 10 44 L 16 27 L 3 17 L 20 18 Z',
		options: { seed: 207, strokeWidth: 1.35, roughness: 1.45, bowing: 1.2 }
	}
];

export const infinity = [
	{
		type: 'path',
		d: 'M 6 22 C 14 4, 27 5, 38 22 C 49 39, 62 39, 72 22 C 62 5, 49 5, 38 22 C 27 39, 14 40, 6 22',
		options: { seed: 718, strokeWidth: 1.45, roughness: 1.25, bowing: 1.1 }
	}
];

export const infiniteArrow = [
	{
		type: 'curve',
		points: [
			[7, 34],
			[52, 23],
			[113, 25],
			[174, 29],
			[216, 22]
		],
		options: { seed: 910, strokeWidth: 1.45, roughness: 1.45 }
	},
	{
		type: 'linearPath',
		points: [
			[196, 10],
			[219, 22],
			[199, 37]
		],
		options: { seed: 911, strokeWidth: 1.45, roughness: 1.25 }
	}
];

export const featureIcons = {
	charts: [
		{
			type: 'rectangle',
			x: 13,
			y: 13,
			width: 27,
			height: 29,
			options: { seed: 31, strokeWidth: 1.25 }
		},
		{
			type: 'rectangle',
			x: 18,
			y: 9,
			width: 27,
			height: 29,
			options: { seed: 32, strokeWidth: 1.25 }
		},
		{
			type: 'rectangle',
			x: 23,
			y: 5,
			width: 27,
			height: 29,
			options: { seed: 33, strokeWidth: 1.25 }
		}
	],
	maps: [
		...Array.from({ length: 8 }, (_, index) => {
			const angle = (Math.PI * 2 * index) / 8;
			return {
				type: 'line',
				x1: 30 + Math.cos(angle) * 12,
				y1: 25 + Math.sin(angle) * 12,
				x2: 30 + Math.cos(angle) * 22,
				y2: 25 + Math.sin(angle) * 22,
				options: { seed: 100 + index, strokeWidth: 1.25, roughness: 1.25 }
			};
		}),
		{
			type: 'ellipse',
			x: 30,
			y: 25,
			width: 5,
			height: 5,
			options: {
				seed: 112,
				fill: 'var(--sketch-ink, var(--ink, #1d1d1f))',
				fillStyle: 'solid',
				strokeWidth: 1
			}
		}
	],
	creativeCode: [
		{
			type: 'path',
			d: 'M 12 30 C 4 20, 12 8, 24 13 C 27 2, 45 5, 43 18 C 56 19, 55 38, 42 38 C 38 51, 18 47, 20 37 C 15 38, 11 35, 12 30 Z',
			options: { seed: 550, strokeWidth: 1.25, roughness: 1.45 }
		},
		{
			type: 'curve',
			points: [
				[21, 27],
				[27, 20],
				[34, 28],
				[40, 21]
			],
			options: { seed: 551, strokeWidth: 1.1 }
		}
	]
};

export const navActiveLine = [
	{
		type: 'curve',
		points: [
			[3, 9],
			[28, 7],
			[58, 10],
			[88, 6],
			[117, 8]
		],
		options: { seed: 142, strokeWidth: 1.35, roughness: 1.5, bowing: 1.4 }
	}
];

export const socialFrames = {
	linkedin: [
		{
			type: 'rectangle',
			x: 6,
			y: 6,
			width: 40,
			height: 40,
			options: { seed: 1304, strokeWidth: 1.35, roughness: 1.55, bowing: 1.35 }
		},
		{
			type: 'rectangle',
			x: 4,
			y: 8,
			width: 43,
			height: 37,
			options: { seed: 1305, strokeWidth: 0.7, roughness: 1.8, bowing: 1.2 }
		}
	],
	github: [
		{
			type: 'ellipse',
			x: 26,
			y: 26,
			width: 43,
			height: 41,
			options: { seed: 2711, strokeWidth: 1.35, roughness: 1.55, bowing: 1.2 }
		},
		{
			type: 'ellipse',
			x: 25,
			y: 27,
			width: 39,
			height: 43,
			options: { seed: 2712, strokeWidth: 0.7, roughness: 1.75, bowing: 1.35 }
		}
	]
};

export const socialIcons = {
	linkedin: [
		{
			type: 'ellipse',
			x: 5.8,
			y: 5.8,
			width: 2.7,
			height: 2.7,
			options: {
				seed: 6101,
				fill: 'var(--sketch-ink)',
				fillStyle: 'solid',
				strokeWidth: 1,
				roughness: 1.15
			}
		},
		{
			type: 'line',
			x1: 7.1,
			y1: 10.5,
			x2: 7.1,
			y2: 18.4,
			options: { seed: 6102, strokeWidth: 2.15, roughness: 1.05, bowing: 0.7 }
		},
		{
			type: 'line',
			x1: 11,
			y1: 10.7,
			x2: 11,
			y2: 18.4,
			options: { seed: 6103, strokeWidth: 2.05, roughness: 1.05, bowing: 0.65 }
		},
		{
			type: 'path',
			d: 'M 11 14.2 C 11.7 11.7, 13.2 10.5, 15.2 10.5 C 17.6 10.5, 18.2 12.1, 18.2 14.4 L 18.2 18.4',
			options: { seed: 6104, strokeWidth: 2.05, roughness: 1.05, bowing: 0.75 }
		}
	],
	github: [
		{
			type: 'path',
			d: 'M 7.1 9 C 6.2 6.8, 6.6 4.7, 7.7 3.2 C 9.6 3.5, 11 4.2, 12 5 C 13.6 4.6, 15.1 4.6, 16.5 5 C 17.8 4, 19.2 3.4, 20.5 3.4 C 21.2 5.6, 21.1 7.3, 20.2 9 C 21.5 10.2, 22.1 11.8, 22.1 13.5 C 22.1 18.1, 18.5 20.3, 13.6 20.3 C 8.3 20.3, 4.2 18.2, 4.2 13.5 C 4.2 11.7, 5.2 10.1, 7.1 9 Z',
			options: { seed: 7201, strokeWidth: 1.55, roughness: 1.15, bowing: 0.8 }
		},
		{
			type: 'curve',
			points: [
				[8.7, 19],
				[6.9, 20.2],
				[5.1, 18.6],
				[4, 17.1],
				[2.2, 17]
			],
			options: { seed: 7202, strokeWidth: 1.45, roughness: 1.25, bowing: 1 }
		},
		{
			type: 'ellipse',
			x: 10.4,
			y: 13.6,
			width: 1.15,
			height: 1.45,
			options: {
				seed: 7203,
				fill: 'var(--sketch-ink)',
				fillStyle: 'solid',
				strokeWidth: 0.75,
				roughness: 0.9
			}
		},
		{
			type: 'ellipse',
			x: 16.2,
			y: 13.6,
			width: 1.15,
			height: 1.45,
			options: {
				seed: 7204,
				fill: 'var(--sketch-ink)',
				fillStyle: 'solid',
				strokeWidth: 0.75,
				roughness: 0.9
			}
		}
	]
};

export const headerDivider = [
	{
		type: 'curve',
		points: [
			[0, 6],
			[260, 7],
			[535, 5],
			[810, 7],
			[1085, 5],
			[1360, 7],
			[1600, 6]
		],
		options: { seed: 404, strokeWidth: 0.8, roughness: 1.3, bowing: 0.7 }
	}
];

// Card frames are seeded per Project so every card is unique but stable.
// Seeds are the Project's `seed` mapped into rough.js's accepted range.

/** @param {number} projectSeed */
export function cardSeed(projectSeed) {
	return (projectSeed % 2000000000) + 1;
}

/** @param {number} seed - a cardSeed() value */
export function cardFrame(seed) {
	const topLeft = 8 + (seed % 8);
	const topRight = 8 + ((seed >>> 3) % 9);
	const bottomRight = 8 + ((seed >>> 7) % 8);
	const bottomLeft = 7 + ((seed >>> 11) % 10);
	return [
		{
			type: 'polygon',
			points: [
				[topLeft, 15],
				[991 - topRight, 9 + (seed % 4)],
				[990 - bottomRight, 909 - (seed % 5)],
				[bottomLeft, 911 - ((seed >>> 4) % 5)]
			],
			options: { seed, roughness: 1.05, bowing: 0.75, strokeWidth: 1.65 }
		},
		{
			type: 'polygon',
			points: [
				[8 + ((seed >>> 6) % 5), 21],
				[988 - ((seed >>> 9) % 6), 14],
				[985, 901 - ((seed >>> 12) % 5)],
				[12, 903]
			],
			options: {
				seed: seed + 17,
				roughness: 1.55,
				bowing: 1.1,
				strokeWidth: 0.72,
				stroke: 'var(--sketch-line, rgb(29 29 31 / 0.68))'
			}
		}
	];
}

/** @param {number} seed - a cardSeed() value */
export function cardImageFrame(seed) {
	seed += 701;
	return [
		{
			type: 'polygon',
			points: [
				[7 + (seed % 4), 8 + ((seed >>> 2) % 3)],
				[953 - ((seed >>> 5) % 5), 6 + ((seed >>> 8) % 4)],
				[954 - ((seed >>> 11) % 4), 713 - ((seed >>> 14) % 4)],
				[6 + ((seed >>> 17) % 5), 712 - ((seed >>> 20) % 3)]
			],
			options: { seed, roughness: 1.15, bowing: 0.7, strokeWidth: 1.85 }
		},
		{
			type: 'polygon',
			points: [
				[10, 11],
				[949, 9 + ((seed >>> 7) % 3)],
				[951, 709],
				[9 + ((seed >>> 13) % 3), 708]
			],
			options: {
				seed: seed + 23,
				roughness: 1.6,
				bowing: 0.95,
				strokeWidth: 0.7,
				stroke: 'var(--sketch-line-soft, rgb(41 41 35 / 0.38))'
			}
		}
	];
}

/** @param {number} seed - a cardSeed() value */
export function paperRadius(seed) {
	/** @param {number} shift */
	const corner = (shift) => `${1.2 + ((seed >>> shift) % 11) / 10}%`;
	return `${corner(0)} ${corner(4)} ${corner(8)} ${corner(12)} / ${corner(2)} ${corner(6)} ${corner(10)} ${corner(14)}`;
}
