# Build Pipeline

This repo is organized around a static-first site pipeline.

The goal is to take checked-in site config plus site-owned assets and data, produce a deterministic static artifact, and deploy that artifact to a target repo without mixing in runtime product concerns.

## Current scope

In scope now:

- checked-in site config via `sites/site-config.default.ts` and `sites/<site-id>/site-config.ts`
- checked-in canonical site assets in `sites/<site-id>/assets/*`
- validate -> build -> deploy for one site per run
- static export output for GitHub Pages
- repo-to-repo deploy sync with preserve rules

Out of scope for the active pipeline:

- hosted auth
- user accounts
- runtime submissions
- moderation state
- databases
- session-aware build behavior

Those are future extension paths, not current build responsibilities.

## Mental model

The pipeline works from one canonical checked-in config model:

1. the repo defines the full starter config in `sites/site-config.default.ts`
2. each site defines its own sparse checked-in override in `sites/<site-id>/site-config.ts`
3. the pipeline validates the resolved site config and source data
4. the pipeline builds one static artifact
5. the pipeline deploys that artifact to the configured target

If required inputs are missing, the pipeline should fail early and say exactly what is incomplete.

## Flow

### 1. Define the site

Canonical checked-in files:

- `sites/site-config.default.ts`
- `sites/<site-id>/site-config.ts`

Authoring rule:

- add new fields to the default config once
- keep per-site config files override-only
- inherit unchanged values through the central resolver instead of copying the full config into every site file
- `sites/<site-id>/products.json` or `listings.json`
- `sites/<site-id>/assets/logo.png`
- `sites/<site-id>/assets/opengraph-image.png`
- `sites/<site-id>/assets/favicon.ico`

Optional temporary intake can live under `tmp/sites/<site-id>/`, but that is scratch space only, not source of truth.

### 2. Validate

```bash
pnpm validate:site -- --site your-site-id
```

Validation checks:

- the checked-in site config resolves cleanly against the default config
- referenced local files exist
- referenced remote brand assets can be staged into the expected local asset shape before build
- source JSON can be normalized into valid listing entries

### 3. Build

```bash
pnpm build:site -- --site your-site-id
```

Build behavior:

- loads `sites/site-config.default.ts`
- loads `sites/<site-id>/site-config.ts`
- resolves the final site/runtime config
- prepares `data/listings.json` for the active site
- generates site-aware side artifacts such as search index output
- stages supported brand assets into the app build when configured
- if a configured brand asset uses `source: 'url'`, the pipeline downloads it once into the deterministic `sites/<site-id>/assets/*` staging path, validates the file shape, and then builds from that staged local copy
- if that staged local file already exists and is non-empty, the pipeline reuses it intentionally instead of redownloading the remote asset
- runs the static export build
- writes the final artifact to `dist/sites/<site-id>`

Current supported staged asset shapes:

- favicon -> `sites/<site-id>/assets/favicon.ico`
- logo -> `sites/<site-id>/assets/logo.png`
- Open Graph image -> `sites/<site-id>/assets/opengraph-image.png`

Failure behavior:

- fail early if the remote fetch fails
- fail early if the downloaded asset is empty
- fail early if the asset does not match the expected file constraints for the staged target
- never ship a runtime hotlink to the remote asset in the final built site

### 4. Deploy

```bash
pnpm deploy:site -- --site your-site-id
```

Deploy behavior:

- reads the deploy target from the checked-in site config
- syncs the built artifact into the target repo
- preserves configured target-managed files such as `CNAME` and required Pages workflow files
- relies on the target repo’s Pages workflow to publish the final site

## Workflow behavior

The GitHub Actions path resolves the build run before validate/build/deploy:

- `site_id` selects the checked-in site config
- artifact upload/download follows the resolved artifact directory instead of assuming a hardcoded path
- workflow concurrency is keyed by ref plus site id to reduce overlapping runs for the same target

## Design rules

We should treat hosted/auth/submission as a future extension path, not active scope.

The goal now is to keep the static pipeline clean enough that adding hosted features later is an additive layer, not a rewrite.

What that means in practice:

- keep checked-in site config focused on build/deploy/site inputs, not user-account concepts
- keep target repos static-only and dumb
- keep submit/auth flows out of the core pipeline
- avoid coupling build logic to databases, sessions, moderation state, or runtime APIs
- leave clear extension points:
  source adapters, deploy strategies, and content ownership boundaries

## Current extension points

- source adapters
  checked-in local files today, other sources later
- deploy strategies
  `github-pages-repo-sync` today, other static/hosted targets later
- content ownership boundaries
  starter defaults vs site-owned content vs optional modules

## Current known follow-up work

- decide the next deploy strategy after `github-pages-repo-sync`
- finish washing out older naming and hardcoded copy so more site-facing surfaces are resolved from checked-in site config or site-owned content

## Related docs

- [PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md)
- [IMPLEMENTATION_TRACKER.md](/Users/devin/dev/repos/json-directory-template/docs/IMPLEMENTATION_TRACKER.md)
- [SITE_CONFIG_INVENTORY.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_CONFIG_INVENTORY.md)
- [github-pages-static-export.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/github-pages-static-export.md)
- [hosted-submission-extension-path.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/hosted-submission-extension-path.md)
- [large-site-scale-strategy.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/large-site-scale-strategy.md)
