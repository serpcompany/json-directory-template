# Deploy Runbook

The active supported deploy path is `github-pages-repo-sync`.

That means this repo builds static artifacts for resolved checked-in site
targets, then deploys each artifact through the target strategy in
`sites/<site-id>/site-config.ts`.

Current active checked-in deployable sites include `browserextensions.io`,
`pornvideodownloaders.com`, `serp.ai`, `serp.co`, `serp.software`, and
`serpdownloaders.com`.

## Prerequisites

Before deploying, confirm:

- the site has checked-in config in `sites/<site-id>/site-config.ts`
- the site defines a checked-in `deploy.strategy` and its required target fields
- you are on Node `24`
- GitHub Pages repo-sync sites have the deploy secret required by the source deploy workflow
- submit-enabled target repos have a `GH_PAT` secret that can create PRs in `json-directory-template`
- submit-enabled sites use a public GitHub issue repo with Issues enabled
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
- `deploy:site --dry-run` confirms the target strategy, branch, and artifact directory without pushing anything

Do not run a real local deploy while source changes are uncommitted, untracked, unpushed, behind upstream, or diverged from upstream.

## Normal deploy flow

The normal production path is:

1. make the source change on a branch
2. run local verification, including `pnpm deploy:site -- --site <site-id> --dry-run`
3. commit and push the source branch
4. open and merge the PR
5. let `.github/workflows/build-and-deploy.yml` deploy the checked-out source commit
6. verify the target hosting provider and live site

`pnpm deploy`, `pnpm deploy:site`, and target GitHub Pages repo syncs are push
operations. They require explicit user approval and must not be used to push
artifacts built from unreviewed local source changes.

## Dry-run before deploy

Use this to confirm the target strategy, branch, and artifact directory without
pushing anything:

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

Normal deploys must use the target strategy and branch from checked-in site
config. `DEPLOY_REPO_URL` and `DEPLOY_BRANCH` are refused unless
`ALLOW_DEPLOY_TARGET_OVERRIDE=true` is set for an explicitly approved audited
emergency bypass.

## GitHub Actions path

The repo workflow is `.github/workflows/build-and-deploy.yml`.

The workflow:

1. resolves deploy targets from workflow dispatch `site_id`, push changed paths,
   associated merged PR files, or submission-aware PR metadata
2. runs a matrix over the resolved site targets
3. runs `pnpm validate:site`
4. runs `pnpm build:site`
5. runs `pnpm audit:sitemaps`
6. runs `pnpm audit:forbidden-links`
7. verifies the deploy secret required by the checked-in site strategy
8. runs `pnpm deploy:site` against the checked-in site config deploy target

Workflow dispatch with a concrete `site_id` deploys that site. Workflow dispatch
with `site_id=all` deploys every active checked-in site.

Push changed paths that identify one site deploy that site. Push changed paths
that identify multiple concrete sites deploy those exact sites. Shared-only
pushes with no concrete site signal deploy every active checked-in site. Shared
maintainer PRs may still deploy one site when metadata mentions exactly one
checked-in site domain/public URL or links to exactly one configured public issue
repo. Metadata that matches multiple concrete sites fails and requires manual
workflow dispatch per `site_id`, unless concrete changed paths already identify
the exact deploy targets. Do not add fallback deploy sites through repository
variables.

The generated artifact stays in the same GitHub Actions job workspace between
build, audit, and deploy. Normal deploys do not upload/download the large
artifact between jobs.

## Redeploy after a normal content or brand change

For a normal static-site update, the redeploy path is the same as the first deploy:

1. edit checked-in site config, content, assets, or listing data
2. run `pnpm validate:site -- --site <site-id>`
3. run `pnpm build:site -- --site <site-id>`
4. run `pnpm audit:sitemaps -- --site <site-id>`
5. run `pnpm deploy:site -- --site <site-id> --dry-run`
6. commit, push, review, and merge the source change
7. let the workflow deploy or, with explicit approval, run a local real deploy from a clean synced source branch
8. verify the target provider and live site

## Submit-intake rollout

The public `/submit` GitHub issue intake is active for:

- `browserextensions.io`
- `pornvideodownloaders.com`
- `serp.ai`
- `serp.co`
- `serp.software`
- `serpdownloaders.com`

Each active site's public issue repo is `serpcompany/<site-id>`. These repos must stay public and
must keep Issues enabled because the static submit form opens GitHub's public issue composer.
The target repo badge workflow is a thin caller source-managed in
`scripts/templates/target-verify-badge.yml`; the implementation lives in
`.github/workflows/reusable-verify-badge.yml` and is called at `@main` so badge logic fixes land in
one place. For workflow-only maintenance, install that thin caller into the public issue repo as
`.github/workflows/verify-badge.yml` without rebuilding or deploying static sites. Normal site
deploys also install `.github/workflows/deploy.yml` and `.github/workflows/verify-badge.yml` from
`scripts/templates/` as a safety net. Do not hand-edit divergent target workflow logic as the
long-term fix.

Prefer rolling out submit-intake config changes one site per source PR so review
and live verification stay simple. If a PR changes multiple concrete site paths,
the push deploy resolver deploys those exact sites. Metadata-only multi-site
signals still fail and require manual `workflow_dispatch` per `site_id`.

For each site PR:

1. configure `social.githubIssueOwner`, `social.githubIssueRepo`, and `social.githubIssuesUrl`
2. make the site's `/submit` route render `GitHubIssueSubmitForm`
3. configure the target repo `GH_PAT` secret needed for verified-submission PR creation
4. run local verification with `pnpm deploy:site -- --site <site-id> --dry-run`
5. merge only after PR checks pass
6. let GitHub Actions deploy from `main`
7. verify the target Pages repo run, `submit/index.html`, the live `/submit/` page, and
   `.github/workflows/verify-badge.yml` in the target repo. The workflow should be the thin caller,
   not a copy of the full badge verification logic.

Do not run a local real deploy for submit-intake changes from a dirty, unpushed, or unreviewed
source worktree.

## Verification checklist

After deploy, check:

- `dist/sites/<site-id>` contains the expected static artifact
- `dist/sites/<site-id>/build-info.json` contains the source `siteId`, `sourceSha`,
  `sourceBranch`, and `sourceRepository`
- the target provider contains plain static files, not `.next`
- GitHub Pages repo-sync targets still contain `.github/workflows/deploy.yml`
- submit-enabled targets still contain `.github/workflows/verify-badge.yml`
- the target provider publish completes successfully
- the live domain returns the updated site from the intended provider
- `https://<site-id>/build-info.json` returns HTTP `200`, has the expected `siteId`,
  and has a `sourceSha` matching the deployed source commit

## Related references

- [BUILD_PIPELINE.md](./BUILD_PIPELINE.md)
- [github-pages-static-export.md](./knowledge/github-pages-static-export.md)
- [site-config.md](./knowledge/site-config.md)
