# Site Config

Use a starter-level `siteConfig` to centralize reusable brand and shell values instead of hardcoding them across the header, footer, metadata, and social links.

Runtime file:

- `apps/web/lib/site-config.ts`

Recommended shape:

```ts
export type SiteConfig = {
  name: string
  domain: string
  tagline: string
  githubUrl: string
  redditUrl: string
  twitterUrl: string
  drBadge?: {
    href: string
    imageSrc: string
    alt: string
    width: number
    height: number
  }
}

export const siteConfig: SiteConfig = {
  name: 'SoftwareGuys',
  domain: 'softwareguys.com',
  tagline: 'Directory of software tools and products',
  githubUrl: 'https://github.com/someorg/softwareguys',
  redditUrl: 'https://reddit.com/r/softwareguys',
  twitterUrl: 'https://x.com/softwareguys',
  drBadge: {
    href: 'https://dr.serp.co/',
    imageSrc: 'https://dr.serp.co/badge/softwareguys.com?style=serp-dr-v3',
    alt: 'Verified DR 52 for softwareguys.com',
    width: 200,
    height: 50
  }
}
```

## Field meanings

| Field | Required | Notes |
|------|------|------|
| `name` | Yes | Main display name for the site. |
| `domain` | Yes | Canonical public domain. |
| `tagline` | Yes | Short descriptive line used in marketing copy and metadata. |
| `githubUrl` | Yes | Repo or org URL used in the shell and docs. |
| `redditUrl` | Yes | Community URL for the site. |
| `twitterUrl` | Yes | Current X or Twitter URL. |
| `drBadge` | No | Optional footer or brand-trust badge object. |
| `drBadge.href` | Yes, if `drBadge` is present | Click target for the badge. |
| `drBadge.imageSrc` | Yes, if `drBadge` is present | Image URL for the badge graphic. |
| `drBadge.alt` | Yes, if `drBadge` is present | Accessible text for the badge image. |
| `drBadge.width` | Yes, if `drBadge` is present | Display width. |
| `drBadge.height` | Yes, if `drBadge` is present | Display height. |

## Usage notes

- Use raw values such as `siteConfig.name` in metadata, links, and plain text rendering.
- Use tiny wrapper components such as `<SiteName />` only when you want a reusable JSX helper.
- Keep the config values plain. Do not store JSX inside the config for basic fields like the site name or tagline.
- Keep this in internal starter documentation, not public `/docs` content.
