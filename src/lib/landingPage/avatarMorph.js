import mesh from './avatarMesh.json';

/**
 * The avatar's head, drawn by WebGL as one mesh over three drawings: as it is, looking up and
 * looking down. The mesh's vertices are landmarks found in all three (the hair's outline and its
 * notches, brows, eyes, mouth, ears, jaw, collar, shoulders; the frame's edge stays put), in
 * avatarMesh.json as fractions of the drawing's side. Each vertex sits between where its landmark
 * is at rest and where it is in the pose the head is turning to, and every drawing is sampled
 * where that landmark is in it, so each is bent into the shape of the moment and they cross over
 * there: the head tilts rather than fades. `turn` slides the face's features sideways, as the head
 * turns to follow the glasses.
 */

const vertexShader = /* glsl */ `
attribute vec2 aRest;
attribute vec2 aUp;
attribute vec2 aDown;
attribute float aTurn;
uniform float uUp;
uniform float uDown;
uniform float uTurn;
varying vec2 vRest;
varying vec2 vUp;
varying vec2 vDown;
varying float vUpMix;
varying float vDownMix;

void main() {
	vec2 p = aRest + (aUp - aRest) * uUp + (aDown - aRest) * uDown;
	p.x += aTurn * uTurn;
	vRest = aRest;
	vUp = aUp;
	vDown = aDown;
	// The drawings cross over in the middle of the move, where the shapes are nearest both.
	vUpMix = smoothstep(0.2, 0.8, uUp);
	vDownMix = smoothstep(0.2, 0.8, uDown);
	gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
}`;

const fragmentShader = /* glsl */ `
precision mediump float;
uniform sampler2D uRestImage;
uniform sampler2D uUpImage;
uniform sampler2D uDownImage;
varying vec2 vRest;
varying vec2 vUp;
varying vec2 vDown;
varying float vUpMix;
varying float vDownMix;

void main() {
	vec4 colour = texture2D(uRestImage, vRest);
	colour = mix(colour, texture2D(uUpImage, vUp), vUpMix);
	gl_FragColor = mix(colour, texture2D(uDownImage, vDown), vDownMix);
}`;

/** @typedef {{ up: number, down: number, turn: number }} Pose */

/**
 * Where the eyes and mouth are in a pose, as fractions of the side.
 * @param {Pose} pose
 */
function face({ up, down, turn }) {
	return ['eye_l', 'eye_r', 'mouth'].map((name) => {
		const i = mesh.names.indexOf(name);
		const at = (/** @type {number} */ k) =>
			mesh.rest[2 * i + k] + (mesh.up[2 * i + k] - mesh.rest[2 * i + k]) * up + (mesh.down[2 * i + k] - mesh.rest[2 * i + k]) * down;
		return [at(0) + mesh.turn[i] * turn, at(1)];
	});
}
/**
 * The frame the eyes and mouth span: the first, and the other two's offsets from it.
 * @param {number[][]} points
 */
const frame = ([p0, p1, p2]) => new DOMMatrix([p1[0] - p0[0], p1[1] - p0[1], p2[0] - p0[0], p2[1] - p0[1], p0[0], p0[1]]);
const fromRest = frame(face({ up: 0, down: 0, turn: 0 })).inverse();

/**
 * How glasses sitting on the face move with it: the affine map that carries the eyes and mouth from
 * where they rest to where the pose has taken them, as a CSS transform about `origin` (fractions of
 * the side), in % of the side.
 * @param {Pose} pose
 * @param {number[]} origin
 */
function glassesOn(pose, [ox, oy]) {
	const m = frame(face(pose)).multiply(fromRest);
	// Where the origin goes, less where it was.
	const { x, y } = m.transformPoint({ x: ox, y: oy });
	return `translate(${(x - ox) * 100}%, ${(y - oy) * 100}%) matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, 0, 0)`;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement[]} images at rest, looking up, looking down
 * @param {() => void} lost called if the context is lost, when the page should show the picture again
 */
export function createMorph(canvas, images, lost) {
	const gl = /** @type {WebGLRenderingContext} */ (canvas.getContext('webgl', { alpha: false, antialias: false }));

	/** @param {number} type @param {string} source */
	const shader = (type, source) => {
		const s = /** @type {WebGLShader} */ (gl.createShader(type));
		gl.shaderSource(s, source);
		gl.compileShader(s);
		return s;
	};
	const program = /** @type {WebGLProgram} */ (gl.createProgram());
	gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexShader));
	gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentShader));
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link failed');
	gl.useProgram(program);

	for (const [name, data, size] of /** @type {const} */ ([
		['aRest', mesh.rest, 2],
		['aUp', mesh.up, 2],
		['aDown', mesh.down, 2],
		['aTurn', mesh.turn, 1]
	])) {
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		const at = gl.getAttribLocation(program, name);
		gl.enableVertexAttribArray(at);
		gl.vertexAttribPointer(at, size, gl.FLOAT, false, 0, 0);
	}
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.triangles), gl.STATIC_DRAW);

	images.forEach((image, unit) => {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		// Not powers of two, so no mipmaps and no repeats.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.uniform1i(gl.getUniformLocation(program, ['uRestImage', 'uUpImage', 'uDownImage'][unit]), unit);
	});

	const uniform = (/** @type {string} */ name) => gl.getUniformLocation(program, name);
	const [uUp, uDown, uTurn] = ['uUp', 'uDown', 'uTurn'].map(uniform);

	/** Take a new context back to where the page is: it shows the picture until the next load. */
	const onlost = (/** @type {Event} */ event) => {
		event.preventDefault();
		lost();
	};
	canvas.addEventListener('webglcontextlost', onlost);

	return {
		/** @param {Pose} pose @param {number} pixels the canvas's side in device px */
		draw({ up, down, turn }, pixels) {
			if (canvas.width !== pixels) canvas.width = canvas.height = pixels;
			gl.viewport(0, 0, pixels, pixels);
			gl.uniform1f(uUp, up);
			gl.uniform1f(uDown, down);
			gl.uniform1f(uTurn, turn);
			gl.drawElements(gl.TRIANGLES, mesh.triangles.length, gl.UNSIGNED_SHORT, 0);
		},
		glasses: glassesOn,
		dispose() {
			canvas.removeEventListener('webglcontextlost', onlost);
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		}
	};
}
