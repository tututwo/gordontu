import * as THREE from 'three';
import { cubicOut } from 'svelte/easing';
import { toOptimizedImage } from '../project/project.js';
import { CARD_RATIO, cardSize, cellSize, layoutPlane, panLimits } from './layout.js';
import { backTexture, loadBackFonts, readTokens } from './postcardBack.js';

const CAMERA_Z = 1000;
const GHOST = 0.15;
const OPEN_MS = 520;
const REVEAL_MS = 380;
const REVEAL_STAGGER_MS = 28;
const PAPER = 0xf1ebe0;
const CARD_PAPER = 0xfffdf9;

/** @typedef {import('../project/project.js').Project} Project */

/**
 * @typedef {object} Card
 * @property {Project} project
 * @property {THREE.Mesh} mesh the one postcard on the plane
 * @property {THREE.MeshBasicMaterial} material opacity = reveal × ghost
 * @property {THREE.MeshBasicMaterial} backingMaterial opaque silhouette beneath transparent art
 * @property {boolean} landscape
 * @property {{ w: number, h: number }} size
 */

/**
 * The three.js half of the Postcard gallery. Plain object, no Svelte reactivity — the
 * component talks to it from event handlers and reads nothing back reactively.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Project[]} projects
 * @param {{ pan: { x: number, y: number, zoom: number, constrain: () => void }, reduced: () => boolean, onready: () => void, onheroresize?: (box: { w: number, h: number }) => void }} options
 *   `pan` is sampled every frame (screen px, +y down); `onready` fires once textures are in.
 */
export function createScene(canvas, projects, { pan, reduced, onready, onheroresize = () => {} }) {
	const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(30, 1, 1, CAMERA_Z * 2);
	camera.position.z = CAMERA_Z;
	const geometry = new THREE.PlaneGeometry(1, 1);
	const raycaster = new THREE.Raycaster();
	const tokens = readTokens();

	let width = 1;
	let height = 1;
	let cell = 300;
	let homeY = 0;
	let plane = layoutPlane(projects, cell, width, height);
	/** @type {Card[]} */
	const cards = [];
	let revealStart = Infinity;
	let disposed = false;

	// --- hero (the opened card) ---
	const hero = new THREE.Group();
	hero.visible = false;
	hero.renderOrder = projects.length * 2 + 2;
	const heroPaper = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, color: CARD_PAPER })
	);
	const heroFront = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ transparent: true, depthTest: false }));
	const heroBack = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, color: PAPER })
	);
	heroPaper.position.z = -0.001;
	heroBack.rotation.y = Math.PI;
	heroPaper.renderOrder = hero.renderOrder;
	heroFront.renderOrder = heroBack.renderOrder = hero.renderOrder + 1;
	hero.add(heroPaper, heroFront, heroBack);
	scene.add(hero);
	/** @type {Card | undefined} */
	let heroCard;
	/** @type {THREE.Texture | undefined} */
	let heroBackTexture;
	let heroFrom = { x: 0, y: 0, rot: 0, w: 1, h: 1 };
	let heroTo = { x: 0, y: 0, rot: 0, w: 1, h: 1 };
	// Open progress 0..1 as an interruptible tween: retargeting starts from the current value.
	let openValue = 0;
	let openFrom = 0;
	let openTarget = 0;
	let openStart = 0;
	let openDuration = OPEN_MS;

	// --- cards + textures ---
	const loader = new THREE.TextureLoader();
	/** @param {string} url @returns {Promise<THREE.Texture>} */
	const loadTexture = (url) => new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));

	/** @type {Promise<void>[]} */
	const loads = [];
	for (const [index, project] of projects.entries()) {
		const material = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, color: PAPER, opacity: 0 });
		const backingMaterial = new THREE.MeshBasicMaterial({
			transparent: true,
			depthTest: false,
			color: CARD_PAPER,
			opacity: 0
		});
		const mesh = new THREE.Mesh(geometry, material);
		const backing = new THREE.Mesh(geometry, backingMaterial);
		backing.position.z = -0.001;
		backing.renderOrder = index * 2;
		mesh.renderOrder = index * 2 + 1;
		mesh.add(backing);
		scene.add(mesh);
		/** @type {Card} */
		const card = { project, mesh, material, backingMaterial, landscape: false, size: cardSize(cell, false) };
		mesh.userData.card = card;
		cards.push(card);
		const load = loadTexture(toOptimizedImage(project.projectImgSource))
			.catch(() => loadTexture(project.projectImgSource))
			.then((texture) => {
				if (disposed) return texture.dispose();
				texture.colorSpace = THREE.SRGBColorSpace;
				texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
				const image = /** @type {{ width: number, height: number }} */ (texture.image);
				const imageRatio = image.width / image.height;
				const cardRatio = 1 / CARD_RATIO;
				if (imageRatio > cardRatio) {
					texture.repeat.x = cardRatio / imageRatio;
					texture.offset.x = (1 - texture.repeat.x) / 2;
				} else {
					texture.repeat.y = imageRatio / cardRatio;
					texture.offset.y = (1 - texture.repeat.y) / 2;
				}
				material.map = texture;
				material.color.set(0xffffff);
				material.needsUpdate = true;
			})
			.catch(() => {
				/* keeps the paper-coloured material; layout never breaks */
			})
			.then(() => place(card));
		loads.push(load);
	}

	/** Put a card on its cell with its current aspect. @param {Card} card */
	function place(card) {
		const spot = plane.cells[cards.indexOf(card)];
		card.size = cardSize(cell, card.landscape);
		card.mesh.position.set(spot.x, spot.y, 0);
		card.mesh.rotation.z = spot.rot;
		card.mesh.scale.set(card.size.w, card.size.h, 1);
	}

	function resize() {
		const rect = canvas.getBoundingClientRect();
		width = Math.max(1, Math.round(rect.width));
		height = Math.max(1, Math.round(rect.height));
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.fov = (2 * Math.atan(height / 2 / CAMERA_Z) * 180) / Math.PI;
		camera.updateProjectionMatrix();
		cell = cellSize(width);
		homeY = cell * 0.18;
		plane = layoutPlane(projects, cell, width, height);
		for (const card of cards) place(card);
		pan.constrain();
		if (heroCard) {
			heroTo = heroTargetFor(heroCard);
			onheroresize(heroBoxFor(heroCard));
		}
		wake();
	}

	// --- frame ---
	/** @param {number} a @param {number} b @param {number} t */
	const lerp = (a, b, t) => a + (b - a) * t;
	let frame = 0;
	function wake() {
		if (!frame && !disposed) frame = requestAnimationFrame(tick);
	}

	/** Apply the screen-space view controller to Three's world-space camera. */
	function syncCamera() {
		const zoom = Math.max(0.001, pan.zoom);
		if (camera.zoom !== zoom) {
			camera.zoom = zoom;
			camera.updateProjectionMatrix();
		}
		// Dividing by zoom keeps a one-pixel drag equal to one screen pixel at every scale.
		camera.position.set(-pan.x / zoom, (pan.y + homeY) / zoom, CAMERA_Z);
		camera.updateMatrixWorld();
	}

	/** @param {number} now */
	function tick(now) {
		frame = 0;
		let animating = false;

		// Pan is screen px (+y down); the camera moves the opposite way in world units (+y up).
		syncCamera();

		// Open tween.
		if (openValue !== openTarget) {
			const p = openDuration === 0 ? 1 : Math.min(1, (now - openStart) / openDuration);
			openValue = openFrom + (openTarget - openFrom) * cubicOut(p);
			if (p >= 1) openValue = openTarget;
			animating ||= openValue !== openTarget;
			if (openValue === 0 && openTarget === 0) settleClosed();
		}
		const ghost = 1 - (1 - GHOST) * openValue;

		// Cards fade in with a stagger and ghost while one is open.
		for (const [index, card] of cards.entries()) {
			const revealAge = now - revealStart - index * REVEAL_STAGGER_MS;
			const reveal = reduced() ? 1 : cubicOut(Math.min(1, Math.max(0, revealAge / REVEAL_MS)));
			if (reveal < 1) animating = true;
			card.material.opacity = reveal * ghost;
			card.backingMaterial.opacity = reveal * ghost;
			card.mesh.visible = card !== heroCard;
		}

		// Hero.
		if (hero.visible) {
			const t = openValue;
			hero.position.set(lerp(heroFrom.x, heroTo.x, t), lerp(heroFrom.y, heroTo.y, t), 1);
			hero.rotation.z = lerp(heroFrom.rot, heroTo.rot, t);
			hero.scale.set(lerp(heroFrom.w, heroTo.w, t), lerp(heroFrom.h, heroTo.h, t), 1);
		}

		renderer.render(scene, camera);
		if (animating) wake();
	}

	/** Largest postcard box that fits the viewport with breathing room. @param {Card} card */
	function heroBoxFor(card) {
		const maxW = width * 0.8;
		const maxH = height * 0.66;
		if (card.landscape) {
			const w = Math.min(maxW, maxH * CARD_RATIO);
			return { w, h: w / CARD_RATIO };
		}
		const h = Math.min(maxH, maxW * CARD_RATIO);
		return { w: h / CARD_RATIO, h };
	}

	/** World-space target whose rendered box matches heroBoxFor at the current camera zoom. @param {Card} card */
	function heroTargetFor(card) {
		const zoom = Math.max(0.001, pan.zoom);
		const box = heroBoxFor(card);
		return {
			x: -pan.x / zoom,
			y: (pan.y + homeY) / zoom,
			rot: 0,
			w: box.w / zoom,
			h: box.h / zoom
		};
	}

	/** @param {number} target */
	function tweenOpen(target) {
		openFrom = openValue;
		openTarget = target;
		openStart = performance.now();
		openDuration = reduced() ? 0 : OPEN_MS;
		wake();
	}

	function settleClosed() {
		hero.visible = false;
		heroCard = undefined;
		heroBackTexture?.dispose();
		heroBackTexture = undefined;
		heroBack.material.map = null;
		heroBack.material.needsUpdate = true;
	}

	// --- observers ---
	let resizePending = 0;
	const observer = new ResizeObserver(() => {
		if (!resizePending) resizePending = requestAnimationFrame(() => ((resizePending = 0), resize()));
	});
	observer.observe(canvas);
	/** @param {Event} event */
	const onContextLost = (event) => event.preventDefault();
	const onContextRestored = () => wake();
	canvas.addEventListener('webglcontextlost', onContextLost);
	canvas.addEventListener('webglcontextrestored', onContextRestored);

	resize();
	// Reveal once every texture has settled (loaded or fell back), not one by one.
	Promise.allSettled(loads).then(() => {
		if (disposed) return;
		revealStart = performance.now();
		onready();
		wake();
	});

	return {
		/** Fixed screen-space composition offset used by pointer-anchored zoom. */
		viewOffset() {
			return { x: 0, y: homeY };
		},

		/** Half-extents the pan may travel, in screen px. */
		panLimits() {
			return panLimits(plane.width, plane.height, width, height, cell * 0.5, pan.zoom);
		},

		/** Which card is under the pointer, if any. @param {PointerEvent | MouseEvent} event */
		hitTest(event) {
			syncCamera();
			const rect = canvas.getBoundingClientRect();
			const ndc = new THREE.Vector2(
				((event.clientX - rect.left) / rect.width) * 2 - 1,
				-((event.clientY - rect.top) / rect.height) * 2 + 1
			);
			raycaster.setFromCamera(ndc, camera);
			const hits = raycaster.intersectObjects(
				cards.filter((card) => card.mesh.visible).map((card) => card.mesh),
				false
			);
			if (!hits.length) return undefined;
			// All cards sit on z=0; the one drawn last (highest renderOrder) is the one you see.
			const top = hits.reduce((best, hit) => (hit.object.renderOrder > best.object.renderOrder ? hit : best));
			return /** @type {Card} */ (top.object.userData.card).project;
		},

		/** Fly a card from its place on the plane to the centre of the view. @param {Project} project */
		open(project) {
			const card = cards.find((c) => c.project === project);
			if (!card) return;
			syncCamera();
			heroCard = card;
			heroFrom = {
				x: card.mesh.position.x,
				y: card.mesh.position.y,
				rot: card.mesh.rotation.z,
				w: card.size.w,
				h: card.size.h
			};
			heroTo = heroTargetFor(card);
			heroFront.material.map = card.material.map;
			heroFront.material.color.set(card.material.map ? 0xffffff : PAPER);
			heroFront.material.needsUpdate = true;
			hero.rotation.y = 0;
			hero.visible = true;
			loadBackFonts().then(() => {
				if (heroCard !== card || disposed) return;
				heroBackTexture?.dispose();
				heroBackTexture = backTexture(project, card.landscape, tokens);
				heroBack.material.map = heroBackTexture;
				heroBack.material.color.set(0xffffff);
				heroBack.material.needsUpdate = true;
				wake();
			});
			tweenOpen(1);
		},

		close() {
			if (!heroCard) return;
			tweenOpen(0);
		},

		/** @param {number} radians */
		setFlip(radians) {
			hero.rotation.y = radians;
			wake();
		},

		/** CSS-pixel box of the opened card at rest, for the DOM hit target. */
		heroBox() {
			return heroCard ? heroBoxFor(heroCard) : { w: 0, h: 0 };
		},

		wake,

		dispose() {
			disposed = true;
			if (frame) cancelAnimationFrame(frame);
			if (resizePending) cancelAnimationFrame(resizePending);
			observer.disconnect();
			canvas.removeEventListener('webglcontextlost', onContextLost);
			canvas.removeEventListener('webglcontextrestored', onContextRestored);
			for (const card of cards) {
				card.material.map?.dispose();
				card.material.dispose();
				card.backingMaterial.dispose();
			}
			heroBackTexture?.dispose();
			heroPaper.material.dispose();
			heroFront.material.dispose();
			heroBack.material.dispose();
			geometry.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	};
}
