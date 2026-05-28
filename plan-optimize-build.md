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

## Current Closeout Assessment

Current assessment, 2026-05-27:

- Phase 3A, the Phase 3B cache config, Phase 3C, Phase 4A, Phase 4B, and
  Phase 4C have gone through PR review and merge. Phase 3A, Phase 3C, Phase 4A,
  Phase 4B, and Phase 4C also have explicit post-merge `serp.co` GitHub
  Actions verification.
- PR #80 merged by rebase into `main` at source SHA
  `71dc41b2b668224147703f392533d135657840ea` after CI passed.
- The automatic push-triggered workflow after merge used the repository
  `SITE_ID` fallback and deployed `serpdownloaders.com`, not `serp.co`. That run
  is useful evidence that generic/shared path pushes still use the repo fallback,
  but it is not `serp.co` acceptance evidence.
- Explicit `workflow_dispatch` run `26494840409` with `site_id=serp.co` built,
  audited, and deployed the merged source. It completed in `5m10s`; `Build
  static site` took `1m57s`; sitemap audit passed with `3464 urls`, `5 sitemap
  files`, `0 errors`, `0 warnings`; deploy targeted
  `https://github.com/serpcompany/serp.co.git`; the target Pages workflow
  completed successfully.
- The first explicit `serp.co` run produced target repo commit `fd7ee35` because
  the target artifact still differed from the newly merged optimized output.
- Same-source explicit `workflow_dispatch` run `26495179828` with
  `site_id=serp.co` completed in `4m24s`; `Build static site` took `2m00s`;
  sitemap audit again passed with `3464 urls`, `5 sitemap files`, `0 errors`,
  `0 warnings`; deploy logged `No changes to deploy.`
- The same-source no-op deploy result confirms Phase 4C's practical target:
  unchanged source/content can now avoid a target repo commit and avoid a new
  target Pages deployment. The `serp.co` target repo remained at commit
  `fd7ee35`, and no new target Pages workflow ran for the no-op dispatch.
- Normal GitHub Actions deploys now keep build, audit, and deploy in one job.
  Log checks on the explicit `serp.co` runs found no normal-path
  `actions/upload-artifact` or `actions/download-artifact` handoff for the
  large static artifact.
- Phase 3B cache evidence is mixed and should not be counted as a material win
  yet. The warm run restored the app-level cache key, but the restored archive
  was effectively empty (`~0 MB`), and Next still emitted `No build cache
  found`. Treat app-level Next cache behavior as remaining follow-up work.
- Phase 3C should not receive more tuning unless CI or QA finds a concrete
  regression. The measured remaining cost is dominated by generated payload size
  and deploy/publish strategy, not finalizer copy mechanics.

Recommended order from here:

1. Treat Phase 3A, Phase 3C, Phase 4A, Phase 4B, and Phase 4C as closed unless
   new CI or QA evidence finds a regression.
2. Investigate Phase 3B as a narrow cache follow-up: verify the actual Next
   cache path for Next `16.1.6`/Turbopack in this repo, explain why the restored
   app cache is only `~0 MB`, and keep any fix limited to `.next/cache`-style
   compiler cache surfaces rather than generated artifacts.
3. Address the GitHub Actions Node 20 deprecation warning for
   `pnpm/action-setup@v4` before the June 2, 2026 default Node 24 switch causes
   avoidable CI noise. This is now implemented and merged in PR #82:
   `pnpm/action-setup` was upgraded to `v6` and `dorny/paths-filter` was
   upgraded to `v4`; the PR and post-merge workflow logs showed those action
   versions with no Node 20 deprecation warning matches.
4. Move Phase 5 from planning to implementation only after review of the
   concrete deploy-strategy proposal in `docs/DEPLOY_STRATEGY_EXIT_PLAN.md`.
   The proposal recommends object storage plus CDN when measured artifact size,
   target repo growth, or Pages limits become the operational blocker.

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

Status: implemented, merged in PR #80, and post-merge `serp.co` CI/deploy verified.

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

Local limitation resolved by post-merge CI:

- This local smoke proves the single-job workflow sequence still has a valid build artifact and deploy target plan.
- The real Phase 3A speed delta had to be measured inside GitHub Actions because the removed `891M` artifact upload/download only happened there.
- Post-merge workflow evidence is now recorded below.

Adversarial QA completed:

- Initial QA found that inherited `NEXT_PUBLIC_SITE_ID` could bypass push-path inference, inherited deploy target override env vars needed explicit clearing in the workflow, `workflow_dispatch` had a non-deployable default, the artifact-action test was too version-specific, and this plan still described Phase 3A as planned.
- Those issues were fixed in the workflow, workflow contract tests, runbook/docs, and this plan.
- Final QA found one low-severity docs gap: `docs/DEPLOY_RUNBOOK.md` did not mention the repo `SITE_ID` fallback for generic push paths. The runbook now documents that fallback.

Post-merge CI verification completed:

- PR #80 merged by rebase into `main` at source SHA
  `71dc41b2b668224147703f392533d135657840ea`.
- Automatic push-triggered workflow run `26494689610` succeeded, but it used the
  repo `SITE_ID` fallback and deployed `serpdownloaders.com`, not `serp.co`.
  That run is not `serp.co` acceptance evidence.
- Explicit `serp.co` workflow dispatch run `26494840409` succeeded:
  - job time: `5m10s`
  - build step: `1m57s`
  - deploy step: `43s`
  - sitemap audit: `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`
  - target repo: `https://github.com/serpcompany/serp.co.git`
  - target commit: `fd7ee35`
  - target repo Pages workflow completed successfully
- Same-source explicit `serp.co` workflow dispatch run `26495179828` succeeded:
  - job time: `4m24s`
  - build step: `2m00s`
  - deploy step: `12s`
  - sitemap audit: `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`
  - deploy result: `No changes to deploy.`
  - target repo remained at `fd7ee35`; no new target Pages workflow ran
- The explicit `serp.co` logs did not contain normal-path
  `actions/upload-artifact` or `actions/download-artifact` usage for the large
  static artifact.

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

Status: closed as not worth more complexity under the current Next
`16.1.6`/Turbopack static-export output shape.

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

Post-merge cache evidence:

- Explicit `serp.co` run `26494840409` restored a Next cache key, but the
  restored archive was only about `742 B`; the post-job step saved a new Next
  cache key.
- Same-source explicit `serp.co` run `26495179828` restored that new Next cache
  key, but the restored archive was still only about `750 B`.
- The same-source run still emitted Next's `No build cache found` warning.
- `Build static site` was `1m57s` on the first explicit `serp.co` run and
  `2m00s` on the same-source rerun, so the current cache evidence does not show
  a material warm-cache win.
- Keep the existing low-risk app-level cache config, but treat Phase 3B as a
  narrow follow-up to verify the actual Next `16.1.6`/Turbopack cache output
  path before adding any more cache complexity.

Local closeout evidence on 2026-05-27:

- A Node `24.13.1` local `CI=true pnpm build:site -- --site serp.co` run passed
  in `44.60s`.
- After that build, `apps/serp.co/.next/cache` was only `12K` and contained only
  `config.json`, `.rscinfo`, and `.previewinfo`.
- The large generated output lived outside the safe cache surface:
  - `apps/serp.co/.next/server`: `1.8G`
  - `apps/serp.co/.next/static`: `4.0M`
  - `apps/serp.co/.next/build`: `788K`
  - `apps/serp.co/out`: `1.8G`
- All active wrapper app `.next/cache` directories were tiny locally:
  `8K` for most wrappers, `12K` for `serp.co`, and `72K` for `starter`.
- These large paths are generated build/deploy output and remain deliberately
  excluded from the GitHub Actions cache.
- Conclusion: the configured `.next/cache` path matches official guidance, but
  this repo's current static-export/Turbopack build does not put meaningful
  reusable compiler output there. Caching `.next/server`, `.next/static`,
  `.next/build`, `apps/*/out`, or `dist/sites/**` would be generated-artifact
  caching with stale-output and restore/upload risks. Do not add deeper cache
  complexity unless a future Next version writes a meaningful safe cache or CI
  evidence changes.

Acceptance criteria:

- If cache hit improves build time materially, keep it and document the observed win.
- If cache hit is negligible, keep only low-risk dependency/app cache config and do not add more cache complexity.
- No generated artifacts are restored from cache into deploy outputs.

Accepted result:

- Phase 3B is closed with no cache path change. Keep the low-risk app-level
  `.next/cache` path for compatibility with official guidance, but do not claim
  a material cache win and do not cache generated artifacts.

QC risks:

- Cache keys that invalidate on every content-only change.
- Cache archives that take longer to upload/download than the work they save.
- Stale build output from caching more than `.next/cache`.

## GitHub Actions Node 20 Warning Cleanup

Status: implemented, merged in PR #82, and CI verified.

Goal:

- Remove the known Node 20 action deprecation warnings from PR Review and the
  shared install action without changing build/deploy behavior.

Implemented result:

- Upgraded `.github/actions/install/action.yml` from `pnpm/action-setup@v4` to
  `pnpm/action-setup@v6`.
- Upgraded `.github/workflows/pr-review.yml` from `dorny/paths-filter@v3` to
  `dorny/paths-filter@v4`.
- Preserved the existing PR Review E2E filter paths:
  `apps/starter/app/**`, `apps/starter/components/**`,
  `apps/starter/lib/**`, `apps/starter/public/**`, `apps/e2e/**`, and
  `packages/ui/**`.
- Added workflow contract tests that assert docs-only and unrelated source paths
  do not match the E2E filter while starter/e2e/UI paths still do.
- No deploy target behavior changed.

Local verification on 2026-05-27 under Node `24.13.1`:

```sh
pnpm exec vitest run scripts/ci-workflow-install.test.ts scripts/pr-review-workflow.test.ts scripts/build-and-deploy-workflow.test.ts scripts/next-config-build-id.test.ts
pnpm test:repo
pnpm exec biome check .github/actions/install/action.yml .github/workflows/pr-review.yml scripts/ci-workflow-install.test.ts scripts/pr-review-workflow.test.ts configs/next/index.ts scripts/next-config-build-id.test.ts
git diff --check
```

Results:

- Focused workflow/build-id tests passed: `4` files, `23` tests.
- `pnpm test:repo` passed: `19` files, `125` tests.
- Biome check passed on the touched managed workflow/test/config files.
- Git diff whitespace check passed.

CI evidence:

- PR #82 merged by rebase into `main` at source SHA
  `81cc702143e505e59f3012002a3787bad4de0a77`.
- PR Review run `26497894024` passed:
  - `Validate`: passed in `2m10s`
  - `Detect changes`: passed in `16s`
  - `E2E Tests`: skipped for this non-E2E path set
  - logs showed `pnpm/action-setup@v6` and `dorny/paths-filter@v4`
  - log checks found no `Node.js 20` or `Node20` deprecation warning matches
- Label PRs run `26497894026` passed.
- Post-merge Build & Deploy run `26498049605` passed in `3m11s`.
  Because this was a generic main push, it used the repo `SITE_ID` fallback and
  deployed `serpdownloaders.com`, not `serp.co`.
- Post-merge Build & Deploy evidence:
  - resolved `PUSH_FALLBACK_SITE_ID=serpdownloaders.com`
  - validated `105` entries
  - built `130` static pages
  - sitemap audit passed: `115 urls`, `4 sitemap files`, `0 errors`,
    `0 warnings`
  - deploy target was `https://github.com/serpcompany/serpdownloaders.com.git`
  - target commit was `7f343aa`
  - target Pages workflow run `26498139524` completed successfully
- Post-merge Release run `26498049599` passed in `1m43s` and also used
  `pnpm/action-setup@v6` with no Node 20 deprecation warning matches.
- The post-merge Build & Deploy run still logged Next's
  `No build cache found` warning and saved a tiny Next cache archive of `747`
  bytes, which supports the Phase 3B decision to avoid deeper generated-output
  caching.

## Phase 3C: Filter Artifact Copy

Status: implemented, merged in PR #80, and post-merge `serp.co` CI build/audit verified.

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

Status: implemented, merged in PR #80, and post-merge `serp.co` CI build/audit verified. Page-size deltas below are local artifact measurements.

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

Status: implemented, merged in PR #80, and post-merge `serp.co` CI build/audit verified. Page-size deltas below are local artifact measurements.

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

Local Phase 4B results, 2026-05-27:

- Source checkpoint before Phase 4B: committed branch
  `build-optimization-phase-3-plus-more` at `0219d67`; worktree was clean
  before edits.
- Baseline artifact, before Phase 4B code changes:
  - final file count: `3,636`
  - product detail pages: `3,206`
  - `dist/sites/serp.co/index.html`: `2,724,424` bytes
  - `dist/sites/serp.co/products/index.html`: `2,723,972` bytes
  - `dist/sites/serp.co/products/best/other/index.html`: `2,423,145` bytes
  - `dist/sites/serp.co/search/index.html`: `386,448` bytes
- After Phase 4B local build:
  - `command time -p pnpm build:site -- --site serp.co`: passed, `40.13s`
    real time
  - final file count: `3,636`
  - product detail pages: `3,206`
  - `dist/sites/serp.co/index.html`: `859,667` bytes
    (`-1,864,757`, `-68.4%`)
  - `dist/sites/serp.co/products/index.html`: `859,215` bytes
    (`-1,864,757`, `-68.5%`)
  - `dist/sites/serp.co/products/best/other/index.html`: `556,331` bytes
    (`-1,866,814`, `-77.0%`)
  - `dist/sites/serp.co/search/index.html`: `386,448` bytes (`0`, `0.0%`)
- Artifact inspection:
  - Representative listing pages no longer contained serialized
    `"content"`, `resourceLinks`, `"images"`, or `"video"` payload keys.
  - Representative listing titles and `/products/<slug>/reviews/` links
    remained present in exported browse HTML.
  - `dist/sites/serp.co/search/search-index.json` remained present.
- Verification:
  - `pnpm exec vitest run packages/web-core/src/content-query.test.ts`:
    passed, `6` tests.
  - `pnpm typecheck`: passed.
  - `pnpm exec biome check` on touched `web-core` files: passed.
  - `pnpm exec vitest run scripts/serp-co-artifact-links.test.ts`: passed,
    `12` tests.
  - `pnpm audit:sitemaps -- --site serp.co --artifact`: passed,
    `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`.
  - Local shell still warns that the project wants Node `>=24`; this run used
    Node `22.22.0`.

Acceptance criteria:

- Large page HTML size decreases.
- Browse/search interactions still work locally.
- No sitemap or route target regressions.

QC risks:

- Client search can regress if only a sliced listing array is available.
- Favorites/sort behavior can regress if the component assumes all listings are present.
- Do not hide content from crawlers without an explicit SEO decision.

## Phase 4C: Deterministic Artifacts And No-Op Deploy Guard

Status: implemented, merged in PR #80, and same-source post-merge no-op deploy verified.

Goal:

- Make rebuild output stable enough that unchanged source/content can skip target repo commits and avoid unnecessary GitHub Pages deploys.

Why this matters:

- Cached rebuilds and no-op deploys are unsafe if every build embeds fresh timestamps or nondeterministic generated values.
- Before Phase 4C, category JSON-LD used `new Date().toISOString()` for `datePublished` and `dateModified`, which could force artifact diffs even when source content was unchanged.
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

Implemented result:

- Source checkpoint before Phase 4C: clean branch
  `build-optimization-phase-3-plus-more` at `80a47a3`.
- Added deterministic collection schema date resolution for category and
  featured pages:
  - `datePublished` is the oldest checked-in listing `publishedAt` in the
    collection.
  - `dateModified` is the newest checked-in listing `publishedAt` in the
    collection.
  - Empty collections fall back to the checked-in site listing source date
    when available.
  - Invalid or rollover date strings are ignored instead of being normalized by
    JavaScript date parsing.
- Exposed `listingSourcePublishedAt` from the resolved runtime site config for
  the empty-collection fallback.
- Removed the category/featured schema use of the current wall-clock time.
- Initial same-source checksum evidence exposed a second nondeterministic
  source: Next generated a different `_next/static/<buildId>` path on each
  build, and that path was referenced throughout exported HTML/RSC payloads.
- Added a deterministic shared Next `generateBuildId` in
  `@thedaviddias/config-next`, derived from site id plus `NEXT_BUILD_ID`,
  `GITHUB_SHA`, `VERCEL_GIT_COMMIT_SHA`, local `git rev-parse HEAD`, or a
  final local fallback. The value is hashed to a stable 20-character id.
  This is intentionally source-revision keyed: it stabilizes reruns of the same
  source revision, but it does not make different commits reuse a build id even
  when their rendered output would otherwise match.
- Added focused tests for category/featured schema dates and deterministic
  Next build id behavior, and added both to `pnpm test:repo`.

Verification:

- Run two local `pnpm build:site -- --site serp.co` builds from the same source.
- Compare checksums for representative files and the full `dist/sites/serp.co` tree.
- Run sitemap audit.
- Run `pnpm deploy:site -- --site serp.co --dry-run`.
- After merge, verify that a same-source workflow dispatch either produces no target repo commit or records any remaining deterministic blockers.

Local verification completed on 2026-05-27 under Node `24.13.1`:

- `pnpm exec vitest run packages/web-core/src/category-routes/schema-dates.test.tsx scripts/next-config-build-id.test.ts`
  - Passed: `10` tests after QA follow-up coverage for invalid dates,
    date-time strings, build-id env precedence, base config wiring, and
    git/local fallback stability.
- `pnpm typecheck`
  - Passed.
- `pnpm test:repo`
  - Passed: `19` test files, `122` tests.
- `pnpm exec biome check configs/next/index.ts scripts/next-config-build-id.test.ts packages/web-core/src/category-routes/category-page.tsx packages/web-core/src/category-routes/featured-page.tsx packages/web-core/src/category-routes/schema-dates.ts packages/web-core/src/category-routes/schema-dates.test.tsx packages/web-core/src/site-config.ts`
  - Passed.
- `pnpm exec biome check package.json`
  - Passed.
- Two same-source local builds:
  - First `command time -p pnpm build:site -- --site serp.co`: passed,
    `39.83s` real time, `3,636` final files.
  - Second `command time -p pnpm build:site -- --site serp.co`: passed,
    `39.90s` real time, `3,636` final files.
  - Full artifact manifest hash matched:
    `17dd0ae4a0e2353bef5af279023f160eee8c41b7ed82d063ba79496a291d61df`.
  - Representative checksums matched for:
    - `index.html`:
      `5478f40e3460123bf3d2498c579740dc743484c13d5a02f63940165bb374e276`
    - `products/index.html`:
      `bcbfe18446aefb209c852bb68fd460fb34b32f1ef56ccfb8becf2e7ee5170caa`
    - `products/best/featured/index.html`:
      `abd85254472e0b4649098e919f3d1398b0d4e210fff853bc3094c5defda85117`
    - `products/best/other/index.html`:
      `134954b3576474fdb749fede48059798cdaa7a84ded4d528ea32a02461523eaf`
    - `products/youtube-downloader/reviews/index.html`:
      `8ee0c6b02435359a4599ee9c524390ef9887bebeaa1e8e7fbe71c45e46c6f458`
    - `sitemap-index.xml`:
      `37a621ee489954fdd84b51bf92f82ae270c20b12ed43a408cdc433ef7c450e81`
    - `sitemaps/categories/1.xml`:
      `22198c16556063f2627b04d2e70e8f37c9744eb4599538978a99a9d3d6e5ee3a`
  - Result: `FULL_TREE_MANIFEST_MATCH=1` and
    `REPRESENTATIVE_CHECKSUMS_MATCH=1`.
- `pnpm exec vitest run scripts/serp-co-artifact-links.test.ts`
  - Passed: `12` tests.
- `pnpm audit:sitemaps -- --site serp.co --artifact`
  - Passed: `3464 urls`, `5 sitemap files`, `0 errors`, `0 warnings`.
- `command time -p pnpm deploy:site -- --site serp.co --dry-run`
  - Passed: target repo `https://github.com/serpcompany/serp.co.git`,
    branch `main`, preserve paths `.github/workflows/deploy.yml` and `CNAME`;
    `0.61s` real time.
- `git diff --check`
  - Passed.

Post-merge no-op deploy verification completed:

- First explicit `serp.co` workflow dispatch after merge, run `26494840409`,
  deployed target repo commit `fd7ee35` because the target artifact still
  differed from the newly optimized output.
- Second explicit `serp.co` workflow dispatch from the same source SHA, run
  `26495179828`, rebuilt and audited successfully, then logged
  `No changes to deploy.`
- The target repo remained at `fd7ee35`, and no new target Pages workflow ran
  for the no-op dispatch.

Remaining nondeterminism/risk:

- The deterministic Next build id is revision-keyed, not output-keyed. A new
  source commit can still change `_next/static/<buildId>` references and force a
  target repo diff even if the rendered pages are otherwise equivalent. Phase
  4C only proves same-source rebuild stability.
- `packages/web-core/src/content-query.ts`,
  `apps/serp.co/content-collections.ts`, and
  `packages/web-core/src/sitemaps.ts` still contain current-time fallback
  paths for missing guide/content/sitemap source dates. They did not affect the
  current `serp.co` artifact in the two-build full-tree comparison because the
  relevant checked-in content has dates or sitemap source dates. If future
  content omits dates, those fallback paths can reintroduce artifact churn and
  should fail validation or use checked-in source dates instead.
- Some runtime/operator/test/archive code still records real event times. Those
  paths are outside the static `serp.co` artifact evidence collected here.
- Post-merge no-op deploy behavior is verified for same-source reruns. A new
  source commit can still legitimately produce a target diff because the
  deterministic Next build id is source-revision keyed.

New-commit churn decision on 2026-05-27:

- Two local Node `24.13.1` builds simulated different source revisions with
  `NEXT_BUILD_ID=phase-churn-a` and `NEXT_BUILD_ID=phase-churn-b`, without
  changing checked-in source.
- The generated build IDs differed:
  - `phase-churn-a`: `b190e64f5fa149c32591`
  - `phase-churn-b`: `b189e96313455a051f22`
- Raw artifact hashes differed because HTML/RSC references include
  `_next/static/<buildId>`:
  - `phase-churn-a` full-tree hash: `35312e7c573769bfb059eb6016c626cd72876014cc7f9fd9637ef4fdb452aaff`
  - `phase-churn-b` full-tree hash: `7c6f8fd22d5de78a8387c76d5c6d88c788a32507db05dd841d5f2d776a26cc21`
  - representative `index.html` and
    `products/youtube-downloader/reviews/index.html` hashes also differed.
- A normalized manifest that replaced the build ID in both file paths and file
  contents matched for both builds:
  `061554e7587eb6f6cea09ce2f5621eacb7e070a1665448dd16715180648092c9`.
- Both builds produced `3,636` final files and `4,017,803` bytes under
  `_next/static/**`.
- `sitemap-index.xml` remained byte-identical:
  `37a621ee489954fdd84b51bf92f82ae270c20b12ed43a408cdc433ef7c450e81`.
- `pnpm audit:sitemaps -- --site serp.co --artifact` passed after the simulated
  new-revision build: `3464 urls`, `5 sitemap files`, `0 errors`,
  `0 warnings`.
- `pnpm exec vitest run scripts/serp-co-artifact-links.test.ts` passed after the
  simulated new-revision build: `12` tests.
- JSON-LD/category dates remained checked-in source dates in representative
  category output, for example `datePublished` and `dateModified` were
  `2026-05-16` for `products/best/other`.
- Decision: keep the source-revision-keyed build ID and accept new-commit
  `_next/static/<buildId>` churn for now. An output-keyed build ID would need to
  hash every deployed asset and every HTML/RSC reference before Next emits final
  paths; this is not proven safe here and could reuse stale asset paths across
  changed output.

Acceptance criteria:

- Repeated same-source local builds produce identical representative page checksums.
- Any remaining nondeterministic files are listed explicitly.
- No-op deploys can be skipped by the existing deploy script when target repo already matches the artifact.

QC risks:

- Changing schema dates in a way that misrepresents content freshness.
- Assuming determinism from a few files while Next build IDs or asset hashes still change.
- Skipping deploy when source changed but output comparison is incomplete.

## Phase 5: Deploy Strategy Exit Plan

Status: decision-ready proposal documented; implementation not started.

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
- current proposal: `docs/DEPLOY_STRATEGY_EXIT_PLAN.md`

Research requirements:

- Compare object storage plus CDN, GitHub Pages artifact deploy, and hosted Next runtime options.
- Preserve static-first build authority unless intentionally moving to runtime rendering.
- Explicitly document how DNS, CNAME, cache headers, rollback, and artifact retention would work.

Acceptance criteria for planning:

- A migration proposal exists with cost, operational risk, rollback plan, and required secrets.
- No real deploy is run.
- No deploy target override is introduced.

Implemented planning result:

- Added `docs/DEPLOY_STRATEGY_EXIT_PLAN.md`.
- Compared current GitHub Pages repo sync, GitHub Pages artifact deploy, object
  storage plus CDN, and hosted Next runtime.
- Recommended object storage plus CDN as the long-term path because it removes
  target Git repo history growth and the GitHub Pages `1 GB` ceiling while
  preserving static-first build authority.
- Documented DNS/CNAME, cache headers, rollback, required secrets, artifact
  retention, cost surfaces, migration sequence, and incident checks.
- Trigger is tied to measured artifact size, target repo size/reliability, and
  Pages publish limits. `serp.co` is already at about `892M`, so this is now a
  planning trigger, not an automatic deploy-script change.
- No deploy scripts or deploy target override patterns were changed.

## Guardrails

- Keep large-site optimization work local until benchmark and artifact checks pass.
- Do not run real deploys from a dirty, unreviewed, unpushed, behind, diverged, or untracked worktree.
- Do not run real deploys unless source work has gone through branch, commit, push, review/merge, then deploy from a clean branch synced with upstream or from GitHub Actions.
- Treat `pnpm deploy`, `pnpm deploy:site`, and target GitHub Pages repo syncs as production-affecting git push operations.
- Do not use deploy target overrides such as `DEPLOY_REPO_URL` or `DEPLOY_BRANCH` unless a same-turn emergency bypass is explicitly approved.
- Preserve the static-export model unless a later phase explicitly changes hosting strategy.
- Prefer changes that are measurable in local build time, static generation time, raw export size, final artifact size, or CI cache hit behavior.
- If a phase cannot prove a measurable win, keep the code simple and document the result instead of stacking more complexity.
