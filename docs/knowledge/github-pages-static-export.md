# GitHub Pages Static Export

The `serpdownloaders.com` POC uses GitHub Pages, so the deployable output must be plain static files. The active operator-facing flow now stages raw inputs in `sites/<site-id>/` and generates a `BuildSpec` that owns the build and deploy contract for that run.

Compatibility/reference site definitions can still exist under `records/site-definitions/**`, but they are no longer the intended operator interface.

For the broader pipeline model and the “hosted later, static now” boundary, see [BUILD_PIPELINE.md](/Users/devin/dev/repos/json-directory-template/docs/BUILD_PIPELINE.md).

## Current flow

### 1. Source data

- Operator staging workspace: `sites/serpdownloaders/`
- Build spec: `sites/serpdownloaders/build-spec.json`
- Trial source data for the current run: `sites/serpdownloaders/products.json`
- Compatibility/reference definition: `records/site-definitions/serpdownloaders.json`
- The active app expects website entries in the `data/websites.json` shape
- `scripts/trial-build.ts` converts the trial product JSON into that website-entry shape during the site build

### 2. Build step

- Run `pnpm build-spec:init -- --site serpdownloaders`
- Then run `pnpm build:site -- --spec sites/serpdownloaders/build-spec.json`
- `pnpm build:pages` currently aliases the same site-aware build flow
- The build wrapper:
  - loads the explicit `BuildSpec`
  - or can still derive the same internal contract from a compatibility/reference site definition
  - prepares the active website JSON input for that site
  - generates a site-aware search index from the active website JSON source
  - fails early if the `BuildSpec` still contains placeholder values or references missing staged files
  - sets `STATIC_EXPORT=true`
  - runs the normal app build in export mode
  - writes the final static artifact to `dist/sites/serpdownloaders`
  - stages supported brand assets from `sites/<site-id>/` when they are explicitly referenced in `BuildSpec`
  - temporarily removes the NextAuth route from the static build surface, then restores temporary overrides after the build

### 3. Output artifact

- The deploy artifact is `dist/sites/serpdownloaders`
- `apps/web/out` is just the intermediate Next.js export directory
- Do not deploy `.next` output for this POC

### 4. Workflow deploy path

- Source repo workflow: `.github/workflows/build-and-deploy.yml`
- Workflow inputs:
  `site_id` and optional `build_spec_path`
- Workflow resolves the active run first via `scripts/resolve-build-run.ts`
- Validate job runs `pnpm validate:site`
- Build job runs `pnpm build:site`
- Deploy job downloads the resolved artifact directory
- Deploy job runs `pnpm deploy:site`
- `scripts/deploy-site.ts` loads the deploy target from the resolved `BuildSpec` or compatibility site definition and calls `scripts/deploy-to-repo.sh`
- `scripts/deploy-to-repo.sh` syncs the Pages artifact into the target repo, preserves configured target-managed files, and restores the target repo’s Pages workflow from `scripts/templates/target-pages-deploy.yml`

### 5. Target repo publish step

- Target repo: `serpcompany/serpdownloaders.com`
- GitHub Pages is configured there with `build_type: workflow`
- Because of that, the target repo must contain `.github/workflows/deploy.yml`
- The source repo deploy script now installs that workflow automatically before pushing
- Once pushed, the target repo’s own Pages workflow uploads the repo root and calls `actions/deploy-pages`

## Required environment values

The current POC site values live in `sites/serpdownloaders/site.json`.

Workflow/runtime env is now derived from that checked-in site definition rather than a bundle of one-off workflow vars.

## Important implementation notes

- The build does not intentionally source missing brand assets from unrelated repo files. Operators are expected to stage any required asset files in `sites/<site-id>/`.
- Use `pnpm build:site -- --site <site_id>` for Pages deployments
- GitHub auth still works in normal builds, but the Pages build disables auth-only behavior
- Search and login were adjusted so export mode does not rely on request-time `searchParams`
- JSON-LD rendering was adjusted so export mode does not rely on `headers()`
- The build now restores temporary source-data and search-index overrides after export so local repo state stays cleaner
- Validation/build scratch paths are now per-run temp directories so overlapping runs do not share the same temp files

## Current constraints

- Next.js redirects are ignored by `output: export`, so Pages builds should rely on real static routes instead of redirect-only behavior
- Request-bound features like `headers()`, request-time `searchParams`, API auth routes, and Server Actions must stay out of the Pages build path
- The target repo uses a workflow-based Pages deploy, so deleting `.github/workflows/deploy.yml` there will leave the public domain stuck on a GitHub 404 even if the static files are present
- If a new route starts failing in `pnpm build:pages`, search first for `headers()`, `cookies()`, `draftMode()`, `use server`, API routes, or route handlers that expect runtime server behavior

## Verification checklist

- Run `pnpm build:site -- --site serpdownloaders`
- Confirm `dist/sites/serpdownloaders` contains `index.html`, `404.html`, `.nojekyll`, and `CNAME`
- Confirm the target repo contains plain static files at repo root, not `.next`
- Confirm the target repo contains `.github/workflows/deploy.yml`
- Confirm the target repo Pages workflow completes successfully
- Confirm `https://serpdownloaders.com/` stops returning GitHub’s 404 page
