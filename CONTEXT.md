# Portfolio

This context describes how Gordon's creative and technical work is presented to visitors.

## Language

**Project**:
A published piece of Gordon's creative or technical work, with a title, image, destination, tools, category, and date.
_Avoid_: Post, moment, photo

**Landing**:
The home page and its three tabs, on plain white. A headline ("I'm Gordon", his avatar, then what he makes) names the three Project categories as Category links; below it come the social links (X, LinkedIn, GitHub), a rule, and a quiet text nav of tabs: about, projects, writing, each with its own URL (`/about`, `/projects`, `/writing`). Switching tabs changes only the panel below the nav; the headline stays put. The home URL opens on about, the grey bio that carries the Bio revision. projects lists every Project, newest first, each leading to its Project page; writing is the Blog.
_Avoid_: Hero, landing nav, card deck, menu

**Category link**:
One of the three links set into the landing headline, one per Project category: a line-drawn 3D icon, followed by the category's name, leading to that category's Postcard gallery. On hover the icon doubles in size as a white card and the sentence makes room like a page round a picture (the rest of its line moves along, and the lines below stay put while it cuts through them, splitting a word between its letters where it lands), corner brackets spring out around it, its lines turn violet and it plays its own reveal, and a black bar wipes across the name. Leaving reverses it. Keyboard focus plays it the same way; on touch, pressing plays it and releasing follows the link. The icons: Interactive maps is a folded map that unfolds into a zigzag with contour lines flowing across it; Visual stories is a book that opens and lets five cubes rise out of it and melt into one another; Web tools is a browser window that narrows into a phone while its cards reflow.
_Avoid_: Button, pill, chip, card

**Bio revision**:
The about bio's self-correction, played on every arrival: its second sentence first reads plainly as a tool list ("I use d3.js, three.js…"); then a grey highlight and a strikethrough sweep across the list together in one left-to-right stroke (if the list wraps, the stroke runs on from line to line in reading order, like a pen crossing out part of one sentence), and "Claude Code, Codex & Jev across my toolkit…" is typed in after it, so the sentence now reads "I use Claude Code, Codex & Jev…". Styled like a suggested edit, but in grey only. Reduced motion shows the finished revision at once.
_Avoid_: Typo, draft, tracked change

**Postcard gallery**:
A Project category's page: every Project of that category scattered once as postcards on a bounded plane you drag around. One postcard can be opened (it flies to the centre) and flipped to its back; its Details link leads to the Project page (`/<category>/<project slug>`). Opening or flipping never changes the URL.
_Avoid_: Grid, wall, canvas

**Project category**:
One of the portfolio's canonical groupings: Interactive maps, Visual stories, or Web tools. Each has its own page (`/maps`, `/charts`, `/creative-code` — the URLs keep the earlier names Maps, Charts, Creative coding), reached from the landing page or the gallery's section switcher. The stored `value` never changes; `slug` is the URL form.
_Avoid_: Title tag, navigation item, filter, services

**Sketch**:
A hand-drawn rough.js decoration on the back of a postcard in the Postcard gallery, seeded from the Project's name so it is unique but stable.
_Avoid_: Doodle, icon
