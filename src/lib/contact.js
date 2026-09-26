/** Where every message goes: the page shows it, and the server sends to it. */
export const EMAIL = 'tugordon@outlook.com';

/** Sent from Gordon's own domain (verified with Resend), so Outlook trusts it. */
const FROM = 'gordontu.com <contact@gordontu.com>';

/**
 * Reads the Contact page's form as the server gets it. A filled honeypot is a bot: `spam`, which the
 * server answers as if sent, so the bot learns nothing. Everything else is checked here because
 * anyone can post to the endpoint without the page.
 * @param {FormData} data
 * @returns {{ spam: true } | { error: string } | { email: string, subject: string, body: string }}
 */
export function readMessage(data) {
	/** @param {string} name */
	const field = (name) => String(data.get(name) ?? '').trim();
	if (field('website')) return { spam: true };

	const email = field('email');
	// One address, no spaces or line breaks: it becomes the Reply-To.
	if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return { error: 'Enter your email address, so I can write back.' };
	}
	const body = field('body');
	if (!body) return { error: 'Write a message first.' };
	if (body.length > 10000) return { error: 'That message is too long: keep it under 10,000 characters.' };
	// A subject is one line.
	const subject = field('subject').replace(/\s+/g, ' ').slice(0, 200);
	return { email, subject, body };
}

/**
 * The email Resend sends to Gordon: the visitor's subject, their words, and Reply-To set to them.
 * @param {{ email: string, subject: string, body: string }} message
 */
export function toEmail({ email, subject, body }) {
	return {
		from: FROM,
		to: [EMAIL],
		reply_to: email,
		subject: subject || 'New message from gordontu.com',
		text: `${body}\n\n—\nFrom ${email}, through gordontu.com/contact`
	};
}
