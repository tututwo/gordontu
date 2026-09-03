/** Minimum and maximum gallery scale. */
export const MIN_ZOOM = 0.55;
export const MAX_ZOOM = 2.5;

/** @param {number} value @param {number} minimum @param {number} maximum */
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

/** @param {number} zoom */
export const clampZoom = (zoom) => clamp(zoom, MIN_ZOOM, MAX_ZOOM);

/**
 * Keep the same world point under a moving screen-space anchor while zooming.
 * `pan`, `from`, and `to` are all measured from the viewport centre in CSS pixels.
 *
 * @param {{ x: number, y: number }} pan
 * @param {{ x: number, y: number }} from
 * @param {{ x: number, y: number }} to
 * @param {number} ratio next zoom / starting zoom
 */
export function anchoredPan(pan, from, to, ratio) {
	return {
		x: to.x - ratio * (from.x - pan.x),
		y: to.y - ratio * (from.y - pan.y)
	};
}

/**
 * Normalise mouse wheels, precision trackpads, and ctrl+wheel trackpad pinches into a zoom ratio.
 * Exponential scaling makes equal wheel distances feel equal at every zoom level.
 *
 * @param {number} deltaY
 * @param {number} deltaMode WheelEvent.DOM_DELTA_PIXEL / LINE / PAGE
 * @param {boolean} ctrlKey Chromium/WebKit expose trackpad pinch as ctrl+wheel
 */
export function wheelZoomRatio(deltaY, deltaMode, ctrlKey) {
	const unit = deltaMode === 1 ? 0.05 : deltaMode === 2 ? 1 : 0.002;
	const exponent = clamp(-deltaY * unit * (ctrlKey ? 10 : 1), -0.5, 0.5);
	return 2 ** exponent;
}
