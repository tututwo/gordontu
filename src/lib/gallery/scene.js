import * as THREE from 'three';
import { cubicOut } from 'svelte/easing';
import { toOptimizedImage } from '../project/project.js';
import { DEFAULT_CARD_RATIO, cardSize, cellSize, layoutPlane, panLimits } from './layout.js';
import { backTexture, loadBackFont, readTokens } from './postcardBack.js';

const GHOST = 0.1;
const OPEN_MS = 520;
const REVEAL_MS = 380;
const REVEAL_STAGGER_MS = 28;
/** The landing's image placeholder grey, shown until a card's image is in (or if it never arrives). */
const PLACEHOLDER = 0xf4f4f4;
/**
 * How far the camera stands from the open card, in card widths. The flip turns the card in real
 * perspective, and from this far its near edge swells by only a seventh, like a postcard turned at
 * arm's length; closer, a wide card's edge doubled and reached past the page.
 */
const PERSPECTIVE = 4;
/** Room under the open card for its caption (PostcardGallery's .caption: a gap and at most three lines), px. */
const CAPTION = 96;

/** @typedef {import('../project/project.js').Project} Project */

/**
 * @typedef {object} HeroBox the open card at rest, CSS px
 * @property {number} w
 * @property {number} h
 * @property {number} y its centre's offset from the viewport's
 * @property {{ x: number, y: number, w: number, h: number } | null} [link] where the Open project link
 *   lies on its back, card px, once the back is drawn (null if it has none)
 */

/**
 * @typedef {object} Card
 * @property {Project} project
 * @property {THREE.Mesh} mesh the one postcard on the plane
 * @property {THREE.MeshBasicMaterial} material opacity = reveal × ghost
 * @property {THREE.MeshBasicMaterial} backingMaterial opaque silhouette beneath transparent art
 * @property {number} ratio width / height, the image's own
 */

/**
 * The three.js half of the Postcard gallery. Plain object, no Svelte reactivity — the
 * component talks to it from event handlers and reads nothing back reactively.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Project[]} projects
 * @param {{ pan: { x: number, y: number, zoom: number, constrain: () => void }, reduced: () => boolean, onready: () => void, onheroresize: (box: HeroBox) => void }} options
 *   `pan` is sampled every frame (screen px, +y down); `onready` fires once textures are in;
 *   `onheroresize` gets the open card's box when it opens, on every resize, and when its back is drawn.
 */
export function createScene(canvas, projects, { pan, reduced, onready, onheroresize }) {
	const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
	let cameraZ = 1000;
	const geometry = new THREE.PlaneGeometry(1, 1);
	const raycaster = new THREE.Raycaster();
	const tokens = readTokens();

	let width = 1;
	let height = 1;
	let cell = 300;
	let homeY = 0;
	/** @type {ReturnType<typeof layoutPlane>} */
	let plane;
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
		new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, color: 0xffffff })
	);
	const heroFront = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ transparent: true, depthTest: false }));
	const heroBack = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, color: 0xffffff })
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
	// Closing, the card unwinds whatever turn it is at back to its front as it flies home.
	let closing = false;
	let closingTurn = 0;

	// --- cards + textures ---
	const loader = new THREE.TextureLoader();
	/** @param {string} url @returns {Promise<THREE.Texture>} */
	const loadTexture = (url) => new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));

	/** @type {Promise<void>[]} */
	const loads = [];
	for (const [index, project] of projects.entries()) {
		const material = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, color: PLACEHOLDER, opacity: 0 });
		const backingMaterial = new THREE.MeshBasicMaterial({
			transparent: true,
			depthTest: false,
			color: 0xffffff,
			opacity: 0
		});
		const mesh = new THREE.Mesh(geometry, backingMaterial);
		const art = new THREE.Mesh(geometry, material);
		art.position.z = 0.001;
		mesh.renderOrder = index * 2;
		art.renderOrder = index * 2 + 1;
		mesh.add(art);
		scene.add(mesh);
		/** @type {Card} */
		const card = { project, mesh, material, backingMaterial, ratio: DEFAULT_CARD_RATIO };
		mesh.userData.card = card;
		cards.push(card);
		const load = loadTexture(toOptimizedImage(project.projectImgSource))
			.then((texture) => {
				if (disposed) return texture.dispose();
				texture.colorSpace = THREE.SRGBColorSpace;
				texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
				// The card is the image, in its own proportions: no frame, no letterbox.
				const image = /** @type {{ width: number, height: number }} */ (texture.image);
				if (image.width > 0 && image.height > 0) card.ratio = image.width / image.height;
				material.map = texture;
				material.color.set(0xffffff);
				material.needsUpdate = true;
			})
			.catch(() => {
				/* keeps the placeholder-grey material; layout never breaks */
			});
		loads.push(load);
	}

	/** Lay the plane out for the cards' current proportions and put every card on its cell. */
	function relayout() {
		plane = layoutPlane(projects, cell, width, cards.map((card) => cardSize(1, card.ratio).h));
		for (const [index, card] of cards.entries()) {
			const spot = plane.cells[index];
			const { w, h } = cardSize(cell, card.ratio);
			card.mesh.position.set(spot.x, spot.y, 0);
			card.mesh.rotation.z = spot.rot;
			card.mesh.scale.set(w, h, 1);
		}
		pan.constrain();
	}

	/** Stand the camera `distance` px back, with the field of view that keeps z = 0 at one unit per CSS px. @param {number} distance */
	function setCameraDistance(distance) {
		cameraZ = distance;
		camera.fov = (2 * Math.atan(height / 2 / cameraZ) * 180) / Math.PI;
		camera.far = cameraZ * 2;
		camera.updateProjectionMatrix();
	}

	function resize() {
		const rect = canvas.getBoundingClientRect();
		width = Math.max(1, Math.round(rect.width));
		height = Math.max(1, Math.round(rect.height));
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		setCameraDistance(heroCard && !closing ? PERSPECTIVE * heroBoxFor(heroCard).w : cameraZ);
		cell = cellSize(width);
		homeY = cell * 0.18;
		relayout();
		if (heroCard && !closing) {
			heroTo = heroTargetFor(heroCard);
			// Redrawing the back reports the box too, with its link where it now lies.
			if (heroBackTexture) drawBack(heroCard);
			else onheroresize(heroBoxFor(heroCard));
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
		camera.position.set(-pan.x / zoom, (pan.y + homeY) / zoom, cameraZ);
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
			if (closing) hero.rotation.y = closingTurn * t;
		}

		renderer.render(scene, camera);
		if (animating) wake();
	}

	/**
	 * The open card at rest, CSS px: as big as fits with its caption under it, the two centred together
	 * (`y` is the card centre's offset from the viewport's). @param {Card} card
	 */
	function heroBoxFor(card) {
		const maxW = width * 0.8;
		const maxH = Math.max(height * 0.4, Math.min(height * 0.7, height - CAPTION - 64));
		const w = Math.min(maxW, maxH * card.ratio);
		return { w, h: w / card.ratio, y: -CAPTION / 2 };
	}

	/** World-space target whose rendered box matches heroBoxFor at the current camera zoom. @param {Card} card */
	function heroTargetFor(card) {
		const zoom = Math.max(0.001, pan.zoom);
		const box = heroBoxFor(card);
		return {
			x: -pan.x / zoom,
			y: (pan.y + homeY - box.y) / zoom,
			rot: 0,
			w: box.w / zoom,
			h: box.h / zoom
		};
	}

	/** Draw the open card's back at its size on screen, and report where its link lies. @param {Card} card */
	function drawBack(card) {
		heroBackTexture?.dispose();
		const box = heroBoxFor(card);
		const back = backTexture(card.project, box, renderer.getPixelRatio(), tokens);
		heroBackTexture = back.texture;
		heroBackTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
		heroBack.material.map = heroBackTexture;
		heroBack.material.needsUpdate = true;
		onheroresize({ ...box, link: back.link });
		wake();
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
		closing = false;
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
	const listeners = new AbortController();
	canvas.addEventListener('webglcontextlost', (event) => event.preventDefault(), { signal: listeners.signal });
	canvas.addEventListener('webglcontextrestored', wake, { signal: listeners.signal });

	resize();
	// Reveal once every texture has settled (loaded or fell back), not one by one, laid out for the
	// proportions they turned out to have.
	Promise.allSettled(loads).then(() => {
		if (disposed) return;
		relayout();
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
			settleClosed();
			heroCard = card;
			setCameraDistance(PERSPECTIVE * heroBoxFor(card).w);
			syncCamera();
			heroFrom = {
				x: card.mesh.position.x,
				y: card.mesh.position.y,
				rot: card.mesh.rotation.z,
				w: card.mesh.scale.x,
				h: card.mesh.scale.y
			};
			heroTo = heroTargetFor(card);
			onheroresize(heroBoxFor(card));
			heroFront.material.map = card.material.map;
			heroFront.material.color.set(card.material.map ? 0xffffff : PLACEHOLDER);
			heroFront.material.needsUpdate = true;
			hero.rotation.y = 0;
			hero.visible = true;
			loadBackFont(tokens).then(() => {
				if (heroCard === card && !closing && !disposed) drawBack(card);
			});
			tweenOpen(1);
		},

		close() {
			if (!heroCard || closing) return;
			// Whole turns are the front again: unwind only the part short of one, the shorter way.
			const turn = hero.rotation.y % (2 * Math.PI);
			closingTurn = turn > Math.PI ? turn - 2 * Math.PI : turn < -Math.PI ? turn + 2 * Math.PI : turn;
			closing = true;
			tweenOpen(0);
		},

		/** @param {number} radians */
		setFlip(radians) {
			if (closing) return;
			hero.rotation.y = radians;
			wake();
		},

		wake,

		dispose() {
			disposed = true;
			if (frame) cancelAnimationFrame(frame);
			if (resizePending) cancelAnimationFrame(resizePending);
			observer.disconnect();
			listeners.abort();
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
