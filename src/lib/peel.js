/*
 * The Peel (CONTEXT.md), ported from canvas-ui's Peel (github.com/DavidHDev/canvas-ui,
 * src/lib/Peel/PeelVanilla.ts): its sheet, a grid bent round a cylinder in a vertex shader, seen in
 * perspective, shaded along the curl and lined along its edge. Canvas UI draws the page into its
 * canvas with the html-in-canvas API, which only Chrome has, behind a flag; here snapdom takes the
 * picture instead, and the navigation, not the pointer, drives the peel.
 *
 * Canvas UI's notice, which its licence asks to travel with this port:
 *
 * MIT + Commons Clause License Condition v1.0. Copyright (c) 2026 David Haz.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, and distribute the
 * Software as part of an application, website, or product, subject to the following conditions: The
 * above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software. Commons Clause Restriction: You may use this Software, including for any
 * commercial purpose, so long as you do not sell, sublicense, or redistribute the components
 * themselves - whether alone, in a bundle, or as a ported version. No Warranty: THE SOFTWARE IS
 * PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
 * SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { gsap } from 'gsap/gsap-core';
import { prefersReducedMotion } from 'svelte/motion';
import { frameLoop } from './frameLoop.js';
import { allProjects, categories } from './project/project.js';

const GALLERY = '/[category]/[[slug]]';
/** The galleries in the rail's order. */
const GALLERIES = [allProjects, ...categories].map(({ slug }) => slug);
const DURATION = 0.9;
/** A picture that takes longer than this (a slow phone) is dropped, and the page simply changes. */
const PATIENCE = 1000;
/**
 * A gallery's table, which snapdom would encode as a PNG at full size (four fifths of the picture's
 * time): it is drawn under the rest instead, straight from the GPU.
 */
const TABLE = '.gallery canvas';

const SEG = 96;

const SHEET_VERT = /* glsl */ `
precision highp float;
in vec2 uv;
uniform vec2 uRes;
uniform float uSide;
uniform float uPeel;
uniform float uFold;
uniform float uCurl;
uniform float uBow;
uniform float uBulge;
uniform float uFocal;
out vec2 vUv;
out float vShade;
out vec2 vSide;

const float PI = 3.1415926;

void main () {
  vec2 aGrid = vec2(uv.x, 1.0 - uv.y);
  vUv = aGrid;
  vec2 p = aGrid * uRes;
  float u = uSide < 0.5 ? p.x : uRes.x - p.x;
  float v = p.y;

  float A = uPeel;
  float R = uCurl;
  float dvB = (0.5 - aGrid.y) / 0.28;
  float c = uFold + uBulge * A * exp(-dvB * dvB);

  float x = u;
  float z = 0.0;
  float sh = 0.0;
  if (u < c) {
    float theta = (c - u) / R;
    if (theta <= PI) {
      x = c - R * sin(theta);
      z = R * (1.0 - cos(theta));
    } else {
      x = c + (theta - PI) * R;
      z = 2.0 * R;
    }
    sh = sin(clamp(theta, 0.0, PI));
  }
  z += uBow * A * sin(PI * aGrid.y) * clamp(z / R, 0.0, 1.5);
  z = clamp(z, -uFocal * 0.2, uFocal * 0.45);
  vShade = sh * smoothstep(0.0, 0.08, A);
  vSide = vec2(u, v);

  vec2 q = vec2(uSide < 0.5 ? x : uRes.x - x, v);
  vec2 ndc = (q / uRes) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  float w = (uFocal - z) / uFocal;
  gl_Position = vec4(ndc, -z / uFocal, w);
}`;

const SHEET_FRAG = /* glsl */ `
precision highp float;
in vec2 vUv;
in float vShade;
in vec2 vSide;
out vec4 outColor;
uniform sampler2D uContent;
uniform float uShade;
uniform float uShine;
uniform float uPeel;
uniform vec2 uRes;

void main () {
  vec4 tex = texture(uContent, vUv);
  float sh = 1.0 - uShade * 0.7 * pow(max(vShade, 0.0), 1.3);
  float du = max(vSide.x, 0.0);
  float line = exp(-du / 2.5) + exp(-du / 18.0) * 0.25;
  float dv = (vSide.y - uRes.y * 0.5) / (uRes.y * 0.45);
  float shine = uShine * line * exp(-dv * dv) * smoothstep(0.0, 0.08, uPeel);
  vec3 rgb = mix(tex.rgb * sh, vec3(0.0), clamp(shine, 0.0, 1.0));
  outColor = vec4(rgb * tex.a, tex.a);
}`;

/**
 * The page as a sheet over the window, drawn at rest until `draw` peels it. `forward` peels it from
 * its right edge, the way a book's page turns to the next; otherwise from its left, turning back.
 * @param {typeof import('three')} THREE
 * @param {HTMLCanvasElement} image the page's picture, at the window's size
 * @param {boolean} forward
 */
function createSheet(THREE, image, forward) {
	/** @type {import('three').WebGLRenderer} */
	let renderer;
	try {
		renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	} catch {
		return null; // no WebGL 2
	}
	const canvas = renderer.domElement;
	canvas.setAttribute('aria-hidden', 'true');
	canvas.dataset.capture = 'exclude'; // never in a picture of the page itself
	canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:2147483647;pointer-events:none';
	renderer.setSize(image.width, image.height, false);
	document.body.append(canvas);
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	// Canvas UI's defaults, but for the curl, which is sized to the window so a phone's page rolls as
	// a desk's does.
	const curl = Math.min(width, height) * 0.3;
	// Mipmapped (three's default), so words squeezed round the curl don't shimmer as it rolls.
	const content = new THREE.CanvasTexture(image);
	content.flipY = false;
	const uniforms = {
		uContent: { value: content },
		uRes: { value: [width, height] },
		uSide: { value: forward ? 1 : 0 },
		uCurl: { value: curl },
		uBow: { value: 75 },
		uBulge: { value: 50 },
		uFocal: { value: 2000 },
		uShade: { value: 0.25 },
		uShine: { value: 1 },
		uPeel: { value: 0 },
		uFold: { value: 0 }
	};
	const sheet = new THREE.Mesh(
		new THREE.PlaneGeometry(1, 1, SEG, SEG),
		new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3,
			vertexShader: SHEET_VERT,
			fragmentShader: SHEET_FRAG,
			uniforms,
			// Curled over, its back shows: the page's print, mirrored.
			side: THREE.DoubleSide,
			transparent: true,
			premultipliedAlpha: true
		})
	);
	// The vertex shader places it, not three.
	sheet.frustumCulled = false;
	const scene = new THREE.Scene().add(sheet);
	const camera = new THREE.Camera();

	/**
	 * The sheet `peel` of the way off: from flat to rolled past the far edge, out of sight.
	 * @param {number} peel
	 */
	const draw = (peel) => {
		uniforms.uPeel.value = peel;
		uniforms.uFold.value = peel * (width + curl);
		renderer.render(scene, camera);
	};
	draw(0);

	return {
		draw,
		remove() {
			canvas.remove();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	};
}

/** @typedef {import('@sveltejs/kit').NavigationTarget | null} Target */

/** Where a page stands: the landing (or any page but a gallery) first, then the galleries in order. @param {Target} target */
const place = (target) => (target?.route.id === GALLERY ? 1 + GALLERIES.indexOf(target.params?.category ?? '') : 0);

/**
 * Which way leaving `from` for `to` peels the page: 1 on (from its right edge), -1 back (from its
 * left), 0 not at all (between the landing's tabs, or within one gallery).
 * @param {Target} from @param {Target} to
 */
export const direction = (from, to) => Math.sign(place(to) - place(from));

const browser = typeof window !== 'undefined';

/** Whether the browser drew its own transition for the last back or forward (a swipe on a phone). */
let swiped = false;
if (browser) addEventListener('popstate', (event) => (swiped = event.hasUAVisualTransition));

/** The peel playing, if one is: a new one finishes it at once. @type {(() => void) | undefined} */
let finish;

/**
 * The window as it looks, drawn by snapdom (the page's WebGL canvases keep their drawing buffers for
 * it) over the page's own white, with a gallery's table in between.
 * @param {object} [options] snapdom's
 */
async function picture(options) {
	const { snapdom } = await import('@zumer/snapdom');
	const dpr = Math.min(devicePixelRatio, 2);
	const rest = await (await snapdom(document.body, { clip: 'viewport', dpr, exclude: [TABLE], ...options })).toCanvas();
	const image = document.createElement('canvas');
	image.width = rest.width;
	image.height = rest.height;
	const ctx = /** @type {CanvasRenderingContext2D} */ (image.getContext('2d'));
	ctx.fillStyle = getComputedStyle(document.documentElement).backgroundColor;
	ctx.fillRect(0, 0, image.width, image.height);
	const table = document.querySelector(TABLE);
	if (table instanceof HTMLCanvasElement) {
		// Its CSS drop shadow, as the 2D canvas's own shadow: Safari's has no `filter`.
		const [, color, x, y, blur] = getComputedStyle(table).filter.match(/drop-shadow\((.+\)) (\S+)px (\S+)px (\S+)px\)/) ?? [];
		if (color) Object.assign(ctx, { shadowColor: color, shadowOffsetX: +x * dpr, shadowOffsetY: +y * dpr, shadowBlur: +blur * dpr });
		const box = table.getBoundingClientRect();
		ctx.drawImage(table, box.x * dpr, box.y * dpr, box.width * dpr, box.height * dpr);
		ctx.shadowColor = 'transparent';
	}
	ctx.drawImage(rest, 0, 0);
	return image;
}

/** Peel the sheet off over the new page, then take it away. @param {NonNullable<ReturnType<typeof createSheet>>} sheet */
function play({ draw, remove }) {
	const progress = { value: 0 };
	const tween = gsap.to(progress, { value: 1, duration: DURATION, ease: 'power2.inOut', paused: true });
	/** @type {number | undefined} */
	let start;
	const loop = frameLoop((dt, now) => {
		start ??= now;
		tween.time((now - start) / 1000);
		draw(progress.value);
		if (tween.progress() < 1) return true;
		finish?.();
		return false;
	});
	finish = () => {
		loop.stop();
		tween.kill();
		remove();
		finish = undefined;
	};
	loop.start();
}

/** Counts peels, so a picture that comes back after a newer navigation began is dropped. */
let turns = 0;

/**
 * For SvelteKit's onNavigate: going to or from a Postcard gallery, the page peels off over the next.
 * Within a gallery (opening a postcard changes the URL) and between the landing's tabs, it doesn't.
 * SvelteKit waits while snapdom draws the page and the drawing is laid over it as a sheet; then it
 * changes the page under the sheet, and the sheet peels away.
 * @param {import('@sveltejs/kit').OnNavigate} navigation
 */
export function peel(navigation) {
	const way = direction(navigation.from, navigation.to);
	if (!way || (navigation.type === 'popstate' && swiped) || prefersReducedMotion.current) return;
	finish?.();
	const turn = ++turns;
	return Promise.race([
		Promise.all([import('three'), picture()]).catch(() => null),
		new Promise((late) => setTimeout(late, PATIENCE, null))
	]).then((ready) => {
		if (!ready || turn !== turns) return;
		const sheet = createSheet(ready[0], ready[1], way > 0);
		if (sheet) navigation.complete.then(() => play(sheet), sheet.remove);
	});
}

// snapdom's first picture of a page takes three or four times as long as the next (it embeds the fonts
// and learns the default styles), so it takes one once the page is up, a frame's work at a time, and
// the first peel starts as soon as later ones. Not while the landing's Intro plays: it would stutter it.
if (browser)
	setTimeout(function warm() {
		if (document.documentElement.dataset.intro) setTimeout(warm, 1000);
		else picture({ fast: false }).catch(() => {});
	}, 2000);
