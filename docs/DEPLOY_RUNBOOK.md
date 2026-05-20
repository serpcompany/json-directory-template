# Deploy Runbook

The active supported deploy path is `github-pages-repo-sync`.

That means this repo builds a static artifact for one checked-in site and syncs that artifact into a target GitHub Pages repo.

Current active checked-in deployable sites include `browserextensions.io`,
`pornvideodownloaders.com`, `serp.ai`, `serp.co`, `serp.software`, and
`serpdownloaders.com`.

## Prerequisites

Before deploying, confirm:

- the site has checked-in config in `sites/<site-id>/site-config.ts`
- the site defines `deploy.repoUrl`, `deploy.branch`, and `deploy.preserve`
- you are on Node `24`
- the source repo has a `GH_PAT` secret for cross-repo deploys
- the target repo is configured for workflow-based GitHub Pages deploys
- source changes have gone through gitflow: branch, commit, push, review/merge
- the deploy is running from GitHub Actions or from a clean local source branch synced with its upstream

## Local verification flow

After a brand, content, or listing change:

```bash
pnpm validate:site -- --site <site-id>
pnpm build:site -- --site <site-id>
pnpm audit:sitemaps -- --site <site-id>
pnpm deploy:site -- --site <site-id> --dry-run
```

What each step does:

- `validate:site` fails early on bad checked-in config or invalid listing inputs
- `build:site` creates the final static artifact in `dist/sites/<site-id>`
- `audit:sitemaps` checks generated XML sitemap files against generated route artifacts
- `deploy:site --dry-run` confirms the target repo, branch, preserve paths, and artifact directory without pushing anything

Do not run a real local deploy while source changes are uncommitted, untracked, unpushed, behind upstream, or diverged from upstream.

## Normal deploy flow

The normal production path is:

1. make the source change on a branch
2. run local verification, including `pnpm deploy:site -- --site <site-id> --dry-run`
3. commit and push the source branch
4. open and merge the PR
5. let `.github/workflows/build-and-deploy.yml` deploy the checked-out source commit
6. verify the target repo workflow and live site

`pnpm deploy`, `pnpm deploy:site`, and target GitHub Pages repo syncs are git push operations. They require explicit user approval and must not be used to push artifacts built from unreviewed local source changes.

## Dry-run before deploy

Use this to confirm the target repo, branch, preserve paths, and artifact directory without pushing anything:

```bash
pnpm deploy:site -- --site <site-id> --dry-run
```

Promotion requirement:

- a site cannot be promoted without a confirmed deploy repo/branch strategy in checked-in config
- promotion review must include a successful `pnpm deploy:site -- --site <site-id> --dry-run`
- docs and runbooks must be updated before the registry change is considered complete
- use [SITE_PROMOTION_CHECKLIST.md](./SITE_PROMOTION_CHECKLIST.md) as the source-of-truth gate

## Local real deploy guard

Local real deploys are blocked unless the source repo is reviewable:

- no uncommitted or untracked changes
- current branch has an upstream tracking branch
- current branch has no unpushed commits
- current branch is not behind or diverged from upstream

GitHub Actions is allowed because it deploys a checked-out commit produced by the repository workflow.

Normal deploys must use the target repo and branch from checked-in site config. `DEPLOY_REPO_URL` and `DEPLOY_BRANCH` are refused unless `ALLOW_DEPLOY_TARGET_OVERRIDE=true` is set for an explicitly approved audited emergency bypass.

## GitHub Actions path

The repo workflow is `.github/workflows/build-and-deploy.yml`.

The workflow:

1. resolves the active site from `site_id`
2. runs `pnpm validate:site`
3. runs `pnpm build:site`
4. runs `pnpm audit:sitemaps`
5. uploads the resolved artifact
6. downloads the artifact into the deploy job
7. runs `pnpm deploy:site` against the checked-in site config deploy target

## Redeploy after a normal content or brand change

For a normal static-site update, the redeploy path is the same as the first deploy:

1. edit checked-in site config, content, assets, or listing data
2. run `pnpm validate:site -- --site <site-id>`
3. run `pnpm build:site -- --site <site-id>`
4. run `pnpm audit:sitemaps -- --site <site-id>`
5. run `pnpm deploy:site -- --site <site-id> --dry-run`
6. commit, push, review, and merge the source change
7. let the workflow deploy or, with explicit approval, run a local real deploy from a clean synced source branch
8. verify the target repo workflow and live site

## Verification checklist

After deploy, check:

- `dist/sites/<site-id>` contains the expected static artifact
- the target repo contains plain static files, not `.next`
- the target repo still contains `.github/workflows/deploy.yml`
- the target repo Pages workflow completes successfully
- the live domain returns the updated site instead of GitHub's 404 page

## Related references

- [BUILD_PIPELINE.md](./BUILD_PIPELINE.md)
- [github-pages-static-export.md](./knowledge/github-pages-static-export.md)
- [site-config.md](./knowledge/site-config.md)
