# Portfolio

This context describes how Gordon's creative and technical work is presented to visitors.

## Language

**Project**:
A published piece of Gordon's creative or technical work, with a title, image, tools, category, Client, and date, and a web page of its own unless the Project is just its image.
_Avoid_: Post, moment, photo

**Client**:
Whoever a Project was made for, by name (World Bank, Yale University); two or more share one line. A Project nobody commissioned is Self-initiated.
_Avoid_: Customer, partner, organisation type (Nonprofit)

**Featured Project**:
A Project Gordon has picked to show on the landing's projects tab. The rest are only in the Postcard galleries.
_Avoid_: Highlight, selected work, pick

**Project card**:
How a Featured Project appears on the landing's projects tab: its image, then its title with its Client beneath, and its year at the right edge.
_Avoid_: Row, tile, profile pic (for the image: that is Gordon's avatar)

**Landing**:
The home page and its four tabs, on plain white. A headline ("I'm Gordon", his avatar, then what he makes) names the three Project categories as Category links; below it come the social links (X, LinkedIn, GitHub), a rule, and a quiet text nav of tabs (the open one underlined; the underline glides to the tab you open): about, projects, writing, contact, each with its own URL (`/about`, `/projects`, `/writing`, `/contact`). On a phone it all sits closer, the rule gone, so the first screen reaches the bio's scrambled last line. Switching tabs changes only the panel below the nav; the headline stays put. The home URL opens on about, the grey bio that carries the Bio revision. projects shows the Featured Projects as Project cards, newest first, each opening its postcard in its category's Postcard gallery, then a View all link to the All projects Postcard gallery; writing is the Blog, a placeholder line until the first post; contact is the Contact page.
_Avoid_: Hero, landing nav, card deck, menu

**Contact page**:
The landing's contact tab: an invitation to write about a project, a collaboration or a question, Gordon's email address as plain words with a small bordered Copy button beside it, a form of just a subject (optional) and a message (their own email app already knows who they are), and the names he has worked with (VISA from the bio, then the Projects' Clients). The site is static, so the form sends nothing itself: it opens the subject and message in the visitor's own email app, addressed to him, and keeps a copy to paste if no app opened.
_Avoid_: Inquiry, lead, contact form (for the whole page)

**Category link**:
One of the three links set into the landing headline, one per Project category: a line-drawn 3D icon, followed by the category's name, leading to that category's Postcard gallery. On hover the icon doubles in size as a white card and the sentence makes room like a page round a picture (the rest of its line moves along, and the lines below stay put while it cuts through them, splitting a word between its letters where it lands), corner brackets spring out around it and it plays its own reveal (in black line, lit or not), and a black bar wipes across the name. Leaving reverses it. Keyboard focus plays it the same way. A finger cannot hover, so on touch the first tap plays it, a second tap follows the link, and a tap anywhere else reverses it. The icons: Interactive maps is a folded map that unfolds into a zigzag with contour lines flowing across it; Visual stories is a book that opens and lets five cubes rise out of it and melt into one another; Web tools is a browser window that narrows into a phone while its cards reflow.
_Avoid_: Button, pill, chip, card

**Bio revision**:
The about bio's self-correction, played on every arrival: its second sentence first reads plainly as a tool list ("I use d3.js, three.js…"); then a strikethrough sweeps across the list in one left-to-right stroke (if the list wraps, the stroke runs on from line to line in reading order, like a pen crossing out part of one sentence), and "Claude Code, Codex & Jev across my toolkit…" comes in after it as a scramble, so the sentence now reads "I use Claude Code, Codex & Jev…". The scramble is GSAP's, as in Gordon's reference recording: word by word, left to right, all in the bio's own weight, the whole text turns at once into light random letters, each of about the width of the one it stands in for, so they sit where the words' letters do, flickering quickly, and one front sweeps across it left to right at a steady 40 letters a second, each letter it passes landing as it will stay, in the bio's grey; every word keeps the box its real self takes, so nothing else on the line moves. Styled like a suggested edit, but in grey only. The bio's last line, the afterthought "Alright, you really wanna know ha: I practice Chen- and Yang-style tai chi, play acoustic guitar, and I’m learning tango with my retired neighbor.", is simply there as a cipher (each letter swapped for another of about its width, capitals and punctuation kept, set in the bio's own weight but light grey, spaced to fill each word's box): only the avatar's Glasses read it. While it is a secret, each time a pointer comes over the paragraph, or a finger taps it (a scroll that starts on it does not count), it scrambles, and under a pointer reads dark until the pointer leaves; the avatar glances down at it, wondering (three question marks by his hair), and a mouse becomes a pair of round glasses with a question mark, drawn in the avatar's line, that draw themselves on. While it is decoded (read with the Glasses and let go) these hints rest, and only the Glasses still read it; once it is a secret again, they are back. Once the Glasses have read it, letting go of them decodes the whole line where it stands, word by word; three minutes later, or once the page is left (hiding the browser tab, or going to another tab of the site, in which case it comes back decoded and scrambles into its cipher a moment later), it scrambles back, played, not switched. Reduced motion shows the finished revision at once and swaps cipher and words at once.
_Avoid_: Typo, draft, tracked change

**Glasses**:
The avatar's glasses, which come off. Pressing the avatar lifts them off to one side, bigger, as if held up to the visitor; the head turns to follow them and startles (three strokes by the hair). Dragging carries them anywhere on the page (scrolling it on at the window's edge), and through their lenses the Bio revision's scrambled last line reads plainly, each word decoding calmly (a slow, thin flicker, then settling) the first time a lens comes over it while they are held; over those words the glasses come a quarter bigger, as if brought closer to read. Held with the glasses themselves within 45° of straight below his head (wherever the hand holding them is), they alarm him: the three strokes stand up one after another into three exclamation marks; anywhere else, they stay three strokes. While they are held, the head looks up at the pointer when it is within 75° of straight above it, and down when it is within 75° of straight below, bending into the drawings of him looking up and looking down; looking up, he does not startle. A finger carries them higher above it than a mouse does, clear of the fingertip. Let go, they spring back on and the head turns back (and if they read the scramble, it decodes). Worn, the glasses leave the head as it is.
_Avoid_: Magnifier, lens tool, X-ray

**Postcard gallery**:
A page of Projects scattered once as postcards on a bounded plane you drag around. There is one per Project category, holding that category's Projects, and one titled All projects (`/all`), holding every Project mixed together, newest first; its tool rail reaches all four. Each postcard is its Project's image in its own proportions. One postcard can be opened (it flies to the centre; picking it from the project index does the same). Under it sit its title and year, a Flip for details button and Close; everything else about the Project is on its back, set like a Project card (date, title, Client, tools, the category as a stamp) and, for a Project with a web page of its own, addressed to it: Open project, on the address lines. An open postcard has its own URL, the gallery's plus the Project's slug (`/maps/<slug>`, `/all/<slug>`): opening one puts it in the address bar, closing takes it out, and arriving at it opens that postcard. Flipping never changes the URL.
_Avoid_: Grid, wall, canvas, infinite canvas, Project page (there is none: a Project's URL is its open postcard)

**Project category**:
One of the portfolio's canonical groupings: Interactive maps, Visual stories, or Web tools. Each has its own page (`/maps`, `/charts`, `/creative-code` — the URLs keep the earlier names Maps, Charts, Creative coding), reached from the landing page or the gallery's section switcher. The stored `value` never changes; `slug` is the URL form.
_Avoid_: Title tag, navigation item, filter, services
