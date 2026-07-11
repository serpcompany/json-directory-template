# Payload and D1 Source Adapter

This repo keeps public directory sites static. Payload CMS and D1 are introduced as a
control-plane and build-time source boundary, not as runtime reads from public routes.

## Implemented Boundary

- `listing-json` and `trial-products-json` remain supported source kinds.
- `d1-listings` is a build-time source kind that reads either an approved D1 snapshot
  export or local Wrangler D1 and materializes the existing `data/listings.json` shape.
- Public apps continue to load generated listing JSON and keep static export behavior.
- Logo normalization and sync utilities only support file-backed listing sources.

## D1 Mirror

The public D1 mirror is represented by `d1/migrations/0001_public_listings.sql`.
Rows are site-scoped and slug-scoped. Only records with `status = 'approved'` are
eligible for public builds by default.

For local D1-backed development:

- `pnpm d1:local:migrate` applies checked-in D1 migrations to `.wrangler/state`.
- `pnpm d1:local:seed -- --site <site>` imports approved records into local D1.
- A site with `content.listingSource.mode = 'local-d1'` queries local D1 during
  `prepare:site`, `validate:site`, and `build:site`.

`pnpm d1:snapshot -- --site <site>` converts the current configured source into D1
mirror records without writing a database. Passing `--output <path>` writes a snapshot
file that a snapshot-mode `d1-listings` source can read.

## Payload CMS

The Payblocks/Payload app is not scaffolded here because the Payblocks source is not
present in the local ShadcnBlocks checkout. Once the private Payblocks source is
available, add it as a separate CMS app and sync approved Payload listing records into
the D1 mirror or snapshot boundary.

Do not wire public static routes directly to Payload or D1 without a new architecture
decision.
