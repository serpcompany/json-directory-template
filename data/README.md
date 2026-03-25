# Listing Data

`data/listings.json` is the active normalized listing dataset for the current starter and multi-site build flow.

- Edit `data/listings.json` directly only when that site uses `content.listingSource.kind = "listing-json"`.
- Validate changes with `pnpm validate:listings data/listings.json`.
- Site-specific build flows may temporarily transform other JSON sources into this shape during build time, but the app itself reads this file format.
- This file is for the main listing collection only. It is not the source of truth for docs, posts, legal pages, or future first-party `/tools`.
- See [listing-data-contract.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/listing-data-contract.md) for the maintainer-facing contract and examples.
- Check [sites/README.md](/Users/devin/dev/repos/json-directory-template/sites/README.md) and the relevant `sites/<id>/README.md` before editing if you are unsure which file is the real source for a given site.

Legacy note:

- `packages/content/data/websites/**` still exists as legacy/reference content and migration material.
- It is no longer the primary source of truth for the active website directory build.
