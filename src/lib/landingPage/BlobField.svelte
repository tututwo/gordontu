<script>
	import { prefersReducedMotion } from 'svelte/motion';

	/** @typedef {import('./blobScene.js').BlobSeed} BlobSeed */

	/** @type {{ blobs: BlobSeed[], onsink?: (i: number) => void }} */
	let { blobs, onsink = () => {} } = $props();

	let ready = $state(false);
	/** @type {ReturnType<typeof import('./blobScene.js').createBlobScene> | undefined} */
	let scene;

	// Reduced motion freezes the drift; flipping it back on has to restart the frame loop.
	$effect(() => {
		prefersReducedMotion.current;
		scene?.wake();
	});

	/** @param {BlobSeed[]} seeds */
	function field(seeds) {
		return (/** @type {HTMLCanvasElement} */ node) => {
			let disposed = false;
			/** @type {typeof scene} */
			let created;
			// three is loaded here, not at the top, so the landing's first paint ships no WebGL.
			import('./blobScene.js')
				.then(({ createBlobScene }) => {
					if (disposed) return;
					created = createBlobScene(node, {
						blobs: seeds,
						reduced: () => prefersReducedMotion.current,
						onready: () => (ready = true),
						onsink
					});
					scene = created;
				})
				.catch((error) => {
					// No WebGL (or a broken chunk): the page keeps its plain paper background, but say so.
					console.warn('Blob field unavailable:', error);
				});
			return () => {
				disposed = true;
				created?.dispose();
				scene = undefined;
				ready = false;
			};
		};
	}
</script>

<canvas class={['blob-field', { ready }]} aria-hidden="true" {@attach field(blobs)}></canvas>

<style>
	.blob-field {
		position: fixed;
		inset: 0;
		z-index: -2;
		width: 100%;
		height: 100%;
		opacity: 0;
		pointer-events: none;
		transition: opacity 900ms ease;
	}

	.blob-field.ready {
		opacity: 1;
	}
</style>
