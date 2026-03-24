# Deploy Runbook

The active supported deploy path is `github-pages-repo-sync`.

That means this repo builds a static artifact for one checked-in site and syncs that artifact into a target GitHub Pages repo.

## Prerequisites

Before deploying, confirm:

- the site has checked-in config in `sites/<site-id>/site-config.ts`
- the site defines `deploy.repoUrl`, `deploy.branch`, and `deploy.preserve`
- you are on Node `24`
- the source repo has a `GH_PAT` secret for cross-repo deploys
- the target repo is configured for workflow-based GitHub Pages deploys

## Normal deploy flow

After a brand, content, or listing change:

```bash
pnpm validate:site -- --site <site-id>
pnpm build:site -- --site <site-id>
pnpm deploy:site -- --site <site-id>
```

What each step does:

- `validate:site` fails early on bad checked-in config or invalid listing inputs
- `build:site` creates the final static artifact in `dist/sites/<site-id>`
- `deploy:site` syncs that artifact into the configured target repo

## Dry-run before deploy

Use this to confirm the target repo, branch, preserve paths, and artifact directory without pushing anything:

```bash
pnpm deploy:site -- --site <site-id> --dry-run
```

## GitHub Actions path

The repo workflow is `.github/workflows/build-and-deploy.yml`.

The workflow:

1. resolves the active site from `site_id`
2. runs `pnpm validate:site`
3. runs `pnpm build:site`
4. uploads the resolved artifact
5. runs `pnpm deploy:site`

## Redeploy after a normal content or brand change

For a normal static-site update, the redeploy path is the same as the first deploy:

1. edit checked-in site config, content, assets, or listing data
2. run `pnpm validate:site -- --site <site-id>`
3. run `pnpm build:site -- --site <site-id>`
4. run `pnpm deploy:site -- --site <site-id>` or trigger the workflow
5. verify the target repo workflow and live site

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
