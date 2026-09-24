# Portfolio

This context describes how Gordon's creative and technical work is presented to visitors.

## Language

**Project**:
A published piece of Gordon's creative or technical work, with a title, image, destination, tools, category, and date.
_Avoid_: Post, moment, photo

**Landing**:
The home page: a short introduction on plain white. A bold headline ("I'm Gordon", his avatar, then what he makes) names the three Project categories as Category links; a grey bio below it carries the Bio revision; then the social links (X, LinkedIn, GitHub) and a quiet text nav (about, projects, writing). "writing" is the Blog; "projects" has no destination yet.
_Avoid_: Hero, landing nav, card deck, menu

**Category link**:
One of the three links set into the landing headline, one per Project category: a line-drawn 3D icon, followed by the category's name, leading to that category's Postcard gallery. On hover the icon doubles in size as a white card and the sentence makes room like a page round a picture (the rest of its line moves along, and the lines below stay put while it cuts through them, splitting a word between its letters where it lands), corner brackets spring out around it, its lines turn violet and it plays its own reveal, and a black bar wipes across the name. Leaving reverses it. Keyboard focus plays it the same way; on touch, pressing plays it and releasing follows the link. The icons: Interactive maps is a folded map that unfolds into a zigzag with contour lines flowing across it; Visual stories is a book that opens and lets five cubes rise out of it and melt into one another; Web tools is a browser window that narrows into a phone while its cards reflow.
_Avoid_: Button, pill, chip, card

**Bio revision**:
The landing bio's self-correction, played on every arrival: the bio first reads plainly with the tool-list sentence ("I use d3.js, three.js…") and no closing sentence; then a grey strikethrough and grey highlight sweep across the tool list, and "I use AI across my toolkit…" is typed in after it. Styled like a suggested edit, but in grey only. Reduced motion shows the finished revision at once.
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
