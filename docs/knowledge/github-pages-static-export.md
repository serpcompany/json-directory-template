# GitHub Pages Static Export

Use this when a checked-in site deploys through the current GitHub Pages repo-sync path.

The active flow resolves a checked-in site config from `sites/site-config.default.ts` plus
`sites/<site-id>/site-config.ts` and builds from that canonical site definition.
`serpdownloaders.com` remains the best current proof-site example, but it is not the only supported
site shape.

For the broader pipeline model and the “hosted later, static now” boundary, see [BUILD_PIPELINE.md](/Users/devin/dev/repos/json-directory-template/docs/BUILD_PIPELINE.md).

## Current flow

### 1. Source data

- Default checked-in config: `sites/site-config.default.ts`
- Site checked-in config: `sites/<site-id>/site-config.ts`
- Site-specific source data: `sites/<site-id>/products.json` or the configured listing source path
- Site-owned assets for the current run: `sites/<site-id>/assets/*`
- The active app expects website entries in the `data/listings.json` shape
- `scripts/trial-build.ts` converts adapter-driven product JSON into that website-entry shape during the site build when the site uses that source kind

### 2. Build step

- Run `pnpm build:site -- --site <site-id>`
- `pnpm build:pages` currently aliases the same site-aware build flow
- The build wrapper:
  - loads the checked-in site config
  - prepares the active website JSON input for that site
  - generates a site-aware search index from the active website JSON source
  - fails early if the site config references missing files or invalid inputs
  - sets `STATIC_EXPORT=true`
  - runs the normal app build in export mode
  - writes the final static artifact to `dist/sites/<site-id>`
  - stages supported brand assets from `sites/<site-id>/assets/*` when they are referenced in site config
  - temporarily removes the NextAuth route from the static build surface, then restores temporary overrides after the build

### 3. Output artifact

- The deploy artifact is `dist/sites/<site-id>`
- `apps/web/out` is just the intermediate Next.js export directory
- Do not deploy `.next` output for this workflow

### 4. Workflow deploy path

- Source repo workflow: `.github/workflows/build-and-deploy.yml`
- Workflow input: `site_id`
- Workflow resolves the active run first via `scripts/resolve-build-run.ts`
- Validate job runs `pnpm validate:site`
- Build job runs `pnpm build:site`
- Deploy job downloads the resolved artifact directory
- Deploy job runs `pnpm deploy:site`
- `scripts/deploy-site.ts` loads the deploy target from the resolved checked-in site config and calls `scripts/deploy-to-repo.sh`
- `scripts/deploy-to-repo.sh` syncs the Pages artifact into the target repo, preserves configured target-managed files, and restores the target repo’s Pages workflow from `scripts/templates/target-pages-deploy.yml`

### 5. Target repo publish step

- Target repo: the repo configured in `sites/<site-id>/site-config.ts`
- GitHub Pages is configured there with `build_type: workflow`
- Because of that, the target repo must contain `.github/workflows/deploy.yml`
- The source repo deploy script installs that workflow before pushing
- Once pushed, the target repo’s own Pages workflow uploads the repo root and calls `actions/deploy-pages`

## Required environment values

The checked-in site values now live in:
- `sites/site-config.default.ts`
- `sites/<site-id>/site-config.ts`

Workflow/runtime env is derived from that checked-in site config rather than a bundle of one-off workflow vars.

## Important implementation notes

- The build does not intentionally source missing brand assets from unrelated repo files. Canonical site assets should live in `sites/<site-id>/assets/*`.
- Use `pnpm build:site -- --site <site_id>` for Pages deployments
- GitHub auth still works in normal builds, but the Pages build disables auth-only behavior
- Search and login were adjusted so export mode does not rely on request-time `searchParams`
- JSON-LD rendering was adjusted so export mode does not rely on `headers()`
- The build restores temporary source-data and search-index overrides after export so local repo state stays cleaner
- Validation/build scratch paths are per-run temp directories so overlapping runs do not share the same temp files

## Current constraints

- Next.js redirects are ignored by `output: export`, so Pages builds should rely on real static routes instead of redirect-only behavior
- Request-bound features like `headers()`, request-time `searchParams`, API auth routes, and Server Actions must stay out of the Pages build path
- The target repo uses a workflow-based Pages deploy, so deleting `.github/workflows/deploy.yml` there will leave the public domain stuck on a GitHub 404 even if the static files are present
- If a new route starts failing in `pnpm build:pages`, search first for `headers()`, `cookies()`, `draftMode()`, `use server`, API routes, or route handlers that expect runtime server behavior

## Verification checklist

- Run `pnpm build:site -- --site <site-id>`
- Confirm `dist/sites/<site-id>` contains `index.html`, `404.html`, `.nojekyll`, and any expected domain files such as `CNAME`
- Confirm the target repo contains plain static files at repo root, not `.next`
- Confirm the target repo contains `.github/workflows/deploy.yml`
- Confirm the target repo Pages workflow completes successfully
- Confirm the configured public domain for that site stops returning GitHub’s 404 page

## Current proof-site example

For a concrete real-world example of this flow, use:

- `sites/serpdownloaders.com/site-config.ts`
- `sites/serpdownloaders.com/products.json`
- `dist/sites/serpdownloaders.com`
