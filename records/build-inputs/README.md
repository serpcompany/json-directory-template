# Internal Generated Snapshots

`records/build-inputs/**` is internal generated snapshot space.

Do not edit files in this tree by hand.

Use it only for:

- captured build/debug inputs
- repeatable investigation snapshots
- temporary comparison material created by scripts

If a site needs new source data, edit the real source instead:

- `data/listings.json` for direct normalized listing sources
- `sites/<id>/products.json` for adapter-driven site inputs

Pull requests that edit `records/build-inputs/**` directly are intentionally blocked by PR intake rules.
