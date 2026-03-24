# Static Export Route Audit

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
