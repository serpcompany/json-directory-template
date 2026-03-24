# Site Config

Use a starter-level `siteConfig` to centralize reusable brand and shell values instead of hardcoding them across the header, footer, metadata, and social links.

Important distinction:
- `siteConfig` is the internal runtime shape used by the app
- the operator-facing `BuildSpec` can be simpler than this and may translate provider-style inputs into these runtime fields
- example: `BuildSpec.branding.drBadge` now prefers a provider payload, while `siteConfig.drBadge` still holds the resolved raw badge values the footer renders

Runtime file:

- `apps/web/lib/site-config.ts`

Recommended shape:

```ts
export type SiteConfig = {
  name: string
  domain: string
  description: string
  tagline: string
  githubUrl: string
  githubRepoUrl: string
  githubIssueOwner: string
  githubIssueRepo: string
  githubIssuesUrl: string
  githubIssueTemplate: string
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
  description: 'Directory of software tools and products.',
  tagline: 'Directory of software tools and products',
  githubUrl: 'https://github.com/someorg/softwareguys',
  githubRepoUrl: 'https://github.com/someorg/softwareguys-directory',
  githubIssueOwner: 'someorg',
  githubIssueRepo: 'softwareguys-directory',
  githubIssuesUrl: 'https://github.com/someorg/softwareguys-directory/issues/new/choose',
  githubIssueTemplate: 'submit-website.yml',
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
| `description` | Yes | Long-form default description for metadata and feeds. |
| `tagline` | Yes | Short descriptive line used in marketing copy and metadata. |
| `githubUrl` | Yes | Public GitHub profile or org URL used in the shell. |
| `githubRepoUrl` | Yes | Repository URL used for starter/source links. |
| `githubIssueOwner` | Yes | Owner used by the submit issue helper. |
| `githubIssueRepo` | Yes | Repo used by the submit issue helper. |
| `githubIssuesUrl` | Yes | Repo issues or issue chooser link for report flows. |
| `githubIssueTemplate` | Yes | Issue template filename used by the submit helper. |
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
- The current low-risk consumers are the header, footer, hero section, search titles, GitHub issue helpers, and SEO/feed output files.
- Use tiny wrapper components such as `<SiteName />` only when you want a reusable JSX helper.
- Keep the config values plain. Do not store JSX inside the config for basic fields like the site name or tagline.
- Keep this in internal starter documentation, not public `/docs` content.
