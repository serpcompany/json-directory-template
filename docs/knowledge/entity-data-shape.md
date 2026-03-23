# Entity Data Shape

## Where The Shape Lives

- Raw website entry data lives in `data/websites.json`.
- The formal runtime schema for those JSON rows lives in `apps/web/lib/website-schema.ts`.
- The active loader that validates and normalizes those rows for the app lives in `apps/web/lib/content-loader.ts`.

## Current Raw JSON Shape

Use this shape when preparing rows to replace the placeholder data:

```json
{
  "slug": "example-project",
  "name": "Example Project",
  "website": "https://example.com",
  "description": "Short plain-English description of the project.",
  "llmsUrl": "https://example.com/llms.txt",
  "llmsFullUrl": "https://example.com/llms-full.txt",
  "category": "developer-tools",
  "featured": false,
  "priority": "high",
  "publishedAt": "2026-03-22",
  "content": "## Overview\n\nLong-form detail page content in Markdown."
}
```

## Required Fields

- `name`
- `description`
- `category`
- `publishedAt`
- either `website` or `domain`
- either `llmsUrl` or `llmsTxtUrl`

## Optional Fields

- `slug`
- `llmsFullUrl`
- `featured`
- `priority`
- `favicon`
- `isUnofficial`
- `content`

## Formatting Rules

- `publishedAt` must use `YYYY-MM-DD`.
- URLs must be full URLs, including `https://` or `http://`.
- `slug` can be omitted; the loader will generate one from `name`.
- `content` is the long-form body for the detail page. Keep it as plain Markdown unless you specifically need MDX features.

## Detail Page Runtime Shape

After validation and normalization, the website detail page effectively receives:

```ts
type WebsiteDetailPageData = {
  slug: string
  name: string
  website: string
  description: string
  llmsUrl: string
  llmsFullUrl?: string | null
  category: string
  publishedAt: string
  featured?: boolean
  priority?: 'high' | 'medium' | 'low'
  isUnofficial?: boolean
  content?: string
  relatedWebsites?: WebsiteDetailPageData[]
  previousWebsite?: WebsiteDetailPageData | null
  nextWebsite?: WebsiteDetailPageData | null
}
```

## Derived Fields

These are not authored directly in `data/websites.json`:

- `relatedWebsites`
- `previousWebsite`
- `nextWebsite`

They are added in `apps/web/lib/content-loader.ts` when `getWebsiteBySlug()` builds the detail page data.

## Important Notes

- `favicon` exists in the raw JSON today but is not part of the normalized detail-page contract.
- The loader sanitizes HTML out of `description`.
- The loader still normalizes the legacy category slug `integration-automation` to `automation-workflow`.
