import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three';

/**
 * The Garden's camera and its two poses. The front pose looks straight down at the sheet from the
 * height that makes it fill the viewport exactly, so the page's picture on it is the page, pixel for
 * pixel. The garden pose comes down toward the near edge and tilts up to look across the sheet,
 * turned a little so the sheet recedes to the upper right, framed so the Projects' cells fill the
 * frame, the paper running on past it all round (paper.js). `pose` (0 front, 1 garden) is what the
 * choreography tweens; between the two the camera orbits what it looks at. At rest the garden pose
 * sways and leans a little toward the pointer, both scaled by `pose` so the front pose is exact.
 */

export const FOV = 30;
/**
 * The garden pose's tilt from looking straight down (a few degrees under the video's, so that the
 * turned block reaches from near the frame's top to near its bottom without its near corners cutting
 * a flower; less in a tall frame, where the lines of cells run away from the camera, so that a flower
 * hides less of the one behind it and the lines take more of the frame's height), and its turn about
 * the vertical, degrees.
 */
const PITCH = 49;
const PITCH_TALL = 40;
const YAW = 11;
/**
 * At the garden pose the Projects' cells fill the frame, as the paper fills the video's. Across a wide
 * frame they span this much of its width (NDC, of 2), moved this far right: the near left corner,
 * which a flower may stand on, at the frame's left edge, the near right one a hair past its right
 * (flowers stand clear of both; checked by eye at 16:10 and 16:9). Turned, the far row then starts
 * about an eighth of the way down and the near one ends about a tenth from the bottom. A tall frame's
 * columns span its width, a corner cell or two cut a little. Either way they take at most this much
 * of the frame's height (a very wide frame), centred this high (NDC y), a little below the middle.
 */
const SPAN = 2.01;
const SHIFT = 0.005;
const SPAN_TALL = 2.04;
const TALL = 1.76;
const MIDDLE = -0.05;
const MIDDLE_TALL = -0.14;

const RAD = Math.PI / 180;
const tanHalf = Math.tan((FOV / 2) * RAD);

/**
 * @param {number} width @param {number} height the viewport, CSS px
 * @param {{ x0: number, z0: number, x1: number, z1: number }} rect the Projects' cells, world units, to frame at the garden pose
 */
export function createCamera(width, height, rect) {
	const camera = new PerspectiveCamera(FOV, width / height, 40, 20000);
	const front = { position: new Vector3(), quaternion: new Quaternion() };
	const garden = { pivot: new Vector3(), distance: 1, pitch: PITCH };
	const pose = { value: 0 };
	/** Where the pointer is, −1..1 across the viewport; the lean eases toward it. */
	const pointer = { x: 0, y: 0 };
	const lean = { x: 0, y: 0 };
	const matrix = new Matrix4();
	const pivot = new Vector3();
	const right = new Vector3();
	const up = new Vector3();
	const corner = new Vector3();

	/**
	 * Place the camera at `distance` from `at`, tilted `pitch` from the vertical toward the near edge
	 * and turned `yaw` about the vertical, looking at it.
	 * @param {Vector3} at @param {number} distance @param {number} pitch @param {number} yaw degrees
	 */
	function place(at, distance, pitch, yaw) {
		const p = pitch * RAD;
		const y = yaw * RAD;
		camera.position.set(at.x + distance * Math.sin(p) * Math.sin(y), at.y + distance * Math.cos(p), at.z + distance * Math.sin(p) * Math.cos(y));
		camera.up.set(0, 1, 0);
		camera.lookAt(at);
	}

	/**
	 * Frame the Projects' cells at the garden pose: pull back until their four corners span the frame's
	 * width (or as much of its height as they may), then slide the view so they sit where they should
	 * across and down; a few rounds settle it.
	 * @param {number} w @param {number} h @param {{ x0: number, z0: number, x1: number, z1: number }} r
	 */
	function fit(w, h, r) {
		width = w;
		height = h;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();

		front.position.set(0, h / 2 / tanHalf, 0);
		matrix.lookAt(front.position, new Vector3(0, 0, 0), new Vector3(0, 0, -1));
		front.quaternion.setFromRotationMatrix(matrix);

		const corners = [
			[r.x0, r.z0],
			[r.x1, r.z0],
			[r.x0, r.z1],
			[r.x1, r.z1]
		];
		const tall = h > w;
		garden.pitch = tall ? PITCH_TALL : PITCH;
		const span = tall ? SPAN_TALL : SPAN;
		const shift = tall ? 0 : SHIFT;
		const middle = tall ? MIDDLE_TALL : MIDDLE;
		const aim = garden.pivot.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
		let distance = Math.max(w, h) * 1.5;
		for (let round = 0; round < 16; round++) {
			place(aim, distance, garden.pitch, YAW);
			camera.updateMatrixWorld();
			let minX = Infinity;
			let maxX = -Infinity;
			let minY = Infinity;
			let maxY = -Infinity;
			for (const [x, z] of corners) {
				corner.set(x, 0, z).project(camera);
				minX = Math.min(minX, corner.x);
				maxX = Math.max(maxX, corner.x);
				minY = Math.min(minY, corner.y);
				maxY = Math.max(maxY, corner.y);
			}
			distance *= Math.max((maxX - minX) / span, (maxY - minY) / TALL);
			right.setFromMatrixColumn(camera.matrixWorld, 0);
			up.setFromMatrixColumn(camera.matrixWorld, 1);
			const half = distance * tanHalf;
			aim.addScaledVector(right, ((minX + maxX) / 2 - shift) * half * camera.aspect);
			aim.addScaledVector(up, ((minY + maxY) / 2 - middle) * half);
		}
		garden.distance = distance;
	}
	fit(width, height, rect);

	return {
		camera,
		pose,
		pointer,
		/** The garden pose's turn, radians: the flowers face it. */
		yaw: YAW * RAD,
		fit,

		/**
		 * Pose the camera for this frame: between the front and garden poses by `pose`, the garden
		 * pose swaying ±0.8° over nine seconds and leaning up to a degree toward the pointer.
		 * @param {number} now ms @param {number} dt ms since the last frame
		 */
		update(now, dt) {
			const t = pose.value;
			const ease = 1 - Math.exp(-Math.max(dt, 0) / 260);
			lean.x += (pointer.x - lean.x) * ease;
			lean.y += (pointer.y - lean.y) * ease;
			if (t <= 0) {
				camera.position.copy(front.position);
				camera.quaternion.copy(front.quaternion);
			} else {
				const sway = Math.sin((now / 9000) * Math.PI * 2) * 0.8 + lean.x * 1.1;
				const nod = Math.sin((now / 13000) * Math.PI * 2 + 1) * 0.3 + lean.y * 0.7;
				pivot.copy(garden.pivot).multiplyScalar(t);
				const distance = front.position.y + (garden.distance - front.position.y) * t;
				place(pivot, distance, Math.max((garden.pitch + nod) * t, 1e-3), (YAW + sway) * t);
			}
			camera.updateMatrixWorld();
		},

		/** A world point on screen, CSS px from the viewport's top left. @param {Vector3} point */
		project(point) {
			corner.copy(point).project(camera);
			return { x: ((corner.x + 1) / 2) * width, y: ((1 - corner.y) / 2) * height };
		}
	};
}
