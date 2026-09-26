// Run with `node src/lib/contact.check.js`: the server sends a real message with Reply-To set to the
// visitor, drops a bot's honeypot quietly, and turns away a message it cannot answer.
import { readMessage, toEmail } from './contact.js';

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
	if (!condition) throw new Error(message);
}

/** @param {Record<string, string>} fields */
const form = (fields) => {
	const data = new FormData();
	for (const [name, value] of Object.entries(fields)) data.set(name, value);
	return data;
};

const message = readMessage(form({ email: ' ana@example.com ', subject: 'A map\r\nBcc: x@y.z', body: 'Hi' }));
assert(!('error' in message) && !('spam' in message), 'a real message reads');
const email = toEmail(/** @type {{ email: string, subject: string, body: string }} */ (message));
assert(email.reply_to === 'ana@example.com', 'replying answers the visitor');
assert(email.subject === 'A map Bcc: x@y.z', 'the subject stays one line');
assert(toEmail({ email: 'a@b.co', subject: '', body: 'Hi' }).subject === 'New message from gordontu.com', 'no subject, a default one');

assert('spam' in readMessage(form({ email: 'a@b.co', body: 'Hi', website: 'x' })), 'a filled honeypot is spam');
assert('error' in readMessage(form({ email: 'not an email', body: 'Hi' })), 'no address, no message');
assert('error' in readMessage(form({ email: 'a@b.co\nBcc: x@y.z', body: 'Hi' })), 'one address only');
assert('error' in readMessage(form({ email: 'a@b.co', body: '   ' })), 'an empty message is refused');
assert('error' in readMessage(form({ email: 'a@b.co', body: 'x'.repeat(10001) })), 'a huge message is refused');

console.log('contact: ok');
