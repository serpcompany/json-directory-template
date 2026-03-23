# GitHub Pages Static Export

The `serpdownloaders.com` POC uses GitHub Pages, so the deployable output must be plain static files from `apps/web/out`.

## Current flow

### 1. Source data

- Trial source data currently lives at `tmp/serpdownloaders.com/products.json`
- The active app still expects `data/websites.json`
- `scripts/trial-build.ts` converts the trial product JSON into the website JSON shape used by the app

### 2. Build step

- Run `pnpm build:pages`
- That command calls `scripts/build-pages-site.ts`
- The build wrapper:
  - optionally rebuilds `data/websites.json` from `TRIAL_SOURCE_JSON`
  - sets `STATIC_EXPORT=true`
  - runs the normal app build in export mode
  - writes `.nojekyll`, `404.html`, and `CNAME` into `apps/web/out`
  - temporarily removes the NextAuth route from the static build surface, then restores it after the build

### 3. Output artifact

- The deploy artifact is `apps/web/out`
- This is what should be pushed or uploaded for Pages
- Do not deploy `.next` output for this POC

### 4. Workflow deploy path

- Source repo workflow: `.github/workflows/build-and-deploy.yml`
- Build job runs `pnpm build:pages`
- Deploy job downloads the artifact into `apps/web/out`
- Deploy job runs `scripts/deploy-to-repo.sh`
- `scripts/deploy-to-repo.sh` syncs the Pages artifact into the target repo and also restores the target repo’s Pages workflow from `scripts/templates/target-pages-deploy.yml`

### 5. Target repo publish step

- Target repo: `serpcompany/serpdownloaders.com`
- GitHub Pages is configured there with `build_type: workflow`
- Because of that, the target repo must contain `.github/workflows/deploy.yml`
- The source repo deploy script now installs that workflow automatically before pushing
- Once pushed, the target repo’s own Pages workflow uploads the repo root and calls `actions/deploy-pages`

## Required environment values

The current POC build uses these site overrides:

- `SITE_NAME=SERP Downloaders`
- `SITE_DOMAIN=serpdownloaders.com`
- `SITE_DESCRIPTION=Directory of download-focused browser tools.`
- `SITE_TAGLINE=Download-focused product directory`
- `SITE_GITHUB_URL=https://github.com/serpcompany`
- `SITE_GITHUB_REPO_URL=https://github.com/serpcompany/json-directory-template`
- `SITE_GITHUB_ISSUE_OWNER=serpcompany`
- `SITE_GITHUB_ISSUE_REPO=json-directory-template`
- `SITE_GITHUB_ISSUES_URL=https://github.com/serpcompany/json-directory-template/issues/new/choose`

## Important implementation notes

- Use `pnpm build:pages` instead of the normal `pnpm build` flow for Pages deployments
- GitHub auth still works in normal builds, but the Pages build disables auth-only behavior
- Search and login were adjusted so export mode does not rely on request-time `searchParams`
- JSON-LD rendering was adjusted so export mode does not rely on `headers()`

## Current constraints

- Next.js redirects are ignored by `output: export`, so Pages builds should rely on real static routes instead of redirect-only behavior
- Request-bound features like `headers()`, request-time `searchParams`, API auth routes, and Server Actions must stay out of the Pages build path
- The target repo uses a workflow-based Pages deploy, so deleting `.github/workflows/deploy.yml` there will leave the public domain stuck on a GitHub 404 even if the static files are present
- If a new route starts failing in `pnpm build:pages`, search first for `headers()`, `cookies()`, `draftMode()`, `use server`, API routes, or route handlers that expect runtime server behavior

## Verification checklist

- Run `pnpm build:pages`
- Confirm `apps/web/out` contains `index.html`, `404.html`, `.nojekyll`, and `CNAME`
- Confirm the target repo contains plain static files at repo root, not `.next`
- Confirm the target repo contains `.github/workflows/deploy.yml`
- Confirm the target repo Pages workflow completes successfully
- Confirm `https://serpdownloaders.com/` stops returning GitHub’s 404 page
