# Each Live piece is its own Worker, routed under its Project's URL

A Live piece is served at `gordontu.com/<category>/<slug>/live/` by a Cloudflare Worker of its own, built and deployed from the piece's own repository; a Route `gordontu.com/<category>/<slug>/live*` sends it those requests, and every other path stays with the `gordontu` Worker. The Worker has only static assets and no script. Workers look an asset up by the full request path, and a Route doesn't strip its prefix, so each piece builds with that path as both its Vite `base` and its output directory (`dist/<category>/<slug>/live/`). That way no script runs and no request is counted.

Considered: proxying `/…/live/*` from the main Worker to each `*.vercel.app`. Every request for a three.js page's scripts, textures and models would run, and count against, the main Worker; Vercel would still serve the bytes; and each request would take one more hop.

Consequences: the path is written in four places, the piece's `base`, its output directory, its Route, and `projectLink` in `project.js`. Renaming a Project or changing its category therefore means rebuilding its piece, moving the Route and redirecting the old URL. The piece's old `*.vercel.app` stays up only to redirect (`vercel.json`, `"source": "/(.*)"`, since `/:path*` misses the bare root). Steps and per-piece notes are in `docs/cloudflare-plan.md`.
