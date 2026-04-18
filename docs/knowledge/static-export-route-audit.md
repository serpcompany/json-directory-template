# Static Export Route Audit

Historical note:

- This audit captures the static export surface at the time of the Pages cleanup work.
- Any `apps/web/**` references below should be treated as historical route/build snapshots.
- Use current build pipeline and wrapper docs for present-day ownership and output paths.

## What happened

The GitHub Pages POC proved the deploy flow, but it also exposed that the factory build was exporting too much of the original starter app into target repos.

The target repo was receiving:

- auth/account surfaces like `/account` and `/login`
- collection/app surfaces like `/favorites`, `/projects`, `/docs`, and `/guides`
- public sourcemaps
- exported debug text artifacts like `__next*.txt` and `index.txt`

Those routes were not being exposed because GitHub Pages rebuilt the app. They were being exposed because the factory repo exported them and then synced that artifact almost as-is.

## Important finding

The static placeholder copy for `/account` and related Pages-mode behavior was added in this repo during the Pages POC work. It is not something we can fix by simply restoring from this repo's `main` branch.

That means the cleanup has to happen in the factory build/export behavior.

## First classification pass

Default-off for static export:

- `/account`
- `/login`
- `/favorites`
- `/projects`
- `/docs`
- `/guides`

Still in the app build for now, but pruned from the final artifact unless explicitly enabled:

- auth/account routes
- favorites route
- projects route
- docs route
- guides route

Always removed from the public artifact:

- `*.map`
- `__next*.txt`
- `index.txt`
- `_not-found/`
- `404/`

## Why this approach

This is the smallest safe fix.

- It stops shipping obvious public noise immediately.
- It narrows the default static site surface without rewriting the theme.
- It preserves room for a deeper route-by-route upstream audit before restoring any route intentionally.

## Follow-up

We still need a deeper upstream comparison against `thedaviddias/llms-txt-hub` for the placeholder/demo routes. That audit should classify each route as:

- restore from upstream behavior
- keep as a static-safe optional route
- remove from default export entirely

## Upstream comparison

Checked against `thedaviddias/llms-txt-hub` `main` on March 24, 2026.

### Route classification

- `/account`
  remove from default export entirely
  Upstream `main` does not have `apps/web/app/account/page.tsx` at all. This is not an upstream route we are temporarily diverging from; it is local Pages-era placeholder behavior and should stay out of starter-safe static output unless a future hosted account model is intentionally restored.
- `/login`
  keep as a static-safe optional route
  Upstream still has a real authenticated login flow, but it is Clerk-based and runtime-auth dependent. The starter should keep login behind the existing feature flag and continue excluding it from default static artifacts.
- `/favorites`
  keep as a static-safe optional route
  Upstream has a real favorites page, so this is not just a local placeholder. The current starter version is a simplified/safer variant and should remain optional rather than default-on for exported static sites.
- `/projects`
  keep as a static-safe optional route
  Upstream has a real projects page driven by GitHub-topic discovery. Our current page is no longer a Pages placeholder problem; it is a generalized starter module and can remain optional/default-off in the static artifact.
- `/guides`
  keep as a static-safe optional route
  Upstream has a real guides index. The current generalized version should be treated as an optional editorial surface, not removed as fake placeholder content.
- `/docs`
  keep as a static-safe optional route
  Upstream has a real docs route, but it is tightly tied to the old `llmstxt-cli` product. The starter-safe path is to keep docs optional and site-owned rather than deleting the surface entirely.
- `/featured`
  restore from upstream behavior
  Upstream still treats featured listings as a first-class public route. This route is not part of the placeholder-route problem and should stay in the active app.

### Conclusion

The deeper upstream audit changes the interpretation of the static-export cleanup:

- `/account` is the only audited route in this bucket that clearly falls into "local placeholder/demo surface, remove from default export entirely".
- `/login`, `/favorites`, `/projects`, `/guides`, and `/docs` are real upstream product surfaces and should be treated as optional starter modules, not mistaken for temporary placeholder pages.
- `/featured` belongs with the active public directory surface, not the placeholder cleanup bucket.
