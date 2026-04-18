# Listing Data Shape

## Where The Shape Lives

- Raw listing entry data lives in `data/listings.json`.
- The formal runtime schema for those JSON rows lives in `apps/starter/lib/website-schema.ts`.
- The active loader that validates and normalizes those rows for the app lives in `apps/starter/lib/content-loader.ts`.
- `data/listings.json` is only for the main listing collection. Docs, posts, legal pages, and future first-party tools do not belong in this file.

## Current Raw JSON Shape

Use this shape when preparing rows to replace the placeholder data:

```json
{
  "slug": "example-project",
  "name": "Example Project",
  "website": "https://example.com",
  "description": "Short plain-English description of the project.",
  "category": "developer-tools",
  "featured": false,
  "priority": "high",
  "publishedAt": "2026-03-22",
  "resourceLinks": [
    {
      "label": "Docs",
      "url": "https://example.com/docs"
    }
  ],
  "content": "## Overview\n\nLong-form detail page content in Markdown."
}
```

## Required Fields

- `name`
- `description`
- `category`
- `publishedAt`
- either `website` or `domain`

## Optional Fields

- `slug`
- `featured`
- `priority`
- `favicon`
- `isUnofficial`
- `resourceLinks`
- `content`

## Formatting Rules

- `publishedAt` must use `YYYY-MM-DD`.
- URLs must be full URLs, including `https://` or `http://`.
- `slug` can be omitted; the loader will generate one from `name`.
- `content` is the long-form body for the detail page. Keep it as plain Markdown unless you specifically need MDX features.

## Detail Page Runtime Shape

After validation and normalization, the website detail page effectively receives:

```ts
type ListingDetailPageData = {
  slug: string;
  name: string;
  website: string;
  description: string;
  category: string;
  publishedAt: string;
  featured?: boolean;
  priority?: 'high' | 'medium' | 'low';
  isUnofficial?: boolean;
  resourceLinks?: Array<{
    label: string;
    url: string;
  }>;
  content?: string;
  relatedWebsites?: ListingDetailPageData[];
  previousWebsite?: ListingDetailPageData | null;
  nextWebsite?: ListingDetailPageData | null;
};
```

## Derived Fields

These are not authored directly in `data/listings.json`:

- `relatedWebsites`
- `previousWebsite`
- `nextWebsite`

They are added in `apps/starter/lib/content-loader.ts` when `getWebsiteBySlug()` builds the detail page data.

## Important Notes

- `favicon` exists in the raw JSON today but is not part of the normalized detail-page contract.
- The loader sanitizes HTML out of `description`.
- The loader still normalizes the legacy category slug `integration-automation` to `automation-workflow`.
- The raw field name `website` is kept for compatibility and still means the destination URL for a listing.
- `resourceLinks` is the generic path for optional per-listing docs, support, or example links. Avoid bringing back special `llms.txt`-specific fields.
- The starter's canonical user-facing term is now `listing`, so UI copy and config-backed labels should prefer `listing` even when the underlying JSON field remains `website`.
