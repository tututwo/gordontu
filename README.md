# gordontu

Portfolio: a landing with about, projects and writing tabs, and postcard galleries (one per category, plus all projects) where each project opens at its own URL. SvelteKit + three.js + GSAP.
`CONTEXT.md` has the vocabulary, `docs/adr/` the decisions.

```bash
npm install
npm run dev     # Vite dev server
npm run check   # svelte-check
npm run build
node --test 'src/**/*.check.js'
node scripts/garden-sprites.mjs   # the Garden's sprites, after changing a species drawing
```

Pushing to `main` deploys to Cloudflare Workers through Workers Builds; `docs/cloudflare-plan.md` records the setup.
