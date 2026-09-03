/**
 * The landing Blob field's three blobs. `home` is [x, y] as viewport fractions with the origin
 * bottom-left (the shader's frame); `radius` is where the paint has faded to nothing, as a fraction of
 * min(width, height). `home` is only where a blob starts: placed to sit behind the headline as in
 * docs/landing-page.png before the drift carries it off. The drift check runs against these same
 * seeds, so retune here and both stay in step.
 * @type {import('./blobScene.js').BlobSeed[]}
 */
export const landingBlobs = [
	{ color: '#d3e3f6', home: [0.332, 0.72], radius: 0.165 },
	{ color: '#f08d6a', home: [0.481, 0.73], radius: 0.18 },
	{ color: '#fdd07e', home: [0.593, 0.6], radius: 0.12 }
];
