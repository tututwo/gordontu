# Portfolio

This context describes how Gordon's creative and technical work is presented to visitors.

## Language

**Project**:
A published piece of Gordon's creative or technical work, with a title, image, destination, tools, category, and date.
_Avoid_: Post, moment, photo

**Blob field**:
The landing page's background: three soft colour blobs (blue, salmon, yellow) that cruise slowly across the whole viewport behind the headline, bounce off its edges, and overlap like layered spray paint. One shader draws them; a drift simulation moves them.
_Avoid_: Bubbles, orbs, gradient background, lava lamp

**Landing nav**:
The landing page itself: the "Design + Code" headline over the Blob field, with a vertical list of links to each Project category and the Blog, the brand link (home) top-left, About top-right, and the colophon (location, status, contacts, version) along the bottom.
_Avoid_: Hero, card deck, menu

**Postcard gallery**:
A Project category's page: every Project of that category scattered once as postcards on a bounded plane you drag around. One postcard can be opened (it flies to the centre) and flipped to its back; its Details link leads to the Project page (`/<category>/<project slug>`). Opening or flipping never changes the URL.
_Avoid_: Grid, wall, canvas

**Project category**:
One of the portfolio's canonical groupings: Charts, Maps, or Creative coding. Each has its own page (`/charts`, `/maps`, `/creative-code`), reached from the Landing nav or the gallery's section switcher. The stored `value` never changes; `slug` is the URL form.
_Avoid_: Title tag, navigation item, filter

**Sketch**:
A hand-drawn rough.js decoration on the back of a postcard in the Postcard gallery, seeded from the Project's name so it is unique but stable.
_Avoid_: Doodle, icon
