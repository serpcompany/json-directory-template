# Site Config

Use checked-in site config files under `sites/**` to centralize reusable brand and shell values instead of hardcoding them across the header, footer, metadata, and social links.

## Ownership Model

The current intended ownership boundary is:

- `apps/<site>`
  - thin wrapper apps only
  - Next config, env wiring, generated content-collections entrypoints, and other framework-specific runtime hooks
  - no reusable business logic
- `packages/web-core`
  - reusable runtime/query/render helpers
  - routes, site copy, SEO, schema generation, category/query helpers, shared listing/runtime helpers
- `packages/site-contract`
  - checked-in site contract
  - checked-in site config/category/content resolution
  - onboarding helpers
  - source-path resolution
  - trial product normalization
- `sites/<site>`
  - declarative checked-in site data/config/assets only
  - sparse per-site overrides and site-owned content/assets
  - no shared resolver logic

If a file can be reused by more than one site app, it should not live under `apps/<site>`.
If a file defines checked-in site data rather than shared runtime behavior, it should not live in
`packages/web-core`.

Promotion rule:

- `sites/<site-id>` content alone does not make a site active
- activation requires explicit promotion into the active registry plus green validation, build,
  deploy dry-run, docs, and tests

Important distinction:

- `sites/site-config.default.ts` and `sites/<id>/site-config.ts` are declarative checked-in source
  inputs
- `sites/site-config.default.ts` is the full starter config, while `sites/<id>/site-config.ts`
  should stay as a sparse override-only file
- `packages/site-contract` owns the checked-in site resolution logic that merges defaults and
  per-site overrides
- `packages/web-core` owns app-facing helpers such as site copy and shared runtime adapters built
  on top of the checked-in site contract

Source-of-truth files:

- `sites/site-config.default.ts`
- `sites/<id>/site-config.ts`

Site id rule:

- use the site domain as the checked-in site id and folder name when possible, for example `serpdownloaders.com`
- domains are usually the most stable identifier across repo, build, and deploy flows

Recommended authoring rule:

- add new configurable fields to `sites/types.ts`
- set the default value once in `sites/site-config.default.ts`
- only add the field to `sites/<id>/site-config.ts` when that site needs a non-default override
- let the central resolver merge defaults plus overrides before validation

Current adapter files:

- `apps/starter/lib/site-config.ts`
- `apps/starter/lib/site-copy.ts`
- `apps/starter/lib/site-content.ts`
- `apps/starter/lib/network-links.ts`

These app-local files are compatibility shims while the wrapper-app migration is in progress. The
target state is for active callers to import package modules directly, with only truly Next-specific
wrappers left in the app layer.

Site-owned content boundary:

- keep declarative checked-in config in `sites/site-config.default.ts` plus `sites/<id>/site-config.ts`
- keep site-specific optional modules and datasets in `sites/site-content.default.ts` plus
  `sites/<id>/site-content.ts`
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
    githubIssueOwner: string | null;
    githubIssueRepo: string | null;
    githubIssuesUrl: string | null;
    redditUrl: string;
    twitterUrl: string;
  };
  branding: {
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
    categoryLabels: Record<string, string>;
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

| Field                                  | Required | Notes                                                                                                                               |
| -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `site.*`                               | Yes      | Main public identity and metadata values for the site.                                                                              |
| `social.*`                             | Yes      | Public social links and submit/report helper destinations.                                                                          |
| `branding.favicon/logo/opengraphImage` | No       | Canonical asset references when a site owns those assets. Supports checked-in local paths and staged remote URL inputs.             |
| `content.listingSource`                | Yes      | Declares where the site's listing data comes from.                                                                                  |
| `copy.*`                               | Yes      | Small site-facing wording contract for listing terminology, optional category display labels, and configurable docs/network labels. |
| `routes.*`                             | Yes      | Controls the public base paths for listings, docs, and the site-owned network page.                                                 |
| `features.*`                           | Yes      | Controls starter-owned optional surfaces.                                                                                           |
| `deploy.*`                             | No       | Required for deploy runs; omitted only for non-deploy examples.                                                                     |

## Minimum Real-Site Input Checklist

For a real site build, the site owner should supply meaningful values for these checked-in fields even though the starter defaults let the app compile without them:

- `id`
- `site.name`
- `site.domain`
- `site.publicUrl`
- `site.description`
- `site.tagline`
- `social.githubUrl`
- `social.githubRepoUrl`
- `social.githubIssueOwner`
- `social.githubIssueRepo`
- `social.githubIssuesUrl`
- `social.twitterUrl`
- `social.redditUrl`
- `content.listingSource`
- `build.artifactDir`
- `copy.docsLabel`
- `copy.networkLabel`
- `copy.categoryLabels`
- `routes.docsBasePath`
- `routes.networkBasePath`

Depending on the chosen source:

- the adapter-driven source kind currently named `trial-products-json` also needs `category`, `featuredCount`, and `publishedAt`
- deploy runs also need `deploy.repoUrl`, `deploy.branch`, and `deploy.preserve`

Important:

- Use `null` for all three GitHub issue target fields when a site does not have an issue repo
  ready yet. Do not use blank strings. Omitting the fields means the site inherits starter
  defaults; `null` is the explicit "disabled for now" value.
- Configure `social.githubIssueOwner`, `social.githubIssueRepo`, and `social.githubIssuesUrl` as a
  set. Validation rejects mixed states where only some issue target fields are configured.
- For a public `/submit` flow, the configured issue repo must be public and must have Issues
  enabled. Private issue repos are not usable from a static public site.
- The configured issue repo may also be the target GitHub Pages artifact repo, but it is still only
  a public inbox and artifact host. Accepted listing data remains in the private/source repo's
  checked-in `content.listingSource`.
- `site-config` does not own the individual listing names.
- Shell labels like `Listings`, `Docs`, `Network`, and `Submit` come from `copy.*` in `sites/<id>/site-config.ts`.
- `copy.listingName.singular` and `copy.listingName.plural` are public-facing copy only. They drive headings, search placeholders, CTA text, and helper copy like `All Listings`. They do not change route paths.
- Category route slugs stay canonical in shared taxonomy, but the visible category names can be overridden per site with `copy.categoryLabels`.
- The actual listing names and slugs come from the configured listing source itself. For adapter-driven sites that use `products.json`, that means editing the source records in `sites/<id>/products.json` and then rebuilding `data/listings.json`.
- `records/build-inputs/**` is internal generated snapshot space. It is not operator input and should not be edited manually.

Usually customized, but safe to inherit from the starter if they fit:

- `copy.listingName.singular`
- `copy.listingName.plural`
- `copy.submitLabel`
- `copy.categoryLabels`
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
- branding verification should be done as a set, not one file at a time:
  `favicon.ico`, `logo.png`, `apple-touch-icon.png`, and `opengraph-image.png`.
  The build copies `branding.logo` into both `/logo.png` and `/apple-touch-icon.png`, so a stale
  site logo will leak into both surfaces even if the favicon is replaced correctly.
- for static custom-domain deploys, root asset paths such as `/favicon.ico` and `/logo.png` may
  stay stale behind CDN caches longer than HTML or query-busted asset URLs. If a branding deploy is
  correct in the build artifact and target repo but the live root URL still serves the previous
  file, verify the same asset with a query string before assuming the deploy failed.

## Known Gaps

- Legal/privacy contact emails are not first-class site-config fields yet; the legal content currently derives them from `site.domain`.
- About-page copy is still content-owned in `packages/content/data/about/about.mdx`, not part of `site-config`.
- Future first-party `/tools` pages are reserved conceptually, but there is no dedicated `site-config` surface for them yet.
- Newsletter copy is still starter-owned; only its on/off behavior is configurable today via `features.showNewsletter`.

## Usage notes

- Put canonical site values in the checked-in `sites/**` config files.
- Put small reusable site wording such as listing terminology and submit CTA labels in `copy.*`.
- Use raw resolved values such as `siteConfig.name` in metadata, links, and plain text rendering.
- Use `apps/starter/lib/site-copy.ts` when you need derived UI labels like `All Listings` so the string construction stays centralized.
- The current low-risk consumers are the header, footer, hero section, search titles, GitHub issue helpers, and SEO/feed output files.
- Use tiny wrapper components such as `<SiteName />` only when you want a reusable JSX helper.
- Keep the config values plain. Do not store JSX inside the config for basic fields like the site name or tagline.
- Keep this in internal starter documentation, not public `/docs` content.
