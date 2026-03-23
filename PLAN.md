# JSON-First Static Starter

## Goal

Turn this repo into a simpler directory starter that keeps the current visual design while trimming app-style runtime features.

## Active Starter Scope

- [x] Local JSON is the primary source of truth for website data
- [x] Homepage, category pages, guides, docs, listing pages, and website detail pages stay active
- [x] Favorites are local-only via `localStorage`
- [x] Submit flow opens a prefilled GitHub issue instead of using auth/server actions
- [x] Analytics are reduced to optional GTM support
- [x] Projects page is static-friendly and no longer calls the GitHub API at runtime
- [x] Runtime site config exists at `apps/web/lib/site-config.ts` for name, domain, social URLs, tagline, and DR badge
- [x] Header, footer, and GitHub CTA links read low-risk site values from runtime config
- [x] Metadata, schema, RSS, robots, and sitemap outputs use centralized site name/domain values
- [x] GitHub issue submit/report flows use centralized repo config instead of hardcoded owner/repo strings
- [x] Hero, search, community, and recently-added UI copy use centralized site name and social values where low-risk
- [x] Active app TypeScript excludes `_archive` so typecheck/build verify the starter, not parked legacy code
- [x] Old app-only workspace packages (`analytics`, `auth`, `api-utils`, `caching`, `security`, `flags`) are no longer part of the active build surface
- [x] First rebrand pass uses neutral directory copy on home, website detail, submit, and favorites without changing routes or data fields
- [x] Legal pages now live under `/legal/*`, with redirects preserved from `/privacy`, `/terms`, and `/cookies`
- [x] FAQ page and footer link removed from the active starter surface
- [x] About page content now lives in a content-backed collection while preserving the existing frontend layout
- [x] Lightweight GitHub auth now supports sign up / sign in without adding a starter database

## Archived Product Features

- [x] Members, profile, settings, community, extension, and old API routes moved to archive
- [x] Supporting auth/profile/member/newsletter/CSRF/OpenPanel components, hooks, actions, and libs moved to archive
- [x] Archive README added to explain what was moved

## Data Shape

- [x] `data/websites.json` regenerated to the new schema:
- [x] `slug`
- [x] `name`
- [x] `website`
- [x] `description`
- [x] `llmsUrl`
- [x] optional `llmsFullUrl`
- [x] `category`
- [x] optional `featured`
- [x] optional `priority`
- [x] `publishedAt`
- [x] Formal website entry schema lives at `apps/web/lib/website-schema.ts`
- [x] JSON website loader validates entries and supports optional long-form `content` for detail pages

## Verification

- [x] Targeted tests pass for local favorites, GitHub issue submit URL generation, and basic smoke rendering
- [x] `pnpm --filter web typecheck`
- [x] `pnpm --filter web build`
- [x] Playwright smoke coverage updated for the static starter routes and flows
- [x] GitHub auth has targeted Jest coverage for login/header behavior
- [x] GitHub auth has Playwright smoke coverage for signed-out redirect and auth flow kickoff
- [x] GitHub Pages static export build works for the serpdownloaders.com POC path
- [x] Trial data from `tmp/serpdownloaders.com/products.json` can be transformed into `data/websites.json`
- [x] Docs explain the GitHub issue submit flow and the active JSON data shapes
- [x] Internal knowledge docs capture the starter site config fields
- [x] Internal knowledge docs capture one representative page per major active and archived surface for later reference
- [x] Internal knowledge docs classify those surfaces into keep/rebrand, reference-only, and drop
- [x] Docs include a rebrand checklist for replacing brand text, assets, links, and legal copy
- [x] Root `package.json` no longer references missing generator scripts
- [x] Internal docs explain the current website/detail-page data contract and schema location
- [x] Internal docs explain why starter GitHub auth uses signed sessions instead of a database
- [x] Internal docs capture the GitHub Pages static-export constraints for this starter

## Follow-Up Ideas

- [x] Add lightweight GitHub auth later if profile attribution becomes important
- [ ] Store public profile overrides in repo data such as `data/users.json`
- [ ] Add a GitHub issue or PR workflow for user-submitted profile/tool updates
