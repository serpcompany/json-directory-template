# JSON Directory Template

Static-first starter for directory-style sites.

The current model is:

- checked-in site config under `sites/**`
- checked-in listing data in `data/websites.json`
- static export builds into `dist/sites/<site-id>`
- deploys sync that artifact into a target GitHub Pages repo

## Quick start

Use Node `24` and `pnpm`.

```bash
pnpm install
pnpm dev
```

The default local app runs at `http://localhost:3005`.

## Core commands

```bash
pnpm validate:site -- --site default
pnpm build:site -- --site default
pnpm deploy:site -- --site default
```

Useful repo checks:

```bash
pnpm test:repo
pnpm --filter web exec jest --runInBand
```

## Current source of truth

- site config: `sites/site-config.default.ts` plus `sites/<site-id>/site-config.ts`
- optional site-owned content: `sites/<site-id>/site-content.ts`
- active listing data: `data/websites.json`
- public docs content: `packages/content/data/docs/*.mdx`
- legal content: `packages/content/data/legal/*.mdx`

## Key docs

- [Build Pipeline](./docs/BUILD_PIPELINE.md)
- [Rebrand Runbook](./docs/REBRAND_RUNBOOK.md)
- [Deploy Runbook](./docs/DEPLOY_RUNBOOK.md)
- [Site Config Notes](./docs/knowledge/site-config.md)
- [Static Starter Notes](./docs/knowledge/static-starter-notes.md)

## Current product boundaries

In scope now:

- static directory pages
- optional docs, posts, and network pages
- GitHub-issue-based submit flow
- deterministic build and Pages-style deploy

Out of scope for the active starter:

- hosted auth
- database-backed submissions
- runtime moderation dashboards
- dynamic user accounts as a core build dependency

## Legacy/reference material

This repo still contains some legacy/reference areas from the earlier product direction.

Use [Legacy Reference Boundary](./docs/knowledge/legacy-reference-boundary.md) for the keep/move/rewrite decisions on:

- `packages/content/data/websites/**`
- `apps/e2e/**`
- `websites/**`
- `_archive/**`

Those areas are not the active starter contract unless explicitly called out in the docs above.
