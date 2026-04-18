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
- [ ] Migrate the coupled content-loading layer using the app-load / package-query split.
- [ ] Consolidate remaining file-backed resource loading behind the same boundary.
- [ ] Create an `apps/serpdownloaders.com` wrapper.
- [ ] Repoint build/validate/deploy flows to the wrapper app without changing artifacts.
- [ ] Delete dead `apps/web/lib/*` shims after direct package imports settle.

Acceptance:

- [ ] `serpdownloaders.com` still ships correctly after extraction.

Status note:

- `packages/web-core` and `packages/site-contract` now own most of the low-coupling shared helper
  slices.
- The biggest remaining migration item is still `apps/web/lib/content-loader.ts` and adjacent
  file-backed content access.
- Full execution plan for the remaining wrapper migration now lives in:
  [docs/superpowers/plans/2026-04-18-wrapper-app-migration.md](/Users/devin/dev/repos/json-directory-template/docs/superpowers/plans/2026-04-18-wrapper-app-migration.md)

#### Subagent Queue

Use the following order for subagent execution. Each item is intentionally bounded and should be
handled as its own reviewable unit.

1. [x] Task 1: split `apps/web/lib/content-loader.ts` into app-owned loading and
       `packages/web-core/src/content-query.ts`
2. [ ] Task 2: consolidate `apps/web/lib/resources.ts` into the same content-loading boundary
3. [ ] Task 3: document thin-wrapper responsibilities in docs
4. [ ] Task 4: create `apps/serpdownloaders.com` thin wrapper skeleton
5. [ ] Task 5: repoint build/validate/deploy to the wrapper app
6. [ ] Task 6: remove dead `apps/web/lib/*` re-export shims
7. [ ] Task 7: run the final Phase 4 acceptance pass

Execution note:

- Tasks 4-6 should not begin until Task 1 verification is green across `/about`, docs, guides,
  legal, search, website detail, RSS, and active category routes.
- Use the exact task-specific verification commands from
  [docs/superpowers/plans/2026-04-18-wrapper-app-migration.md](/Users/devin/dev/repos/json-directory-template/docs/superpowers/plans/2026-04-18-wrapper-app-migration.md)
  instead of ad hoc checks.

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
