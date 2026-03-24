# Site Config

Use checked-in site config files under `sites/**` to centralize reusable brand and shell values instead of hardcoding them across the header, footer, metadata, and social links.

Important distinction:

- `sites/site-config.default.ts` and `sites/<id>/site-config.ts` are the checked-in source of truth
- `sites/site-config.default.ts` is the full starter config, while `sites/<id>/site-config.ts` should stay as a sparse override-only file
- `apps/web/lib/site-config.ts` is the internal app-facing adapter that resolves those checked-in files into the runtime shape the app uses
- `apps/web/lib/site-copy.ts` is the small wording helper that turns checked-in copy fields into reusable UI labels such as "All Listings" and "Submit a Listing"
- example: checked-in `branding.drBadge` prefers a provider payload, while the app-facing `siteConfig.drBadge` still holds the resolved raw badge values the footer renders

Source-of-truth files:

- `sites/site-config.default.ts`
- `sites/<id>/site-config.ts`

Recommended authoring rule:

- add new configurable fields to `sites/types.ts`
- set the default value once in `sites/site-config.default.ts`
- only add the field to `sites/<id>/site-config.ts` when that site needs a non-default override
- let the central resolver merge defaults plus overrides before validation

Adapter file:

- `apps/web/lib/site-config.ts`
- `apps/web/lib/site-copy.ts`
- `apps/web/lib/site-content.ts`
- `apps/web/lib/network-links.ts`

Site-owned content boundary:

- keep reusable build/runtime contract in `sites/site-config.default.ts` plus `sites/<id>/site-config.ts`
- keep site-specific optional modules and datasets in `sites/site-content.default.ts` plus `sites/<id>/site-content.ts`
- use the site-content layer for things like external tool cards or optional listing CLI install mappings that are too site-specific to belong in the shared starter contract
- default site content should stay empty/safe so enabling a starter feature does not automatically ship old llms-specific residue

Terminology rule:

- use `listing` as the canonical user-facing directory-item term in starter copy and config-backed labels
- keep `routes.listingBasePath` configurable, with `listing` as the current starter default public path
- keep public category pages at `/categories/[slug]`
- keep public posts at `/posts/[slug]` when the optional editorial surface is enabled
- keep `routes.docsBasePath`, `routes.listingBasePath`, and `routes.networkBasePath` unique; do not reuse one public base path for another
- treat `/posts`, `/categories`, and reserved `/tools` as starter-owned paths that checked-in route base config cannot override
- keep raw/internal names like `website`, `websites`, and `Website*` only where they still describe compatibility fields or internal implementation details
- the raw JSON field `website` still specifically means the listing destination URL; that field does not force the UI copy to say `website`
- keep `routes.projects` and `website.*` as internal compatibility route keys in code for now, but treat `network` and `listing` as the public product concepts

Checked-in source-of-truth shape:

```ts
export type CheckedInSiteConfig = {
  id: string;
  version: 1;
  site: {
    name: string;
    domain: string;
    description: string;
    publicUrl: string;
    tagline: string;
  };
  social: {
    githubUrl: string;
    githubRepoUrl: string;
    githubIssueOwner: string;
    githubIssueRepo: string;
    githubIssuesUrl: string;
    githubIssueTemplate: string;
    redditUrl: string;
    twitterUrl: string;
  };
  branding: {
    drBadge: {
      provider: 'serp-dr';
      domain: string;
      style?: 'serp-dr-v3';
      alt?: string;
    };
    favicon?:
      | { source: 'local-path'; path: string }
      | { source: 'url'; url: string };
    logo?:
      | { source: 'local-path'; path: string }
      | { source: 'url'; url: string };
    opengraphImage?:
      | { source: 'local-path'; path: string }
      | { source: 'url'; url: string };
  };
  content: {
    listingSource:
      | { kind: 'listing-json'; path: string; outputPath?: string }
      | {
          kind: 'trial-products-json';
          path: string;
          outputPath?: string;
          category: string;
          featuredCount: number;
          publishedAt: string;
        };
  };
  copy: {
    docsLabel: string;
    listingName: {
      singular: string;
      plural: string;
    };
    networkLabel: string;
    submitLabel: string;
  };
  routes: {
    docsBasePath: string;
    listingBasePath: string;
    networkBasePath: string;
  };
  features: {
    showAuth: boolean;
    showDocs: boolean;
    showFavorites: boolean;
    showGuides: boolean;
    showProjects: boolean;
    showCreatorProjects: boolean;
    showFeaturedGuides: boolean;
    showExternalResources: boolean;
    showNewsletter: boolean;
  };
  deploy?: {
    strategy: 'github-pages-repo-sync';
    repoUrl: string;
    branch: string;
    preserve: string[];
  };
};
```

## Field meanings

| Field                                  | Required | Notes                                                                                                                   |
| -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `site.*`                               | Yes      | Main public identity and metadata values for the site.                                                                  |
| `social.*`                             | Yes      | Public social links and submit/report helper destinations.                                                              |
| `branding.drBadge`                     | Yes      | Current trust badge input. Provider-first shape is preferred.                                                           |
| `branding.favicon/logo/opengraphImage` | No       | Canonical asset references when a site owns those assets. Supports checked-in local paths and staged remote URL inputs. |
| `content.listingSource`                | Yes      | Declares where the site's listing data comes from.                                                                      |
| `copy.*`                               | Yes      | Small site-facing wording contract for listing terminology plus configurable docs/network labels.                       |
| `routes.*`                             | Yes      | Controls the public base paths for listings, docs, and the site-owned network page.                                     |
| `features.*`                           | Yes      | Controls starter-owned optional surfaces.                                                                               |
| `deploy.*`                             | No       | Required for deploy runs; omitted only for non-deploy examples.                                                         |

## Minimum Real-Site Input Checklist

For a real site build, the site owner should supply meaningful values for these checked-in fields even though the starter defaults let the app compile without them:

- `id`
- `site.name`
- `site.domain`
- `site.publicUrl`
- `site.description`
- `site.tagline`
- `branding.drBadge`
- `social.githubUrl`
- `social.githubRepoUrl`
- `social.githubIssueOwner`
- `social.githubIssueRepo`
- `social.githubIssuesUrl`
- `social.githubIssueTemplate`
- `social.twitterUrl`
- `social.redditUrl`
- `content.listingSource`
- `build.artifactDir`
- `copy.docsLabel`
- `copy.networkLabel`
- `routes.docsBasePath`
- `routes.networkBasePath`

Depending on the chosen source:

- `content.listingSource.kind = "trial-products-json"` also needs `category`, `featuredCount`, and `publishedAt`
- deploy runs also need `deploy.repoUrl`, `deploy.branch`, and `deploy.preserve`

Usually customized, but safe to inherit from the starter if they fit:

- `copy.listingName.singular`
- `copy.listingName.plural`
- `copy.submitLabel`
- `routes.listingBasePath`
- `features.*`

Optional site-owned content modules live outside `site-config`:

- `sites/<id>/site-content.ts` for `externalResources`
- `sites/<id>/site-content.ts` for `listingCliInstall`
- `sites/<id>/site-content.ts` for `networkLinks`

Starter defaults worth knowing:

- `copy.docsLabel` defaults to `Docs`
- `copy.networkLabel` defaults to `Network`
- `routes.listingBasePath` defaults to `listing`
- `routes.docsBasePath` defaults to `docs`
- `routes.networkBasePath` defaults to `network`
- public posts live at `/posts` when `features.showGuides` is enabled
- public category pages live at `/categories/[slug]`
- the network page automatically includes a reusable default link set derived from `social.githubRepoUrl`, `social.githubIssuesUrl`, and `social.githubUrl`, then appends any site-owned `networkLinks`

## Brand asset staging

The build treats brand assets as staged local inputs even when the site config points at a remote file.

How it works:

- `source: 'local-path'` keeps using the checked-in asset directly from `sites/<site-id>/assets/*`
- `source: 'url'` downloads the remote asset before the build, writes it into the deterministic checked-in-style staging path under `sites/<site-id>/assets/*`, and then builds from that staged local file
- if a non-empty staged file already exists at that deterministic path, the build intentionally reuses it instead of downloading the remote asset again
- the final built site never hotlinks the remote branding asset just because the input source was remote

Current file constraints:

- `branding.favicon` must stage to `favicon.ico`
- `branding.logo` must stage to `logo.png`
- `branding.opengraphImage` must stage to `opengraph-image.png`
- remote inputs fail early if the download fails, the file is empty, or the content type / filename does not match the expected staged file shape

Operational guidance:

- prefer `local-path` for canonical long-lived assets you want versioned in the repo
- use `url` when operators need a temporary or externally managed source, but still want the static build to stage and pin the file locally before export
- after a successful remote-asset build, treat the staged file in `sites/<site-id>/assets/*` as the local cached copy the next build may intentionally reuse

## Known Gaps

- Legal/privacy contact emails are not first-class site-config fields yet; the legal content currently derives them from `site.domain`.
- About-page copy is still content-owned in `packages/content/data/about/about.mdx`, not part of `site-config`.
- Future first-party `/tools` pages are reserved conceptually, but there is no dedicated `site-config` surface for them yet.
- Newsletter copy is still starter-owned; only its on/off behavior is configurable today via `features.showNewsletter`.

## Usage notes

- Put canonical site values in the checked-in `sites/**` config files.
- Put small reusable site wording such as listing terminology and submit CTA labels in `copy.*`.
- Use raw resolved values such as `siteConfig.name` in metadata, links, and plain text rendering.
- Use `apps/web/lib/site-copy.ts` when you need derived UI labels like `All Listings` so the string construction stays centralized.
- The current low-risk consumers are the header, footer, hero section, search titles, GitHub issue helpers, and SEO/feed output files.
- Use tiny wrapper components such as `<SiteName />` only when you want a reusable JSX helper.
- Keep the config values plain. Do not store JSX inside the config for basic fields like the site name or tagline.
- Keep this in internal starter documentation, not public `/docs` content.
