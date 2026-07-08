# Submission Flow

Static-friendly GitHub issue intake flow with badge verification. The public site gathers listing
details, builds a prefilled GitHub issue URL, and sends the submitter to GitHub. Badge verification,
badge-state labels, and verified listing PR creation are handled by a tiny public issue repo
`verify-badge.yml` caller that invokes the central reusable workflow in this repo.

---

## How it works

1. Submitter fills out `/submit`.
2. The client validates required fields with `react-hook-form`, Zod, and native required controls.
3. The primary `Submit` action builds a prefilled GitHub issue URL from checked-in site config.
4. The browser opens the GitHub issue composer in the configured public issue repo.
5. On issue creation, the target repo's `verify-badge.yml` caller auto-runs the central reusable
   workflow and checks the submitter's site
   for a dofollow backlink and adds the `badge-not-verified` label while the check is pending or
   failing.
6. The submitter places the "Featured on [site]" badge on their website.
7. A maintainer (or the submitter) comments `/check-badge` to re-verify.
8. On successful verification, the workflow removes `badge-not-verified`, adds `badge-verified`,
   and creates a PR in the source repo that adds the listing to `sites/<site-id>/products.json`.
9. The generated PR mentions and assigns `@devinschumacher`.
10. The maintainer reviews and merges the PR. The existing `build-and-deploy.yml` workflow builds and deploys
    the site with the new listing.

---

## GitHub issue commands

| Command | Who runs it | What it does |
|---|---|---|
| `/check-badge` | Maintainer or submitter | Fetches the submitter's URL, checks for a dofollow backlink to the directory domain, posts the result, updates `badge-not-verified` / `badge-verified`, and creates or reuses the source PR on success. |

`/approve` is no longer required for the normal path. Badge verification is the approval gate for
creating the listing PR.

### Auto-check on new issues

The target repo `verify-badge.yml` caller also triggers on `issues: opened`, so every new
submission automatically gets a badge check through the central reusable workflow. If the submitter
already has a badge, it's verified immediately. If not, they get instructions and the issue remains
labeled `badge-not-verified`.

---

## Badge verification

### How verification works

1. The workflow fetches the submitter's website URL (server-side, 10s timeout).
2. It searches the HTML for a dofollow `<a href>` link to the exact directory domain
   (e.g. `serp.co`, with optional `www.`).
3. If a backlink is found, the issue gets `badge-verified` and the source PR step runs.
4. If the link is missing, unreachable, or marked `nofollow`, the bot replies with badge embed code
   the submitter can copy-paste and leaves `badge-not-verified` on the issue.

### Badge embed code

The badge snippet links to the listing's detail page and references the site's static SVG badge:

```html
<a href="https://serp.co/products/example.com/reviews/" target="_blank" title="Featured on serp.co">
  <img src="https://serp.co/badge/featured-on-serp.co-light.svg" alt="Featured on serp.co" width="200" height="50" />
</a>
```

Badge SVGs are generated at build time by `scripts/generate-badges.ts` and served as static
assets from each site's `public/badge/` directory. Each site gets light and dark variants.

### Ongoing enforcement

The `check-badges.yml` workflow runs weekly (Monday 9am UTC) and re-checks all published
listings for backlinks. Listings that remove their badge are reported in the cron output.

---

## Verified PR flow

When the badge check succeeds on a new issue or a `/check-badge` rerun:

1. The central reusable badge workflow parses the issue body for: name, URL, category, description,
   logo URL, resource links, and notes.
2. It derives the slug from the product URL hostname (e.g. `https://www.example.com` → `example.com`).
3. It checks `sites/<site-repo>/products.json` on `main`.
4. If that slug already exists, it comments on the issue that the listing already exists and stops
   without creating a branch, changing content, or opening a duplicate PR.
5. If the slug is absent, it creates a branch `listing/<site-repo>/<slug>` in
   `serpcompany/json-directory-template`.
6. It adds the listing entry to `sites/<site-repo>/products.json`.
7. It opens a PR targeting `main`.
8. It assigns the PR to `@devinschumacher`, mentions `@devinschumacher` in the PR body, and
   comments on the source issue with the PR link.

The maintainer reviews and merges the PR. The existing deploy pipeline handles the rest.

### Required secret

The verified PR step requires a `GH_PAT` secret on each site's public issue repo
(e.g. `serpcompany/serp.co`) with access to create branches and PRs in
`serpcompany/json-directory-template`. The caller passes that secret through to the reusable
workflow. Without this secret, badge labels and comments still work, but the workflow fails the PR
step after badge verification and comments that the secret is missing.

---

## Submit form fields

| Field | Required | Notes |
|---|---|---|
| Name | Yes | Listing display name |
| Website URL | Yes | Must be a valid URL |
| Logo URL | Yes | Public logo asset URL |
| Video URL | No | Public video URL, including YouTube URLs |
| Category | Yes | Single primary category |
| Short Description | Yes | One-liner, shown to reviewers |
| Full Description | Yes | Reviewer notes and richer description |
| FAQs | No | Question and answer pairs (max 5) |
| Resource Links | No | Label and URL pairs (max 5) |

---

## GitHub issue target

Each static issue-enabled site config must set these fields together:

```ts
social: {
  githubIssueOwner: 'OWNER',
  githubIssueRepo: 'REPO',
  githubIssuesUrl: 'https://github.com/OWNER/REPO/issues'
}
```

Use `null` for all three fields when a site does not have a public issue inbox ready yet.
Validation rejects partial configuration.

Active public issue targets:

| Site | Public issue repo | Submit URL |
|---|---|---|
| `browserextensions.io` | `serpcompany/browserextensions.io` | `https://browserextensions.io/submit/` |
| `pornvideodownloaders.com` | `serpcompany/pornvideodownloaders.com` | `https://pornvideodownloaders.com/submit/` |
| `serp.ai` | `serpcompany/serp.ai` | `https://serp.ai/submit/` |
| `serp.co` | `serpcompany/serp.co` | `https://serp.co/submit/` |
| `serp.software` | `serpcompany/serp.software` | `https://serp.software/submit/` |
| `serpdownloaders.com` | `serpcompany/serpdownloaders.com` | `https://serpdownloaders.com/submit/` |

Active target workflow rollout matrix:

| Public issue repo | Required workflow | Required secret | Badge assets |
|---|---|---|---|
| `serpcompany/browserextensions.io` | Thin `.github/workflows/verify-badge.yml` caller | `GH_PAT` | `/badge/featured-on-browserextensions.io-{light,dark}.svg` |
| `serpcompany/pornvideodownloaders.com` | Thin `.github/workflows/verify-badge.yml` caller | `GH_PAT` | `/badge/featured-on-pornvideodownloaders.com-{light,dark}.svg` |
| `serpcompany/serp.ai` | Thin `.github/workflows/verify-badge.yml` caller | `GH_PAT` | `/badge/featured-on-serp.ai-{light,dark}.svg` |
| `serpcompany/serp.co` | Thin `.github/workflows/verify-badge.yml` caller | `GH_PAT` | `/badge/featured-on-serp.co-{light,dark}.svg` |
| `serpcompany/serp.software` | Thin `.github/workflows/verify-badge.yml` caller | `GH_PAT` | `/badge/featured-on-serp.software-{light,dark}.svg` |
| `serpcompany/serpdownloaders.com` | Thin `.github/workflows/verify-badge.yml` caller | `GH_PAT` | `/badge/featured-on-serpdownloaders.com-{light,dark}.svg` |

---

## Workflows

| Workflow | Repo | Trigger | Purpose |
|---|---|---|---|
| `verify-badge.yml` | Each site's public repo | `issues: opened`, `issue_comment: /check-badge` | Thin caller for the central reusable badge workflow |
| `reusable-verify-badge.yml` | `json-directory-template` | `workflow_call` | Badge/backlink verification, badge labels, verified listing PR creation |
| `check-badges.yml` | `json-directory-template` | Weekly cron (Monday 9am UTC) | Re-check all published listings for badge presence |
| `build-and-deploy.yml` | `json-directory-template` | Push to main, workflow_dispatch | Build and deploy sites |

### Setting up a new site

To enable the submission + badge flow on a new site repo:

1. Ensure the site's `social.githubIssueOwner`, `social.githubIssueRepo`, and `social.githubIssuesUrl`
   are configured.
2. Ensure the public issue repo has Issues enabled.
3. Set a `GH_PAT` secret on the public issue repo with access to `json-directory-template`.
4. Confirm the site's light and dark badge SVG assets are available under `/badge/`.
5. Run `scripts/generate-badges.ts` when badge assets need to change.
6. Install the thin reusable workflow caller from `scripts/templates/target-verify-badge.yml` in
   the public issue repo as `.github/workflows/verify-badge.yml`. This is workflow-only
   maintenance; it does not require rebuilding or deploying the static site. The caller intentionally
   references `serpcompany/json-directory-template/.github/workflows/reusable-verify-badge.yml@main`
   so future badge logic fixes centralize in this repo.
7. Confirm that `badge-not-verified` /
   `badge-verified` labels are created by the first workflow run.

---

## Files that control the flow

| File | Purpose |
|---|---|
| `packages/web-core/src/forms/github-issue-submit-form.tsx` | Public form and client-side GitHub handoff |
| `packages/web-core/src/github-issue.ts` | Prefilled issue title/body URL builder |
| `packages/web-core/src/verify/submit-verify-page.tsx` | Badge verification page (token-based flow) |
| `packages/web-core/src/verify/copy-snippet.tsx` | Badge embed code with copy button |
| `packages/web-core/src/verify/verify-button.tsx` | Verify button triggering badge scan |
| `packages/web-core/src/website/featured-on-badge-embed-panel.tsx` | Badge embed panel on listing detail pages |
| `packages/web-core/src/website/featured-on-badge-url.ts` | Badge URL and listing URL utilities |
| `scripts/generate-badges.ts` | Build-time badge SVG generation |
| `.github/workflows/reusable-verify-badge.yml` | Central reusable badge verification and verified listing PR workflow |
| `scripts/templates/target-verify-badge.yml` | Thin target repo caller installed as `.github/workflows/verify-badge.yml` |
| `scripts/deploy-to-repo.sh` | Target repo sync script that installs target workflows |
| `apps/starter/app/api/cron/check-badges/route.ts` | Weekly badge presence cron endpoint |
| `sites/<site-id>/site-config.ts` | Site-specific config including badge paths and listing routes |
| `sites/<site-id>/products.json` | Canonical accepted listing source |
| `data/submissions-pending.json` | Pending submission records (token-based flow) |
| `data/submissions-verified.json` | Verified submission records (token-based flow) |

---

## Data ownership

Accepted listings are added to the active site's checked-in listing source via PR. For most
active sites, that is `sites/<site-id>/products.json`. The central reusable badge workflow creates
these PRs automatically after badge verification.

Do not write submissions directly into:

- `data/listings.json` (aggregated output, not a source)
- `sites/<site-id>/products.json` outside the normal PR path

---

## Verification

For a submit-intake or accepted-listing change:

```bash
pnpm validate:site -- --site <site-id>
pnpm build:site -- --site <site-id>
pnpm audit:sitemaps -- --site <site-id>
pnpm deploy:site -- --site <site-id> --dry-run
```
