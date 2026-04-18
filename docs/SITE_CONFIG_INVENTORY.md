# Site Config Inventory

This document is the source-of-truth inventory for site-facing configuration in this repo.

Use it to answer:

- what is already site-configurable
- what is still hardcoded
- what should become site-configurable next
- what should remain starter-owned or internal-only
- where each item lives in code

This is intentionally broader than naming and URLs. It covers terminology, routes, branding, metadata, copy, content modules, data/build/deploy assumptions, and other hardcoded site-facing behavior that needs to be washed out or classified.

## Current recommendation

- canonical directory-item term: `listing`
- current public route prefix: `routes.listingBasePath` is the checked-in source of truth, and the current starter default is `/listing/[slug]`
- source-of-truth split:
  - checked-in site config under `sites/**` for true site-facing inputs
  - site-owned content for larger page/copy/legal/tool datasets
  - starter defaults for shared implementation behavior
  - internal-only for schema/analytics/helper naming

## Status buckets

- `Configurable now`
- `Should become configurable`
- `Keep as starter default`
- `Keep internal only`
- `Needs product decision`

## 1. Core directory-item terminology

### Recommended canonical term

- `listing`

Why:

- avoids overloading `website`
- avoids ambiguity between website/product/tool/project
- scales if the directory later includes non-website entries

### Current mixed terms to wash out

- `website`
- `websites`
- `product`
- `project`
- `directory entry`
- `member` in analytics/event helpers

### Inventory

| Surface | Status | Recommendation | File references | Notes |
| --- | --- | --- | --- | --- |
| Public route helper names still use `website.*` | Keep internal only | Normalize helper keys toward `listing.*` even though the public contract is already `/listing` and the old `/websites` path is now just a compatibility alias | [routes.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/routes.ts#L6), [routes.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/routes.ts#L41) | Internal naming cleanup |
| Analytics payloads and helper names use `website`, `websites`, and `member` | Keep internal only | Normalize around `listing` or `directory_item`; preserve legacy event names only if analytics continuity matters | [analytics-helpers.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/analytics-helpers.ts#L5), [analytics-helpers.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/analytics-helpers.ts#L54), [analytics-helpers.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/analytics-helpers.ts#L102), [analytics-helpers.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/analytics-helpers.ts#L161) | Internal/event cleanup |
| Schema and loader types use `website` naming | Keep internal only | Normalize schema/type/helper names toward `listing` over time | [website-schema.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/website-schema.ts#L5), [website-schema.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/website-schema.ts#L50), [content-loader.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/content-loader.ts#L12), [content-loader.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/content-loader.ts#L47) | JSON field `website` may still remain if it specifically means the listing destination URL |
| UI copy mixes `website`, `project`, and `directory entry` | Should become configurable | Move visible CTA/copy wording into site-owned copy or config-backed text | [page.tsx](/Users/devin/dev/repos/json-directory-template/apps/starter/app/page.tsx#L16), [search/page.tsx](/Users/devin/dev/repos/json-directory-template/apps/starter/app/search/page.tsx#L15), [search-results.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/search/search-results-route.tsx), [github-issue-submit-form.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/forms/github-issue-submit-form.tsx) | High-visibility naming cleanup |

## 2. Public routes and route prefixes

### Current recommendation

- keep `routes.listingBasePath` as the checked-in source of truth; the current starter default is `listing`
- route prefix is now a checked-in site-config decision through `routes.listingBasePath`

### Inventory

| Surface | Status | Recommendation | File references | Notes |
| --- | --- | --- | --- | --- |
| Listing route base path | Configurable now | Keep `listing` as the current starter default and allow each site to override it through checked-in site config | [types.ts](/Users/devin/dev/repos/json-directory-template/sites/types.ts), [site-config.default.ts](/Users/devin/dev/repos/json-directory-template/sites/site-config.default.ts), [routes.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/routes.ts) | Public URL path now comes from site config |
| Singular redirect `/website/:path*` -> `/websites/:path*` | Keep as starter default | Keep only if the legacy alias is still worth preserving, but treat `/websites` as a compatibility redirect to the configured listing base path rather than a default route | [next.config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/next.config.ts#L70) | Legacy alias |
| Search index URL fallback | Configurable now | Search index generation should keep following `routes.listingBasePath` as the source of truth | [search-index-generator.ts](/Users/devin/dev/repos/json-directory-template/scripts/search-index-generator.ts) | Route coupling removed from hardcoded `/websites` strings |
| Optional routes like auth/docs/guides/projects/favorites | Keep as starter default | Continue treating them as starter-controlled surfaces gated by checked-in site config | [site-config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/site-config.ts), [build-site.ts](/Users/devin/dev/repos/json-directory-template/scripts/build-site.ts) | Export/pruning now works |

## 3. Branding and assets

### Already configurable

| Surface | Status | File references | Notes |
| --- | --- | --- | --- |
| favicon/logo/Open Graph image references | Configurable now | [types.ts](/Users/devin/dev/repos/json-directory-template/sites/types.ts), [site-config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/site-config.ts), [layout.tsx](/Users/devin/dev/repos/json-directory-template/apps/starter/app/layout.tsx#L24) | Asset references are modeled and staged |
| DR badge provider payload | Not active | n/a | Remove or reintroduce only when a real badge feature lands; the active checked-in site-config contract does not currently expose this surface |

### Should become configurable next

| Surface | Status | File references | Notes |
| --- | --- | --- | --- |
| Brand-specific metadata image selection and fallbacks | Should become configurable | [seo-config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/seo/seo-config.ts#L12), [schema.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/schema.ts#L88) | Some consumers still need to be fully generalized |

## 4. Site identity and metadata

### Already configurable

| Surface | Status | File references | Notes |
| --- | --- | --- | --- |
| `site.name`, `site.domain`, `site.publicUrl`, `site.description`, `site.tagline` | Configurable now | [site-config.default.ts](/Users/devin/dev/repos/json-directory-template/sites/site-config.default.ts), [site-config.ts](/Users/devin/dev/repos/json-directory-template/sites/serpdownloaders.com/site-config.ts), [site-config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/site-config.ts) | Core site identity is in the active contract |
| Social and repo links | Configurable now | [site-config.default.ts](/Users/devin/dev/repos/json-directory-template/sites/site-config.default.ts), [site-config.ts](/Users/devin/dev/repos/json-directory-template/sites/serpdownloaders.com/site-config.ts), [site-config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/site-config.ts) | Already site-configurable |

### Keep as starter default

| Surface | Status | File references | Notes |
| --- | --- | --- | --- |
| SEO metadata generation logic | Keep as starter default | [seo-config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/seo/seo-config.ts#L62), [seo-config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/seo/seo-config.ts#L132) | Feed with config values, but keep logic internal |
| Feed/schema wiring | Keep as starter default | [rss.xml/route.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/app/(files)/rss.xml/route.ts#L19), [schema.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/schema.ts#L88) | Selected inputs only |

### Should become configurable next

| Surface | Status | File references | Notes |
| --- | --- | --- | --- |
| User-facing metadata copy that still says `website directory` or similar | Should become configurable | [seo-config.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/seo/seo-config.ts#L47), [category-seo.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/seo/category-seo.ts#L25) | Better as site-facing labels/keywords, not hardcoded copy |

## 5. Navigation, shell, and CTA copy

### Already configurable

| Surface | Status | Recommendation | File references | Notes |
| --- | --- | --- | --- | --- |
| Primary listing terminology and submit CTA copy for core home/search/submit surfaces | Configurable now | Keep using checked-in `copy.*` fields for high-traffic wording and expand only when a site truly needs larger custom marketing blocks | [site-config.default.ts](/Users/devin/dev/repos/json-directory-template/sites/site-config.default.ts), [site-copy.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/site-copy.ts), [hero-section.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/sections/hero-section.tsx), [search-results.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/search/search-results-route.tsx), [github-issue-submit-form.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/forms/github-issue-submit-form.tsx), [layout.tsx](/Users/devin/dev/repos/json-directory-template/apps/starter/app/submit/layout.tsx) | Current contract: `copy.listingName.singular`, `copy.listingName.plural`, `copy.submitLabel` |

| Surface | Status | Recommendation | File references | Notes |
| --- | --- | --- | --- | --- |
| Header CTA and nav labels | Needs product decision | Track explicitly; may stay starter default or become site copy config | [header.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/layout/header.tsx), [site-copy.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/site-copy.ts) | High-visibility shell copy |
| Footer marketing/nav labels and links | Should become configurable | Make site content/config or intentionally freeze as starter default | [footer.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/layout/footer.tsx) | Currently hardcoded |
| Homepage hero marketing copy beyond the primary listing/submit labels | Should become configurable | Keep the new terminology/CTA on `copy.*`, but move longer hero marketing copy to site-owned content or richer config blocks if sites start diverging | [hero-section.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/sections/hero-section.tsx) | Primary listing count label and submit CTA now follow checked-in copy |
| Newsletter section copy | Should become configurable | Move to site-owned content or config-backed copy blocks | [newsletter-section.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/sections/newsletter-section.tsx) | Still starter pitch copy |
| Search page marketing copy beyond the primary listing/submit labels | Should become configurable | Keep the new terminology/submit wording on `copy.*`, but move any site-specific search marketing copy into richer site-owned content if needed | [search/page.tsx](/Users/devin/dev/repos/json-directory-template/apps/starter/app/search/page.tsx), [search-results.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/search/search-results-route.tsx) | Primary search empty-state terminology now follows checked-in copy |
| Legacy `/websites` redirect shell page copy | Should become configurable | Keep the redirect behavior if needed, but avoid baking route-specific wording into metadata/copy without site-level control now that `/websites` is a compatibility alias, not the public default | [page.tsx](/Users/devin/dev/repos/json-directory-template/apps/starter/app/websites/page.tsx#L5) | Public route wording still starter-owned |

## 6. Content modules and optional surfaces

| Surface | Status | Recommendation | File references | Notes |
| --- | --- | --- | --- | --- |
| External resources dataset and copy | Site-owned content now | Keep this as the site-owned `externalResources` module; reserve `/tools` for future first-party utility pages instead of reusing this naming | [external-resources-section.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/sections/external-resources-section-route.tsx), [external-resources.ts](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/external-resources.ts), [site-content.default.ts](/Users/devin/dev/repos/json-directory-template/sites/site-content.default.ts) | Current surface is outbound/reference links, not future first-party tool pages |
| Communities, guides, docs, projects, website-doc/llms sections | Keep as starter default for now | Treat as optional modules with separate site-owned content decisions later | [site-build-config-audit.md](/Users/devin/dev/repos/json-directory-template/docs/knowledge/site-build-config-audit.md) | Already classified at high level |
| About page structure | Keep as starter default | Keep implementation, let content remain site-owned | [about/page.tsx](/Users/devin/dev/repos/json-directory-template/apps/starter/app/about/page.tsx#L17) | Good current pattern |

## 7. Legal, trust, and support surfaces

| Surface | Status | Recommendation | File references | Notes |
| --- | --- | --- | --- | --- |
| Privacy and terms content with hardcoded brand/domain/email assumptions | Should become configurable | Move to site-owned content or explicit config-backed content source | [privacy.mdx](/Users/devin/dev/repos/json-directory-template/packages/content/data/legal/privacy.mdx), [terms.mdx](/Users/devin/dev/repos/json-directory-template/packages/content/data/legal/terms.mdx), [content-loader.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/content-loader.ts#L400) | High-priority gap |
| Submit/report/support destinations and issue template assumptions | Needs product decision | Keep in config inventory until submit flow direction is locked | [site-config.default.ts](/Users/devin/dev/repos/json-directory-template/sites/site-config.default.ts), [github-issue-submit-form.tsx](/Users/devin/dev/repos/json-directory-template/packages/web-core/src/forms/github-issue-submit-form.tsx:27) | Tied to submit workflow direction |

## 8. Data, search, categories, and listing schema assumptions

| Surface | Status | Recommendation | File references | Notes |
| --- | --- | --- | --- | --- |
| `content.listingSource`, `listing-json`, `trial-products-json` naming | Keep as current operator contract for now | Keep the checked-in source-kind names explicit until a broader product rename is actually needed; avoid treating the adapter path as the default maintainer story in onboarding docs | [types.ts](/Users/devin/dev/repos/json-directory-template/sites/types.ts), [site-config.ts](/Users/devin/dev/repos/json-directory-template/sites/serpdownloaders.com/site-config.ts) | Operator-facing terminology should stay factual, but not proof-site-first |
| Category taxonomy and labels | Keep as starter default for now | Keep one shared canonical taxonomy for the starter, then decide later whether sites can override or subset it | [categories.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/categories.ts) | Submit flow now derives options from this source instead of duplicating a subset |
| Category normalization special case | Keep internal only | Track and review `integration-automation` -> `automation-workflow` rule | [website-schema.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/website-schema.ts) | Hidden taxonomy rule |
| Search index contract | Keep as starter default for now | Current contract is generated from listing JSON into `/search/search-index.json` with canonical `url` ownership in each record; clients should consume that URL instead of rebuilding it | [search-index-generator.ts](/Users/devin/dev/repos/json-directory-template/scripts/search-index-generator.ts), [search-index.ts](/Users/devin/dev/repos/json-directory-template/apps/starter/lib/search-index.ts), [site-config.ts](/Users/devin/dev/repos/json-directory-template/scripts/site-config.ts) | Search index output now targets the resolved wrapper app's `public/search` directory; record shape remains `category`, `content`, `description`, `name`, `slug`, `url`, `website` |

## 9. Build and deploy assumptions

| Surface | Status | Recommendation | File references | Notes |
| --- | --- | --- | --- | --- |
| Workflow `site_id` input and local `default` fallback | Needs product decision | Decide whether the local default site should continue to exist or whether all flows should require an explicit site id | [build-and-deploy.yml](/Users/devin/dev/repos/json-directory-template/.github/workflows/build-and-deploy.yml), [resolve-build-run.ts](/Users/devin/dev/repos/json-directory-template/scripts/resolve-build-run.ts), [site-config.ts](/Users/devin/dev/repos/json-directory-template/scripts/site-config.ts) | Transition-state workflow model |
| Target repo preserve/install policy (`CNAME`, Pages workflow) | Keep as starter default for now | Keep explicit and documented until another deploy strategy exists | [deploy-to-repo.sh](/Users/devin/dev/repos/json-directory-template/scripts/deploy-to-repo.sh) | Current Pages-factory assumption |
| `github-pages-repo-sync` as only deploy strategy | Keep as starter default for now | Fine for current scope; document as intentional | [deploy-site.ts](/Users/devin/dev/repos/json-directory-template/scripts/deploy-site.ts) | Future extension point only |

## 10. Follow-up issue mapping

- `#19` remote build-config assets via staged local downloads
- `#21` upstream placeholder-route audit
- `#22` restore placeholder/demo routes to real pages
- `#23` categories and site index
- `#24` broaden from URL cleanup into a full hardcoded-surface audit and terminology/config inventory pass
  source of truth:
  [Issue #24](https://github.com/serpcompany/json-directory-template/issues/24)
