# Build Optimization Plan

## Summary

`serp.co` is slow to rebuild because the site has thousands of product pages and the current static build was generating duplicate product detail routes:

- Canonical route: `/products/[slug]/reviews/`
- Redundant route: `/products/[slug]/`

Before phase 1, Next generated both routes for all 3,206 products, then `scripts/build-site.ts` pruned the unsuffixed route from the final artifact. That meant local build time and raw export size paid for pages that were never deployed.

Phase 1 was tested locally only. No production deploy, target repository sync, `pnpm deploy`, or `pnpm deploy:site` was run. The measured timing is useful for relative comparison, but should be treated as provisional until rerun under the repo-supported Node runtime.

## Phase 1: Stop Double-Building Detail Pages

Implementation:

- Move the real product detail page implementation into `apps/serp.co/lib/product-detail-route.tsx`.
- Keep `/products/[slug]/reviews/page.tsx` as the only generated product detail route.
- Remove `/products/[slug]/page.tsx` so Next no longer tries to export unsuffixed product detail pages.
- Keep route helpers and public canonical links pointed at `/products/[slug]/reviews/`.

Important implementation note: an attempted parent route with `generateStaticParams()` returning `[]` did not work with `output: export`; Next still rejected `/products/[slug]`. Removing the unsuffixed `page.tsx` route is the compatible fix because the `[slug]` segment can still host the nested `reviews` page.

## Local Benchmark Results

Measured locally on 2026-05-27. The repo reported an engine warning because the shell used Node `v22.22.0` while the package wants Node `>=24` and `.nvmrc` specifies `24.13.1`; both successful builds still completed under the same local environment. Treat the absolute timings as provisional until rerun under Node `24.13.1`; the before/after comparison is still useful because both runs used the same unsupported local runtime.

| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Build command real time | `845.17s` | `390.51s` | `-454.66s` |
| Static generation time | `12.9min` | `5.9min` | `-7.0min` |
| Static pages generated | `6,941` | `3,735` | `-3,206` |
| Raw export size, `apps/serp.co/out` | `4.2G` | `2.4G` | `-1.8G` |
| Raw product files | `62,322` | `33,468` | `-28,854` |
| Raw unsuffixed product detail pages | `3,206` | `0` | `-3,206` |
| Raw review product detail pages | `3,206` | `3,206` | no change |
| Final artifact size, `dist/sites/serp.co` | `891M` | `891M` | no change |
| Final product artifact size | `853M` | `853M` | no change |
| Final artifact file count | `3,636` | `3,636` | no change |

The final artifact size did not change because the old pipeline already removed the duplicate unsuffixed detail pages after building them. The improvement is in build time, raw export size, and local file churn before final pruning.

## Local Verification

Commands run:

```sh
command time -p pnpm build:site -- --site serp.co
pnpm audit:sitemaps -- --site serp.co --artifact
pnpm exec vitest run scripts/serp-co-artifact-links.test.ts
```

Results:

- Baseline build passed before code changes.
- After build passed with `/products/[slug]` removed from the route table and `/products/[slug]/reviews` still generated for all 3,206 products.
- Artifact sitemap audit passed: `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`.
- `scripts/serp-co-artifact-links.test.ts` passed: `12` tests.
- Representative canonical artifact exists: `dist/sites/serp.co/products/youtube-downloader/reviews/index.html`.
- Representative raw unsuffixed artifact does not exist: `apps/serp.co/out/products/youtube-downloader/index.html`.

## Research Notes

Docs-backed conclusions:

- Next CI build caching is directly relevant. Next persists compiler/build cache under `.next/cache`; CI must cache the app-level `.next/cache` folder to reuse it between builds.
- Turborepo task caching can restore declared task outputs, but caching multi-GB static artifacts should be treated carefully because restore/upload cost can erase the win.
- Next `generateStaticParams()` can generate only a subset of routes and render the rest later, but that requires a runtime server. It is not compatible with the current pure static export/GitHub Pages target.
- Next `use cache` / Cache Components is not a drop-in answer for this site while using static export; current docs list static export as unsupported for that feature.
- React `cache()` is useful inside Server Component render work, but it does not cover all of this repo's build paths, especially `generateStaticParams()`, `generateMetadata()`, and non-component loader calls.

References:

- Next CI build caching: <https://nextjs.org/docs/pages/guides/ci-build-caching>
- Next `generateStaticParams()`: <https://nextjs.org/docs/app/api-reference/functions/generate-static-params>
- Next `use cache`: <https://nextjs.org/docs/app/api-reference/directives/use-cache>
- React `cache()`: <https://react.dev/reference/react/cache>
- Turborepo caching: <https://turborepo.com/docs/crafting-your-repository/caching>
- Turborepo config: <https://turborepo.com/docs/reference/configuration>

## Delegation Model

Each phase should be assigned to a separate worker with a narrow write set. A separate reviewer should inspect every phase before merge.

Shared rules for all workers:

- Read `docs/BUILD_PIPELINE.md`, `docs/DEPLOY_RUNBOOK.md`, and `docs/knowledge/large-site-scale-strategy.md` before editing.
- Do not run `pnpm deploy`, `pnpm deploy:site`, target repo syncs, or any command that pushes generated artifacts.
- A real deploy is out of scope unless the source changes have gone through gitflow: branch, commit, push, review/merge, then deploy from a clean branch synced with upstream or from GitHub Actions.
- When the worktree has uncommitted, untracked, unpushed, behind, or diverged changes, only build, audit, report, or dry-run deploy commands are allowed.
- Do not use deploy target overrides such as `DEPLOY_REPO_URL` or `DEPLOY_BRANCH` during normal deploys.
- Do not run database commands.
- Do not change unrelated dirty files.
- Use Node `24.13.1` from `.nvmrc` for benchmark numbers that will be used as acceptance data.
- Benchmark locally with the same command shape used in phase 1.
- Record before/after metrics in this file when a phase is implemented.
- If a phase changes generated artifact behavior, run the artifact sitemap audit and focused artifact-link tests before calling it complete.

Reviewer checklist for every phase:

- Public URLs are unchanged unless the phase explicitly says otherwise.
- Static export remains supported unless the phase explicitly moves hosting/runtime strategy.
- Final artifact passes sitemap audit.
- The worker measured the specific thing the phase was supposed to improve.
- Claims in this document match measured command output, not estimates.
- Unrelated working tree changes are not included.
- Workflow assumptions are checked against `.github/workflows/build-and-deploy.yml`, not only against docs.

## Phase 2A: Fix Next CI Cache Paths And Build Triggers

Status: implemented locally.

Goal:

- Use the official Next CI cache guidance so repeated CI builds can reuse the app-level `.next/cache`.
- Ensure changes to active wrapper apps, including `apps/serp.co/**`, actually trigger the build workflow or are explicitly documented as requiring `workflow_dispatch`.

Why this is next:

- It is the easiest docs-backed win.
- It does not change app behavior, generated URLs, or deploy targets.
- Current `.github/actions/install/action.yml` caches `${{ github.workspace }}/.next/cache`, but `serp.co` builds under `apps/serp.co/.next/cache`.
- Current `.github/workflows/build-and-deploy.yml` path filters include `apps/starter/**` but not active wrapper app paths such as `apps/serp.co/**`; a wrapper-app-only optimization can merge without automatically building `serp.co`.

Suggested owner:

- CI/build worker.

Expected write set:

- `.github/actions/install/action.yml`
- `.github/workflows/build-and-deploy.yml`
- update this file with measured result notes

Implementation requirements:

- Add app-level Next cache paths. Prefer a broad workspace-safe pattern such as `apps/*/.next/cache` unless the workflow has a strong reason to cache only `apps/serp.co/.next/cache`.
- Keep pnpm dependency caching unchanged.
- Keep the cache key tied to `pnpm-lock.yaml` plus JS/TS source files.
- Do not add generated artifacts such as `apps/*/out`, `dist/sites/**`, or full `.next/**` to the GitHub Actions cache.
- Add workflow path coverage for active wrapper apps. Prefer explicitly listing current active wrappers over only adding `apps/**` if `apps/**` would create too much unrelated workflow noise.
- At minimum, include `apps/serp.co/**` because phase 1 changed that path.
- Check the actual workflow concurrency key before relying on per-site concurrency behavior; current docs describe ref plus site id, but the workflow currently uses `main-ci-${{ github.ref }}`.

Local verification:

- No full deploy is required.
- Run a YAML/static workflow test if one exists for workflow install/cache behavior.
- Run `pnpm exec vitest run scripts/ci-workflow-install.test.ts scripts/build-and-deploy-workflow.test.ts` if those tests cover the workflow contract.

CI verification:

- First CI run should populate the new app-level Next cache.
- Second CI run with no relevant source changes should show a cache restore for the app-level cache.
- Record whether the build still emits any Next "No Cache Detected" warning.

Acceptance criteria:

- CI cache config includes app-level `.next/cache`.
- `serp.co` wrapper app changes trigger a build automatically, or the workflow explicitly documents and tests that `workflow_dispatch` with `site_id=serp.co` is required.
- No deploy behavior changes.
- Existing workflow tests pass or the absence of coverage is explicitly documented.

Implemented result:

- Added app-level cache coverage for `apps/*/.next/cache`.
- Added active wrapper app path filters for `browserextensions.io`, `pornvideodownloaders.com`, `serp.ai`, `serp.co`, `serp.software`, and `serpdownloaders.com`.
- Updated the build resolver so push events without an explicit `SITE_ID` can infer one changed checked-in site from `apps/<site-id>/**`, `apps/starter/**`, or `sites/<site-id>/**` paths.
- The resolver fails explicitly when a push touches multiple site-specific paths and no explicit `SITE_ID` is available, instead of silently building the wrong site.
- Added workflow tests for app-level cache paths and active wrapper app triggers.
- Local tests passed under Node `24.13.1`: `pnpm exec vitest run scripts/build-workflow.test.ts scripts/resolve-build-run.test.ts scripts/ci-workflow-install.test.ts scripts/build-and-deploy-workflow.test.ts`.

QC risks:

- Do not cache full `.next/**`; that can preserve stale build output and bloat cache storage.
- Do not cache `apps/serp.co/out` or `dist/sites/serp.co` in the dependency cache.
- Do not make the cache key so broad that every content change destroys useful cache reuse.

## Phase 2B: Cache Listing Transforms And Slug Lookups

Status: implemented locally for Phase 2B-1. Phase 2B-2 related-products bucket optimization remains unimplemented.

Goal:

- Reduce remaining static generation CPU by avoiding repeated normalization, sorting, and full-array lookup work across thousands of pages.

Why this matters:

- After phase 1, `serp.co` still generates `3,735` static pages.
- `apps/serp.co/lib/content-loader.ts` currently has `getWebsites()` call `buildWebsiteMetadata(allJsonWebsites)` every time.
- `getWebsiteBySlug()` then calls `resolveWebsiteBySlug(getWebsites(), slug)`.
- `packages/web-core/src/content-query.ts` currently resolves a product by scanning the full list and computes related products by mapping, filtering, and sorting across all listings.

Suggested owner:

- App data-loader worker.

Expected write set:

- `apps/serp.co/lib/content-loader.ts`
- `packages/web-core/src/content-query.ts` only if helper APIs must be added for exact behavior preservation
- focused tests for content lookup behavior if existing coverage is insufficient
- update this file with before/after benchmark results

Implementation requirements:

- Keep source data as checked-in JSON.
- Keep public routes and rendered product content identical.
- Build normalized listings once per Node process for the active app build, scoped to the app module and active listing input.
- Build a `Map<string, WebsiteMetadata>` for slug lookups.
- Build a `Map<string, number>` or equivalent for previous/next lookup.
- Preserve the current previous/next ordering, which is based on the sorted website array.
- Phase 2B should not change the related-products algorithm unless it is split into a separate clearly measured subphase.
- Cache keys/invalidation must be implicit and safe for static builds: module reload or process restart must rebuild from the current `allJsonWebsites` import, and no generated deploy artifact should be used as a cache source.
- Do not persist this cache to disk.
- Do not share a mutable singleton across different site builds in a way that can mix `serp.co` listings with another site's listings.

Recommended split:

- Phase 2B-1: cache normalized array, slug map, and slug index only. Low risk.
- Phase 2B-2: optimize related-products computation with category buckets. Medium risk because related-product ordering can change if not carefully preserved.

Verification:

- Run `command time -p pnpm build:site -- --site serp.co`.
- Run `pnpm audit:sitemaps -- --site serp.co --artifact`.
- Run `pnpm exec vitest run scripts/serp-co-artifact-links.test.ts`.
- Add or run focused tests that compare `getWebsites()` ordering and a known `getWebsiteBySlug()` result before/after.
- Manually inspect a known detail artifact, such as `dist/sites/serp.co/products/youtube-downloader/reviews/index.html`.

Metrics to record:

- Build command real time.
- Static generation time.
- Static pages generated.
- Raw export size, `apps/serp.co/out`.
- Final artifact size, `dist/sites/serp.co`.
- Raw unsuffixed and review product page counts.

Acceptance criteria:

- Same generated route count as after phase 1 unless intentionally changed.
- Same canonical product page count: `3,206`.
- Same sitemap audit result: `0 errors`.
- No visible product page content regression for representative pages.
- Measured build time improves, or the phase is marked as low-impact with exact numbers.

Implemented result:

- `apps/serp.co/lib/content-loader.ts` now builds the normalized listing array and lookup index once per Node process.
- `getWebsites()` returns a fresh array copy so callers cannot reorder the cached array.
- `getWebsiteBySlug()` uses a cached lookup index for slug and previous/next lookup.
- `packages/web-core/src/content-query.ts` now exposes `buildWebsiteLookupIndex()` and `resolveWebsiteBySlugFromIndex()`.
- The existing related-products mapping/filtering/sorting algorithm is intentionally unchanged.
- Focused tests passed under Node `24.13.1`: `pnpm exec vitest run packages/web-core/src/content-query.test.ts scripts/serp-co-content-loader.test.ts`.

QC risks:

- Avoid shared mutable cached objects if downstream code mutates listing objects.
- Do not move site-specific cache state into shared package scope in a way that can leak across site builds.
- Do not alter related-products order in Phase 2B-1.
- Do not use React `cache()` as the main solution for this phase; it does not cover every build call path here.
- If the worker returns cached arrays directly, reviewer must check whether any caller mutates the returned array with `sort()`, `push()`, or in-place edits.

## Phase 2 Local Benchmark Results

Measured locally on 2026-05-27 under Node `24.13.1`.

Baseline is after Phase 1 and before Phase 2 code changes.

| Metric | Phase 2 Baseline | After Phase 2 | Delta |
| --- | ---: | ---: | ---: |
| Build command real time | `301.13s` | `41.48s` | `-259.65s` |
| Static generation time | `4.4min` | `9.7s` | about `-254.3s` |
| Static pages generated | `3,735` | `3,735` | no change |
| Raw export size, `apps/serp.co/out` | `2.4G` | `2.4G` | no change |
| Raw unsuffixed product detail pages | `0` | `0` | no change |
| Raw review product detail pages | `3,206` | `3,206` | no change |
| Final artifact size, `dist/sites/serp.co` | `891M` | `891M` | no change |
| Final product artifact size | `852M` | `852M` | no change |
| Final artifact file count | `3,636` | `3,636` | no change |

Verification commands run under Node `24.13.1`:

```sh
pnpm --filter serp.co typecheck
pnpm exec biome lint scripts/resolve-build-run.ts scripts/resolve-build-run.test.ts scripts/build-workflow.test.ts scripts/ci-workflow-install.test.ts scripts/build-and-deploy-workflow.test.ts apps/serp.co/lib/content-loader.ts packages/web-core/src/content-query.ts packages/web-core/src/content-query.test.ts scripts/serp-co-content-loader.test.ts
pnpm exec vitest run scripts/build-workflow.test.ts scripts/resolve-build-run.test.ts scripts/ci-workflow-install.test.ts scripts/build-and-deploy-workflow.test.ts packages/web-core/src/content-query.test.ts scripts/serp-co-content-loader.test.ts
pnpm exec vitest run scripts/serp-co-artifact-links.test.ts
command time -p pnpm build:site -- --site serp.co
pnpm audit:sitemaps -- --site serp.co --artifact
```

Verification results:

- Typecheck passed.
- Biome lint passed with no warnings.
- Git diff whitespace check passed.
- Focused Phase 2 tests passed: `27` tests.
- Existing `serp.co` artifact-link tests passed: `12` tests.
- After build passed with `3,735` generated pages.
- Artifact sitemap audit passed: `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`.

Conclusion:

- Phase 2B-1 is a major local build win. The improvement comes from CPU work avoided during static generation, not from reducing artifact size.
- Phase 2A improves CI repeat-build behavior and ensures wrapper app changes trigger the workflow, but its cache-hit impact still needs confirmation in GitHub Actions after merge.

## Phase 3: Filter Artifact Copy

Status: planned.

Goal:

- Reduce local file churn by copying only deployable files from `apps/serp.co/out` into `dist/sites/serp.co`.

Why this matters:

- After phase 1, raw export is still `2.4G`, while final artifact is `891M`.
- `scripts/build-site.ts` currently copies the full app export, then prunes files such as debug text artifacts, disabled routes, unsuffixed detail artifacts, and route aliases.

Suggested owner:

- Build-pipeline worker.

Expected write set:

- `scripts/build-site.ts`
- tests around artifact finalization/pruning behavior
- update this file with before/after metrics

Implementation requirements:

- Preserve final artifact contents exactly unless a difference is explicitly intended and tested.
- Prefer a deterministic filtered copy function over shelling out to platform-specific sync commands.
- Keep `.nojekyll`, `CNAME`, `404.html`, route path rewrites, sitemap generation, and artifact exclusions intact.
- Preserve all current finalizer semantics:
  - copy `_not-found/index.html` to `404.html`
  - apply feature-route pruning
  - apply public route remaps
  - remove unsuffixed listing detail route indexes when a suffix is configured
  - remove generated `categories` when `categoryBasePath` remaps them
  - apply legacy root listing redirects
  - remove configured artifact-excluded paths
  - write split sitemaps, `.nojekyll`, and `CNAME`
- Do not run real deploys.

Verification:

- Run `pnpm exec vitest run scripts/serp-co-artifact-links.test.ts scripts/browserextensions-io-artifact-links.test.ts scripts/sitemap-files.test.ts`.
- Run `command time -p pnpm build:site -- --site serp.co`.
- Run `pnpm audit:sitemaps -- --site serp.co --artifact`.
- Compare final artifact file count and representative file paths against the phase 1 baseline.

Acceptance criteria:

- Final artifact file count remains `3,636` unless a deliberate change is documented.
- Final artifact sitemap audit has `0 errors`.
- Representative required files exist after finalization: `404.html`, `.nojekyll`, `CNAME`, `sitemap-index.xml`, `sitemaps/directory/1.xml`, and `products/youtube-downloader/reviews/index.html`.
- Representative pruned files remain absent after finalization: unsuffixed product detail index files and route artifacts excluded by site config.
- Raw export size may stay the same, but finalization time should improve or be documented as not materially improved.

QC risks:

- Skipping a file during copy can silently break static assets.
- Path filtering must understand route rewrites and later sitemap writes.
- Do not remove finalizer prune functions until tests prove the filtered copy fully replaces them.

## Phase 4: Reduce Serialized Listing Payloads

Status: planned.

Goal:

- Reduce HTML/RSC/client payload size on high-fanout listing pages without changing canonical detail pages.

Why this matters:

- Home, listing, category, and search surfaces can pass large listing arrays into client components.
- `WebsitesListWithSearch` stores `initialWebsites` client-side.
- Large categories such as `other` can create heavy category artifacts even when only part of the list is displayed.

Suggested owner:

- Web UI/data-boundary worker.

Expected write set:

- `packages/web-core/src/home-page.tsx`
- `packages/web-core/src/category-routes/category-page.tsx`
- `packages/web-core/src/websites-list-with-search.tsx`
- site wrapper files only if required by existing slot APIs
- update this file with measured page-size deltas

Implementation requirements:

- Keep first-render UX functional without requiring a runtime server.
- Do not remove search; load larger search data from static JSON only when needed if changing search behavior.
- Keep no-JS fallback acceptable for primary browse pages.
- Avoid changing product detail route generation.

Verification:

- Build `serp.co` locally.
- Record size of heavy pages before/after, especially:
  - `dist/sites/serp.co/index.html`
  - `dist/sites/serp.co/products/index.html`
  - `dist/sites/serp.co/products/best/other/index.html`
- Run artifact sitemap audit and focused artifact-link tests.

Acceptance criteria:

- Large page HTML size decreases.
- Browse/search interactions still work locally.
- No sitemap or route target regressions.

QC risks:

- Client search can regress if only a sliced listing array is available.
- Favorites/sort behavior can regress if the component assumes all listings are present.
- Do not hide content from crawlers without an explicit SEO decision.

## Phase 5: Deploy Strategy Exit Plan

Status: research/planning only.

Goal:

- Define the migration path away from GitHub Pages repo-sync when `serp.co` crosses the practical static hosting threshold.

Why this matters:

- `serp.co` final artifact is already `891M`, close to the documented GitHub Pages `1 GB` ceiling.
- Repo-sync deploys commit generated artifacts into target repo history, so repeated deploys grow operational cost even if the latest artifact stays the same size.

Suggested owner:

- Hosting/deploy architecture worker.

Expected write set:

- docs only at first
- no deployment script changes unless a separate implementation phase is approved

Research requirements:

- Compare object storage plus CDN, GitHub Pages artifact deploy, and hosted Next runtime options.
- Preserve static-first build authority unless intentionally moving to runtime rendering.
- Explicitly document how DNS, CNAME, cache headers, rollback, and artifact retention would work.

Acceptance criteria for planning:

- A migration proposal exists with cost, operational risk, rollback plan, and required secrets.
- No real deploy is run.
- No deploy target override is introduced.

## Guardrails

- Keep large-site optimization work local until benchmark and artifact checks pass.
- Do not run real deploys from a dirty, unreviewed, unpushed, behind, diverged, or untracked worktree.
- Do not run real deploys unless source work has gone through branch, commit, push, review/merge, then deploy from a clean branch synced with upstream or from GitHub Actions.
- Treat `pnpm deploy`, `pnpm deploy:site`, and target GitHub Pages repo syncs as production-affecting git push operations.
- Do not use deploy target overrides such as `DEPLOY_REPO_URL` or `DEPLOY_BRANCH` unless a same-turn emergency bypass is explicitly approved.
- Preserve the static-export model unless a later phase explicitly changes hosting strategy.
- Prefer changes that are measurable in local build time, static generation time, raw export size, final artifact size, or CI cache hit behavior.
- If a phase cannot prove a measurable win, keep the code simple and document the result instead of stacking more complexity.
