# Active-Site Contract And Multisite Wrapper Migration Plan

## Goal

Move this repo onto a disciplined multisite path without keeping speculative sites in the active
runtime/build/deploy graph.

The immediate objective is:

- keep the repo aligned to a multisite architecture
- treat `serpdownloaders.com` as the only active checked-in site right now
- remove `serp.co`, `extensions.serp.co`, and `serp.software` from the active registry until they
  are explicitly promoted
- create a clean path toward thin wrapper apps plus a shared `packages/web-core` style runtime

Execution tracking lives in
[docs/IMPLEMENTATION_TRACKER.md](/Users/devin/dev/repos/json-directory-template/docs/IMPLEMENTATION_TRACKER.md).

## Current Truth

- This repo is supposed to become a multisite repo.
- The only site currently powering the repo is `serpdownloaders.com`.
- The codebase already has partial multisite plumbing:
  checked-in site config under `sites/**`, site-aware build/deploy scripts, and
  `dist/sites/<site-id>` artifacts.
- The current problem is not the multisite direction itself. The problem is that inactive or
  incubating sites have been allowed into the active graph too early, which creates shared-file
  churn, branch noise, and cleanup work.

## Locked Decisions

- Keep the repo on a multisite trajectory.
- Do not keep speculative or not-yet-approved sites in the active site registry.
- Distinguish explicitly between:
  - active sites: wired into runtime/build/deploy/validation
  - incubating sites: kept as reference material or parked work, but not active
- Keep `serpdownloaders.com` as the sole active checked-in site until another site is intentionally
  promoted.
- Do not treat generated compatibility outputs such as `data/listings.json` as the source of truth
  for inactive sites.
- Finish the active-site cleanup before doing the larger wrapper-app extraction.

## Read First

- [README.md](/Users/devin/dev/repos/json-directory-template/README.md)
  - current repo contract, source-of-truth summary, and core commands
- [docs/BUILD_PIPELINE.md](/Users/devin/dev/repos/json-directory-template/docs/BUILD_PIPELINE.md)
  - current site-aware validate/build/deploy contract
- [docs/DEPLOY_RUNBOOK.md](/Users/devin/dev/repos/json-directory-template/docs/DEPLOY_RUNBOOK.md)
  - deploy expectations and target Pages repo sync behavior
- [docs/SITE_CONFIG_INVENTORY.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_CONFIG_INVENTORY.md)
  - current checked-in site inventory and assumptions
- [docs/knowledge/site-config.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/site-config.md)
  - site config ownership, boundaries, and terminology
- [docs/knowledge/github-pages-static-export.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/github-pages-static-export.md)
  - static export constraints, especially around route behavior and deploy artifacts

Structural reference repos:

- `/Users/devin/dev/repos/openpanel`
- `/Users/devin/dev/repos/emd-monorepo`

Use them only as architectural references for the target wrapper-app shape. They are not a source
of truth for this repo’s current implementation details.

## Phase Order

### Phase 1. Active-Site Contract Cleanup

- inventory every file that currently registers or assumes `serp.co`, `extensions.serp.co`, or
  `serp.software` as active
- remove those sites from active exports, registries, validation, and default build/deploy paths
- keep `serpdownloaders.com` validating, building, and deploying cleanly through the existing
  pipeline

Acceptance:

- `serpdownloaders.com` is the only active site in the runtime/build/deploy graph
- no shared file still implies the inactive sites are active

### Phase 2. Inactive-Site Isolation

- decide where inactive/incubating sites should live:
  `_archive/`, an incubation area, or a dedicated parking branch
- move or park inactive site assets/config/content there without deleting useful reference material
- document the difference between “inactive/incubating” and “active”

Acceptance:

- inactive sites remain available as reference material
- inactive sites do not affect runtime, build, validation, or deploy behavior

### Phase 3. Active-Registry Hardening

- add tests that assert only active sites are exported and validated
- make active commands fail cleanly or refuse unsupported site ids where appropriate
- update docs so “active site” has a precise meaning and promotion rules are explicit

Acceptance:

- future speculative sites cannot silently become active just by adding folders

### Phase 4. Wrapper-App Migration

- define the target repo shape:
  - `apps/<site>` thin wrappers
    - Next config, env wiring, generated content-collections entrypoints, and other framework hooks
    - no reusable business logic
  - `packages/site-contract` checked-in site contract, source-path resolution, and site-owned config/content/category resolution
    - checked-in site resolution and sparse per-site normalization
    - onboarding helpers and source-path ownership
  - `packages/web-core` shared rendering/runtime/build-facing logic
    - reusable runtime/query/render helpers that can be shared across site apps
  - `sites/<site>` site-owned config/content/assets
    - declarative per-site data, sparse overrides, and site-owned assets only
    - no shared runtime or resolver logic
  - `dist/sites/<site>` build artifacts
- extract shared logic from `apps/web` into `packages/web-core`
- keep `serpdownloaders.com` behavior stable during the extraction

Execution detail:

- the current subagent-ready execution plan for this phase lives in
  [docs/superpowers/plans/2026-04-18-wrapper-app-migration.md](/Users/devin/dev/repos/json-directory-template/docs/superpowers/plans/2026-04-18-wrapper-app-migration.md)
- the critical path is the `content-loader` split:
  - keep generated collection loading in the app layer
  - move reusable content shaping/query logic into `packages/web-core`
- the ownership model for this phase is:
  - `apps/<site>` = thin wrapper app only
  - `packages/web-core` = reusable runtime/query/render helpers
  - `packages/site-contract` = checked-in site contract and source-path resolution
  - `sites/<site>` = declarative per-site config/content/assets only
- wrapper app creation and build-pipeline retargeting should wait until that split is stable

Acceptance:

- `serpdownloaders.com` still validates, builds, and deploys during and after extraction
- wrapper apps stay thin and site-specific rather than becoming full forks

### Phase 5. Site Promotion Contract

- document the exact requirements before a second site can become active:
  - approved deploy target
  - checked-in site config and owned content
  - validation/build/deploy coverage
  - docs/runbook updates
  - tests
- use
  [docs/SITE_PROMOTION_CHECKLIST.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_PROMOTION_CHECKLIST.md)
  as the operational gate for site promotion

Acceptance:

- promoting site #2 is a deliberate operational step, not an accidental codebase side effect

## Important Implementation Areas

The implementation should expect to touch these kinds of surfaces:

- active site registry and checked-in site exports:
  `sites/index.ts`, `sites/categories.ts`, `sites/**/site-config.ts`
- shared app config and site adaptation:
  `apps/web/lib/site-config.ts`, `apps/web/lib/categories.ts`,
  `apps/web/lib/category-navigation.ts`
- build/validation/deploy entrypoints:
  `scripts/validate-site.ts`, `scripts/validate-active-sites.ts`,
  `scripts/build-site.ts`, `scripts/deploy-site.ts`
- planning and runbook docs:
  `docs/PLAN.md`, `docs/IMPLEMENTATION_TRACKER.md`, and likely
  [docs/BUILD_PIPELINE.md](/Users/devin/dev/repos/json-directory-template/docs/BUILD_PIPELINE.md)
  plus
  [docs/knowledge/site-config.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/site-config.md)

Do not treat this as a file-by-file mandate. Use it as a decision-complete guide to the likely
edit zones.

## Test And Verification Expectations

The implementation pass should verify at least:

- active site registry behavior
  - only active sites are exported and validated
  - inactive sites do not participate in active resolution paths
- `serpdownloaders.com` pipeline health
  - `pnpm validate:site -- --site serpdownloaders.com`
  - `pnpm build:site -- --site serpdownloaders.com`
  - `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- negative behavior
  - inactive/unregistered sites fail cleanly or are explicitly excluded
- migration safety
  - wrapper extraction does not change `serpdownloaders.com` route or artifact behavior

## Assumptions

- The repo should stay multisite, not revert to a single-site product shape.
- `serpdownloaders.com` is the only active site right now.
- `serp.co`, `extensions.serp.co`, and `serp.software` should be treated as inactive/incubating
  immediately.
- The wrapper-app / `packages/web-core` migration is a follow-on implementation phase, not the
  first cleanup step.
