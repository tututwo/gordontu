# gordontu

Portfolio: a landing with about, projects and writing tabs, and postcard galleries (one per category, plus all projects) where each project opens at its own URL. SvelteKit + three.js + GSAP.
`CONTEXT.md` has the vocabulary, `docs/adr/` the decisions.

```bash
npm install
npm run dev     # Vite dev server
npm run check   # svelte-check
npm run build
node src/lib/frameLoop.check.js && node src/lib/gallery/layout.check.js && node src/lib/gallery/pan.check.js && node src/lib/landingPage/spring.check.js
```
