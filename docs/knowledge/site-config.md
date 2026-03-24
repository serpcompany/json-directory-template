# Site Config

Use checked-in site config files under `sites/**` to centralize reusable brand and shell values instead of hardcoding them across the header, footer, metadata, and social links.

Important distinction:
- `sites/site-config.default.ts` and `sites/<id>/site-config.ts` are the checked-in source of truth
- `apps/web/lib/site-config.ts` is the internal app-facing adapter that resolves those checked-in files into the runtime shape the app uses
- example: checked-in `branding.drBadge` prefers a provider payload, while the app-facing `siteConfig.drBadge` still holds the resolved raw badge values the footer renders

Source-of-truth files:

- `sites/site-config.default.ts`
- `sites/<id>/site-config.ts`

Adapter file:

- `apps/web/lib/site-config.ts`

Checked-in source-of-truth shape:

```ts
export type CheckedInSiteConfig = {
  id: string
  version: 1
  site: {
    name: string
    domain: string
    description: string
    publicUrl: string
    tagline: string
  }
  social: {
    githubUrl: string
    githubRepoUrl: string
    githubIssueOwner: string
    githubIssueRepo: string
    githubIssuesUrl: string
    githubIssueTemplate: string
    redditUrl: string
    twitterUrl: string
  }
  branding: {
    drBadge: {
      provider: 'serp-dr'
      domain: string
      style?: 'serp-dr-v3'
      alt?: string
    }
    favicon?: { source: 'local-path'; path: string }
    logo?: { source: 'local-path'; path: string }
    opengraphImage?: { source: 'local-path'; path: string }
  }
  content: {
    listingSource:
      | { kind: 'listing-json'; path: string; outputPath?: string }
      | {
          kind: 'trial-products-json'
          path: string
          outputPath?: string
          category: string
          featuredCount: number
          publishedAt: string
        }
  }
  routes: {
    listingBasePath: string
  }
  features: {
    showAuth: boolean
    showDocs: boolean
    showFavorites: boolean
    showGuides: boolean
    showProjects: boolean
    showCreatorProjects: boolean
    showFeaturedGuides: boolean
    showDeveloperTools: boolean
    showNewsletter: boolean
  }
  deploy?: {
    strategy: 'github-pages-repo-sync'
    repoUrl: string
    branch: string
    preserve: string[]
  }
}
```

## Field meanings

| Field | Required | Notes |
|------|------|------|
| `site.*` | Yes | Main public identity and metadata values for the site. |
| `social.*` | Yes | Public social links and submit/report helper destinations. |
| `branding.drBadge` | Yes | Current trust badge input. Provider-first shape is preferred. |
| `branding.favicon/logo/opengraphImage` | No | Canonical asset references when a site owns those assets. |
| `content.listingSource` | Yes | Declares where the site's listing data comes from. |
| `routes.listingBasePath` | Yes | Controls the public listing route base path. Current default is `websites`. |
| `features.*` | Yes | Controls starter-owned optional surfaces. |
| `deploy.*` | No | Required for deploy runs; omitted only for non-deploy examples. |

## Usage notes

- Put canonical site values in the checked-in `sites/**` config files.
- Use raw resolved values such as `siteConfig.name` in metadata, links, and plain text rendering.
- The current low-risk consumers are the header, footer, hero section, search titles, GitHub issue helpers, and SEO/feed output files.
- Use tiny wrapper components such as `<SiteName />` only when you want a reusable JSX helper.
- Keep the config values plain. Do not store JSX inside the config for basic fields like the site name or tagline.
- Keep this in internal starter documentation, not public `/docs` content.
