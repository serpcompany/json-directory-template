# Site Build Config Audit

This audit captures what the current starter already treats as site-configurable, what still appears hardcoded in active surfaces, and what should remain internal to the build engine.

Use this as the working checklist for expanding the site-facing build contract without turning internal implementation details into user inputs.

## Current decision

- `sites/site-config.default.ts` plus `sites/<site-id>/site-config.ts` are the trusted checked-in build contract
- `sites/<site-id>/assets/*` holds canonical checked-in site assets
- `tmp/sites/<site-id>/` is scratch space only and should not become implied source of truth

## Already configurable today

These are already part of the active site/build contract through checked-in site config -> app/build adapters -> `siteConfig`.

### Site identity

- `site.name`
- `site.domain`
- `site.publicUrl`
- `site.description`
- `site.tagline`

### Social and repo links

- `social.githubUrl`
- `social.githubRepoUrl`
- `social.githubIssueOwner`
- `social.githubIssueRepo`
- `social.githubIssuesUrl`
- `social.githubIssueTemplate`
- `social.redditUrl`
- `social.twitterUrl`

### Simple branding

Status note:
- the checked-in site config now treats `drBadge` as a provider payload first
- preferred shape:
  - `branding.drBadge.provider`
  - `branding.drBadge.domain`
  - optional `branding.drBadge.style`
  - optional `branding.drBadge.alt`
- raw `href` / `imageSrc` / `width` / `height` remains compatibility-only for unusual badge providers or migration

- `branding.drBadge`


### Content/data source

- `content.listingSource.kind`
- `content.listingSource.path`
- `content.listingSource.category` for trial product inputs
- `content.listingSource.featuredCount`
- `content.listingSource.publishedAt`

### Optional shell modules

Field-type note:
- the site-facing build contract should explicitly distinguish:
  - booleans: yes/no toggles
  - enums: choose from known options
  - free text: operator-supplied text
  - URLs
  - file references
  - provider payloads/presets
- this matters both for validation and for any future GUI form
- current `features.*` fields are already boolean in code, but the audit should treat the whole config surface this way, not just feature flags

- `features.showCreatorProjects`
- `features.showDeveloperTools`
- `features.showFeaturedGuides`
- `features.showNewsletter`

### Deploy shape

- `deploy.strategy`
- `deploy.repoUrl`
- `deploy.branch`
- `deploy.preserve`

## Field-type pass

This is the current recommended field classification for the active checked-in site config contract.

### Enum

- `version`
- `build.mode`
- `content.listingSource.kind`
- `deploy.strategy`

### Boolean

- `features.showCreatorProjects`
- `features.showDeveloperTools`
- `features.showFeaturedGuides`
- `features.showNewsletter`

### Free text

- `build.artifactDir`
- `site.name`
- `site.domain`
- `site.description`
- `site.tagline`
- `social.githubIssueOwner`
- `social.githubIssueRepo`
- `social.githubIssueTemplate`
- `deploy.branch`
- `deploy.preserve[]`
- `content.listingSource.category`
- `content.listingSource.publishedAt`

### URL

- `site.publicUrl`
- `social.githubUrl`
- `social.githubRepoUrl`
- `social.githubIssuesUrl`
- `social.redditUrl`
- `social.twitterUrl`

### File reference

- `branding.favicon`
- `branding.logo`
- `branding.opengraphImage`
- `content.listingSource.path`

### Provider payload

- `branding.drBadge`

Note:
- `content.listingSource.featuredCount` is still numeric in code.
- keep that as a small structured numeric field, not a free-text UI field.

## Should be added to the site-facing build contract next

These are still effectively hardcoded, inferred, or only partially wired.

### Brand assets

- favicon asset source
- logo asset source
- Open Graph image asset source
- optional OG alt text override
- optional site/share image fallbacks

Status:
- local/url asset references are supported in checked-in site config
- staged asset validation exists
- staged asset application into the build is working for the current favicon/logo/OG image flow
- broader metadata consumers still need to finish reading those staged outputs consistently

### Public brand metadata

- site logo public URL generation
- favicon public URL generation
- brand-specific metadata image selection
- optional theme or brand color values if we decide to expose them

### Homepage and marketing content blocks

- hero secondary copy beyond `tagline`
- newsletter CTA copy
- tools section dataset and text
- communities section links/content
- featured guides section text
- project/github CTA copy on `/projects`

### Legal and trust/contact content

- legal contact identity
- legal contact email/domain values
- trust badges beyond the DR badge
- issue/report/support destinations if they differ from submit destinations

### Search and directory UX copy

- search page description/keywords
- empty state copy for lists/search
- “submit a website” style CTA labels if sites need custom wording
- canonical directory-item vocabulary:
  pick one term for the listed unit (`listing` is the current recommendation) and wash out mixed `website` / `product` wording from active surfaces, docs, analytics labels, and helper names
- generated listing route shape:
  decide whether `/websites/[slug]` remains the durable public route or becomes a configurable route prefix for different site types

### Feed and structured metadata surfaces

- RSS title/description branding
- sitemap/robots related branding where needed
- JSON-LD publisher/logo behavior

Current recommendation:
- keep RSS, sitemap, robots, and JSON-LD generation as starter-owned implementation
- only feed selected brand inputs into them:
  site identity, public URL, staged assets, and selected social links
- do not expose feed/schema wiring itself as direct operator config

## Still hardcoded in active surfaces today

These are the main active areas still worth cleaning up or explicitly deciding to keep as starter defaults.

### Active routes and metadata

- `apps/web/app/projects/page.tsx`
- `apps/web/app/guides/page.tsx`
- `apps/web/app/guides/[slug]/page.tsx`
- `apps/web/app/docs/page.tsx`
- `apps/web/app/(files)/rss.xml/route.ts`
- `apps/web/app/websites/[slug]/page.tsx`
- `apps/web/lib/routes.ts`
- `apps/web/lib/seo/seo-config.ts`
- `apps/web/lib/analytics-helpers.ts`
- `apps/web/lib/website-schema.ts`

### Active components and helpers

- `apps/web/components/sections/tools-section.tsx`
- `apps/web/components/sections/communities-section.tsx`
- `apps/web/components/forms/github-issue-submit-form.tsx`
- `apps/web/components/forms/submit-form-guidelines.tsx`
- `apps/web/components/website/website-docs-section.tsx`
- `apps/web/components/website/website-llms-section.tsx`
- `apps/web/lib/tools.ts`
- `apps/web/lib/seo/seo-config.ts`
- `apps/web/lib/schema.ts`

### Current pattern

These files are not all bugs. Some are starter defaults. The follow-up work is to sort each one into:

- move into checked-in site config
- keep as shared starter default
- move into site-owned content later
- archive/remove from the active starter

Additional naming concern:

- the project currently uses `website`, `websites`, and `product` inconsistently for the same directory item
- that inconsistency affects copy, helper names, analytics payloads, schema names, and the generated detail route
- this should be treated as a first-class cleanup pass, not just copy polish

## First classification pass

This is the current recommendation for the highest-visibility active surfaces.

### Keep as starter defaults

These are useful shared defaults and do not need to become direct operator inputs right away.

- `apps/web/app/projects/page.tsx`
  Keep the page as a starter default, but clean the copy and topic links so they are generic or site-aware enough.
- `apps/web/app/(files)/rss.xml/route.ts`
  Keep as a starter default with branding wired from the site contract and staged assets.
- `apps/web/lib/seo/seo-config.ts`
  Keep as internal translation logic from checked-in site config/site config into metadata, not a direct user input surface.
- `apps/web/lib/schema.ts`
  Keep as internal structured-data generation logic, with only selected content/branding values fed from config.
- `apps/web/components/sections/tools-section.tsx`
  Keep disabled by default unless a later content-owned tools dataset is introduced.

### Better as site-owned content later

These should likely remain part of the product surface, but the actual page messaging/content should eventually be site-owned rather than hardcoded.

- `apps/web/app/guides/page.tsx`
- `apps/web/app/guides/[slug]/page.tsx`
- `apps/web/app/docs/page.tsx`
- `apps/web/components/forms/submit-form-guidelines.tsx`
- `apps/web/components/sections/communities-section.tsx`
  Treat as site-owned content once we decide whether community links should exist at all for a given site.

Reason:
- these are more content/editorial than infrastructure
- trying to flatten them into many raw checked-in site config fields will make the contract noisy and brittle

### Needs decision before more config expansion

These sit in the middle and should be decided explicitly before we add more fields.

- `apps/web/components/sections/tools-section.tsx`
  Likely either:
  - starter default dataset,
  - site-owned content list later,
  - or optional module disabled unless configured
- `apps/web/lib/tools.ts`
  Same decision as above; probably not a free-text checked-in site config surface
- `apps/web/components/forms/github-issue-submit-form.tsx`
  Keep the wiring contract-driven now, but leave most copy as a starter default until submit flows become a first-class product surface
- `apps/web/components/website/website-docs-section.tsx`
- `apps/web/components/website/website-llms-section.tsx`
  These may stay starter-specific if the project remains documentation/llms-aware, or become optional modules if the starter broadens further

### Metadata and marketing decision

Keep as starter defaults for now:
- RSS, sitemap, robots, JSON-LD, and SEO helper wiring
- generic project CTA structure on `/projects`
- generic fallback copy in the submit flow

Better as site-owned content later:
- communities content
- guides/docs editorial messaging
- richer marketing copy blocks beyond the core hero/tagline
- curated tools/community datasets if they remain part of the starter

## Current decision snapshot

These are the decisions to use now so the static pipeline can keep moving without over-expanding checked-in site config.

### Starter defaults

- RSS, sitemap, robots, and structured-data wiring
- generic submit-flow fallback copy
- projects page structure
- tools section as a starter-owned optional/default-disabled module

### Site-owned content later

- communities content
- guides and docs editorial content
- richer marketing blocks beyond the core site identity fields

### Optional modules

- website docs and llms surfaces
  keep them as optional surfaces that appear only when the entry/content supports them
- tools/community datasets
  do not turn these into raw checked-in site config fields; treat them as optional content modules if they stay in the product

## Contract guidance from this pass

Do not turn every active page or text block into checked-in site config.

Preferred layering:

- checked-in site config
  site identity, source inputs, feature flags, deploy target, asset references, selected public metadata
- starter defaults
  generic page structures, fallback copy, feed/SEO wiring logic
- site-owned content later
  guides, docs, communities, richer marketing/editorial blocks, optional curated lists

## Intentionally internal-only

These should not become user/operator-facing checked-in site config fields unless a real need appears.

- `apps/web/out`
- internal temp restore paths
- search index output paths
- auth-route disable/restore mechanics
- Next.js export toggles
- build wrapper implementation details

## Recommended next config-expansion tasks

- Audit active metadata/logo consumers and switch them to staged asset outputs
- Audit `/projects`, `/guides`, `/docs`, RSS, and community/tool surfaces for whether they belong in config or starter defaults
- Decide which remaining marketing/content blocks should be config-driven vs content-driven
