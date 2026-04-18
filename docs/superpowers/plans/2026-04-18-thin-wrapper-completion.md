# Thin Wrapper Completion Plan

Historical note:

- This plan documents the thin-wrapper migration work as it was scoped at the time.
- It is now completed and preserved as implementation history.
- Use `docs/IMPLEMENTATION_TRACKER.md` and `docs/superpowers/plans/2026-04-18-apps-web-normalization.md`
  for the current post-migration state.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Execute each task as a bounded slice with a coder/reviewer loop before moving on.

**Goal:** Finish the refactor that turns `apps/*` into real thin wrappers over `packages/web-core` and `packages/site-contract`, with `apps/serpdownloaders.com` as the canonical active-site wrapper and `apps/web` no longer acting as the implementation source app.

## Current Reality

- `apps/serpdownloaders.com` now self-builds and owns the active-site route entrypoints that ship
  `serpdownloaders.com` today.
- `apps/web/app/**` still owns most route implementations.
- `apps/web/components/**` is no longer in the active wrapper resolution path, but there is still
  a sizeable app-local support graph under `apps/serpdownloaders.com/components/**` that should be
  reduced or promoted into `packages/web-core`.
- shared support primitives for empty-state, MDX rendering, project navigation, card/copy/favicon
  UI, and listing-logo presentation now live in `packages/web-core`.
- generic search helpers/filtering UI and `JsonLd` now also live in `packages/web-core`; the
  remaining search debt is mostly the route-facing search-results wrapper plus favorites/analytics
  coupling in the list stack.
- favorites/list-control primitives and the shared listing grid now also live in `packages/web-core`;
  the remaining list-stack debt is now mostly app-local analytics glue plus the section-level
  adapters that still sit above the package-owned list wrappers.
- category/homepage list wrappers and the shared website-detail route adapters now also live in
  `packages/web-core`; the remaining debt is concentrated in section-level wrappers that still
  inject app-local analytics or data glue.
- homepage list-section wrappers and guide/external-resource card wrappers now also live in
  `packages/web-core`; the remaining active-wrapper debt is mostly the creator-project analytics
  adapter plus the now-dead hero shim and shared analytics helpers.
- shared analytics helpers and the creator-projects route wrapper now also live in
  `packages/web-core`, so the active wrapper support graph is down to thin re-exports and small
  helper shims instead of route-owned UI logic.
- `apps/serpdownloaders.com/app/**` now imports package-owned modules directly for the active
  homepage, category, search, detail, about, and legal routes, and the wrapper-local
  `apps/serpdownloaders.com/components/**` shim tree has been removed entirely.
- `apps/web/app/**` now also imports package-owned modules directly for the shared content-driven
  routes instead of routing through local compatibility wrappers. The remaining `apps/web`
  cleanup is mostly legacy shim deletion for non-route consumers plus truly app-specific UI.
- active-site build/search-index/dev flows no longer target `apps/web`, but wrapper isolation is
  not complete until the copied support graph is reduced to package-owned exports plus a thin app
  shell.

## Task 1: Extract Shared Root Shell Into `packages/web-core`

**Intent:**

- Move the reusable root layout UI out of `apps/web/app/layout.tsx`.
- Keep wrapper apps responsible only for app-local loading/auth/runtime hooks and package entrypoint wiring.

**Files:**

- Create: package-owned root shell module(s) under `packages/web-core/src/`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/serpdownloaders.com/app/layout.tsx`
- Move or extract shared layout-facing UI from `apps/web/components/layout/**`, `apps/web/components/analytics/**`, `apps/web/components/ui/back-to-top.tsx`, and any other shared shell pieces used by layout

**Verification:**

- Run focused layout/component suites that cover header/footer/sidebar/auth shell behavior
- Run: `pnpm --filter serpdownloaders.com build`
- Run: `pnpm build:site -- --site serpdownloaders.com`

## Task 2: Extract Homepage Route Into `packages/web-core`

**Intent:**

- Move the shared homepage route implementation out of `apps/web/app/page.tsx`.
- Keep wrapper apps as entrypoint files only.

**Files:**

- Create: package-owned homepage route module(s) under `packages/web-core/src/`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/serpdownloaders.com/app/page.tsx`
- Move or extract any shared homepage data helpers and route-facing sections needed by the homepage

**Verification:**

- Run homepage-related test coverage if touched
- Run: `pnpm --filter serpdownloaders.com build`
- Run: `pnpm build:site -- --site serpdownloaders.com`

## Task 3: Extract Content-Driven Route Modules Into `packages/web-core`

**Intent:**

- Move shared content-driven routes out of `apps/web/app/**` into package-owned modules.
- Target about/docs/guides/search/categories/websites/projects/submit/legal/news routes first.

**Files:**

- Move shared route implementations from `apps/web/app/**` into `packages/web-core/src/`
- Keep `apps/web/app/**` and `apps/serpdownloaders.com/app/**` as thin wrapper entrypoints

**Verification:**

- Run: `pnpm --dir apps/web exec jest --runInBand lib/__tests__/content-loader.test.ts lib/__tests__/about-content.test.ts lib/__tests__/legal-content.test.ts lib/__tests__/schema-copy.test.ts 'app/(files)/rss.xml/route.test.ts'`
- Run: `pnpm --dir apps/web exec jest --runInBand 'app/docs/__tests__/page.test.tsx' 'app/docs/__tests__/doc-page.test.tsx' 'app/guides/__tests__/page.test.tsx' 'app/search/__tests__/page.test.tsx' 'app/websites/[slug]/__tests__/page.test.tsx' 'app/categories/[category]/__tests__/page.test.tsx'`
- Re-run direct-path Jest calls for bracketed route suites when needed
- Run: `pnpm build:site -- --site serpdownloaders.com`

## Task 4: Extract Shared Route-Facing UI Into `packages/web-core`

**Intent:**

- Move reusable route-facing UI out of `apps/web/components/**` so package-owned route modules do not depend on `apps/web`.

**Files:**

- Move shared components from `apps/web/components/**` into `packages/web-core/src/`
- Keep only truly app-specific/operator/auth-only UI in `apps/web`

**Verification:**

- Run focused Jest suites for touched component groups
- Run: `pnpm --filter serpdownloaders.com build`
- Run: `pnpm build:site -- --site serpdownloaders.com`

## Task 5: Flip Canonical Wrapper Ownership Away From `apps/web`

**Intent:**

- Make `apps/serpdownloaders.com` the canonical active-site wrapper app.
- Ensure wrapper route files import package modules directly, not `../../web/app/*`.

**Files:**

- Modify: `apps/serpdownloaders.com/app/**`
- Modify: `apps/web/app/**`
- Modify docs/trackers as needed

**Verification:**

- Run: `pnpm --filter serpdownloaders.com build`
- Confirm `apps/serpdownloaders.com/app/**` imports package-owned modules rather than `apps/web/app/**`

Status:

- Completed for the active-site surfaces that currently ship (`/`, `/about`, `/categories/**`,
  `/products/**`, `/legal/**`, `/search`, `/rss.xml`, `/robots.txt`, `/sitemap.xml`).
- Remaining follow-up is to collapse the copied support graph so these entrypoints depend on
  package-owned exports instead of a growing set of wrapper-local component copies.

## Task 6: Remove Remaining `apps/web` Build-Source Assumptions

**Intent:**

- Stop hardcoding `apps/web` as the active-site source app in the build pipeline.

**Files:**

- Modify: `scripts/build-site.ts`
- Modify: `scripts/site-config.ts`
- Modify: other build/deploy helpers if needed

**Verification:**

- Run: `pnpm validate:site -- --site serpdownloaders.com`
- Run: `pnpm build:site -- --site serpdownloaders.com`
- Run: `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- Compare artifact families in `dist/sites/serpdownloaders.com`:
  - `index.html`
  - `products/**`
  - `categories/**`
  - `rss.xml`
  - `sitemap-index.xml`
  - staged brand assets and search index output

Status:

- Completed for the active site. `sites/serpdownloaders.com/site-config.ts` now points `appOutDir`
  at `apps/serpdownloaders.com/out`, `search-index-generator` writes into the selected wrapper app,
  and `dev:site` starts the wrapper package rather than hardcoding `web`.

## Task 6a: Promote Active Wrapper Support Components Out Of The App Layer

**Intent:**

- Finish the isolation step that the self-building wrapper surfaced.
- Reduce the copied support graph in `apps/serpdownloaders.com/components/**` and move the reusable
  pieces into `packages/web-core` where they belong.

**Files:**

- Modify: `apps/serpdownloaders.com/tsconfig.json`
- Modify: `apps/serpdownloaders.com/components/**`
- Create: any missing local support shims needed for the active-site surfaces
- Modify: `packages/web-core/src/**` and exports where shared UI should become package-owned

**Verification:**

- Run: `pnpm --filter serpdownloaders.com typecheck`
- Run: `pnpm --filter serpdownloaders.com build`
- Run: `pnpm build:site -- --site serpdownloaders.com`
- Confirm wrapper support components have been either moved into `packages/web-core` or reduced to
  thin app-local adapters around package exports
- Confirm the active wrapper component graph no longer resolves through sibling-app imports or an
  `@/* -> ../web/*` alias fallback

## Task 7: Final Thin-Wrapper Acceptance Pass

**Intent:**

- Prove the repo now matches the actual thin-wrapper target rather than the partial wrapper state.

**Verification:**

- Run: `pnpm validate:site -- --site serpdownloaders.com`
- Run: `pnpm build:site -- --site serpdownloaders.com`
- Run: `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- Re-run the exact verification commands from:
  - Phase 4 Task 1
  - Phase 4 Task 5
  - Phase 4 Task 6
  - wrapper build command: `pnpm --filter serpdownloaders.com build`
- Confirm:
  - `apps/serpdownloaders.com` is the canonical thin wrapper app
  - `apps/web` is not the active-site source implementation app
  - shared route logic and shared route-facing UI live in `packages/web-core`
