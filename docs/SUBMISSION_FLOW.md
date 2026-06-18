# Submission Flow

Static-friendly GitHub issue intake flow with badge verification. The public site gathers listing
details, builds a prefilled GitHub issue URL, and sends the submitter to GitHub. Badge verification
and listing approval are handled via GitHub issue commands.

---

## How it works

1. Submitter fills out `/submit`.
2. The client validates required fields with `react-hook-form`, Zod, and native required controls.
3. The primary `Submit` action builds a prefilled GitHub issue URL from checked-in site config.
4. The browser opens the GitHub issue composer in the configured public issue repo.
5. On issue creation, the `verify-badge.yml` workflow auto-runs and checks the submitter's site
   for a backlink. If no badge is found, the bot @mentions the submitter with badge embed code
   and placement instructions.
6. The submitter places the "Featured on [site]" badge on their website.
7. A maintainer (or the submitter) comments `/check-badge` to re-verify.
8. On successful verification, the issue gets the `verified` label.
9. A maintainer comments `/approve` to auto-generate a PR in the source repo that adds the
   listing to `sites/<site-id>/products.json`.
10. The maintainer merges the PR. The existing `build-and-deploy.yml` workflow builds and deploys
    the site with the new listing.

---

## GitHub issue commands

| Command | Who runs it | What it does |
|---|---|---|
| `/check-badge` | Maintainer or submitter | Fetches the submitter's URL, checks for a backlink to the directory domain. Posts result as a comment. Adds `verified` label on success. On failure, @mentions submitter with badge embed code and instructions. |
| `/approve` | Maintainer only | Parses listing data from the issue body, creates a branch and PR in `serpcompany/json-directory-template` that adds the entry to `sites/<site-id>/products.json`. Posts PR link as a comment. Adds `approved` label. |

### Auto-check on new issues

The `verify-badge.yml` workflow also triggers on `issues: opened`, so every new submission
automatically gets a badge check. If the submitter already has a badge, it's verified immediately.
If not, they get instructions.

---

## Badge verification

### How verification works

1. The workflow fetches the submitter's website URL (server-side, 10s timeout).
2. It searches the HTML for any link containing the directory domain (e.g. `serp.co`).
3. It also checks for a `data-verify-token` attribute (used by the `/submit/verify` page flow).
4. If a backlink is found, the issue gets the `verified` label.
5. If not found, the bot replies with badge embed code the submitter can copy-paste.

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

## Approve flow

When a maintainer comments `/approve` on a verified issue:

1. The `approve-listing.yml` workflow parses the issue body for: name, URL, category,
   description, logo URL, resource links, and FAQs.
2. It derives the slug from the product URL hostname (e.g. `https://www.example.com` → `example.com`).
3. It creates a branch `listing/<site-repo>/<slug>` in `serpcompany/json-directory-template`.
4. It adds the listing entry to `sites/<site-repo>/products.json`.
5. It opens a PR targeting `main`.
6. It comments on the issue with the PR link and adds the `approved` label.

The maintainer reviews and merges the PR. The existing deploy pipeline handles the rest.

### Required secret

The `/approve` workflow requires a `GH_PAT` secret on each site's public issue repo (e.g.
`serpcompany/serp.co`) with `repo` scope to `serpcompany/json-directory-template`.

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

---

## Workflows

| Workflow | Repo | Trigger | Purpose |
|---|---|---|---|
| `verify-badge.yml` | Each site's public repo | `issues: opened`, `issue_comment: /check-badge` | Badge/backlink verification |
| `approve-listing.yml` | Each site's public repo | `issue_comment: /approve` | Auto-generate listing PR in source repo |
| `check-badges.yml` | `json-directory-template` | Weekly cron (Monday 9am UTC) | Re-check all published listings for badge presence |
| `build-and-deploy.yml` | `json-directory-template` | Push to main, workflow_dispatch | Build and deploy sites |

### Setting up a new site

To enable the submission + badge flow on a new site repo:

1. Copy `verify-badge.yml` and `approve-listing.yml` to the site's `.github/workflows/`.
2. Set a `GH_PAT` secret on the site repo with `repo` scope to `json-directory-template`.
3. Ensure the site's `social.githubIssueOwner` and `social.githubIssueRepo` are configured.
4. Run `scripts/generate-badges.ts` and deploy to generate the badge SVGs.

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
| `apps/starter/app/api/cron/check-badges/route.ts` | Weekly badge presence cron endpoint |
| `sites/<site-id>/site-config.ts` | Site-specific config including badge paths and listing routes |
| `sites/<site-id>/products.json` | Canonical accepted listing source |
| `data/submissions-pending.json` | Pending submission records (token-based flow) |
| `data/submissions-verified.json` | Verified submission records (token-based flow) |

---

## Data ownership

Accepted listings are added to the active site's checked-in listing source via PR. For most
active sites, that is `sites/<site-id>/products.json`. The `/approve` workflow creates these
PRs automatically.

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
