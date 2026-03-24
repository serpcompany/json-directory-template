# Build Pipeline

This repo is now organized around a static-first site pipeline.

The goal is to take explicit build inputs, produce a deterministic static artifact, and deploy that artifact to a target repo without mixing in runtime product concerns.

## Current scope

In scope now:
- explicit build inputs via `BuildSpec`
- local staged operator inputs in `sites/<site-id>/`
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

The pipeline should work like a strict form submission:

1. the operator stages the required files and data
2. the operator generates or updates a `BuildSpec`
3. the pipeline validates the inputs
4. the pipeline builds one static artifact
5. the pipeline deploys that artifact to the configured target

If required inputs are missing, the pipeline should fail early and say exactly what is incomplete.

## Flow

### 1. Stage inputs

Local operator workspace:
- `sites/<site-id>/products.json` or `websites.json`
- `sites/<site-id>/logo.png`
- `sites/<site-id>/opengraph-image.png`
- `sites/<site-id>/favicon.ico`

This folder is gitignored and is not treated as source of truth by itself.

### 2. Generate or review `BuildSpec`

Command:

```bash
pnpm build-spec:init -- --site serpdownloaders
```

Active build contract:
- `sites/<site-id>/build-spec.json`

`BuildSpec` is the only trusted input contract for a run.

### 3. Validate

Command:

```bash
pnpm validate:site -- --spec sites/serpdownloaders/build-spec.json
```

Validation checks:
- required spec sections exist
- placeholder `TODO` values are gone
- referenced local files exist
- source JSON can be normalized into valid website entries

### 4. Build

Command:

```bash
pnpm build:site -- --spec sites/serpdownloaders/build-spec.json
```

Build behavior:
- loads the explicit `BuildSpec`
- derives the internal site/runtime config
- prepares `data/websites.json` for the active site
- generates site-aware side artifacts such as search index output
- stages supported brand assets into the app build when explicitly referenced
- runs the static export build
- writes the final artifact to `dist/sites/<site-id>`

### 5. Deploy

Command:

```bash
pnpm deploy:site -- --spec sites/serpdownloaders/build-spec.json
```

Deploy behavior:
- reads the deploy target from `BuildSpec`
- syncs the built artifact into the target repo
- preserves configured target-managed files such as `CNAME` and required Pages workflow files
- relies on the target repo’s Pages workflow to publish the final site

## Workflow behavior

The GitHub Actions path now resolves the build run before validate/build/deploy:

- if `BUILD_SPEC_PATH` is provided, the workflow uses the explicit `BuildSpec`
- otherwise it falls back to the compatibility `SITE_ID` path
- artifact upload/download now follows the resolved artifact directory instead of assuming a hardcoded site id path
- workflow concurrency is keyed by ref plus resolved site/spec input to reduce overlapping runs for the same target

This keeps workflow automation compatible with both:
- the newer explicit-spec operator flow
- the older checked-in compatibility path

## Design rules

We should treat hosted/auth/submission as a future extension path, not active scope.

The goal now is to keep the static pipeline clean enough that adding hosted features later is an additive layer, not a rewrite.

What that means in practice:
- keep `BuildSpec` focused on build/deploy inputs, not user-account concepts
- keep target repos static-only and dumb
- keep submit/auth flows out of the core pipeline
- avoid coupling build logic to databases, sessions, moderation state, or runtime APIs
- leave clear extension points:
  source adapters, deploy strategies, and content ownership boundaries

## Current extension points

These are the places where future growth should happen without changing the core static contract:

- source adapters
  local staged files today, other sources later
- deploy strategies
  `github-pages-repo-sync` today, other static/hosted targets later
- content ownership boundaries
  starter defaults vs site-owned content vs optional modules

## Current known follow-up work

- decide whether the workflow should ever accept only explicit `BuildSpec` input in the future, or keep the compatibility fallback
- decide the next deploy strategy after `github-pages-repo-sync`
- decide whether the compatibility `--site` path should eventually be retired or kept permanently

## Tooling recommendation

Recommended repo-to-repo workflow tooling:
- GitHub MCP / GitHub connector for issue, workflow, and target-repo inspection

Reason:
- it reduces manual repo state checking
- it makes workflow/debug inspection easier without mixing that logic into the build scripts

## Related docs

- [PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md)
- [IMPLEMENTATION_TRACKER.md](/Users/devin/dev/repos/json-directory-template/docs/IMPLEMENTATION_TRACKER.md)
- [build-spec.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/build-spec.md)
- [github-pages-static-export.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/github-pages-static-export.md)
