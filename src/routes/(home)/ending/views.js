/**
 * The figure's parts that turn with him, drawn three times: facing you (ending_1), turned to your right
 * (ending_6, which shows his right side) and from behind (after ending_8). Every outline has the same
 * points in the same order (left to right on the page) in each, so a turn is each point moving from one
 * drawing to the next (`view`). Units are ending_1's pixels, as in figure.js.
 */

/** @typedef {[number, number] | [number, number, number]} Point  the third item is how sharp a corner it is, 0–1 */

/** @param {Point[]} points @param {number} axis */
const mirror = (points, axis) => points.map(([x, y, k]) => /** @type {Point} */ ([2 * axis - x, y, k ?? 0]));

/* Facing you. */
export const FRONT = {
	/** The hair's bowl, from its left end over the crown to its right end (traced off ending_1). */
	bowl: [[441.0, 301.0, 1], [429.9, 284.3], [427.2, 264.4], [429.2, 244.4], [435.8, 225.5], [446.7, 208.6], [461.3, 194.7], [478.4, 184.1], [497.1, 176.9], [516.8, 173.5], [537.0, 173.5], [557.6, 172.8], [578.1, 174.0], [597.7, 180.3], [615.4, 190.7], [630.3, 204.8], [640.9, 222.3], [646.6, 242.1], [646.4, 262.6], [639.8, 281.8], [633.0, 301.0, 1]],
	/** The hair's lower edge, from its right end back to its left: the fringe, split twice. */
	fringe: [[627.0, 290.0], [606.0, 280.0], [575.0, 277.5, 1], [567.0, 262.0], [562.5, 250.0, 1], [559.5, 262.0], [556.0, 276.0, 1], [530.0, 280.0], [503.0, 279.0, 1], [497.0, 263.0], [494.0, 251.0, 1], [489.0, 263.0], [483.0, 278.0, 1], [452.0, 285.0]],
	/** The head under the hair, from the neck up one side, over the top (hidden) and down the other. */
	skull: [[505.1, 394.2], [491.4, 387.5], [479.3, 380.2], [469.3, 370.1], [460.2, 358.3], [455.1, 344.0], [453.0, 322.0], [449.0, 300.0], [455.0, 270.0], [537.0, 250.0], [619.0, 270.0], [623.0, 300.0], [620.0, 322.0], [618.0, 341.9], [612.2, 356.0], [604.2, 369.0], [592.8, 379.5], [580.4, 387.3], [567.0, 394.6]],
	/** His right ear (on your left facing you), from the hair round to the jaw, and his left. */
	earL: [[445.2, 300.7], [435.2, 304.6], [430.2, 313.7], [430.4, 324.9], [435.4, 335.0], [444.2, 341.8], [455.1, 344.0]],
	earR: [[626.9, 299.9], [637.3, 302.1], [641.6, 311.6], [642.0, 322.6], [637.4, 332.9], [629.0, 340.4], [618.0, 341.9]],
	eyeL: [495.1, 310.9],
	eyeR: [575.6, 310.9],
	/** Each lens: centre, and its half width and height (a lens turned away is narrower). */
	lensL: [492.8, 312.7, 30, 30],
	lensR: [578.0, 312.0, 30, 30],
	bridge: [
		[522.5, 313.5],
		[535.5, 309.5],
		[548.5, 313.5]
	],
	templeL: [
		[462.5, 318],
		[456, 319]
	],
	templeR: [
		[608, 318],
		[614.5, 319]
	],
	/** The mouth's middle, and its half width. */
	mouth: [535.5, 357, 6.5],
	browL: [
		[478, 293],
		[504, 289]
	],
	browR: [
		[566, 289],
		[592, 293]
	],
	/** The bead of sweat on his cheek (only while he looks up at the glasses), and the chin under the jaw. */
	sweat: [[612, 322], [613, 330], [616, 334], [619, 330], [620, 321]],
	chin: [536, 405],
	neck: [[507.0, 380.0], [507.0, 426.0], [514.0, 437.0], [520.0, 443.0], [527.0, 460.0], [532.5, 474.5, 1], [538.0, 460.0], [545.0, 448.0], [555.0, 437.0], [565.5, 426.0], [565.5, 380.0]],
	collarL: [[504, 400], [495, 405], [483, 414], [473, 427], [467, 441], [464, 456], [463.5, 466], [464.5, 471, 1], [473, 465], [483, 457], [493, 449, 1], [505, 437], [506, 422]],
	/** The shirt's outline: up its sides from the hem (the shoulders are the sleeves'). */
	shirt: [[425.5, 539], [425.5, 600], [426, 660], [431, 700], [437, 718, 1], [455, 725], [476, 736], [503, 745], [530, 748.5], [558, 747], [578, 743], [600, 734], [633, 719, 1], [642, 700], [649, 660], [650, 600], [650, 539]],
	/** And over the shoulders, under the sleeves, to fill it in. */
	shoulders: [
		[646, 470],
		[600, 440],
		[532, 428],
		[464, 440],
		[424, 470]
	],
	waist: [[440, 690, 1], [537, 690], [633, 690, 1], [656, 760], [657, 810], [656, 850, 1], [537, 876], [417, 850, 1], [416, 810], [417, 760]],
	/** Each shoe about its ankle. */
	shoe: [[-55, 0, 1], [-70, 16], [-79, 31], [-85.5, 41], [-84.5, 50], [-75.5, 60], [-51.5, 62], [-24.5, 62], [1.5, 57], [27.5, 52], [41.5, 49], [50.5, 42], [49.5, 26], [48.5, 8], [47.5, 0, 1]],
	laces: [[[-81.5, 40], [-49, 43.5], [-16.5, 42], [16, 37.5], [46.5, 30]], [[-50, 8], [-38, 4], [-23, 3]], [[-44, 16], [-31, 13], [-16, 11]], [[-22, 26], [-16, 31], [-12, 38]]],
	/** Where each hip, shoulder and collar's edge is, and the shirt's sides. */
	hipL: [476, 810],
	hipR: [596.5, 810],
	shoulderL: [415.9, 504],
	shoulderR: [656.4, 506.5],
	baseL: [467.3, 439.4],
	baseR: [608, 440],
	sideL: 425.5,
	sideR: 650,
	/** A trouser leg's width at the hip, the knee and the cuff. */
	leg: [120, 118, 115],
};

/* Turned to your right: his right side, after ending_6 (moved 12 to the left, so he turns on the spot). */
const SIDE = {
	bowl: [
		[448, 323, 1],
		[437, 315],
		[424, 298],
		[417, 275],
		[417, 250],
		[424, 227],
		[437, 207],
		[456, 190],
		[480, 178],
		[508, 170],
		[538, 167],
		[565, 168],
		[590, 173],
		[610, 181],
		[626, 193],
		[638, 207],
		[647, 222],
		[652, 238],
		[654, 254],
		[652, 269],
		[645, 282, 1]
	],
	fringe: [
		[635, 281],
		[626, 280],
		[620, 279, 1],
		[617, 272],
		[615, 265, 1],
		[613, 272],
		[609, 278, 1],
		[578, 276],
		[556, 277, 1],
		[553, 272],
		[551, 266, 1],
		[549, 272],
		[545, 278, 1],
		[488, 292]
	],
	skull: [
		[495, 393],
		[494, 380],
		[490, 365],
		[485, 350],
		[478, 335],
		[472, 322],
		[469, 310],
		[468, 300],
		[475, 275],
		[540, 250],
		[640, 262],
		[650, 295],
		[652, 318],
		[648, 340],
		[640, 360],
		[626, 377],
		[606, 389],
		[580, 394],
		[555, 395]
	],
	earL: [
		[486, 301],
		[467, 301],
		[456, 311],
		[452, 326],
		[455, 340],
		[466, 349],
		[486, 351]
	],
	earR: [
		[540, 310],
		[540, 312],
		[540, 318],
		[540, 325],
		[540, 332],
		[540, 338],
		[540, 340]
	],
	eyeL: [576, 304],
	eyeR: [626, 305],
	lensL: [583, 306, 23.5, 28.5],
	lensR: [631, 309, 13, 27],
	bridge: [
		[606, 308],
		[612, 307],
		[618, 308]
	],
	templeL: [
		[560, 306],
		[488, 308]
	],
	templeR: [
		[618, 309],
		[618, 309]
	],
	mouth: [607, 355, 3],
	browL: [
		[566, 286],
		[590, 283]
	],
	browR: [
		[620, 283],
		[632, 285]
	],
	sweat: [[640, 322], [640, 326], [641, 328], [642, 326], [642, 321]],
	chin: [590, 396],
	neck: [
		[493, 380],
		[492, 426],
		[500, 438],
		[512, 446],
		[525, 452],
		[540, 456, 1],
		[552, 450],
		[558, 440],
		[560, 430],
		[558, 415],
		[556, 380]
	],
	collarL: [
		[548, 402],
		[528, 399],
		[508, 397],
		[488, 396],
		[471, 397],
		[466, 410],
		[468, 427],
		[482, 437],
		[500, 446],
		[520, 456],
		[546, 467, 1],
		[553, 452],
		[555, 436]
	],
	shirt: [
		[468, 432],
		[455, 480],
		[444, 540],
		[439, 620],
		[441, 700],
		[446, 764, 1],
		[470, 757],
		[493, 749],
		[515, 742],
		[537, 737],
		[560, 738],
		[590, 744],
		[622, 752, 0.3],
		[624, 690],
		[606, 610],
		[583, 520],
		[563, 445]
	],
	shoulders: [
		[560, 420],
		[545, 412],
		[520, 408],
		[495, 412],
		[475, 422]
	],
	waist: [
		[459, 700, 1],
		[537, 700],
		[613, 700, 1],
		[615, 760],
		[615, 810],
		[615, 850, 1],
		[537, 880],
		[459, 850, 1],
		[460, 810],
		[461, 760]
	],
	shoe: [
		[-70, -6, 1],
		[-75, 8],
		[-77, 26],
		[-73, 44],
		[-50, 50],
		[-10, 51],
		[40, 49],
		[85, 45],
		[105, 39],
		[109, 30],
		[104, 21],
		[90, 13],
		[73, 5],
		[60, 0],
		[50, -6, 1]
	],
	laces: [
		[
			[-77, 30],
			[-30, 33],
			[20, 34],
			[70, 34],
			[108, 32]
		],
		[
			[40, -2],
			[51, 3],
			[61, 8]
		],
		[
			[47, 7],
			[59, 11],
			[69, 15]
		],
		[
			[82, 13],
			[88, 19],
			[92, 26]
		]
	],
	hipL: [537, 810],
	hipR: [537, 810],
	shoulderL: [510, 478],
	shoulderR: [545, 478],
	baseL: [500, 440],
	baseR: [548, 440],
	sideL: 450,
	sideR: 600,
	leg: [142, 138, 134]
};

/* From behind, after ending_8: the hair down to the nape, both ears, the back of the collar and shirt. */
const BACK = {
	bowl: [[443, 318, 1], [430, 298], [426, 274], ...FRONT.bowl.slice(3, 18), [651, 274], [646, 298], [631, 318, 1]],
	// Down to the nape, round the back of his head.
	fringe: [
		[626, 330],
		[615, 342],
		[602, 351],
		[590, 357],
		[578, 361],
		[566, 363],
		[554, 364],
		[537, 365],
		[520, 364],
		[508, 363],
		[496, 361],
		[484, 357],
		[472, 351],
		[458, 336]
	],
	skull: [
		[505, 402],
		[504, 390],
		[500, 378],
		[494, 366],
		[486, 355],
		[476, 345],
		[466, 334],
		[458, 318],
		[455, 280],
		[537, 250],
		[619, 280],
		[616, 318],
		[608, 334],
		[598, 345],
		[588, 355],
		[580, 366],
		[574, 378],
		[570, 390],
		[569, 402]
	],
	earL: FRONT.earR,
	earR: FRONT.earL,
	eyeL: [600, 304],
	eyeR: [626, 305],
	lensL: [600, 306, 12, 28],
	lensR: [626, 309, 8, 27],
	bridge: SIDE.bridge,
	templeL: SIDE.templeR,
	templeR: SIDE.templeR,
	mouth: [600, 355, 3],
	browL: SIDE.browL,
	browR: SIDE.browR,
	sweat: SIDE.sweat,
	chin: [537, 408],
	neck: [
		[505, 380],
		[505, 426],
		[510, 432],
		[518, 436],
		[526, 438],
		[533, 439, 0],
		[540, 438],
		[548, 436],
		[556, 432],
		[562, 426],
		[562, 380]
	],
	collarL: [
		[533, 410],
		[550, 408],
		[570, 410],
		[588, 415],
		[602, 425],
		[610, 438],
		[606, 447],
		[590, 444],
		[573, 440],
		[555, 437],
		[540, 436, 0],
		[533, 436],
		[533, 423]
	],
	shirt: FRONT.shirt,
	shoulders: FRONT.shoulders,
	waist: FRONT.waist,
	shoe: [
		[-40, 0, 1],
		[-48, 8],
		[-55, 18],
		[-58, 30],
		[-57, 42],
		[-50, 53],
		[-35, 60],
		[-10, 63],
		[15, 62],
		[35, 58],
		[48, 50],
		[53, 38],
		[52, 24],
		[47, 10],
		[40, 0, 1]
	],
	laces: [
		[
			[-57, 40],
			[-30, 45],
			[0, 46],
			[30, 45],
			[52, 38]
		],
		[
			[-8, 2],
			[0, 8],
			[8, 2]
		],
		[
			[0, 8],
			[0, 8],
			[0, 8]
		],
		[
			[0, 8],
			[0, 8],
			[0, 8]
		]
	],
	hipL: FRONT.hipR,
	hipR: FRONT.hipL,
	shoulderL: FRONT.shoulderR,
	shoulderR: FRONT.shoulderL,
	baseL: [608, 440],
	baseR: [467.3, 440],
	sideL: FRONT.sideR,
	sideR: FRONT.sideL,
	leg: FRONT.leg
};

/* Turned three quarters away: the back of his head, his right ear, and only the edge of his cheek. */
const LOST = {
	bowl: [
		[440, 318, 1],
		[428, 300],
		[422, 278],
		[422, 254],
		[428, 231],
		[440, 211],
		[456, 195],
		[476, 183],
		[500, 175],
		[525, 170],
		[550, 168],
		[575, 170],
		[598, 176],
		[618, 187],
		[634, 202],
		[645, 220],
		[652, 240],
		[654, 260],
		[653, 276],
		[650, 286],
		[645, 294, 1]
	],
	fringe: [
		[638, 298],
		[630, 302],
		[622, 305],
		[614, 306],
		[606, 306],
		[597, 308],
		[588, 315],
		[578, 326],
		[566, 337],
		[552, 346],
		[535, 352],
		[510, 352],
		[485, 344],
		[462, 330]
	],
	skull: [
		[520, 400],
		[516, 388],
		[510, 376],
		[502, 364],
		[492, 352],
		[480, 342],
		[466, 332],
		[456, 318],
		[460, 280],
		[540, 250],
		[630, 262],
		[648, 290],
		[650, 312],
		[647, 332],
		[640, 350],
		[630, 366],
		[615, 380],
		[595, 392],
		[575, 398]
	],
	earL: [
		[612, 300],
		[598, 302],
		[590, 312],
		[588, 326],
		[591, 340],
		[600, 348],
		[614, 350]
	],
	earR: [
		[470, 318],
		[470, 320],
		[470, 322],
		[470, 325],
		[470, 328],
		[470, 330],
		[470, 332]
	],
	eyeL: [640, 305],
	eyeR: [650, 305],
	lensL: [640, 306, 8, 27],
	lensR: [652, 309, 4, 26],
	bridge: [
		[648, 308],
		[650, 307],
		[652, 308]
	],
	templeL: [
		[630, 306],
		[612, 307]
	],
	templeR: [
		[652, 309],
		[652, 309]
	],
	mouth: [640, 355, 2],
	browL: [
		[630, 286],
		[645, 284]
	],
	browR: [
		[648, 284],
		[652, 285]
	],
	sweat: [[648, 322], [648, 326], [649, 328], [650, 326], [650, 321]],
	chin: [590, 400]
};

/* Looking up (the landing avatar's drawing of it, looking-up.png, its features slid as its mesh slides
   them when the head turns to the glasses held off to its right) and seen from above (the drawing of
   the overhead shot): faces the head blends into, facing you. */
const LOOKING_UP = {
	bowl: [[445.9, 301.2, 1], [434.7, 291.4], [433.1, 271.7], [435.1, 252.0], [441.3, 233.2], [451.5, 216.2], [464.5, 201.2], [479.9, 188.7], [497.5, 179.5], [516.3, 173.3], [535.9, 170.3], [555.1, 170.3], [574.2, 172.3], [592.9, 176.6], [610.9, 183.1], [626.9, 193.6], [640.0, 207.6], [649.5, 224.3], [655.1, 242.6], [656.8, 261.7], [648.9, 274.3, 1]],
	fringe: [[643.7, 271.2], [619.1, 257.9], [593.7, 252.3, 1], [586.9, 246.9], [573.3, 229.0, 1], [573.8, 243.1], [573.2, 253.6, 1], [547.8, 257.9], [516.4, 262.8, 1], [509.5, 254.9], [504.8, 237.2, 1], [500.0, 246.4], [494.7, 267.1, 1], [463.4, 286.8]],
	skull: [[515.0, 398.1], [502.9, 393.7], [491.6, 387.4], [481.5, 379.5], [472.8, 370.0], [466.5, 358.8], [459.3, 335.0], [456.5, 308.7], [466.9, 275.9], [545.6, 233.3], [624.3, 243.1], [644.0, 266.1], [645.7, 292.3], [644.9, 339.0], [640.8, 351.8], [634.2, 363.6], [625.7, 374.0], [615.8, 382.9], [605.1, 391.1]],
	earL: [[454.3, 324.2], [446.3, 328.5], [442.6, 337.1], [443.4, 346.4], [448.8, 354.1], [457.1, 358.6], [466.5, 358.8]],
	earR: [[648.7, 302.9], [657.6, 305.8], [662.8, 313.8], [662.7, 323.4], [658.8, 332.2], [651.3, 338.2], [644.9, 339.0]],
	eyeL: [527.6, 292.7],
	eyeR: [607.6, 281.8],
	browL: [[507.4, 281.5], [517.0, 272.3]],
	browR: [[589.6, 261.8], [612.5, 265.4]],
	mouth: [573.1, 326.8, 9.5],
	sweat: [[615.6, 306.8], [618.8, 320.6], [624.6, 326.1], [629.8, 320.8], [630.7, 305.6]],
	chin: [565.6, 400.6],
	lensL: [525.3, 294.5, 30.1, 30.1],
	lensR: [610.0, 282.9, 30.1, 30.1],
	bridge: [[554.6, 289.9], [567.6, 285.9], [580.6, 289.9]],
	templeL: [[495.3, 299.7], [488.8, 300.7]],
	templeR: [[640.1, 288.8], [646.6, 289.8]],
};
/** The avatar's neck and collar as its head looks up (and turns) at the held glasses, from the same drawing. */
export const LOOKING_UP_NECK = {
	neck: [[519.9, 380.9], [516.7, 398.3], [514.4, 433.8], [534.0, 443.8], [550.2, 455.7], [553.8, 479.6, 1], [574.2, 456.1], [596.0, 434.1], [605.9, 418.6], [604.1, 391.1], [606.2, 380.9]],
	collarL: [[516.7, 414.7], [505.2, 417.9], [495.0, 423.5], [487.4, 432.5], [480.8, 442.3], [475.7, 453.0], [471.6, 464.1], [467.4, 475.2, 1], [483.3, 459.5], [497.7, 442.5], [511.3, 424.8, 1], [514.7, 427.3], [518.1, 426.7]],
	collarR: [[607.1, 413.9], [619.0, 415.4], [628.9, 422.2], [635.6, 432.1], [642.4, 442.1], [648.7, 452.2], [653.7, 463.1], [658.8, 474.0, 1], [636.8, 464.0], [624.3, 444.2], [612.9, 423.5, 1], [609.8, 426.5], [608.5, 423.5]]
};
const FROM_ABOVE = {
	bowl: [[435.8, 302.8, 1], [428.4, 286.5], [427.0, 267.2], [430.7, 248.5], [436.9, 231.5], [446.7, 215.9], [459.8, 202.0], [474.6, 191.2], [490.2, 182.8], [507.6, 176.7], [526.4, 172.8], [549.0, 172.8], [570.9, 176.1], [590.9, 182.9], [608.9, 193.3], [623.5, 206.6], [636.4, 224.5], [643.9, 243.8], [647.0, 265.7], [644.5, 287.8], [638.2, 304.5, 1]],
	fringe: [[633.6, 305.4], [620.3, 299.9], [586.8, 298.5, 1], [578.1, 285.8], [571.6, 273.8, 1], [569.0, 288.6], [563.3, 305.6, 1], [541.4, 308.2], [508.2, 307.0, 1], [501.9, 293.9], [496.4, 275.9, 1], [491.3, 285.1], [482.8, 305.6, 1], [451.4, 307.0]],
	skull: [[509.3, 402.5], [494.7, 398.3], [482.2, 389.7], [471.4, 379.0], [463.1, 367.5], [457.1, 354.3], [451.7, 338.1], [447.5, 311.6], [462.3, 288.6], [536.8, 271.0], [610.6, 288.6], [631.8, 308.0], [628.3, 331.0], [626.8, 349.2], [620.9, 363.8], [612.5, 376.7], [601.6, 388.8], [588.8, 397.8], [574.8, 404.7]],
	earL: [[446.2, 321.3], [438.7, 324.0], [436.5, 332.1], [437.8, 340.5], [442.3, 347.7], [449.1, 352.6], [457.1, 354.3]],
	earR: [[633.7, 316.0], [642.4, 318.3], [645.5, 327.0], [644.5, 336.3], [639.2, 344.1], [631.2, 346.1], [626.8, 349.2]],
	eyeL: [503.6, 341.2],
	eyeR: [576.4, 340.9],
	browL: [[485.6, 321.1], [504.7, 312.6]],
	browR: [[571.1, 308.4], [589.1, 315.5]],
	mouth: [539.3, 380.1, 9.0],
	sweat: [[601.1, 358.5], [601.8, 364.9], [604.6, 367.0], [607.4, 364.9], [608.2, 358.2]],
	chin: [541.4, 428.1],
	lensL: [501.3, 343.0, 27.1, 27.1],
	lensR: [578.8, 342.0, 27.1, 27.1],
	bridge: [[527.0, 343.7], [540.0, 339.7], [553.0, 343.7]],
	templeL: [[474.2, 348.2], [467.7, 349.2]],
	templeR: [[605.9, 347.9], [612.4, 348.9]],
};


/**
 * A drawing's parts; those it has twice, one per side, come after (see below).
 * @typedef {typeof FRONT & { collarR: Point[], shoeR: Point[], lacesR: Point[][], pocketL: Point[], pocketR: Point[] }} View
 */

/** `a` to `b`, `t` of the way, number by number (points, lists of them). @param {any} a @param {any} b @param {number} t @returns {any} */
export function blend(a, b, t) {
	if (typeof a === 'number' || typeof b === 'number') return (a ?? 0) + ((b ?? 0) - (a ?? 0)) * t;
	return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => blend(a[i], b[i], t));
}

/** @param {number[][]} points */
const points = (points) => /** @type {Point[]} */ (points);
/** A pocket's opening, from its top corner by the hem, facing you. */
const POCKET = points([
	[430, 720, 1],
	[439.5, 730, 1],
	[418.5, 770.5, 1],
	[406.5, 748, 1]
]);

/** A pocket out of sight, at the front of his far hip. */
const HIDDEN_POCKET = points([
	[566, 740, 1],
	[566, 740, 1],
	[566, 740, 1],
	[566, 740, 1]
]);

/* The parts each drawing has twice, one per side. The right shoe is the left's mirror, run the same way
   round, so it turns rather than twists. */
Object.assign(FRONT, {
	collarR: points([[569, 400], [578, 404], [590, 414], [597, 425], [601, 440], [603, 455], [604, 466], [602.5, 471, 1], [594, 466], [583, 457], [573, 449, 1], [562, 437], [567, 422]]),
	shoeR: mirror(points(FRONT.shoe), 0).reverse(),
	lacesR: FRONT.laces.map((line) => mirror(/** @type {Point[]} */ (line), 0).reverse()),
	pocketL: POCKET,
	pocketR: points([
		[644, 719, 1],
		[633, 727, 1],
		[656.5, 769.5, 1],
		[667, 748, 1]
	])
});
Object.assign(SIDE, {
	collarR: SIDE.collarL,
	// The far shoe, a little behind the near one.
	shoeR: SIDE.shoe,
	lacesR: SIDE.laces,
	// His right hand in the pocket at the front of his hip; the left one's is out of sight.
	pocketL: [
		[560, 728, 1],
		[575, 736, 1],
		[570, 760, 1],
		[552, 750, 1]
	],
	pocketR: HIDDEN_POCKET
});
Object.assign(BACK, {
	collarR: mirror(points(BACK.collarL), 533),
	shoeR: mirror(points(BACK.shoe), 0).reverse(),
	lacesR: BACK.laces.map((line) => mirror(/** @type {Point[]} */ (line), 0).reverse()),
	pocketL: HIDDEN_POCKET,
	pocketR: HIDDEN_POCKET
});

/** The head's parts, which also have the lost profile between the side and the back. */
const HEAD = Object.keys(LOST);
/** @type {[number, any][]} */
const BODY_FRAMES = [
	[0, FRONT],
	[90, SIDE],
	[180, BACK]
];
/** @type {[number, any][]} */
const HEAD_FRAMES = [
	[0, FRONT],
	[90, SIDE],
	[135, LOST],
	[180, BACK]
];

/**
 * The turning parts as they look `yaw` degrees round (0 facing you, 90 turned to your right, 180 from
 * behind). Each outline point moves in a straight line from one drawing to the next, easing in and out
 * of each, so he seems to turn rather than slide.
 * @param {number} yaw
 * @returns {View}
 */
export function view(yaw) {
	const y = Math.max(0, Math.min(180, yaw));
	/** @param {[number, any][]} frames @param {string} key */
	const at = (frames, key) => {
		const i = Math.max(0, frames.findIndex(([deg], j) => y <= frames[j + 1]?.[0]));
		const [[a, from], [b, to]] = [frames[i], frames[Math.min(i + 1, frames.length - 1)]];
		const t = b > a ? (y - a) / (b - a) : 0;
		return blend(from[key], to[key], t * t * (3 - 2 * t));
	};
	return /** @type {View} */ (Object.fromEntries(Object.keys(FRONT).map((key) => [key, at(HEAD.includes(key) ? HEAD_FRAMES : BODY_FRAMES, key)])));
}

/**
 * The head's parts as he turns (`look`, as `view`), then looking up by `up` (0–1) and seen from above
 * by `above` (0–1), the faces drawn for those.
 * @param {number} look @param {number} up @param {number} above
 * @returns {View}
 */
export function head(look, up, above) {
	const turned = view(look);
	if (!up && !above) return turned;
	/** @type {any} */
	const out = { ...turned };
	for (const key of HEAD) {
		const a = /** @type {any} */ (turned)[key];
		const b = up ? blend(a, /** @type {any} */ (LOOKING_UP)[key], up) : a;
		out[key] = above ? blend(b, /** @type {any} */ (FROM_ABOVE)[key], above) : b;
	}
	return out;
}
