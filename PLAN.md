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

## Archived Product Features

- [x] Login and account routes moved to [`apps/web/_archive`](/Users/devin/dev/repos/json-directory-template/apps/web/_archive)
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

## Verification

- [x] Targeted tests pass for local favorites, GitHub issue submit URL generation, and basic smoke rendering
- [x] `pnpm --filter web typecheck`
- [x] `pnpm --filter web build`
- [x] Playwright smoke coverage updated for the static starter routes and flows
- [x] Docs explain the GitHub issue submit flow and the active JSON data shapes
- [x] Docs include a rebrand checklist for replacing brand text, assets, links, and legal copy

## Follow-Up Ideas

- [ ] Add lightweight GitHub auth later if profile attribution becomes important
- [ ] Store public profile overrides in repo data such as `data/users.json`
- [ ] Add a GitHub issue or PR workflow for user-submitted profile/tool updates
