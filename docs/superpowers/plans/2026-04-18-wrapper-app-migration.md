# Wrapper App Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the transition from `apps/web` as a mixed runtime/app layer into a thin wrapper app over `packages/web-core` and `packages/site-contract`, while keeping `serpdownloaders.com` build output stable.

**Architecture:** Keep the generated content-collections loading and Next-specific runtime hooks in the app layer, but move reusable shaping/query/runtime logic into packages. Treat `packages/site-contract` as the owner of checked-in site config/content/category contracts and `packages/web-core` as the owner of reusable rendering/runtime helpers. Delay any full `content-loader` move that breaks build-time routes; instead split it into app-owned loading and package-owned shaping/query logic.

**Tech Stack:** Next.js 16, TypeScript, pnpm workspaces, Jest, Vitest, static export build scripts.

---

## Current Baseline

- Active checked-in site resolution now lives in `packages/site-contract`.
- Many helper modules already moved into `packages/web-core`.
- `apps/web` still owns the coupled content-loading/runtime layer, especially `apps/web/lib/content-loader.ts`.
- `apps/web` is thinner than before, but not yet a true thin wrapper.

## Target End State

- `packages/site-contract`
  Owns checked-in site contract, onboarding, source-path resolution, trial product normalization, and checked-in site alias behavior.
- `packages/web-core`
  Owns reusable runtime logic: routes, SEO, schema generation, category/query logic, submission helpers, and content-query shaping.
- `apps/web`
  Owns Next-specific concerns only: generated content-collections loading, `notFound()` wrappers, auth wiring, and route/component rendering.
- `apps/serpdownloaders.com`
  Exists as the first thin wrapper app that wires the active site into the shared core without forking runtime logic.

## Task 1: Split Content Loader Into App Loading vs Package Query Logic

**Files:**
- Create: `packages/web-core/src/content-query.ts`
- Modify: `apps/web/lib/content-loader.ts`
- Test: `apps/web/lib/__tests__/content-loader.test.ts`
- Test: `apps/web/lib/__tests__/about-content.test.ts`
- Test: `apps/web/lib/__tests__/legal-content.test.ts`
- Test: `apps/web/lib/__tests__/schema-copy.test.ts`
- Test: `apps/web/app/(files)/rss.xml/route.test.ts`

**Intent:**
- Keep `require('@/.content-collections/generated')` and raw `data/listings.json` loading in `apps/web/lib/content-loader.ts`.
- Move pure shaping/query logic into `packages/web-core/src/content-query.ts`.
- `apps/web/lib/content-loader.ts` should become a thin adapter that loads raw inputs and passes them into package functions.

- [ ] Extract shared content/query types into `packages/web-core/src/content-query.ts`.
- [ ] Move reusable functions from `apps/web/lib/content-loader.ts` into `packages/web-core/src/content-query.ts`:
  - website list normalization/sorting
  - website detail lookup
  - previous/next listing resolution
  - related listing resolution
  - guide/doc/about shaping helpers
  - legal placeholder substitution helper
- [ ] Keep app-local loading only in `apps/web/lib/content-loader.ts`:
  - generated content-collections import
  - raw `data/listings.json` read
  - calls into package shaping/query helpers
- [ ] Preserve current exported app-facing API names:
  - `getWebsites`
  - `getWebsiteBySlug`
  - `getGuides`
  - `getGuideBySlug`
  - `getDocs`
  - `getDocBySlug`
  - `getAboutPage`
  - `getLegalContent`
- [ ] Re-run focused tests.

**Verification:**
- Run: `pnpm --dir apps/web exec jest --runInBand lib/__tests__/content-loader.test.ts lib/__tests__/about-content.test.ts lib/__tests__/legal-content.test.ts lib/__tests__/schema-copy.test.ts 'app/(files)/rss.xml/route.test.ts'`
- Run: `pnpm --dir apps/web exec jest --runInBand 'app/docs/__tests__/page.test.tsx' 'app/docs/__tests__/doc-page.test.tsx' 'app/guides/__tests__/page.test.tsx' 'app/search/__tests__/page.test.tsx' 'app/websites/[slug]/__tests__/page.test.tsx' 'app/categories/[category]/__tests__/page.test.tsx'`
- Run: `pnpm build:site -- --site serpdownloaders.com`
- Expected:
  - tests pass
  - build succeeds
  - built `/about` route still contains real about-page content, not a 404 shell
  - docs, guides, legal, search, and website-detail route tests still pass
  - static params and detail-page route behavior remain unchanged for the active site

## Task 2: Consolidate Remaining File-Backed Resource Loader

**Files:**
- Modify: `apps/web/lib/resources.ts`
- Modify: `packages/web-core/src/content-query.ts`
- Test: add or update resource loader coverage if needed

**Intent:**
- Remove duplicate file-backed content access logic from `apps/web/lib/resources.ts`.
- Either make `resources.ts` call into package-owned query helpers or inline it into the new content-query boundary if still used.

- [ ] Check whether `apps/web/lib/resources.ts` is still referenced by active code.
- [ ] If active:
  - move its shaping/validation logic into `packages/web-core/src/content-query.ts`
  - keep only path/loading entry code in the app layer
- [ ] If inactive:
  - document it as inactive and avoid expanding it further

**Verification:**
- If `apps/web/lib/resources.ts` still has active callers:
  - stop and update this plan with the exact active-caller test suite list before proceeding
- If it has no active callers:
  - run: `rg -n "from '@/lib/resources'|from \"@/lib/resources\"" apps/web --glob '!**/_archive/**'`
  - expected: no active imports
- Run: `pnpm build:site -- --site serpdownloaders.com`

## Task 3: Define Thin Wrapper Responsibilities Explicitly

**Files:**
- Modify: `docs/PLAN.md`
- Modify: `docs/IMPLEMENTATION_TRACKER.md`
- Modify: `docs/knowledge/site-config.md`

**Intent:**
- Make wrapper responsibilities explicit before creating `apps/serpdownloaders.com`.
- Prevent the first wrapper app from becoming another full app fork.

- [ ] Document `apps/<site>` ownership:
  - generated collection loading entrypoints
  - Next config / env / route bindings
  - zero reusable business logic
- [ ] Document `packages/web-core` ownership:
  - reusable runtime/query/render helpers
- [ ] Document `packages/site-contract` ownership:
  - checked-in site contract and source-path resolution

**Verification:**
- Docs should describe one unambiguous ownership model for:
  - `apps/<site>`
  - `packages/web-core`
  - `packages/site-contract`
  - `sites/<site>`

## Task 4: Create `apps/serpdownloaders.com` Thin Wrapper Skeleton

**Files:**
- Create: `apps/serpdownloaders.com/package.json` with package name `serpdownloaders.com`
- Create: `apps/serpdownloaders.com/next.config.ts`
- Create: `apps/serpdownloaders.com/tsconfig.json`
- Create exactly these app entry files for the first thin wrapper:
  - `apps/serpdownloaders.com/app/layout.tsx`
  - `apps/serpdownloaders.com/app/page.tsx`
  - `apps/serpdownloaders.com/app/[...route]/page.tsx` only if the chosen wrapper shape uses a catch-all handoff
- Modify: workspace/package scripts only as needed

**Intent:**
- Introduce the first site-specific wrapper app without moving all behavior at once.
- Keep `apps/web` temporarily as the canonical implementation while the wrapper proves the shape.

- [ ] Create the wrapper app directory and manifest.
- [ ] Use `apps/web` as the reference for the minimum runtime contract the wrapper must satisfy:
  - Next config
  - package manifest
  - TypeScript config
  - exactly the entry files listed above
- [ ] Re-export or reuse shared app/runtime entrypoints rather than copying business logic.
- [ ] Keep the wrapper app intentionally minimal.
- [ ] Do not fork content/query/helper logic into the wrapper.

**Verification:**
- Run the wrapper app’s local build command explicitly:
  - `pnpm --filter serpdownloaders.com build`
- Confirm it resolves the same checked-in site config for `serpdownloaders.com`.

## Task 5: Repoint Build Pipeline To Wrapper App

**Files:**
- Modify: `scripts/build-site.ts`
- Modify: `scripts/validate-site.ts`
- Modify: `scripts/deploy-site.ts` if needed
- Modify: docs/runbooks if command behavior changes
- Test: relevant build/validation tests

**Intent:**
- Make the build/validate pipeline target the wrapper app for `serpdownloaders.com` instead of the old shared app path.
- Preserve artifact parity in `dist/sites/serpdownloaders.com`.

- [ ] Add explicit app-target selection to site build resolution.
- [ ] Point `serpdownloaders.com` to `apps/serpdownloaders.com`.
- [ ] Keep output artifacts and public route behavior unchanged.

**Verification:**
- Run: `pnpm validate:site -- --site serpdownloaders.com`
- Run: `pnpm build:site -- --site serpdownloaders.com`
- Compare resulting artifact structure against the current baseline for:
  - `dist/sites/serpdownloaders.com/index.html`
  - `dist/sites/serpdownloaders.com/products/**`
  - `dist/sites/serpdownloaders.com/categories/**`
  - `dist/sites/serpdownloaders.com/rss.xml`
  - `dist/sites/serpdownloaders.com/sitemap-index.xml`
  - staged brand assets and search index output
- Expected:
  - same public route shape
  - same artifact file families
  - no missing listing detail pages

## Task 6: Remove Dead Wrapper Shims And Freeze `apps/web` As Legacy Shared App

**Files:**
- Modify or delete: trivial `apps/web/lib/*` re-export shims once app imports are direct
- Modify: docs/trackers

**Intent:**
- Reduce the leftover app-local shim clutter after wrapper apps and direct package imports are in place.
- Keep only truly app-specific adapters in `apps/web`.

- [ ] Identify zero-logic re-export shims that are no longer needed.
- [ ] Delete or collapse them once callers import package modules directly.
- [ ] Keep Next-only wrappers where required (`notFound()`, auth runtime, generated collection loading).

**Verification:**
- Run focused Jest suites for changed imports:
  - `pnpm --dir apps/web exec jest --runInBand lib/__tests__/site-config.test.ts lib/__tests__/categories.test.ts lib/__tests__/seo-config.test.ts lib/__tests__/schema-copy.test.ts lib/__tests__/root-listing-aliases.test.ts`
- Run: `pnpm build:site -- --site serpdownloaders.com`

## Task 7: Final Wrapper-App Acceptance Pass

**Files:**
- No single file owner; use this as integration verification

**Intent:**
- Prove the repo now matches the target architecture closely enough to call Phase 4 substantially complete.

- [ ] Confirm `packages/site-contract` owns checked-in site contract resolution.
- [ ] Confirm `packages/web-core` owns reusable runtime/query/render helpers.
- [ ] Confirm `apps/serpdownloaders.com` is thin.
- [ ] Confirm `apps/web` is no longer the only runtime owner.
- [ ] Confirm `serpdownloaders.com` still ships correctly.

**Verification:**
- Run: `pnpm validate:site -- --site serpdownloaders.com`
- Run: `pnpm build:site -- --site serpdownloaders.com`
- Run: `pnpm deploy:site -- --site serpdownloaders.com --dry-run`
- Re-run the exact verification commands from:
  - Task 1
  - Task 5
  - Task 6
  - plus the wrapper app build command from Task 4

## Notes For Subagent Dispatch

- Dispatch one task at a time.
- Treat Task 1 as the current critical path.
- Do not start Task 4 or Task 5 until Task 1 and Task 3 are complete.
- Treat any full `content-loader` extraction that breaks `/about`, docs, guides, or legal content as a failed attempt; revert to the app-load/package-query split instead.
- Preserve route and artifact behavior above all else.
