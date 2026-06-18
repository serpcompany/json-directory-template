# SERP Downloaders Website Submission Intake Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create temporary intake files for submitted Pages.dev websites so each submitted host can become its own `serpdownloaders.com` directory listing.

**Architecture:** Temporary intake lives under `tmp/sites/serpdownloaders.com/pages-dev-intake/` and is scratch only. Each submitted website uses the submitted host as the listing slug, for example `coomervideodownloader.pages.dev`. Checked-in source changes still belong in `sites/serpdownloaders.com/products.json` only after source-backed title, tagline, and optional detail content are available.

**Tech Stack:** Node 24, pnpm, JSON, `trial-products-json` site adapter.

---

## Source Rules

- Do not map submitted websites to existing downloader product slugs.
- Do not invent product titles, taglines, body copy, FAQs, logos, or related links.
- Preserve duplicate submitted lines in `domains.txt`; collapse duplicate final website records.
- Keep `tmp/**` as scratch intake only.
- Do not edit `records/build-inputs/**`.
- Do not run deploy commands, database commands, `git add`, `git commit`, or `git push`.

## Files

- `tmp/sites/serpdownloaders.com/pages-dev-intake/domains.txt`
  - Raw submitted host list.
- `tmp/sites/serpdownloaders.com/pages-dev-intake/normalized-domains.json`
  - One row per submitted line.
  - `slug` equals the submitted host.
  - `website` equals `https://<submitted-host>`.
- `tmp/sites/serpdownloaders.com/pages-dev-intake/domain-audit.json`
  - One row per unique submitted website.
  - Duplicate `manyvidsvideodownloader.pages.dev` is collapsed.
- `tmp/sites/serpdownloaders.com/pages-dev-intake/website-submissions.json`
  - Minimal unique website records with `slug` and `website`.
- `tmp/sites/serpdownloaders.com/pages-dev-intake/source-requests.md`
  - Remaining source-backed fields needed before final `products.json` merge.

## Submitted Websites

```txt
coomervideodownloader.pages.dev
doodstreamvideodownloader.pages.dev
hdzogvideodownloader.pages.dev
hotmovsvideodownloader.pages.dev
javvideodownloader.pages.dev
luxuretvvideodownloader.pages.dev
manyvidsvideodownloader.pages.dev
manyvidsvideodownloader.pages.dev
onlyfansvideodownloader.pages.dev
pornhatvideodownloader.pages.dev
pornhubvideodownloader.pages.dev
pornonevideodownloader.pages.dev
stripchatvideodownloader.pages.dev
txxxvideodownloader.pages.dev
uporniavideodownloader.pages.dev
whopvideodownloader.pages.dev
xfantazyvideodownloader.pages.dev
xfreehdvideodownloader.pages.dev
xgroovyvideodownloader.pages.dev
youpornvideodownloader.pages.dev
```

## Task 1: Create Tmp Intake Files

**Files:**
- Create or update: `tmp/sites/serpdownloaders.com/pages-dev-intake/domains.txt`
- Create or update: `tmp/sites/serpdownloaders.com/pages-dev-intake/normalized-domains.json`
- Create or update: `tmp/sites/serpdownloaders.com/pages-dev-intake/domain-audit.json`
- Create or update: `tmp/sites/serpdownloaders.com/pages-dev-intake/website-submissions.json`
- Create or update: `tmp/sites/serpdownloaders.com/pages-dev-intake/source-requests.md`

- [ ] **Step 1: Preserve the submitted hosts**

Expected:

- `domains.txt` has 20 non-empty lines.
- `pornhubvideodownloader.pages.dev` appears, not `.pages.de`.
- `manyvidsvideodownloader.pages.dev` appears twice.

- [ ] **Step 2: Normalize every submitted line into a website-submission row**

Expected:

- `normalized-domains.json` has 20 records.
- 19 records have `classification = "website-submission"`.
- 1 record has `classification = "duplicate"` and points back to line 7.
- Every record's `slug` equals its `inputHost`.
- Every record's `website` equals `https://` plus its `inputHost`.

- [ ] **Step 3: Collapse unique website submissions**

Expected:

- `domain-audit.json` has 19 records.
- `website-submissions.json` has 19 records.
- Every unique record has `slug` equal to the submitted host.
- Every unique record has `website` equal to `https://<submitted-host>`.

- [ ] **Step 4: Record missing source-backed fields**

Expected:

- `source-requests.md` lists the fields still needed before final checked-in source changes:
  - `product.title`
  - `product.tagline`
  - optional `content.body`
  - optional `content.faq`
  - optional `relatedLinks`

## Task 2: Validate Tmp Intake

Run:

```bash
node - <<'NODE'
const fs = require('fs')

const base = 'tmp/sites/serpdownloaders.com/pages-dev-intake'
const domains = fs.readFileSync(`${base}/domains.txt`, 'utf8').split('\n').map(line => line.trim()).filter(Boolean)
const normalized = JSON.parse(fs.readFileSync(`${base}/normalized-domains.json`, 'utf8'))
const audit = JSON.parse(fs.readFileSync(`${base}/domain-audit.json`, 'utf8'))
const submissions = JSON.parse(fs.readFileSync(`${base}/website-submissions.json`, 'utf8'))
const errors = []

if (domains.length !== 20) errors.push(`Expected 20 domains, found ${domains.length}`)
if (normalized.length !== 20) errors.push(`Expected 20 normalized rows, found ${normalized.length}`)
if (audit.length !== 19) errors.push(`Expected 19 audit rows, found ${audit.length}`)
if (submissions.length !== 19) errors.push(`Expected 19 website submissions, found ${submissions.length}`)
if (domains.includes('pornhubvideodownloader.pages.de')) errors.push('Incorrect .pages.de host remains')
if (!domains.includes('pornhubvideodownloader.pages.dev')) errors.push('Missing corrected Pornhub .pages.dev host')

const manyVidsCount = domains.filter(host => host === 'manyvidsvideodownloader.pages.dev').length
if (manyVidsCount !== 2) errors.push(`Expected ManyVids duplicate count 2, found ${manyVidsCount}`)

for (const row of normalized) {
  if (row.slug !== row.inputHost) errors.push(`Slug does not match inputHost for line ${row.line}`)
  if (row.website !== `https://${row.inputHost}`) errors.push(`Website does not match inputHost for line ${row.line}`)
}

for (const row of submissions) {
  if (row.website !== `https://${row.slug}`) errors.push(`Submission website does not match slug for ${row.slug}`)
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('website submission tmp intake is valid')
NODE
```

Expected:

```txt
website submission tmp intake is valid
```

## Final Source Merge Gate

Do not modify `sites/serpdownloaders.com/products.json` until each submitted website has source-backed final content for the required trial-product fields.
