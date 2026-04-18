# Active-Site Contract Implementation Tracker

This tracker turns the active-site contract plan into the execution queue for the next developer.

Plan source:

- [docs/PLAN.md](/Users/devin/dev/repos/json-directory-template/docs/PLAN.md)

Key context:

- [README.md](/Users/devin/dev/repos/json-directory-template/README.md)
- [docs/BUILD_PIPELINE.md](/Users/devin/dev/repos/json-directory-template/docs/BUILD_PIPELINE.md)
- [docs/DEPLOY_RUNBOOK.md](/Users/devin/dev/repos/json-directory-template/docs/DEPLOY_RUNBOOK.md)
- [docs/SITE_PROMOTION_CHECKLIST.md](/Users/devin/dev/repos/json-directory-template/docs/SITE_PROMOTION_CHECKLIST.md)
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
- [x] Thin wrapper apps plus a shared `packages/web-core` boundary are fully in place.

## Immediate Queue

### Phase 7. Apps Web Normalization

- [x] Record the new decision explicitly: active-site wrapper work is complete, and the remaining
      architecture work is normalizing `apps/web` into an intentional thin starter wrapper rather
      than a privileged implementation app.
- [x] Extract remaining starter-wide/public route surfaces out of `apps/web/components/**` into
      packages.
  Login/auth button, submit form/guidelines, and operator onboarding now live in `packages/web-core`,
  and the `apps/web` login/submit/operator routes import those package-owned surfaces directly.
- [x] Normalize the live tooling/defaults that still hardcoded or privileged `apps/web`.
  Root `pnpm dev` now follows the active-site wrapper flow instead of defaulting to the `web`
  package, hook/test orchestration now runs through generic app-level scripts rather than `cd apps/web`,
  and the starter `web` app defaults are now explicit single-sourced constants instead of duplicated
  magic strings.
- [ ] Delete dead compatibility shims in `apps/web/components/**` once their consumers import
      package-owned modules directly.

Acceptance:

- [ ] `apps/web` is an intentional thin starter wrapper rather than a privileged implementation app.
- [ ] Tooling/defaults/docs no longer hide hard dependencies on `apps/web`.

### Phase 6. Thin-Wrapper Completion

- [x] Correct the tracker/plan state so it matches the current repo shape.
- [x] Extract the shared root app shell out of `apps/web/app/layout.tsx` into `packages/web-core`.
- [x] Extract the homepage route implementation out of `apps/web/app/page.tsx` into `packages/web-core`.
- [x] Extract the remaining content-driven route modules out of `apps/web/app/**` into `packages/web-core`.
  Docs, guides, search, about, legal/news static pages, website detail, and favorites routes are
  package-owned, `apps/serpdownloaders.com` now imports those package modules directly for the
  active-site surfaces that ship today (`/`, `/about`, `/categories/**`, `/products/**`,
  `/legal/**`, `/search`, `/rss.xml`, `/robots.txt`, `/sitemap.xml`), and `apps/web/app/**` now
  imports package-owned modules directly for the shared content-driven routes instead of routing
  through app-local shim files. Remaining route debt is no longer in route ownership; it is the
  cleanup of legacy compatibility shims and any still-app-specific UI under `apps/web/components/**`.
- [x] Extract shared route-facing UI out of `apps/web/components/**` into `packages/web-core`.
  Shared layout/sidebar primitives, hero/animated background, newsletter/external-resources
  blocks, homepage list sections, creator-projects, featured-guides/search/category/search wrappers,
  guide-card, website-detail presentation stack, and the shared support primitives for empty-state,
  MDX rendering, project navigation, card/copy/favicon UI, listing-logo presentation, generic
  search helpers/filtering UI, `JsonLd`, favorites/list-control/card primitives, and the shared
  listing grid now live in `packages/web-core`, along with package-owned route wrappers for search
  results, the websites-list search/sort adapters, category/homepage list wrappers, and the shared
  website-detail route adapters, plus package-owned route wrappers for homepage list sections and
  guide/external-resources cards. Shared analytics helpers and the creator-projects route wrapper
  now also live in `packages/web-core`, the active wrapper's explicit local support graph in
  `apps/serpdownloaders.com/components/**` has been eliminated, and `apps/web/app/**` now imports
  those package-owned route/UI modules directly instead of routing through local compatibility
  wrappers, and the first batch of route-only compatibility shims has been deleted. Remaining
  `apps/web/components/**` debt is legacy shim cleanup for non-route consumers plus truly
  app-specific/operator UI.
- [x] Stop treating `apps/web` as the canonical implementation app for the active site.
- [x] Make `apps/serpdownloaders.com` own explicit thin route entrypoints that import package modules instead of `apps/web`.
- [x] Remove remaining build-source assumptions that still hardcode `apps/web` as the source app.
  `apps/serpdownloaders.com` now self-builds with local `next build`, `dev:site` starts the wrapper
  app through its own package script, `search-index-generator` writes into the selected wrapper
  app's `public/search` directory, and the active checked-in site points its `appOutDir` at
  `apps/serpdownloaders.com/out`.

Acceptance:

- [x] `apps/serpdownloaders.com` is the canonical active-site wrapper app.
- [x] `apps/web` is no longer the source implementation app for the active-site build.
- [x] Shared route logic and shared route-facing UI live in `packages/web-core`.
- [x] Active-site build/deploy no longer rely on `apps/web` as the canonical source app.

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
- [x] Define thin-wrapper responsibilities for `apps/<site>` and the ownership boundary for
      `packages/site-contract` and `sites/<site>`.
- [x] Migrate the coupled content-loading layer using the app-load / package-query split.
- [x] Consolidate remaining file-backed resource loading behind the same boundary.
- [x] Create an `apps/serpdownloaders.com` wrapper.
- [x] Repoint build/validate/deploy flows to the wrapper app without changing artifacts.
- [x] Delete dead `apps/web/lib/*` shims after direct package imports settle.

Acceptance:

- [x] `serpdownloaders.com` still ships correctly after extraction.

Phase 4 ownership model:

- `apps/<site>`
  - thin wrapper apps only
  - Next config, env wiring, generated content-collections entrypoints, and framework-specific runtime hooks
  - no reusable business logic
- `packages/web-core`
  - reusable runtime/query/render helpers
  - routes, site copy, SEO, schema generation, category/query helpers, and shared listing/runtime helpers
- `packages/site-contract`
  - checked-in site contract
  - checked-in site config/category/content resolution
  - onboarding helpers, source-path resolution, and trial product normalization
- `sites/<site>`
  - declarative checked-in site data/config/assets only
  - sparse per-site overrides and site-owned content/assets
  - no shared resolver logic

Status note:

- `packages/web-core` and `packages/site-contract` now own most of the low-coupling shared helper
  slices.
- `apps/serpdownloaders.com` now owns the active-site build/dev/typecheck entrypoint and the
  active route files that ship `serpdownloaders.com` today.
- The main remaining gap is package ownership cleanup: the active wrapper now resolves its own
  route-supporting modules explicitly, and the active wrapper support graph is now package-direct.
  The remaining repo-level gap is broader cleanup of legacy `apps/web` route-facing UI and any
  direct app-level imports there that should become package-owned or package-direct.
- Phase 4 wrapper extraction tasks are complete and verified through validate/build/deploy dry-run
  plus focused route and shim test suites.
- Full execution plan for the remaining wrapper migration now lives in:
  [docs/superpowers/plans/2026-04-18-wrapper-app-migration.md](/Users/devin/dev/repos/json-directory-template/docs/superpowers/plans/2026-04-18-wrapper-app-migration.md)

#### Subagent Queue

Use the following order for subagent execution. Each item is intentionally bounded and should be
handled as its own reviewable unit.

1. [x] Task 1: split `apps/web/lib/content-loader.ts` into app-owned loading and
       `packages/web-core/src/content-query.ts`
2. [x] Task 2: consolidate `apps/web/lib/resources.ts` into the same content-loading boundary
   No active callers remain; the file is documented in-place as inactive legacy code and should
   not be expanded further without a new task that reintroduces app-layer file-backed resources.
3. [x] Task 3: document thin-wrapper responsibilities plus explicit ownership for `packages/web-core`,
       `packages/site-contract`, and `sites/<site>` in docs
4. [x] Task 4: create `apps/serpdownloaders.com` thin wrapper skeleton
5. [x] Task 5: repoint build/validate/deploy to the wrapper app
6. [x] Task 6: remove dead `apps/web/lib/*` re-export shims
7. [x] Task 7: run the final Phase 4 acceptance pass

Execution note:

- Tasks 4-6 should not begin until Task 1 verification is green across `/about`, docs, guides,
  legal, search, website detail, RSS, and active category routes.
- Use the exact task-specific verification commands from
  [docs/superpowers/plans/2026-04-18-wrapper-app-migration.md](/Users/devin/dev/repos/json-directory-template/docs/superpowers/plans/2026-04-18-wrapper-app-migration.md)
  instead of ad hoc checks.

### Phase 5. Site Promotion Contract

- [x] Document the checklist for promoting a new site into the active registry.
- [x] Require validation/build/deploy/docs/tests before promotion.

Acceptance:

- [x] Adding site #2 becomes a deliberate promotion step instead of an ad hoc branch action.

## Verification Checklist

- [x] `pnpm validate:site -- --site serpdownloaders.com`
- [x] `pnpm build:site -- --site serpdownloaders.com`
- [x] `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- [x] active site registry tests pass
- [x] inactive/unregistered site rejection tests pass

## Done Conditions

- [x] The active registry contains only approved active sites.
- [x] Inactive sites are preserved without affecting runtime/build/deploy.
- [x] `serpdownloaders.com` remains healthy through the full pipeline.
- [x] The repo has an explicit, implemented path toward thin wrapper apps plus shared core runtime.
