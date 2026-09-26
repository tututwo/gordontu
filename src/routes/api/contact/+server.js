import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readMessage, toEmail } from '$lib/contact.js';

// The one route that runs on the server (a Vercel function): the rest of the site is prerendered.
export const prerender = false;

// SvelteKit already refuses form posts from other sites (its CSRF origin check).
// ponytail: no rate limit; add one (e.g. Vercel's firewall) if spam gets past the honeypot.
export async function POST({ request }) {
	const message = readMessage(await request.formData());
	if ('spam' in message) return json({ ok: true });
	if ('error' in message) return json({ error: message.error }, { status: 400 });

	if (!env.RESEND_API_KEY) return json({ error: 'The form is not set up yet.' }, { status: 503 });
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(toEmail(message))
	});
	if (!response.ok) {
		console.error('Resend', response.status, await response.text());
		return json({ error: 'The message could not be sent.' }, { status: 502 });
	}
	return json({ ok: true });
}
