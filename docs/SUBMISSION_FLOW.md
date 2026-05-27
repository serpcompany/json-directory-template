# Submission Flow

Static-friendly GitHub issue intake flow. The public site gathers listing details, builds a
prefilled GitHub issue URL, and sends the submitter to GitHub for manual review.

---

## How it works

1. Submitter fills out `/submit`.
2. The client validates required fields with `react-hook-form`, Zod, and native required controls.
3. The primary `Submit` action builds a prefilled GitHub issue URL from checked-in site config.
4. The browser opens the GitHub issue composer in the configured public issue repo.
5. Maintainers review the public issue.
6. Accepted submissions become normal source changes to the configured checked-in listing source.
7. The source change goes through pull request review, validation, build checks, merge, and the
   existing static deploy flow.

There is no runtime submission database, hosted queue, badge token, or public issue-to-JSON
automation in the static path.

---

## Submit form fields

| Field | Required | Notes |
|---|---|---|
| Name | Yes | Listing display name |
| Website URL | Yes | Must be a valid URL |
| Logo URL | Yes | Public logo asset URL |
| Video URL | Yes | Public video URL, including YouTube URLs |
| Category | Yes | Single primary category |
| Short Description | Yes | One-liner, shown to reviewers |
| Full Description | Yes | Reviewer notes and richer description |
| FAQs | Yes | At least one question and answer pair |
| Resource Links | Yes | At least one label and URL pair |

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

The configured issue repo must be public and have GitHub Issues enabled. The public `/submit`
page redirects visitors to GitHub, so private repos or disabled Issues make the submit flow unusable
for visitors.

The issue inbox may be the same public GitHub Pages artifact repo used by `deploy.repoUrl`. That
repo is an inbox and static artifact host only. It is not canonical listing data.

Active public issue targets:

| Site | Public issue repo | Submit URL |
|---|---|---|
| `browserextensions.io` | `serpcompany/browserextensions.io` | `https://browserextensions.io/submit/` |
| `pornvideodownloaders.com` | `serpcompany/pornvideodownloaders.com` | `https://pornvideodownloaders.com/submit/` |
| `serp.ai` | `serpcompany/serp.ai` | `https://serp.ai/submit/` |
| `serp.co` | `serpcompany/serp.co` | `https://serp.co/submit/` |
| `serp.software` | `serpcompany/serp.software` | `https://serp.software/submit/` |
| `serpdownloaders.com` | `serpcompany/serpdownloaders.com` | `https://serpdownloaders.com/submit/` |

For example, `browserextensions.io` uses:

```txt
https://github.com/serpcompany/browserextensions.io
```

---

## Reviewer safety copy

The generated issue body must make the review boundary explicit:

- submissions are public GitHub issues
- submitters should not include secrets, private credentials, or non-public launch details
- submissions are reviewed manually
- accepted listings are added through the private source repo's normal PR, validation, build, and
  deploy process

---

## Data ownership

The public site must not write submitted data into source files.

Accepted listings are edited in the active site's checked-in listing source. For most active
site-specific builds, that is `sites/<site-id>/products.json`. Always follow the active site's
checked-in `content.listingSource` config.

For starter/default listing-json sites, accepted listings may be edited in the configured
`data/listings.json` source.

Do not write submissions from public issues into:

- `data/listings.json` unless it is the active checked-in source for the maintainer PR
- `sites/browserextensions.io/products.json` outside the normal source PR path
- `data/submissions-*.json`

---

## Files that control the flow

| File | Purpose |
|---|---|
| `packages/web-core/src/forms/github-issue-submit-form.tsx` | Public form and client-side GitHub handoff |
| `packages/web-core/src/github-issue.ts` | Prefilled issue title/body URL builder |
| `sites/site-config.default.ts` | Starter/default issue target config |
| `sites/<site-id>/site-config.ts` | Site-specific issue target and listing source |
| `sites/<site-id>/products.json` | Canonical accepted listing source for active trial-product sites |

---

## Deploy resolution from submissions

Public issue links are also deploy resolver signals for shared-only maintainer PRs.

When a merged PR changes only shared code, `.github/workflows/build-and-deploy.yml` resolves the
site in this order:

1. explicit `workflow_dispatch` `site_id`
2. changed checked-in site paths in the push payload
3. changed checked-in site paths from the associated merged PR
4. associated PR metadata, linked public issue URLs, linked public issue title/body, and commit messages
5. skip deploy when no single checked-in site can be inferred

The resolver only uses checked-in site signals:

- `site.id`
- `site.domain`
- `site.publicUrl`
- configured `social.githubIssueOwner` plus `social.githubIssueRepo`
- configured `social.githubIssuesUrl`

Examples:

- `https://browserextensions.io/products/example` resolves to `browserextensions.io`
- `https://github.com/serpcompany/browserextensions.io/issues/1` resolves to `browserextensions.io`
- a linked issue in `serpcompany/browserextensions.io` resolves to `browserextensions.io` even if
  the submitted product URL in the issue body points to an unrelated domain

Offsite product URLs submitted inside public issues do not define the deploy target. If metadata
matches two concrete sites, the deploy resolver fails and asks for a manual `workflow_dispatch`
run per `site_id`.

---

## Verification

For a submit-intake or accepted-listing change:

```bash
pnpm validate:site -- --site <site-id>
pnpm build:site -- --site <site-id>
pnpm audit:sitemaps -- --site <site-id>
pnpm deploy:site -- --site <site-id> --dry-run
```

Then confirm:

- `dist/sites/<site-id>/submit/index.html` exists
- the submit page opens `https://github.com/<owner>/<repo>/issues/new?...`
- the issue title/body include the submitted listing details
- the artifact does not include source maps, secrets, raw `products.json`, raw `listings.json`, or
  submission JSON
