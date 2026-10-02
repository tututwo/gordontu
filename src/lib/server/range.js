/**
 * Answers a Range request from the whole file: 206 with the bytes asked for, or 416 when they start
 * past the end. One range (`bytes=0-1`, `bytes=100-`, `bytes=-500`) is all browsers send for media;
 * anything else gets the whole file, which RFC 9110 allows.
 * @param {ArrayBuffer} body the whole file
 * @param {string} range the request's Range header
 * @param {Headers} headers the whole file's response headers
 */
export function partial(body, range, headers) {
	const size = body.byteLength;
	const [, first = '', last = ''] = /^bytes=(\d*)-(\d*)$/i.exec(range.trim()) ?? [];
	const valid = first !== '' ? last === '' || Number(last) >= Number(first) : last !== '';
	if (!valid) return new Response(body, { headers });

	const start = first === '' ? Math.max(0, size - Number(last)) : Number(first);
	const end = first !== '' && last !== '' ? Math.min(Number(last), size - 1) : size - 1;
	if (start > end) {
		return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
	}
	const sliced = new Headers(headers);
	sliced.delete('Content-Length');
	sliced.set('Content-Range', `bytes ${start}-${end}/${size}`);
	return new Response(body.slice(start, end + 1), { status: 206, headers: sliced });
}
