# Website Data

`data/websites.json` is the active website-entry source for the current starter and multi-site build flow.

- Edit `data/websites.json` directly when updating the active website dataset.
- Validate changes with `pnpm tsx scripts/validate-data.ts data/websites.json`.
- Site-specific build flows may temporarily transform other JSON sources into this shape during build time, but the app itself reads this file format.

Legacy note:

- `packages/content/data/websites/**` still exists as legacy/reference content and migration material.
- It is no longer the primary source of truth for the active website directory build.
