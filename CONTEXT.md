# Portfolio

This context describes how Gordon's creative and technical work is presented to visitors.

## Language

**Project**:
A published piece of Gordon's creative or technical work, with a title, image, destination, tools, category, and date.
_Avoid_: Post, moment, photo

**Blob field**:
The landing page's background: three soft colour blobs (blue, salmon, yellow) that cruise slowly across the whole viewport behind the headline and bounce off its edges. Their solid inner cores meet through soft spring-damper contacts (~100 ms response, damping ratio 0.6) while their feathered paint overlaps into a metaball-like neck. One shader draws them; a drift simulation moves them. While the scene is active, mouse, pen, and touch grab dense paint through a stiff, critically damped hold spring (~80 ms response) and throw it; the released kick fades on a 0.7-second time constant, retains 70% of its extra speed at an edge, and re-aims the ambient cruise; a held blob pushes free blobs it meets; a press that does not grab pokes nearby blobs away; one-finger pans stay with the Blob field while pinch zoom remains available; disposal removes the pointer listeners and cursor state; and reduced motion ignores all input.
_Avoid_: Bubbles, orbs, gradient background, lava lamp

**Landing nav**:
The landing page itself: the "Design + Code" headline over the Blob field, with links to each Project category and the Blog in a vertical list that compacts across short landscape viewports, the brand link (home) top-left, About top-right, and the colophon (location, status, contacts, version) along the bottom.
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
