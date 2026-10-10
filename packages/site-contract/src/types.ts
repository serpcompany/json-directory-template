export type AssetSource =
  | {
      path: string
      source: 'local-path'
    }
  | {
      source: 'url'
      url: string
    }

export type ListingSourceConfig =
  | {
      kind: 'listing-json'
      outputPath?: string
      path: string
    }
  | {
      category: string
      featuredCount: number
      kind: 'trial-products-json'
      outputPath?: string
      path: string
      publishedAt: string
    }

/** Optional homepage copy overrides. Each field falls back to the starter homepage copy. */
export type SiteHomepageCopy = {
  /** Meta description of the homepage. */
  description?: string
  /** Visible H1. Defaults to `site.name`. */
  heading?: string
  /** Intro paragraph under the H1. */
  intro?: string
  /** `<title>` of the homepage (the root layout does not append the site name to it). */
  title?: string
}

export type SiteCopyConfig = {
  /** Optional brands page meta and intro description. */
  brandsDescription?: string
  brandsLabel: string
  categoryLabels: Record<string, string>
  docsLabel: string
  homepage?: SiteHomepageCopy
  listingName: {
    plural: string
    singular: string
  }
  networkLabel: string
  submitLabel: string
}

export type SiteHomepageListingLayout = 'alphabetical' | 'category-sections'

/** Optional browse-surface layout. Omitted fields keep the starter behaviour. */
export type SiteBrowseConfig = {
  /**
   * Listings per category page. Pages after the first are served at
   * `<category route>page/<n>/`. Omit to render every listing on one page.
   */
  categoryPageSize?: number
  /** Cards per category section when `homepageListingLayout` is `category-sections`. */
  homepageCategorySectionLimit?: number
  /**
   * `alphabetical` (default): one flat list of the first 200 listings by name.
   * `category-sections`: one section per active category in `categories.json` order, each capped
   * at `homepageCategorySectionLimit` cards with a link to the category page.
   */
  homepageListingLayout?: SiteHomepageListingLayout
}

export type SiteExternalResourceIcon = 'chrome' | 'code2' | 'command' | 'gitBranch' | 'terminal'

export type SiteCategoryPriority = 'high' | 'medium' | 'low'

export type SiteCategoryInput = {
  description?: string
  name: string
  priority?: SiteCategoryPriority
  slug: string
}

export type SiteExternalResource = {
  description: string
  href: string
  icon: SiteExternalResourceIcon
  imageAlt?: string
  imageSrc?: string
  name: string
  slug: string
}

export type SiteListingCliInstall = {
  commandPrefix: string
  installTargetByListingSlug: Record<string, string>
}

export type SiteNetworkLink = {
  description: string
  href: string
  label: string
  title: string
}

export type SiteOwnedContent = {
  externalResources: SiteExternalResource[]
  listingCliInstall: SiteListingCliInstall | null
  networkLinks: SiteNetworkLink[]
}

export type SiteAnalyticsConfig = {
  gtmId?: string
}

export type SiteLegalConfig = {
  /**
   * Domain passed to `applyLegalContentBranding` for the shared legal pages. It replaces every
   * `{{domain}}` placeholder (today only the `dmca[@]` and `privacy[@]` contact addresses) and
   * any literal `serp.co` (the parent-brand domain). Falls back to `site.domain` when omitted.
   */
  contactEmailDomain?: string
}

export type SiteBadgesConfig = {
  featuredOn?: {
    dark?: string
    displayName?: string
    light?: string
  }
}

export type GitHubPagesRepoSyncDeployConfig = {
  branch: string
  preserve: string[]
  repoUrl: string
  strategy: 'github-pages-repo-sync'
}

export type DeployConfig = GitHubPagesRepoSyncDeployConfig

export type SiteFeatureFlags = {
  showAuth: boolean
  showBrands: boolean
  showCreatorProjects: boolean
  showDocs: boolean
  showExternalResources: boolean
  showFavorites: boolean
  showFeaturedGuides: boolean
  showGuides: boolean
  showNewsletter: boolean
  showProjects: boolean
}

export type SiteSitemapGroupKey = 'docs' | 'listings' | 'pages' | 'posts' | 'taxonomies'

export type SiteSitemapConfig = {
  additionalPathsByGroup?: Partial<Record<SiteSitemapGroupKey, string[]>>
  artifactExcludedPaths?: string[]
  categoryBasePath?: string
  excludedPaths?: string[]
  featuredCategoryPath?: string
  indexGroupOrder?: SiteSitemapGroupKey[]
  listingDetailSuffix?: string
  pathByGroup?: Partial<Record<SiteSitemapGroupKey, string>>
  staticPagePaths?: string[]
}

export type CheckedInSiteConfig = {
  analytics?: SiteAnalyticsConfig
  badges?: SiteBadgesConfig
  branding: {
    favicon?: AssetSource
    logo?: AssetSource
    opengraphImage?: AssetSource
  }
  browse?: SiteBrowseConfig
  build: {
    appPackageName: string
    appOutDir: string
    artifactDir: string
    mode: 'static-directory'
  }
  copy: SiteCopyConfig
  content: {
    listingSource: ListingSourceConfig
  }
  deploy?: DeployConfig
  features: SiteFeatureFlags
  id: string
  legal?: SiteLegalConfig
  networkBrandGroup: string | null
  routes: {
    brandsBasePath: string
    docsBasePath: string
    listingBasePath: string
    networkBasePath: string
  }
  site: {
    description: string
    domain: string
    name: string
    publicUrl: string
    tagline: string
  }
  sitemap: SiteSitemapConfig
  social: {
    githubIssueOwner: string | null
    githubIssueRepo: string | null
    githubIssuesUrl: string | null
    githubRepoUrl: string
    githubUrl: string
    redditUrl: string
    twitterUrl: string
  }
  version: 1
}

type Primitive = boolean | null | number | string | undefined

export type DeepPartial<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : {
        [K in keyof T]?: DeepPartial<T[K]>
      }

export type CheckedInSiteConfigOverride = DeepPartial<Omit<CheckedInSiteConfig, 'id'>> & {
  id: string
}
