import { dev } from '$app/environment';
import { gsap } from 'gsap';
import { BackSide, DoubleSide, FrontSide, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { frameLoop } from '../frameLoop.js';
import { createArcs } from './arcs.js';
import { createCamera, FOV } from './camera.js';
import { createPaper } from './paper.js';
import { createPetals } from './petals.js';
import { createPlants } from './plants.js';
import { createPost } from './post.js';

/**
 * The Garden (CONTEXT.md): the scene and its choreography. One renderer on the given canvas, one
 * frame loop (frameLoop.js) that keeps the Garden's clock and seeks the GSAP timelines playing by it
 * (ADR-0006): the entry or the leave, and the growth, which starts before the entry ends. Each
 * timeline only tweens plain values (the camera's pose, the paper's uniforms, each Plant's pop and
 * wash, each arc's head and fade); every frame poses the scene from them and draws it through the
 * post pass.
 */

/** @typedef {import('./layout.js').Cell} Cell */
/** @typedef {import('./plants.js').Plant} Plant */
/** @typedef {import('three').Mesh<import('three').BufferGeometry, import('three').Material>} Mesh */
/** @typedef {import('three').Sprite} Sprite */
/** @typedef {import('three').Side} Side */

/** Growth: the gap between throws, an arc's flight, and how long it lingers once landed before it fades. */
const GAP = 0.13;
const FLIGHT = 0.6;
const LINGER = 0.5;
/**
 * The entry: the camera's move off the page, seconds, and how far through it the first arc is thrown
 * (two thirds of the way through, when the camera has come about four fifths of the way and eases
 * in, so the first lands as it comes to rest and the entry flows straight into the growth); without
 * the page's picture, how soon the first is thrown, as the rulings draw in.
 */
const MOVE = 2.5;
const THROW = 0.67;
const THROW_BLANK = 0.35;
/** At rest, a petal drifts down from a flower about this often, seconds. */
const DRIFT = 2.4;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Cell[]} cells
 * @param {{ picture?: HTMLCanvasElement | null, reduced?: boolean, onhover?: (cell: Cell | null, at: { x: number, y: number }) => void, onpick?: (cell: Cell) => void }} [options]
 *   `picture`: the page at the window's size, which the Garden starts from (null: blank paper);
 *   `reduced`: prefers-reduced-motion (cuts instead of moves); `onhover` when the Plant under the
 *   pointer changes, and while one is under it as its anchor moves; `onpick` on a click on a Plant.
 */
export function createGarden(canvas, cells, { picture = null, reduced = false, onhover, onpick } = {}) {
	const renderer = new WebGLRenderer({ canvas, powerPreference: 'high-performance', preserveDrawingBuffer: true });
	// Checking each shader for errors as it is first used waits on the GPU, a frame's hitch each time:
	// worth it while working on them, not on the site.
	renderer.debug.checkShaderErrors = dev;
	let width = Math.max(1, canvas.clientWidth);
	let height = Math.max(1, canvas.clientHeight);
	/**
	 * Whether the page's print is on the paper: then the Garden draws at the picture's density (the
	 * screen's, up to 2, as peel.js takes it), so that at the front pose it is the page pixel for pixel;
	 * once the print is gone and the camera at rest, at most 1.5, which keeps it at 60 fps on a laptop.
	 */
	let sharp = !!picture;
	renderer.setPixelRatio(Math.min(devicePixelRatio, sharp ? 2 : 1.5));
	renderer.setSize(width, height, false);

	// The paper is ruled for the block the cells take (as many across and down as they fill).
	const grid = { cols: 1 + Math.max(0, ...cells.map((c) => c.col)), rows: 1 + Math.max(0, ...cells.map((c) => c.row)) };
	const paper = createPaper(width, height, grid);
	paper.setPrint(picture);
	const view = createCamera(width, height, paper.bounds());
	const plants = createPlants(cells, paper, { yaw: view.yaw, anisotropy: renderer.capabilities.getMaxAnisotropy() });
	const arcs = createArcs();
	const petals = createPetals();
	const scene = new Scene();
	scene.add(paper.mesh, plants.group, arcs.group, petals.points);
	const post = createPost(renderer, scene, view.camera);
	const u = paper.uniforms;

	/** Each cell's wash as last written to the paper, so only changes are. */
	const written = new Float32Array(cells.length).fill(-1);
	/** The Garden's clock, seconds: the timelines, ripples and petals all run on it. */
	let clock = 0;
	/**
	 * Every timeline the Garden makes is made in this context, so that dispose() kills them all: GSAP
	 * never takes a paused timeline out of its global one, even once it has ended, and each would keep
	 * the whole scene alive through the callbacks it holds.
	 */
	const motion = gsap.context(() => {});
	/** Settles once the growth's shaders are compiled (see `grow`): until then three looks at them every few ms. @type {Promise<unknown>} */
	let compiled = Promise.resolve();
	/** The entry or the leave, and the growth, each from the moment of the clock it started at. @type {gsap.core.Timeline | null} */
	let playing = null;
	let playingFrom = 0;
	/** @type {gsap.core.Timeline | null} */
	let growing = null;
	let growingFrom = 0;
	/** When the entry is ready for the first arc, on the clock. */
	let throwAt = 0;
	/**
	 * What the next frames draw once, unseen, one each (see `render`), a side at a time where one is
	 * given, and what to call when they have.
	 * @type {[Mesh | Sprite, Side | null][]}
	 */
	let unseen = [];
	/** @type {(() => void) | null} */
	let primed = null;
	let leaving = false;
	let disposed = false;
	let nextDrift = DRIFT;
	/** @type {Plant | null} */
	let hovered = null;
	let anchorAt = { x: NaN, y: NaN };
	/** How long drawing a frame takes (ms, averaged), and how often frames come. */
	const timing = { render: 0, interval: 16.7 };

	/** The drawing buffer's size and density as last set: setting them again, even unchanged, would reallocate it. */
	let measured = '';
	function measure() {
		const ratio = Math.min(devicePixelRatio, sharp ? 2 : 1.5);
		if (measured === `${width}x${height}@${ratio}`) return;
		measured = `${width}x${height}@${ratio}`;
		renderer.setPixelRatio(ratio);
		renderer.setSize(width, height, false);
		petals.setScale(renderer.getDrawingBufferSize(new Vector2()).y / 2 / Math.tan(((FOV / 2) * Math.PI) / 180));
		petals.setUnit(paper.side / 135);
		post.resize(width, height);
	}
	measure();

	/** Draw at the print's density, or the Garden's own. @param {boolean} print */
	function density(print) {
		if (print === sharp) return;
		sharp = print;
		measure();
	}

	/** The page's state: the front pose, its print on white paper, no rulings, nothing grown. */
	function toPage() {
		view.pose.value = 0;
		u.uDissolve.value = 0;
		u.uGrid.value = 0;
		for (const plant of plants.plants) plant.pop.value = plant.wash.value = 0;
		arcs.clear();
		petals.clear();
		paper.calm();
	}
	toPage();

	/** The grown Garden at once, nothing moving. */
	function still() {
		stop();
		leaving = false;
		density(false);
		view.pose.value = u.uDissolve.value = u.uGrid.value = 1;
		arcs.clear();
		petals.clear();
		paper.calm();
		for (const plant of plants.plants) plant.pop.value = plant.wash.value = 1;
		// Drawn now, so that a Garden shown grown on arrival never shows a frame of the page first, and
		// again as soon as the Plants' drawings are in: coming back to the Garden they are kept, and are
		// in before the browser paints, so its first frame on screen has them, not bare paper.
		render(0);
		plants.draw().then(() => disposed || render(0));
	}

	/** Play the entry or the leave on the Garden's clock, from now; resolves when it ends (not if it is overtaken). @param {gsap.core.Timeline} timeline */
	function play(timeline) {
		playing?.kill();
		playing = timeline;
		playingFrom = clock;
		return ended(timeline);
	}

	/** @param {gsap.core.Timeline} timeline */
	const ended = (timeline) => new Promise((resolve) => timeline.eventCallback('onComplete', () => resolve(undefined)));

	function stop() {
		playing?.kill();
		growing?.kill();
		playing = growing = null;
	}

	/**
	 * Where the flowers' shadows fall: to the right, as a low light from the left casts them. Across a
	 * wide frame that is along their row, and they run long; down a tall one the next column is to a
	 * flower's right, so there the light is higher and they are short, a pool beside the foot that ends
	 * before the strip between columns.
	 */
	function lay() {
		plants.lay(height > width ? 0.3 : 1);
	}
	lay();
	// The drawings from the start, in parallel with the entry: the growth waits for them only if they
	// are not in by its first throw.
	plants.draw();

	/** Where an arc to `to` is thrown from: beyond the near edge, below the frame, a little to either side. @param {Plant} plant @param {Vector3} to */
	function launch(plant, to) {
		const bounds = paper.bounds();
		const seed = plant.cell.project.seed;
		const spread = (((seed >> 3) % 1000) / 1000 - 0.5) * (bounds.x1 - bounds.x0) * 0.6;
		return new Vector3(to.x * 0.4 + spread, 0, bounds.z1 + paper.side * (1.2 + ((seed >> 7) % 100) / 100));
	}

	/** An arc lands: ripples, and petals and drops thrown up, at the moment `at` of the Garden's clock. @param {Plant} plant @param {number} at */
	function land(plant, at) {
		const { col, row } = plant.cell;
		paper.ripple(col, row, at);
		const { x, z } = paper.center(col, row);
		petals.burst(x, z, plant.petals, at);
	}

	const raycaster = new Raycaster();
	const ndc = new Vector2();
	/**
	 * The Plant under a point of the window, if any: a flower only where it is drawn, or within a
	 * little of it (a finger's tap more than a mouse's point; see plants.js `solid`).
	 * @param {number} clientX @param {number} clientY @param {boolean} [finger]
	 */
	function pick(clientX, clientY, finger = false) {
		if (leaving || view.pose.value < 0.99) return null;
		const box = canvas.getBoundingClientRect();
		ndc.set(((clientX - box.left) / box.width) * 2 - 1, 1 - ((clientY - box.top) / box.height) * 2);
		raycaster.setFromCamera(ndc, view.camera);
		const hits = raycaster.intersectObjects(
			plants.pickables.filter((mesh) => mesh.visible),
			false
		);
		for (const hit of hits) {
			const plant = /** @type {Plant} */ (hit.object.userData.plant);
			if (plant.shadow ? plant.pop.value > 0.5 && plants.solid(plant, hit.uv, finger ? 0.12 : 0.025) : plant.wash.value > 0.5) return plant;
		}
		return null;
	}

	/** @param {Plant | null} plant */
	function hover(plant) {
		if (plant === hovered) return;
		if (hovered) hovered.hoverTarget = 0;
		hovered = plant;
		if (plant) plant.hoverTarget = 1;
		anchorAt = plant ? view.project(plants.anchor(plant)) : { x: NaN, y: NaN };
		onhover?.(plant?.cell ?? null, anchorAt);
	}

	const listeners = new AbortController();
	const { signal } = listeners;
	canvas.addEventListener(
		'pointermove',
		(event) => {
			const box = canvas.getBoundingClientRect();
			view.pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
			view.pointer.y = ((event.clientY - box.top) / box.height) * 2 - 1;
			if (event.pointerType !== 'touch') hover(pick(event.clientX, event.clientY));
		},
		{ signal }
	);
	canvas.addEventListener(
		'pointerleave',
		(event) => {
			view.pointer.x = view.pointer.y = 0;
			// A finger leaves on every lift; what it named stays named.
			if (event.pointerType === 'mouse') hover(null);
		},
		{ signal }
	);
	// A finger cannot hover: its first tap on a Plant names it, a second opens it (as a Category link
	// on the Landing does), and a tap elsewhere lets go.
	let finger = false;
	canvas.addEventListener('pointerdown', (event) => (finger = event.pointerType !== 'mouse'), { signal });
	canvas.addEventListener(
		'click',
		(event) => {
			const plant = pick(event.clientX, event.clientY, finger);
			if (finger && plant !== hovered) hover(plant);
			else if (plant) onpick?.(plant.cell);
		},
		{ signal }
	);

	/**
	 * Pose the scene from the timelines' values and draw it.
	 * @param {number} dt ms since the last frame
	 */
	function render(dt) {
		// Reduced motion holds the camera still: no sway, no lean. The sway keeps the Garden's clock, so
		// it picks up where it was after a held frame rather than jumping.
		view.update(reduced ? 0 : clock * 1000, reduced ? 0 : dt);
		post.amount.value = view.pose.value;
		plants.update(dt);
		for (const [i, plant] of plants.plants.entries()) {
			// A Plant whose drawing could not be had is never planted: its cell keeps its mark.
			const wash = plant.mesh ? Math.round(plant.wash.value * 255) / 255 : 0;
			if (wash === written[i]) continue;
			written[i] = wash;
			paper.setWash(plant.cell.col, plant.cell.row, wash);
		}
		arcs.update();
		paper.update(clock);
		petals.update(clock);
		const next = unseen.shift();
		if (next) {
			// Drawn once, unseen, before it first shows: the first draw of a texture uploads it, and the
			// first with each kind of material builds the GPU's pipeline for it, which all at once can hold
			// a frame for a tenth of a second; one at a time, alongside the entry, they never do. A
			// material that draws in two passes (transparent and two-sided) is drawn a side at a time.
			const [object, side] = next;
			const { material } = object;
			const shown = object.visible;
			object.visible = true;
			if (side !== null) Object.assign(material, { side, needsUpdate: true });
			post.prime(object);
			if (side !== null) Object.assign(material, { side: DoubleSide, needsUpdate: true });
			object.visible = shown;
			if (!unseen.length) primed?.();
		}
		post.render();
	}

	/** Seek a timeline to the clock; whether it has ended. @param {gsap.core.Timeline} timeline @param {number} from */
	function done(timeline, from) {
		timeline.time(clock - from);
		return timeline.progress() >= 1;
	}

	const loop = frameLoop((dt) => {
		if (dt > 0 && dt < 250) timing.interval += (dt - timing.interval) * 0.05;
		dt = Math.min(Math.max(dt, 0), 100);
		clock += dt / 1000;
		const [entry, growth] = [playing, growing];
		if (entry && done(entry, playingFrom) && playing === entry) playing = null;
		if (growth && clock >= growingFrom && done(growth, growingFrom) && growing === growth) growing = null;

		// At rest, now and then a petal lets go of a flower and drifts down.
		if (!playing && !growing && !leaving && !reduced && view.pose.value === 1 && clock > nextDrift) {
			nextDrift = clock + DRIFT * (0.5 + Math.random());
			const grown = plants.plants.filter((plant) => plant.shadow && plant.pop.value > 0.9);
			const plant = grown[Math.floor(Math.random() * grown.length)];
			if (plant) {
				const { x, z } = plant.node.position;
				petals.drift(x, z, plant.petals[Math.floor(Math.random() * plant.petals.length)], clock);
			}
		}

		const start = performance.now();
		render(dt);
		timing.render += (performance.now() - start - timing.render) * 0.05;

		// The hovered Plant's label follows its anchor as the camera sways.
		if (hovered) {
			const at = view.project(plants.anchor(hovered));
			if (Math.abs(at.x - anchorAt.x) > 0.25 || Math.abs(at.y - anchorAt.y) > 0.25) {
				anchorAt = at;
				onhover?.(hovered.cell, at);
			}
		}
		return true;
	});
	loop.start();
	// The first frame now, so the canvas never shows blank before the loop's first.
	render(0);

	return {
		/**
		 * From the page to the Garden: with the page's picture, the camera rises off the flat page into
		 * the garden pose while the print lifts off and the rulings draw in from the far edge; without it, from blank paper at the garden pose.
		 */
		enter() {
			leaving = false;
			if (reduced) {
				stop();
				view.pose.value = u.uDissolve.value = u.uGrid.value = 1;
				density(false);
				return Promise.resolve();
			}
			const timeline = motion.add(() => gsap.timeline({ paused: true }));
			if (picture) {
				timeline
					.to(view.pose, { value: 1, duration: MOVE, ease: 'power2.inOut' }, 0)
					.to(u.uDissolve, { value: 1, duration: 1.3, ease: 'none' }, 0.05)
					// Down to the Garden's own density once the print has lifted off (it reallocates the
					// frame: while the camera moves, not as the first arcs land or once it is still).
					.call(density, [false], 1.4)
					.to(u.uGrid, { value: 1, duration: 1, ease: 'power1.inOut' }, 0.35);
				throwAt = clock + MOVE * THROW;
			} else {
				view.pose.value = 1;
				timeline.to(u.uGrid, { value: 1, duration: 0.9, ease: 'power1.inOut' }, 0.2);
				throwAt = clock + THROW_BLANK;
			}
			return play(timeline);
		},

		/**
		 * The Projects grow, in the cells' order: an arc thrown to each cell every 0.13 s, and on its
		 * landing a ripple, its cell's wash and the Plant, with a burst of petals; resolves when the last has
		 * settled. Asked for as the entry starts, the first arc is thrown as the camera eases in (see
		 * THROW), or later if the Plants' drawings come later: every landing needs one (a Plant whose
		 * drawing could not be had gets no arc).
		 */
		async grow() {
			await plants.draw();
			if (leaving || disposed) return;
			if (reduced) return still();
			const timeline = motion.add(() => gsap.timeline({ paused: true }));
			for (const [i, plant] of plants.plants.filter((plant) => plant.mesh).entries()) {
				const t = i * GAP;
				const { x, z } = paper.center(plant.cell.col, plant.cell.row);
				const to = new Vector3(x, 0, z);
				const arc = arcs.throw(launch(plant, to), to, paper.side / 135);
				timeline
					.to(arc.head, { value: 1, duration: FLIGHT, ease: 'none' }, t)
					.to(arc.alpha, { value: 0, duration: 0.35, ease: 'power1.in' }, t + FLIGHT + LINGER)
					.call(() => land(plant, growingFrom + t + FLIGHT), [], t + FLIGHT)
					.to(plant.wash, { value: 1, duration: 0.35, ease: 'power2.out' }, t + FLIGHT);
				if (plant.shadow) timeline.to(plant.pop, { value: 1, duration: 0.45, ease: 'back.out(1.7)' }, t + FLIGHT + 0.04);
			}
			// Every shader the growth will use compiled, then drawn once unseen, before its first arc or
			// Plant shows, alongside the entry rather than in the frame each first appears.
			await (compiled = post.compile());
			// The arcs share their materials' kinds: the first one and its drop stand for them all.
			const [arc, drop] = /** @type {(Mesh | Sprite)[]} */ (arcs.group.children);
			const meshes = [arc, drop, ...plants.plants.flatMap(({ mesh, shadow }) => [mesh, shadow])].filter((mesh) => !!mesh);
			await new Promise((resolve) => {
				primed = () => resolve(undefined);
				unseen = /** @type {(Mesh | Sprite)[]} */ (meshes).flatMap((mesh) =>
					/** @type {[Mesh | Sprite, Side | null][]} */ (
						mesh.material.transparent && mesh.material.side === DoubleSide
							? [
									[mesh, BackSide],
									[mesh, FrontSide]
								]
							: [[mesh, null]]
					)
				);
			});
			if (leaving || disposed) return;
			growing = timeline;
			growingFrom = Math.max(clock, throwAt);
			await ended(timeline);
		},

		/**
		 * Back to the page: the Plants sink, newest first, the washes drain, the rulings fade, the print
		 * comes back together and the camera returns to the front pose; resolves when the page could be
		 * shown again.
		 */
		leave() {
			leaving = true;
			hover(null);
			if (reduced) {
				stop();
				toPage();
				density(!!picture);
				return Promise.resolve();
			}
			growing?.kill();
			growing = null;
			const timeline = motion.add(() => gsap.timeline({ paused: true }));
			for (const arc of arcs.arcs) timeline.to(arc.alpha, { value: 0, duration: 0.2 }, 0);
			timeline.to(petals.fade, { value: 0, duration: 0.45, ease: 'power1.in' }, 0.1);
			const grown = plants.plants.filter((plant) => plant.pop.value > 0 || plant.wash.value > 0).reverse();
			for (const [i, plant] of grown.entries()) {
				const t = i * 0.025;
				timeline.to(plant.pop, { value: 0, duration: 0.25, ease: 'back.in(1.4)' }, t).to(plant.wash, { value: 0, duration: 0.3, ease: 'power2.in' }, t + 0.08);
			}
			timeline
				.to(u.uGrid, { value: 0, duration: 0.6, ease: 'power1.in' }, 0.3)
				.to(view.pose, { value: 0, duration: 1.5, ease: 'power3.inOut' }, 0.3)
				// At the print's density, if there is a print to come back (it may come late: see `print`).
				.call(() => density(!!picture), [], 0)
				.to(u.uDissolve, { value: 0, duration: 0.9, ease: 'power2.out' }, 0.9);
			return play(timeline);
		},

		/**
		 * The page's picture for the leave to end on, when the Garden opened without one (coming back to
		 * it, or the Glasses could not take one in time): Garden.svelte takes it as the leave starts.
		 * @param {HTMLCanvasElement} canvas
		 */
		print(canvas) {
			picture = canvas;
			paper.setPrint(canvas);
			density(true);
		},

		/** The grown Garden at once, nothing moving (the dev route's ?still, coming back to it, and reduced motion's growth). */
		still,

		/**
		 * Fit the canvas's size and the screen's density again. The observer reports the canvas's first
		 * size too, and a move to another screen keeps the size, so each part is redone only if it changed.
		 */
		resize() {
			const w = Math.max(1, canvas.clientWidth);
			const h = Math.max(1, canvas.clientHeight);
			if (w !== width || h !== height) {
				width = w;
				height = h;
				// The page's picture shows it at the old size: the leave takes another (see `printed`).
				picture = null;
				paper.setPrint(null);
				paper.resize(width, height);
				view.fit(width, height, paper.bounds());
				plants.place();
				lay();
				written.fill(-1);
			}
			measure();
		},

		/** The Plant under the pointer. */
		get hovered() {
			return hovered?.cell ?? null;
		},

		/** Whether the leave has the page's picture to end on: the Garden opened on it, and the window has kept its size since. */
		get printed() {
			return !!picture;
		},

		/** How long the last frames took to draw and how far apart they came, ms (averaged), for the dev route's console. */
		timing,

		dispose() {
			disposed = true;
			loop.stop();
			motion.kill();
			listeners.abort();
			// Not while three is still waiting on the growth's shaders: it would find their materials gone.
			compiled.then(() => {
				paper.dispose();
				plants.dispose();
				arcs.dispose();
				petals.dispose();
				post.dispose();
				renderer.dispose();
				renderer.forceContextLoss();
			});
		}
	};
}
