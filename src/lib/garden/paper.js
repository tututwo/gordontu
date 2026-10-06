import {
	CanvasTexture,
	DataTexture,
	LinearFilter,
	Mesh,
	NearestFilter,
	PlaneGeometry,
	RedFormat,
	ShaderMaterial,
	SRGBColorSpace,
	UnsignedByteType,
	Vector2,
	Vector4
} from 'three';

/**
 * The sheet of paper the Garden grows on, and the table under it: one plane lying in the XZ plane
 * (y up, the far edge at −z), and one shader that draws everything printed on it: the rulings (lines
 * of square cells, a hairline round each, a small mark at the centre of each cell still to be planted,
 * a blank strip between lines), the wash a planted cell takes (growing from its centre until it fills
 * the cell), the ripples where an arc lands, and the page's print over it all, which lifts off as the
 * camera tilts. The paper is the page's own white, so at the front pose the sheet is the page; the
 * plane runs on past the sheet as a table a shade darker, so the tilted view never runs out of paper.
 * The sheet is quiet on purpose, every mark on it black at a low alpha (as the site's hairlines are):
 * colour is the Plants'. Drawing it all in one shader keeps the lines a hairline at any tilt (they are
 * measured per pixel) and costs one draw call.
 *
 * The rulings run like writing: across a wide viewport the lines are rows, read left to right from
 * the far one; in a tall one they are columns, read from the far end down, the first on the right,
 * as manuscript paper is written vertically. Either way a cell's `col` counts along its line and
 * its `row` counts the lines, so the Projects grow in their order of writing.
 */

/** The ruling strip between two lines of cells, as a fraction of a cell's side. */
export const STRIP = 0.24;
/**
 * The sheet runs on past the Projects' cells like a page of manuscript paper, on past the frame at
 * the garden pose: plain cells at both ends of their lines, and plain lines before the first and after
 * the last. `PAD` of them at either end (rows) or side (columns) fit the viewport with the Projects'
 * cells, which sizes a cell; `RUN` more run on past it. Rows also have more lines beyond the far one;
 * columns, in a tall viewport, fill its height and run on past its top, which the tilted view looks
 * across.
 */
const PAD = 1;
const RUN = 3;
const ROWS_BEFORE = 4;
const ROWS_AFTER = 2;
const COLUMNS_BEYOND = 6;
/** How far the plane runs past the viewport: its size in viewports. */
const EXTENT = 6;
/**
 * How dark each mark is, as black's alpha over the white paper: the table beyond the sheet, the
 * rulings, the centre marks of cells to be planted, a planted cell's wash and the ripples. The rulings
 * are the site's hairline (#ebebeb is 8% black); the wash is the lightest step that still reads.
 */
const TABLE = 0.04;
const RULE = 0.1;
const MARK = 0.16;
const WASH = 0.04;
const RING = 0.14;
/** A hairline's width, device px; a centre mark's arms, in cells from its centre. */
const HAIRLINE = 1.25;
const ARM = 0.06;
/** How many landings the paper can ring at once; past that the oldest ripple gives way. */
const RIPPLES = 10;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = /* glsl */ `
uniform sampler2D uPrint;
uniform sampler2D uWashes;
uniform float uHasPrint, uDissolve, uGrid, uTime, uCell, uPitch, uVertical;
uniform vec2 uSize, uOrigin, uCount;
uniform vec4 uSheet, uRuled;
uniform vec4 uRipples[${RIPPLES}];
varying vec2 vUv;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
}

// How much of a pixel fw wide, d units from a line width units wide, the line covers.
float line(float d, float width, float fw) {
	return clamp((width * 0.5 - d) / fw + 0.5, 0.0, 1.0);
}

// Black at alpha a over what is there, where it covers: worked in the display's (sRGB) terms, as the
// page's own alpha-black would be, though the frame is drawn in linear light.
void darken(inout vec3 rgb, float a, float covers) {
	rgb *= mix(1.0, pow(1.0 - a, 2.2), covers);
}

void main() {
	// Viewport px: x from its left edge, y from its far (top) edge; the plane runs on past it.
	vec2 p = (vec2(vUv.x, 1.0 - vUv.y) - 0.5) * uSize * ${EXTENT.toFixed(1)} + 0.5 * uSize;
	float px = max(fwidth(p.x), fwidth(p.y));

	// The page's white paper; past the sheet's edge, the table a shade darker.
	vec3 rgb = vec3(1.0);
	vec2 past = max(uSheet.xy - p, p - uSheet.zw);
	darken(rgb, ${TABLE.toFixed(2)}, smoothstep(0.0, px, max(past.x, past.y)));

	// Along a line and across the lines, from the first cell of the first line (the far left in
	// rows; the far right in columns): which cell this is, and where across its line it lies.
	vec2 q = uVertical > 0.5 ? vec2(p.y - uOrigin.y, uOrigin.x - p.x) : p - uOrigin;
	vec2 fw = fwidth(q);
	vec2 cell = floor(vec2(q.x / uCell, q.y / uPitch));
	float across = q.y - cell.y * uPitch;
	float onCell = step(across, uCell);
	float len = uCount.x * uCell;
	if (q.x >= -fw.x && q.x <= len + fw.x && q.y >= -fw.y && cell.y < uCount.y && across <= uCell + fw.y) {
		cell.x = clamp(cell.x, 0.0, uCount.x - 1.0);
		float within = step(0.0, q.x) * step(q.x, len);
		// A planted cell's wash, growing from its centre as a clean circle until it fills the cell.
		float grow = texelFetch(uWashes, ivec2(max(cell, 0.0)), 0).r;
		vec2 c = vec2(q.x - (cell.x + 0.5) * uCell, across - 0.5 * uCell);
		float cover = grow > 0.0 ? smoothstep(grow * 0.72 + 0.004, grow * 0.72 - 0.004, length(c) / uCell) * within * step(0.0, across) * onCell : 0.0;
		darken(rgb, ${WASH.toFixed(2)}, cover);

		// The rulings draw in from the far edge to the near one.
		float wipe = 1.0 - smoothstep(uGrid * 1.2 - 0.2, uGrid * 1.2, (p.y - uRuled.y) / (uRuled.w - uRuled.y));
		// Each cell's sides, and the two edges of its line, a hairline on screen however far off; between
		// lines the strip stays blank.
		float side = line(abs(fract(q.x / uCell + 0.5) - 0.5) * uCell, ${HAIRLINE.toFixed(2)} * fw.x, fw.x) * onCell * step(0.0, across);
		float rule = line(min(abs(across), abs(across - uCell)), ${HAIRLINE.toFixed(2)} * fw.y, fw.y) * within;
		darken(rgb, ${RULE.toFixed(2)}, max(side, rule) * wipe);
		// A cell still to be planted has a small + at its centre, where its Plant will stand.
		vec2 arm = abs(c) / uCell;
		float mark = max(line(abs(c.x), ${HAIRLINE.toFixed(2)} * fw.x, fw.x) * step(arm.y, ${ARM.toFixed(2)}), line(abs(c.y), ${HAIRLINE.toFixed(2)} * fw.y, fw.y) * step(arm.x, ${ARM.toFixed(2)}));
		darken(rgb, ${MARK.toFixed(2)}, mark * within * onCell * wipe * (1.0 - step(0.001, grow)));
	}

	// Where an arc lands, ripples: three hairline rings, one after another, widening and fading; on the
	// way out they go with the rulings.
	for (int i = 0; i < ${RIPPLES}; i++) {
		vec4 r = uRipples[i];
		float age = uTime - r.z;
		if (r.w < 0.5 || age < 0.0 || age > 1.4) continue;
		float dist = length(p - r.xy);
		for (int k = 0; k < 3; k++) {
			float t = age - float(k) * 0.16;
			if (t < 0.0 || t > 1.0) continue;
			float radius = (0.05 + (1.0 - pow(1.0 - t, 2.0)) * 0.62) * uCell;
			float ring = line(abs(dist - radius), ${HAIRLINE.toFixed(2)} * px, px);
			darken(rgb, ${RING.toFixed(2)}, ring * (1.0 - t * t) * (1.0 - float(k) * 0.25) * uGrid);
		}
	}

	// The page's print, as ink on the paper: multiplied in, so the page's white is the paper's own (at
	// the front pose, white) and only the ink shows. It lifts off like dust as the camera tilts: each
	// clump of it goes at its own moment, rising a little up the page as it fades, the darker ink last.
	if (uHasPrint > 0.5 && uDissolve < 1.0 && p.x >= 0.0 && p.y >= 0.0 && p.x <= uSize.x && p.y <= uSize.y) {
		// Its moment, spread evenly over the dissolve, and how far it has gone (0 there, 1 gone).
		float n = smoothstep(0.2, 0.8, noise(p * 0.03) * 0.5 + noise(p * 0.12) * 0.3 + hash(floor(p * 0.75)) * 0.2);
		float going = clamp((uDissolve * 1.3 - n * 0.8) / 0.5, 0.0, 1.0);
		vec4 ink = texture2D(uPrint, vec2(p.x, uSize.y - p.y - going * going * 18.0) / uSize);
		float dark = 1.0 - dot(ink.rgb, vec3(0.299, 0.587, 0.114));
		float gone = smoothstep(0.0, 0.85, going * mix(1.3, 0.9, dark));
		rgb *= mix(vec3(1.0), ink.rgb, (1.0 - gone) * ink.a);
	}

	gl_FragColor = vec4(rgb, 1.0);
	#include <colorspace_fragment>
}`;

/**
 * Where the rulings fall for a viewport of `width` × `height` and the Projects' `cols` × `rows`
 * cells: the cell's side, the lines (rows across a wide viewport, columns down a tall one) with
 * the Projects' cells in their middle, and the sheet (the rulings and a margin, and at least the
 * viewport, which the page's print covers). All in viewport px.
 * @param {number} width @param {number} height @param {{ cols: number, rows: number }} grid
 */
export function measure(width, height, { cols, rows }) {
	const vertical = height > width;
	const margin = 0.03 * Math.min(width, height);
	// Rows: the Projects' cells, and a plain one at each end, span the width. Columns: their lines, and
	// a plain one either side, span the width, and run on down the height.
	const side = vertical ? (width - 2 * margin) / ((rows + 2 * PAD) * (1 + STRIP) - STRIP) : (width - 2 * margin) / (cols + 2 * PAD);
	const pitch = side * (1 + STRIP);
	const before = vertical ? PAD + RUN : ROWS_BEFORE;
	const lines = before + rows + (vertical ? PAD + RUN : ROWS_AFTER);
	const fill = vertical ? Math.max(cols + 2 * PAD, Math.floor((height - 2 * margin) / side)) : cols + 2 * (PAD + RUN);
	const beyond = vertical ? COLUMNS_BEYOND : 0;
	const along = beyond + fill;
	const offsetCol = beyond + Math.floor((fill - cols) / 2);
	const length = along * side;
	const breadth = lines * pitch - STRIP * side;
	const block = { along: cols * side, across: rows * pitch - STRIP * side };
	// The rulings' rectangle, centred on the Projects' cells, which are centred on the viewport.
	const ruled = vertical
		? { x0: (width - breadth) / 2, z0: (height - fill * side) / 2 - beyond * side, x1: (width + breadth) / 2, z1: (height + fill * side) / 2 }
		: {
				x0: (width - length) / 2,
				z0: (height - block.across) / 2 - before * pitch,
				x1: (width + length) / 2,
				z1: (height - block.across) / 2 - before * pitch + breadth
			};
	return {
		vertical,
		side,
		pitch,
		/** Cells along a line, and lines. */
		count: { along, lines },
		/** The Projects' first cell, counted along a line and in lines. */
		offsetCol,
		offsetRow: before,
		/** The corner the counting starts from: the far left (rows) or the far right (columns). */
		origin: { x: vertical ? ruled.x1 : ruled.x0, z: ruled.z0 },
		ruled,
		sheet: {
			x0: Math.min(0, ruled.x0 - margin),
			z0: Math.min(0, ruled.z0 - margin),
			x1: Math.max(width, ruled.x1 + margin),
			z1: Math.max(height, ruled.z1 + margin)
		}
	};
}

/**
 * @param {number} width @param {number} height the viewport, world units (CSS px at the front pose)
 * @param {{ cols: number, rows: number }} grid the cells the Projects take
 */
export function createPaper(width, height, grid) {
	const geometry = new PlaneGeometry(1, 1);
	/** @type {DataTexture} */
	let washes;
	/** @type {ReturnType<typeof measure>} */
	let layout;
	const ripples = Array.from({ length: RIPPLES }, () => new Vector4());
	let nextRipple = 0;
	/** @type {CanvasTexture | null} */
	let print = null;

	const uniforms = {
		uPrint: { value: /** @type {CanvasTexture | null} */ (null) },
		uWashes: { value: /** @type {DataTexture | null} */ (null) },
		uHasPrint: { value: 0 },
		uDissolve: { value: 0 },
		uGrid: { value: 0 },
		uTime: { value: 0 },
		uCell: { value: 1 },
		uPitch: { value: 1 },
		uVertical: { value: 0 },
		uSize: { value: new Vector2() },
		uOrigin: { value: new Vector2() },
		uCount: { value: new Vector2() },
		uSheet: { value: new Vector4() },
		uRuled: { value: new Vector4() },
		uRipples: { value: ripples }
	};
	// Drawn first and leaving no depth, so nothing goes under it: a flower's drawing runs on a little
	// below its foot (a leaf, a fallen petal), and standing up from the paper that part would sink into
	// it and be cut off flat; this way it lies over the paper in front, as a cut-out's would.
	const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false });
	const mesh = new Mesh(geometry, material);
	mesh.renderOrder = -2;
	// Flat on the ground, its top edge (uv v = 1, the print's top) at the far edge.
	mesh.rotation.x = -Math.PI / 2;

	/** Lay the sheet out for a size: the rulings, and a fresh sheet with nothing planted. @param {number} w @param {number} h */
	function resize(w, h) {
		width = w;
		height = h;
		layout = measure(w, h, grid);
		const { count, origin, sheet, ruled } = layout;
		mesh.scale.set(w * EXTENT, h * EXTENT, 1);
		uniforms.uSize.value.set(w, h);
		uniforms.uVertical.value = layout.vertical ? 1 : 0;
		uniforms.uOrigin.value.set(origin.x, origin.z);
		uniforms.uCount.value.set(count.along, count.lines);
		uniforms.uCell.value = layout.side;
		uniforms.uPitch.value = layout.pitch;
		uniforms.uSheet.value.set(sheet.x0, sheet.z0, sheet.x1, sheet.z1);
		uniforms.uRuled.value.set(ruled.x0, ruled.z0, ruled.x1, ruled.z1);
		washes?.dispose();
		washes = new DataTexture(new Uint8Array(count.along * count.lines), count.along, count.lines, RedFormat, UnsignedByteType);
		washes.magFilter = washes.minFilter = NearestFilter;
		washes.generateMipmaps = false;
		washes.needsUpdate = true;
		uniforms.uWashes.value = washes;
	}
	resize(width, height);

	/**
	 * A point on the rulings, world units (y = 0): `along` its line and `across` the lines, in viewport
	 * px from the first cell of the first line. @param {number} along @param {number} across
	 */
	function at(along, across) {
		const { origin, vertical } = layout;
		return vertical
			? { x: origin.x - across - width / 2, z: origin.z + along - height / 2 }
			: { x: origin.x + along - width / 2, z: origin.z + across - height / 2 };
	}

	/** The centre of a Project cell, world units (y = 0). @param {number} col @param {number} row */
	function center(col, row) {
		return at((col + layout.offsetCol + 0.5) * layout.side, (row + layout.offsetRow) * layout.pitch + layout.side / 2);
	}

	return {
		mesh,
		uniforms,
		/** The cell side, world units. */
		get side() {
			return layout.side;
		},
		/** The Projects' cells' corners, world units: what the camera frames. */
		bounds() {
			const from = at(layout.offsetCol * layout.side, layout.offsetRow * layout.pitch);
			const to = at((layout.offsetCol + grid.cols) * layout.side, (layout.offsetRow + grid.rows) * layout.pitch - STRIP * layout.side);
			return { x0: Math.min(from.x, to.x), z0: Math.min(from.z, to.z), x1: Math.max(from.x, to.x), z1: Math.max(from.z, to.z) };
		},
		center,
		resize,

		/** @param {number} seconds the Garden's clock */
		update(seconds) {
			uniforms.uTime.value = seconds;
		},

		/**
		 * How far a planted cell's wash has grown, 0 (nothing planted) to 1 (the whole cell).
		 * @param {number} col @param {number} row @param {number} grow
		 */
		setWash(col, row, grow) {
			const i = (row + layout.offsetRow) * layout.count.along + col + layout.offsetCol;
			const data = washes.image.data;
			if (!data || i < 0 || i >= data.length) return;
			data[i] = Math.round(Math.min(1, Math.max(0, grow)) * 255);
			washes.needsUpdate = true;
		},

		/** Ripples at a cell's centre, where an arc lands, from the given moment of the Garden's clock. @param {number} col @param {number} row @param {number} seconds */
		ripple(col, row, seconds) {
			const { x, z } = center(col, row);
			ripples[nextRipple].set(x + width / 2, z + height / 2, seconds, 1);
			nextRipple = (nextRipple + 1) % RIPPLES;
		},

		/** No ripples (the still state). */
		calm() {
			for (const ripple of ripples) ripple.w = 0;
		},

		/** The page's picture over the paper (null for blank paper). @param {HTMLCanvasElement | null} canvas */
		setPrint(canvas) {
			print?.dispose();
			print = null;
			if (canvas) {
				print = new CanvasTexture(canvas);
				print.colorSpace = SRGBColorSpace;
				print.minFilter = print.magFilter = LinearFilter;
				print.generateMipmaps = false;
			}
			uniforms.uPrint.value = print;
			uniforms.uHasPrint.value = print ? 1 : 0;
		},

		dispose() {
			geometry.dispose();
			material.dispose();
			washes.dispose();
			print?.dispose();
		}
	};
}
