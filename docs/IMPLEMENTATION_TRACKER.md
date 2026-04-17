# Active-Site Contract Implementation Tracker

This tracker turns the active-site contract plan into the execution queue for the next developer.

Plan source:

- [docs/PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md)

Key context:

- [README.md](/Users/devin/dev/repos/json-directory-template/README.md)
- [docs/BUILD_PIPELINE.md](/Users/devin/dev/repos/json-directory-template/docs/BUILD_PIPELINE.md)
- [docs/DEPLOY_RUNBOOK.md](/Users/devin/dev/repos/json-directory-template/docs/DEPLOY_RUNBOOK.md)
- [docs/SITE_CONFIG_INVENTORY.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_CONFIG_INVENTORY.md)
- [docs/knowledge/site-config.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/site-config.md)
- [docs/knowledge/github-pages-static-export.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/github-pages-static-export.md)

Reference architectures:

- `/Users/devin/dev/repos/openpanel`
- `/Users/devin/dev/repos/emd-monorepo`

## Current Truth

- [x] This repo is intended to be multisite.
- [x] `serpdownloaders.com` is the only site currently powering this repo.
- [x] `serp.co`, `extensions.serp.co`, and `serp.software` are removed from the active registry.
- [x] Active-vs-incubating site rules are documented and enforced.
- [ ] Thin wrapper apps plus a shared `packages/web-core` boundary are in place.

## Immediate Queue

### Phase 1. Active-Site Cleanup

- [x] Inventory every file that registers or assumes `serp.co`, `extensions.serp.co`, or
      `serp.software` as active.
- [x] Remove those sites from active exports and registries.
- [x] Remove inactive-site assumptions from shared category/config surfaces.
- [x] Verify `serpdownloaders.com` still validates, builds, and dry-run deploys cleanly.
- [x] Record any inactive-site files intentionally kept as reference material.

Acceptance:

- [x] Only `serpdownloaders.com` remains active in the runtime/build/deploy graph.

### Phase 2. Inactive-Site Parking

- [x] Choose the parking location for inactive/incubating sites.
- [x] Move or park inactive site files there.
- [x] Add doc language explaining inactive/incubating status.
- [x] Verify no active command path reads parked sites.

Acceptance:

- [x] Inactive sites are preserved without participating in active behavior.

### Phase 3. Registry Hardening

- [x] Add tests for active site exports and validation.
- [x] Add guards or tests for inactive site rejection/exclusion.
- [x] Update build/deploy docs with the active-site contract.

Acceptance:

- [x] Future speculative sites cannot become active accidentally.

### Phase 4. Wrapper-App Migration

- [x] Define the shared `packages/web-core` boundary.
- [ ] Define thin-wrapper responsibilities for `apps/<site>`.
- [ ] Migrate shared logic from `apps/web` into `packages/web-core`.
- [ ] Create an `apps/serpdownloaders.com` wrapper.
- [ ] Preserve artifact output and deploy behavior during the migration.

Acceptance:

- [ ] `serpdownloaders.com` still ships correctly after extraction.

Status note:

- An initial `packages/web-core` package now exists and owns the first shared runtime/build-facing
  helper slice. `apps/web/lib/*` compatibility shims and site-aware script imports were updated to
  start the extraction without changing the current `apps/web` app path.

### Phase 5. Site Promotion Contract

- [ ] Document the checklist for promoting a new site into the active registry.
- [ ] Require validation/build/deploy/docs/tests before promotion.

Acceptance:

- [ ] Adding site #2 becomes a deliberate promotion step instead of an ad hoc branch action.

## Verification Checklist

- [ ] `pnpm validate:site -- --site serpdownloaders.com`
- [ ] `pnpm build:site -- --site serpdownloaders.com`
- [ ] `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- [ ] active site registry tests pass
- [ ] inactive/unregistered site rejection tests pass

## Done Conditions

- [ ] The active registry contains only approved active sites.
- [ ] Inactive sites are preserved without affecting runtime/build/deploy.
- [ ] `serpdownloaders.com` remains healthy through the full pipeline.
- [ ] The repo has an explicit, documented path toward thin wrapper apps plus shared core runtime.
