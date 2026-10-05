/*
 * The talk at /talk: five minutes on how the landing's avatar came alive, told round Dan Harmon's
 * Story Circle (you, need, go, search, find, take, return, change), with Gordon as the one who goes
 * round it and the avatar as what he is after. This file is the script: change the words here.
 */

/** The circle's eight steps, and when each should start for the talk to end on five minutes. */
export const STEPS = [
	{ name: 'You', at: '0:00' },
	{ name: 'Need', at: '0:25' },
	{ name: 'Go', at: '0:45' },
	{ name: 'Search', at: '1:15' },
	{ name: 'Find', at: '2:20' },
	{ name: 'Take', at: '2:45' },
	{ name: 'Return', at: '3:40' },
	{ name: 'Change', at: '4:35' }
];

/**
 * A beat is one press of the arrow key.
 * @typedef {object} Beat
 * @property {number} step which of `STEPS` it belongs to
 * @property {string} scene what the stage shows: one of the world's poses (world.js), or a panel of
 *   the page's own (`live`, `paper`, `drawn`, `day`, `film`, `credits`)
 * @property {string} line the one line on screen
 * @property {string} [sub] the line under it
 * @property {string} read the stage's caption, until the pointer is over something
 * @property {string} say what Gordon says (shown with N, for rehearsing)
 * @property {number} [travel] how long the arrow key takes to get here (s), where the way here is
 *   itself the show
 */

/** @type {Beat[]} */
export const BEATS = [
	{
		step: 0,
		scene: 'picture',
		line: 'This is me.',
		sub: '134 pixels, and a pair of round glasses.',
		read: 'avatar.png · 134 px',
		say: 'This is me: a hundred and thirty-four pixels at the top of my portfolio. I’m a design engineer. I make maps and data visualization.'
	},
	{
		step: 1,
		scene: 'rings',
		line: 'But it isn’t me. I move.',
		sub: 'And I want to be different. My difference is the round glasses.',
		read: 'the glasses',
		say: 'But it isn’t me, because I move. And I want to be different. What makes me different is this pair of round glasses.'
	},
	{
		step: 2,
		scene: 'layers',
		line: 'So I started with the glasses.',
		sub: 'One picture became two layers. The glasses come off.',
		read: 'face.png + glasses.png',
		say: 'So I started with the glasses. I split the picture into two layers, the face and the glasses, and hung the glasses on a spring. Now they come off.'
	},
	{
		step: 2,
		scene: 'live',
		line: 'And they are a key.',
		sub: 'The last line of my bio is hidden. Only the glasses can read it.',
		read: 'live · take the glasses',
		say: 'And they are a key. I want the site to feel a little like a game, with things to unlock. The last line of my bio is scrambled, and only the glasses can read it. (Take them off, carry them down to the last line, let go.)'
	},
	{
		step: 3,
		scene: 'keys',
		line: 'Take my glasses, and I should look at them. I can’t draw that.',
		sub: 'So Image 2 drew the keyframes.',
		read: 'four drawings',
		say: 'But when you take my glasses, I should look at them. That needs me looking up and looking down, and I can’t draw that. So I asked Image 2 for the keyframes.'
	},
	{
		step: 3,
		scene: 'strip',
		line: 'Seedance turned the keyframes into video.',
		sub: 'Not good enough to ship. Good enough to study.',
		read: 'seedance · test',
		say: 'Then Seedance turned the keyframes into video, so I could see how the motion might look. It wasn’t good enough to put on the site. But it was good reference.'
	},
	{
		step: 3,
		scene: 'mesh',
		line: 'So Opus 5.5 rebuilt the motion in code.',
		sub: 'Every drawing gets the same 87 points.',
		read: '87 points · 162 triangles',
		say: 'So I handed the keyframes and the videos to Opus 5.5, and it rebuilt the motion in code. Every drawing gets the same eighty-seven points: the hair, the brows, the eyes, the jaw.'
	},
	{
		step: 3,
		scene: 'bend',
		line: 'The picture bends between them.',
		sub: 'A video can’t look at your pointer. Code can.',
		read: 'looking up',
		say: 'Join the points into triangles, and the picture bends from one drawing to the next. The head tilts instead of fading. And unlike a video, it can follow your pointer.',
		travel: 2.4
	},
	{
		step: 4,
		scene: 'live',
		line: 'Now it’s me.',
		sub: 'It moves. It panics. It wonders.',
		read: 'live · hold them above, then below',
		say: 'Now it’s me. Hold the glasses above my head, and I look up and sweat. Below my chin, I panic. Point at the hidden line, and I wonder.'
	},
	{
		step: 5,
		scene: 'paper',
		line: 'Last, it needed an entrance.',
		sub: 'Something to watch while the page loads.',
		read: 'a blank sheet',
		say: 'The last thing I made is the first thing you see. On a phone, the three icons arrived about two seconds after the page. So the page needed something to watch while it loads.'
	},
	{
		step: 5,
		scene: 'drawn',
		line: 'One pen. One line at a time.',
		sub: 'Then a brush, and a blink. Seven seconds.',
		read: 'the intro',
		say: 'One pen, one line at a time, then a brush for the colour, and a blink. Seven seconds. My first version stacked pencil, pen and colour like Photoshop layers. I threw it away.',
		travel: 6
	},
	{
		step: 5,
		scene: 'day',
		line: 'Seven seconds on every visit is too much.',
		sub: 'So it plays once a day, and one tap skips it.',
		read: 'once in 24 hours',
		say: 'But seven seconds on every visit is too much. So it plays once a day, and one tap skips it.'
	},
	{
		step: 6,
		scene: 'film',
		line: 'Back to the page.',
		read: 'gordontu.com',
		say: '(Play the film. Say nothing.)'
	},
	{
		step: 7,
		scene: 'credits',
		line: 'It was a picture. Now it’s me.',
		sub: 'And it’s my odd, fun way of saying: I use AI.',
		read: 'the cast',
		say: 'It was a picture. Now it’s me. And it’s my odd, fun way of saying that I use AI. Image 2 drew, Seedance rehearsed, Opus wrote the code. I directed.'
	},
	{
		step: 7,
		scene: 'live',
		line: 'Go take my glasses off.',
		sub: 'gordontu.com',
		read: 'live',
		say: 'gordontu.com. Go take my glasses off.'
	}
];

/** Who made it, as the film's end credits have it (the site's /credits). @type {[string, string][]} */
export const CREDITS = [
	['Cast', 'Gordon'],
	['Director', 'Gordon'],
	['Producer', 'Gordon'],
	['Writer', 'Gordon'],
	['Photography and cinematography', 'Opus 5.5 · Seedance 2.5 · Image 2'],
	['Editor', 'Gordon · Image 2 · Opus 5.5'],
	['Animation', 'GSAP · Seedance 2.5 · Opus 5.5']
];

/**
 * The film, "Portfolio update 2026". The file is Gordon's own copy, kept out of the repo (its music
 * is a released track), so it plays offline from his laptop; anywhere else the page falls back to
 * YouTube.
 */
export const FILM = { src: '/demo/portfolio-update-2026.mp4', youtube: 'D7HTbsX3RzE' };
