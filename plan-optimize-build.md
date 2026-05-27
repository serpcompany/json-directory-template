# Build Optimization Plan

## Summary

`serp.co` is slow to rebuild because the site has thousands of product pages and the current static build was generating duplicate product detail routes:

- Canonical route: `/products/[slug]/reviews/`
- Redundant route: `/products/[slug]/`

Before phase 1, Next generated both routes for all 3,206 products, then `scripts/build-site.ts` pruned the unsuffixed route from the final artifact. That meant local build time and raw export size paid for pages that were never deployed.

Phase 1 was tested locally only. No production deploy, target repository sync, `pnpm deploy`, or `pnpm deploy:site` was run.

## Phase 1: Stop Double-Building Detail Pages

Implementation:

- Move the real product detail page implementation into `apps/serp.co/lib/product-detail-route.tsx`.
- Keep `/products/[slug]/reviews/page.tsx` as the only generated product detail route.
- Remove `/products/[slug]/page.tsx` so Next no longer tries to export unsuffixed product detail pages.
- Keep route helpers and public canonical links pointed at `/products/[slug]/reviews/`.

Important implementation note: an attempted parent route with `generateStaticParams()` returning `[]` did not work with `output: export`; Next still rejected `/products/[slug]`. Removing the unsuffixed `page.tsx` route is the compatible fix because the `[slug]` segment can still host the nested `reviews` page.

## Local Benchmark Results

Measured locally on 2026-05-27. The repo reported an engine warning because the shell is using Node `v22.22.0` while the package wants Node `>=24`; both successful builds still completed under the same local environment.

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

## Follow-Up Phases

Recommended next phases, not implemented in phase 1:

1. Cache listing transforms and lookup data so `getWebsites()` and `getWebsiteBySlug()` do not repeatedly normalize and scan thousands of entries during static generation.
2. Change artifact finalization to copy only deployable files instead of copying the full raw export and pruning afterward.
3. Fix CI cache paths so app-level Next caches, such as `apps/serp.co/.next/cache`, are actually reused.
4. Revisit deploy strategy for large sites; `serp.co` is already near the practical limit of GitHub Pages repository-sync deployment.

## Guardrails

- Keep large-site optimization work local until benchmark and artifact checks pass.
- Do not run real deploys from a dirty or unreviewed worktree.
- Treat `pnpm deploy`, `pnpm deploy:site`, and target GitHub Pages repo syncs as production-affecting git push operations.
- Preserve the static-export model unless a later phase explicitly changes hosting strategy.
