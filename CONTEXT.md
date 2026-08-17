# Portfolio

This context describes how Gordon's creative and technical work is presented to visitors.

## Language

**Project**:
A published piece of Gordon's creative or technical work, with a title, image, destination, tools, category, and date.
_Avoid_: Post, moment, photo

**Card deck**:
The landing page's three flip cards, one per Project category. Dragging or flicking slides the deck and flips the cards; the centre card faces front and links to that category's page.
_Avoid_: Slider, hero carousel

**Project wall**:
A browsable collection of Projects, ordered from newest to oldest. Currently unused; the category pages use the Postcard gallery.
_Avoid_: Blog feed, gallery grid

**Postcard gallery**:
A Project category's page: every Project of that category scattered once as postcards on a bounded plane you drag around. One postcard can be opened (it flies to the centre) and flipped to its back; its Details link leads to the Project page (`/<category>/<project slug>`). Opening or flipping never changes the URL.
_Avoid_: Grid, wall, canvas

**Project category**:
One of the portfolio's canonical groupings: Charts, Maps, or Creative Code. Each has its own page (`/charts`, `/maps`, `/creative-code`), reached from the card deck or the gallery's section switcher. The stored `value` never changes; `slug` is the URL form.
_Avoid_: Title tag, navigation item, filter

**Sketch**:
A hand-drawn rough.js decoration (underlines, arrows, stars, frames) that gives the site its paper-and-ink look. The sketch vocabulary lives in one module; each Project's frames are seeded from its name so they are unique but stable.
_Avoid_: Doodle, icon
