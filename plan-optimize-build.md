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

## Post-Merge CI Observations

Measured from GitHub Actions after Phase 1, Phase 2, and the push-site inference hotfix merged to `main` on 2026-05-27.

Comparable `serp.co` workflow runs:

| Metric | Previous confirmed `serp.co` run | Current optimized `serp.co` run | Delta |
| --- | ---: | ---: | ---: |
| Full workflow wall time | about `11m41s` | about `9m57s` | about `-1m44s` |
| Validate job | `1m33s` | `1m35s` | no material change |
| Build job | `7m25s` | `4m41s` | `-2m44s` |
| `Build static site` step | `4m35s` | `2m07s` | `-2m28s` |
| Deploy job | `2m36s` | `2m35s` | no material change |
| Deploy command step | about `51s` | about `48s` | no material change |

Important interpretation:

- The large local win from Phase 2 shows up in CI, but CI wall time still includes checkout, install/cache restore, artifact upload, artifact download, deploy repo sync, target repo push, and action post-job cleanup.
- The current CI bottleneck is no longer just static generation. It is now split between build orchestration and moving/syncing the `891M` final artifact.
- The `serp.co` target repo Pages workflow completed successfully after the explicit `workflow_dispatch` run with `site_id=serp.co`.
- A wrong-site deploy happened before the hotfix because repo `vars.SITE_ID` overrode changed-path inference. The hotfix now keeps manual `SITE_ID` explicit and treats repo `SITE_ID` only as a push fallback when changed paths do not identify a site.

## Next High-Confidence Work

Current assessment, 2026-05-27:

- Phase 3A, Phase 3B, Phase 3C, and Phase 4A are implemented locally on the
  dirty `build-optimization-phase-3-plus-more` branch, but still need normal
  review/merge hygiene and CI confirmation before they should be treated as
  production-proven.
- Phase 3A still needs a post-merge `serp.co` GitHub Actions timing run to
  compare the single-job workflow against the previous CI baseline.
- Phase 3B still needs CI cache evidence from a warm run: confirm whether the
  app-level `.next/cache` path is restored, whether Next stops warning about a
  missing cache, and whether the cache materially improves CI wall time.
- Phase 3C should not receive more local tuning unless CI or QA finds a
  concrete regression. The remaining copy/finalization cost is no longer the
  dominant measured bottleneck.
- Phase 4A is the latest local payload win. It reduced product review HTML
  logical bytes by `102,680,047` (`-12.3%`) while preserving `3,636` final
  files, `3,206` product detail pages, sitemap audit health, own detail
  content, resource links, canonical review URLs, JSON-LD, related entries, and
  previous/next navigation.
- The current branch mixes prior Phase 3 files and the Phase 4A payload work.
  For review, either split into separate PRs or make the PR boundaries explicit
  so deploy/workflow changes are not reviewed as product payload changes.
- Do not run a real deploy from this dirty local branch. Only build, audit,
  report, and dry-run deploy commands are allowed until the source changes have
  gone through branch, commit, push, review/merge, and a clean upstream-synced
  deploy path.

Recommended order from here:

1. Review and merge the existing local Phase 3A/3B/3C work, or split it from
   Phase 4A if the branch needs smaller review units.
2. Run the post-merge `serp.co` GitHub Actions build/deploy path from the clean
   merged source and record CI timing, cache behavior, artifact size, and target
   repo sync behavior.
3. Review and merge Phase 4A after confirming the same artifact invariants under
   Node `24.13.1` or CI: `3,636` final files, `3,206` product detail pages,
   sitemap audit `0 errors`, and representative page payload reductions.
4. Implement Phase 4B next: reduce listing, category, and search page payloads,
   especially `index.html`, `products/index.html`, and
   `products/best/other/index.html`.
5. Implement Phase 4C after payload work: make representative artifact output
   deterministic and prove same-source rebuilds produce stable checksums before
   relying on no-op deploy guards.
6. Keep Phase 5 as planning only until the GitHub Pages repo-sync model becomes
   the actual blocker. Use it to compare hosting options, not to change deploy
   scripts prematurely.

## Phase 3/4 Subagent Execution Plan

Use one coding subagent and one QA subagent for each part. Keep their scopes
separate: the coding subagent owns implementation or evidence collection; the
QA subagent is read-only unless the controller explicitly asks for a follow-up
fix pass.

Shared rules for every subagent:

- Read `AGENTS.md`, `docs/BUILD_PIPELINE.md`, `docs/DEPLOY_RUNBOOK.md`,
  `docs/knowledge/listing-data-contract.md`, and this plan before acting.
- Do not run `git add`, `git commit`, `git push`, real deploys, target repo
  syncs, database commands, or destructive filesystem commands.
- Treat `pnpm deploy`, `pnpm deploy:site`, and generated-site repo syncs as
  git push operations. Only dry-run deploy commands are allowed unless the user
  gives explicit same-turn deploy approval after source gitflow is complete.
- Treat GitHub Actions manual dispatches that deploy as real deploy paths: they
  require explicit approval and clean source gitflow conditions.
- Inspect the current dirty worktree before editing. Avoid overlapping writes
  with another phase, and stop if the requested phase cannot be isolated without
  touching another phase's unmerged changes.
- Preserve public URLs, canonical links, metadata, sitemap coverage, JSON-LD,
  and static-export compatibility unless a phase explicitly changes them.
- Use Node `24.13.1` for final benchmark evidence where possible. If another
  Node version is used, record the warning and do not treat absolute timings as
  final acceptance data.
- Record command output summaries and measured before/after numbers in this
  file. Do not leave claims as estimates.

Phase 3A: single-job CI deploy path closeout.

- Coding subagent:
  - Owns only `.github/workflows/build-and-deploy.yml`,
    `scripts/build-and-deploy-workflow.test.ts`, `docs/BUILD_PIPELINE.md`,
    `docs/DEPLOY_RUNBOOK.md`, and this plan if review finds Phase 3A gaps.
  - Fixes workflow-contract defects only; does not add deploy target inputs or
    deploy target overrides.
  - After PR/merge happens through normal gitflow, collects the post-merge
    `serp.co` GitHub Actions timing evidence: full workflow time, validate,
    build, audit, deploy, and whether artifact upload/download is absent.
- QA subagent:
  - Reviews the workflow for validate/build/audit/deploy ordering, checked-in
    deploy target usage, explicit `workflow_dispatch` site selection, cleared
    inherited env vars, and absence of normal-path artifact upload/download.
  - Confirms the post-merge run targeted `serp.co` and the target repo Pages
    workflow completed.
  - Fails the phase if a real deploy path can be triggered from dirty or
    ambiguous local state.

Phase 3B: CI cache behavior closeout.

- Coding subagent:
  - Owns `.github/actions/install/action.yml`,
    `scripts/ci-workflow-install.test.ts`, and this plan only if CI evidence
    shows the current cache paths or keys are wrong.
  - Acts primarily as a measurement and cache-log owner unless the evidence
    proves the current app-level cache is wrong or ineffective.
  - Keeps caches limited to dependency/cache surfaces such as
    `apps/*/.next/cache`; does not cache `apps/*/out`, `dist/sites/**`, full
    `.next/**`, or multi-GB build artifacts.
  - Collects two comparable CI runs: one that populates cache and one warm run
    that restores it.
- QA subagent:
  - Reads GitHub Actions cache logs and verifies cache hit/miss status, cache
    size, and whether Next still emits a missing-cache warning.
  - Compares warm-run build timing against the previous CI baseline.
  - Rejects deeper caching proposals unless they include restore/upload cost and
    prove a net win.

Phase 3C: artifact copy/finalization closeout.

- Coding subagent:
  - Does not do more tuning by default. Owns `scripts/build-site.ts`,
    `scripts/build-artifact-pruning.test.ts`, and this plan only if CI or QA
    finds a concrete regression in finalizer behavior.
  - If a regression appears, fixes the minimum issue needed to preserve final
    artifact invariants.
- QA subagent:
  - Rebuilds/audits the artifact and verifies `3,636` final files, `3,206`
    product detail pages, no unsuffixed product detail artifacts, no disabled
    route artifacts, sitemap audit `0 errors`, and focused artifact-link tests.
  - Compares logical bytes and file lists, not only `du -sh`, because local
    filesystem block allocation can change independently of artifact content.
  - Confirms finalizer changes do not alter public routes or sitemap coverage.
  - Records any remaining copy/finalization cost but does not request more
    optimization unless it is again a measured bottleneck.

Phase 4A: product detail payload closeout.

- Coding subagent:
  - Owns the current `web-core` payload files and focused tests:
    `packages/web-core/src/content-query.ts`,
    `packages/web-core/src/content-query.test.ts`,
    `packages/web-core/src/llm/llm-grid.tsx`,
    `packages/web-core/src/website-routes/detail-page.tsx`,
    `packages/web-core/src/website/website-*`, and this plan.
  - Fixes review findings without changing public URLs, removing SEO content,
    or moving detail content to client-only rendering.
  - Keeps JSON-LD and MDX/body rendering on the full detail object; only
    client-bound/UI-card surfaces should receive slim DTOs.
- QA subagent:
  - Verifies related cards, previous/next nav, hero, sidebar, and resources do
    not receive unnecessary full listing payloads.
  - Inspects representative detail HTML for canonical review URL, own content,
    resource links, related entries, previous/next links, and JSON-LD graph.
  - Confirms product review HTML logical bytes remain materially lower and that
    artifact counts remain `3,636` final files and `3,206` product detail pages.
  - Requires final acceptance numbers to be rerun under Node `24.13.1` or CI,
    because the current local Phase 4A evidence used Node `22.22.0`.

Phase 4B: listing, category, and search payload reduction.

- Coding subagent:
  - Owns `packages/web-core/src/home-page.tsx`,
    `packages/web-core/src/category-routes/category-page.tsx`,
    `packages/web-core/src/websites-list-with-search.tsx`, related route/slot
    wrappers only as needed, focused tests, and this plan.
  - Builds slim list-card/search DTOs for high-fanout browse surfaces while
    preserving search, sort, favorites, links, and no-JS browse fallback.
  - Measures before/after sizes for `dist/sites/serp.co/index.html`,
    `dist/sites/serp.co/products/index.html`, and
    `dist/sites/serp.co/products/best/other/index.html`.
- QA subagent:
  - Tests browse/search/sort/favorites behavior and verifies large page HTML
    size decreases without route, sitemap, or internal-link regressions.
  - Checks that any lazy-loaded static JSON is generated, linked, and available
    in the final artifact without runtime server requirements.
  - Rejects changes that hide primary browse content from crawlers unless an
    explicit SEO tradeoff is approved.

Phase 4C: deterministic artifacts and no-op deploy guard.

- Coding subagent:
  - Owns deterministic timestamp/schema generation code, checksum/audit helper
    tests if needed, deploy dry-run evidence collection, and this plan.
  - Replaces build-time timestamps with deterministic source/config dates where
    accurate. Does not fake freshness with current time.
  - Adds tests or scripts that compare representative same-source build outputs.
- QA subagent:
  - Runs two same-source local builds and compares representative checksums and,
    where feasible, the full `dist/sites/serp.co` tree.
  - Audits JSON-LD dates for semantic correctness and confirms sitemap audit
    remains clean.
  - Runs only `pnpm deploy:site -- --site serp.co --dry-run` if deploy behavior
    evidence is needed. No real deploy from local dirty state.
  - Lists any remaining nondeterministic files explicitly before accepting the
    phase.

Controller closeout after each part:

- Read both subagent reports before marking the part complete.
- Update this plan with actual command results and measured deltas.
- Keep unrelated dirty files untouched.
- If the phase requires PR/merge or GitHub Actions evidence, mark it locally
  complete but CI-pending until that evidence exists.

## Phase 3A: Single-Job CI Deploy Path

Status: implemented locally on branch `build-optimization-phase-3-plus-more`; pending PR/merge and post-merge CI timing measurement.

Goal:

- Reduce CI wall time by avoiding unnecessary upload/download of the large static artifact between jobs.

Why this matters:

- Before this implementation, the workflow uploaded `dist/sites/<site-id>` from the build job and downloaded it into the deploy job.
- For `serp.co`, the final artifact is `891M`.
- The optimized `serp.co` build job is now `4m41s`, but deploy remains about `2m35s` and full workflow remains about `9m57s`.
- A single job can preserve the same source-review and checked-in deploy-target rules while avoiding the large artifact handoff and one extra dependency install.
- This is a CI orchestration change, not an application behavior change.

Suggested owner:

- CI/build workflow worker.

Expected write set:

- `.github/workflows/build-and-deploy.yml`
- `scripts/build-and-deploy-workflow.test.ts`
- `docs/DEPLOY_RUNBOOK.md` only if workflow behavior changes enough to need runbook clarification
- update this file with before/after workflow timings

Implemented approach:

- Collapsed `.github/workflows/build-and-deploy.yml` into one deploy-capable job named `Validate, Build & Deploy`.
- The job now runs:
  - checkout
  - install
  - resolve build input
  - validate
  - build
  - audit
  - verify deploy auth
  - `pnpm deploy:site`
- Removed normal-path `actions/upload-artifact` and `actions/download-artifact` usage.
- Kept validation and sitemap audit before deploy.
- Kept deploy target resolution in checked-in site config; no deploy repo or deploy branch workflow inputs were added.
- Removed the non-deployable `workflow_dispatch` default value. Manual dispatch now requires an explicit checked-in `site_id`.
- Hardened push inference by clearing inherited `NEXT_PUBLIC_SITE_ID` in the resolve step.
- Hardened deploy target safety by clearing inherited `ALLOW_DEPLOY_TARGET_OVERRIDE`, `DEPLOY_REPO_URL`, and `DEPLOY_BRANCH` in the deploy step.
- Updated workflow contract tests to reject future artifact upload/download actions, require explicit `site_id`, enforce validate/build/audit/deploy order, and assert the inherited env clearing.
- Updated `docs/BUILD_PIPELINE.md` and `docs/DEPLOY_RUNBOOK.md` to describe the single-job GitHub Actions path.

Local verification completed:

- Node `24.13.1`: `pnpm exec vitest run scripts/build-and-deploy-workflow.test.ts scripts/resolve-build-run.test.ts scripts/deploy-site.test.ts`
  - Passed: `37` tests.
- Node `24.13.1`: `pnpm test:repo`
  - Passed: `102` tests.
- `pnpm exec biome check scripts/build-and-deploy-workflow.test.ts`
  - Passed.
- `git diff --check`
  - Passed.

Local build smoke completed after Phase 3A:

- Node `24.13.1`: `command time -p pnpm validate:site -- --site serp.co`
  - Passed: `3,206` entries.
  - Real time: `1.13s`.
- Node `24.13.1`: `command time -p pnpm build:site -- --site serp.co`
  - Passed: `3,735` static pages generated.
  - Static generation step: `10.8s`.
  - Real time: `46.57s`.
- Node `24.13.1`: `command time -p pnpm audit:sitemaps -- --site serp.co --artifact`
  - Passed: `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`.
  - Real time: `1.59s`.
- Node `24.13.1`: `command time -p pnpm deploy:site -- --site serp.co --dry-run`
  - Passed: target repo `https://github.com/serpcompany/serp.co.git`, branch `main`.
  - Real time: `0.64s`.
- Node `24.13.1`: `pnpm exec vitest run scripts/serp-co-artifact-links.test.ts`
  - Passed: `12` tests.
- Artifact sizes after local build:
  - Raw export `apps/serp.co/out`: `2.4G`.
  - Final artifact `dist/sites/serp.co`: `891M`.
  - Final product artifact `dist/sites/serp.co/products`: `852M`.

Important limitation:

- This local smoke proves the single-job workflow sequence still has a valid build artifact and deploy target plan.
- It does not measure the real Phase 3A speed delta because the removed `891M` artifact upload/download only happens inside GitHub Actions.
- The real speed result still requires a post-merge GitHub Actions run.

Adversarial QA completed:

- Initial QA found that inherited `NEXT_PUBLIC_SITE_ID` could bypass push-path inference, inherited deploy target override env vars needed explicit clearing in the workflow, `workflow_dispatch` had a non-deployable default, the artifact-action test was too version-specific, and this plan still described Phase 3A as planned.
- Those issues were fixed in the workflow, workflow contract tests, runbook/docs, and this plan.
- Final QA found one low-severity docs gap: `docs/DEPLOY_RUNBOOK.md` did not mention the repo `SITE_ID` fallback for generic push paths. The runbook now documents that fallback.

Post-merge CI verification still required:

- Run a manual `workflow_dispatch` for `serp.co` only after PR merge and only through GitHub Actions.
- Compare timings against the post-merge baseline:
  - full workflow wall time
  - validate/build/audit/deploy step timings
  - whether artifact upload/download still happens
- Verify target repo is still `https://github.com/serpcompany/serp.co.git` for `serp.co`.
- Verify target repo Pages workflow completes.

Acceptance criteria:

- CI deploy still validates, builds, audits, and deploys the checked-out source commit.
- `serp.co` target repo receives the artifact when `site_id=serp.co`.
- No deploy target override inputs are introduced.
- Workflow time decreases or the result is documented as not worth the workflow complexity.
- Any retained artifact upload is justified as debug-only or optional.

QC risks:

- Accidentally bypassing sitemap audit.
- Accidentally making deploy target configurable from workflow inputs.
- Losing the explicit artifact for post-failure inspection.
- Reintroducing wrong-site deploy behavior.

## Phase 3B: Measure And Harden CI Cache Behavior

Status: implemented locally; CI verification pending.

Goal:

- Confirm whether app-level Next cache reuse materially improves CI build time before adding deeper cached-rebuild machinery.

Why this matters:

- Next CI build caching is official and docs-backed; `.next/cache` is the supported cache surface.
- Phase 2A added `apps/*/.next/cache` to the GitHub Actions cache.
- Local `apps/serp.co/.next/cache` may be small, so this must be measured in GitHub Actions before claiming it as a major win.
- Turborepo/full artifact caches can be counterproductive when outputs are multi-GB.

Suggested owner:

- CI/cache measurement worker.

Expected write set:

- `.github/actions/install/action.yml` only if measurement shows cache key/path issues
- `scripts/ci-workflow-install.test.ts` only if cache policy changes
- update this file with cache-hit and timing evidence

Implementation requirements:

- Do not cache `apps/*/out`.
- Do not cache `dist/sites/**`.
- Do not cache full `.next/**`.
- Do not add Turborepo remote cache or large output cache without a separate measured proposal.
- Keep pnpm dependency cache unchanged unless it is demonstrably misconfigured.
- Record actual cache logs from at least two consecutive CI runs:
  - first run populates cache
  - second run restores cache

Metrics to record:

- Cache hit/miss for `actions/cache`.
- Size of restored/saved cache.
- `Build static site` step duration.
- Full `Build` job duration.
- Full workflow wall time.
- Whether Next emits any no-cache warning.

Acceptance criteria:

- If cache hit improves build time materially, keep it and document the observed win.
- If cache hit is negligible, keep only low-risk dependency/app cache config and do not add more cache complexity.
- No generated artifacts are restored from cache into deploy outputs.

QC risks:

- Cache keys that invalidate on every content-only change.
- Cache archives that take longer to upload/download than the work they save.
- Stale build output from caching more than `.next/cache`.

## Phase 3C: Filter Artifact Copy

Status: implemented locally on branch `build-optimization-phase-3-plus-more`.

Goal:

- Reduce local file churn by copying only deployable files from `apps/serp.co/out` into `dist/sites/serp.co`.

Why this matters:

- Current local state has `apps/serp.co/out` around `2.0G`, while final `dist/sites/serp.co` is `891M`.
- `scripts/build-site.ts` currently copies the full app export, then prunes files such as debug text artifacts, disabled routes, unsuffixed detail artifacts, route aliases, source maps, and Next text artifacts.
- This should improve finalization/local I/O. It is not expected to reduce final deploy artifact size unless the finalizer currently leaves unnecessary files behind.

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

Implemented result:

- Replaced the finalizer's full `cpSync(appOutDir, artifactDir)` copy with a deterministic TypeScript filtered copy function.
- The filtered copy skips files and route surfaces that the finalizer immediately prunes:
  - `.DS_Store`
  - source maps
  - Next text artifacts such as `__next*.txt` and `index.txt`
  - disabled feature route roots
  - `_not-found`, `404/`, and `operator/`
  - route-remap target roots that would be replaced later
  - unsuffixed listing detail route indexes when a suffixed detail route exists
  - generated category aliases when `categoryBasePath` is configured
  - configured artifact-excluded route indexes
- Route remaps are copied directly to their final deployable paths when safe.
- Existing prune/remap/sitemap functions still run after the filtered copy as guardrails.
- `copyFileSync` uses Node's `COPYFILE_FICLONE` hint so filesystems that support copy-on-write cloning can avoid unnecessary local block churn.
- Added focused tests for filtered copy behavior in `scripts/build-artifact-pruning.test.ts`.
- Added `scripts/build-artifact-pruning.test.ts` to `pnpm test:repo` so finalizer regressions are covered by the standard repo test command.

Local Phase 3C measurements:

Measured locally on 2026-05-27 under Node `24.13.1`.

| Metric | Before Phase 3C local smoke | After Phase 3C | Delta |
| --- | ---: | ---: | ---: |
| Full `pnpm build:site -- --site serp.co` real time | `46.57s` | `40.60s` | `-5.97s` |
| Static generation step | `10.8s` | `11.2s` | no material improvement |
| Raw export file count, `apps/serp.co/out` | `37,009` | `37,009` | no change |
| Final artifact file count, `dist/sites/serp.co` | `3,636` | `3,636` | no change |
| Raw export logical bytes | about `1,949.63 MiB` | about `1,949.63 MiB` | no change |
| Final artifact logical bytes | about `884.09 MiB` | about `884.09 MiB` | no change |
| Raw export disk usage, `du -sh apps/serp.co/out` | `2.4G` | `2.4G` | no change |
| Final artifact disk usage, `du -sh dist/sites/serp.co` | previously about `891M` | `993M` | measurement/block-allocation changed |

Interpretation:

- The reliable Phase 3C win is reduced finalizer copy surface: the deployable artifact is `3,636` files and about `884.09 MiB` logical bytes, while the raw export is `37,009` files and about `1,949.63 MiB` logical bytes.
- The full build time improved on the latest local run, but the static-generation step did not. Treat the `40.60s` wall-time result as directional because compile/cache variance is visible between runs.
- The final deployed content size did not change. The higher `du -sh` number reflects local filesystem block allocation; logical bytes stayed consistent with the prior artifact size.

Local verification completed:

- Node `24.13.1`: `pnpm exec vitest run scripts/build-artifact-pruning.test.ts scripts/serp-co-artifact-links.test.ts scripts/sitemap-files.test.ts`
  - Passed: `29` tests.
- Node `24.13.1`: `pnpm test:repo`
  - Passed: `112` tests.
- Node `24.13.1`: `pnpm typecheck`
  - Passed.
- Node `24.13.1`: `pnpm exec biome lint scripts/build-site.ts scripts/build-artifact-pruning.test.ts`
  - Passed.
- Node `24.13.1`: `command time -p pnpm build:site -- --site serp.co`
  - Passed with `3,735` generated pages and `40.60s` real time.
- Node `24.13.1`: `command time -p pnpm audit:sitemaps -- --site serp.co --artifact`
  - Passed: `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`; `1.65s` real time.
- Node `24.13.1`: `command time -p pnpm deploy:site -- --site serp.co --dry-run`
  - Passed: target repo `https://github.com/serpcompany/serp.co.git`, branch `main`; `0.62s` real time.
- `git diff --check`
  - Passed.

Adversarial QA completed:

- Implementation QA found no Phase 3C issues in `scripts/build-site.ts` or `scripts/build-artifact-pruning.test.ts`.
- QA verified `serp.co` artifact invariants after a fresh build: `3,636` final files, required files present, unsuffixed product detail absent, `categories/featured` absent, `products/best/featured` and `products/best/other` still present as expected for `serp.co`, and legacy root sitemap files absent.
- Known unrelated test gap: `scripts/browserextensions-io-artifact-links.test.ts` still fails its brands JSON parity check because local `packages/web-core/src/data/network-brands.json` has `46` brands while `/Users/devin/dev/repos/serp/docs/websites/pages/brands.json` has `62`. That failure is source-data drift, not a Phase 3C artifact finalization regression.

## Phase 4A: Reduce Product Detail Page Payloads

Status: implemented locally; CI verification pending.

Goal:

- Reduce final artifact size and deploy repo churn by shrinking repeated product detail page payloads.

Why this matters:

- `dist/sites/serp.co/products` is about `852M` of the `891M` final artifact.
- There are `3,206` product detail pages, averaging roughly `255K` each in the final artifact.
- Current Phase 4 listing-page work targets index/category/search surfaces, but product detail pages dominate the final artifact and deploy size.
- Smaller detail pages should reduce artifact upload/download, deploy repo sync, target repo history growth, and live page transfer size.

Suggested owner:

- Detail-page payload worker.

Expected write set:

- `packages/web-core/src/website-routes/detail-page.tsx`
- detail-page child components that receive the full website object
- serializer/helper files only if needed to define a smaller detail DTO
- focused tests around detail rendering and schema output
- update this file with page-size and artifact-size deltas

Implementation requirements:

- Preserve public URLs, canonical links, metadata, JSON-LD semantics, visible detail content, related products, previous/next navigation, and sitemap coverage.
- Do not remove SEO-critical content just to reduce bytes.
- Avoid passing full listing objects into client components when they only need a small subset.
- Prefer explicit DTOs for detail sidebar, hero, resources, previous/next, and related-product cards.
- Keep product detail generation static-export compatible.
- Do not introduce runtime fetches.
- Do not move product content into a client-only payload that search engines cannot see.

Measurement:

- Build `serp.co` locally before and after.
- Record:
  - total `dist/sites/serp.co` size
  - `dist/sites/serp.co/products` size
  - size of at least five representative detail pages
  - total file count
  - `Build static site` time
  - final deploy artifact size in CI if merged
- Suggested representative pages:
  - `products/youtube-downloader/reviews/index.html`
  - one large page with rich resources/media
  - one sparse page
  - one page with related products
  - one page from a large category

Local Phase 4A results, 2026-05-27:

- Source checkpoint before Phase 4A: existing dirty branch
  `build-optimization-phase-3-plus-more`; prior Phase 3 files left intact.
- Baseline artifact, before Phase 4A code changes:
  - final file count: `3,636`
  - product detail pages: `3,206`
  - `dist/sites/serp.co/products`: `949M`
  - product review HTML logical bytes: `837,729,615`
  - representative pages:
    - `products/youtube-downloader/reviews/index.html`: `287,417` bytes
    - `products/onlyfans-downloader/reviews/index.html`: `303,942` bytes
    - `products/dreamspace.art/reviews/index.html`: `237,965` bytes
    - `products/123movies-downloader/reviews/index.html`: `285,455` bytes
    - `products/beeg-video-downloader/reviews/index.html`: `297,882` bytes
- After Phase 4A local build:
  - `command time -p pnpm build:site -- --site serp.co`: passed, `51.74s`
    real time
  - final file count: `3,636`
  - product detail pages: `3,206`
  - `dist/sites/serp.co`: `904M`
  - `dist/sites/serp.co/products`: `860M`
  - product review HTML logical bytes: `735,049,568`
    (`-102,680,047`, `-12.3%`)
  - representative pages:
    - `products/youtube-downloader/reviews/index.html`: `260,244` bytes
      (`-27,173`, `-9.5%`)
    - `products/onlyfans-downloader/reviews/index.html`: `274,616` bytes
      (`-29,326`, `-9.6%`)
    - `products/dreamspace.art/reviews/index.html`: `204,623` bytes
      (`-33,342`, `-14.0%`)
    - `products/123movies-downloader/reviews/index.html`: `258,323` bytes
      (`-27,132`, `-9.5%`)
    - `products/beeg-video-downloader/reviews/index.html`: `268,963` bytes
      (`-28,919`, `-9.7%`)
- HTML inspection:
  - Own detail content, own resource links, canonical review URL, JSON-LD graph,
    related section, and previous/next section remained present on
    `products/youtube-downloader/reviews/index.html`.
  - Related-listing body probes from `123movies-downloader`,
    `adobe-stock-downloader`, `alamy-downloader`, and
    `alpha-porno-video-downloader` were no longer present in
    `youtube-downloader`'s exported HTML/RSC stream.
- Verification:
  - `pnpm validate:site -- --site serp.co`: passed.
  - `pnpm exec vitest run packages/web-core/src/content-query.test.ts`: passed,
    `5` tests.
  - `pnpm test:repo`: passed, `112` tests.
  - `pnpm typecheck`: passed.
  - `pnpm exec biome check` on touched `web-core` files: passed.
  - `pnpm exec vitest run scripts/serp-co-artifact-links.test.ts`: passed,
    `12` tests.
  - `pnpm audit:sitemaps -- --site serp.co --artifact`: passed,
    `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`.
  - Local shell still warns that the project wants Node `>=24`; this run used
    Node `22.22.0`.

Verification:

- `pnpm exec vitest run scripts/serp-co-artifact-links.test.ts`
- `pnpm audit:sitemaps -- --site serp.co --artifact`
- focused rendering/schema tests if added
- manual diff/inspection of representative detail HTML for canonical, title, schema, and visible sections

Acceptance criteria:

- Product detail page HTML size decreases materially.
- `dist/sites/serp.co/products` decreases materially.
- Sitemap audit remains `0 errors`.
- No route count regression.
- Representative pages preserve visible content and structured data.

QC risks:

- Accidentally changing JSON-LD output or removing SEO content.
- Breaking related product ordering.
- Passing mutable shared objects into client components.
- Creating a smaller client payload while leaving the same large server-rendered inline data elsewhere.

## Phase 4B: Reduce Listing, Category, And Search Payloads

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

## Phase 4C: Deterministic Artifacts And No-Op Deploy Guard

Status: planned.

Goal:

- Make rebuild output stable enough that unchanged source/content can skip target repo commits and avoid unnecessary GitHub Pages deploys.

Why this matters:

- Cached rebuilds and no-op deploys are unsafe if every build embeds fresh timestamps or nondeterministic generated values.
- Category JSON-LD currently uses `new Date().toISOString()` for `datePublished` and `dateModified`, which can force artifact diffs even when source content is unchanged.
- `scripts/deploy-to-repo.sh` already skips commit/push when `git diff --cached --quiet`, but nondeterministic output prevents that guard from helping.

Suggested owner:

- Deterministic-build worker.

Expected write set:

- JSON-LD/date generation code such as category routes
- shared site/content timestamp resolver if needed
- tests proving repeated builds are stable for selected pages
- update this file with no-op deploy evidence

Implementation requirements:

- Replace build-time timestamps with deterministic checked-in source dates where possible.
- For category/listing pages, prefer site config/content `publishedAt`, source file metadata, or a checked-in generated timestamp over current clock time.
- Do not fake freshness with build time.
- Keep schema valid.
- Do not run real local deploys.
- Do not add deploy target overrides.

Verification:

- Run two local `pnpm build:site -- --site serp.co` builds from the same source.
- Compare checksums for representative files and the full `dist/sites/serp.co` tree.
- Run sitemap audit.
- Run `pnpm deploy:site -- --site serp.co --dry-run`.
- After merge, verify that a same-source workflow dispatch either produces no target repo commit or records any remaining deterministic blockers.

Acceptance criteria:

- Repeated same-source local builds produce identical representative page checksums.
- Any remaining nondeterministic files are listed explicitly.
- No-op deploys can be skipped by the existing deploy script when target repo already matches the artifact.

QC risks:

- Changing schema dates in a way that misrepresents content freshness.
- Assuming determinism from a few files while Next build IDs or asset hashes still change.
- Skipping deploy when source changed but output comparison is incomplete.

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
