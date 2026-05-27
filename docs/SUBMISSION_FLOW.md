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

For `browserextensions.io`, the public issue inbox and deploy artifact repo is:

```txt
https://github.com/serpcompany/browserextensions.io
```

That repo is an inbox and static artifact host only. It is not canonical listing data.

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

For `browserextensions.io`, accepted listings are edited in:

```txt
sites/browserextensions.io/products.json
```

For starter/default listing-json sites, accepted listings may be edited in the configured
`data/listings.json` source. Always follow the active site's checked-in `content.listingSource`
config.

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
| `sites/browserextensions.io/products.json` | BrowserExtensions.io canonical accepted listing source |

---

## Verification

For BrowserExtensions.io changes:

```bash
pnpm validate:site -- --site browserextensions.io
pnpm build:site -- --site browserextensions.io
```

Then confirm:

- `dist/sites/browserextensions.io/submit/index.html` exists
- the submit page opens `https://github.com/serpcompany/browserextensions.io/issues/new?...`
- the issue title/body include the submitted listing details
- the artifact does not include source maps, secrets, raw `products.json`, raw `listings.json`, or
  submission JSON
