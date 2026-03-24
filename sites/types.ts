export type AssetSource =
  | {
      path: string
      source: 'local-path'
    }
  | {
      source: 'url'
      url: string
    }

export type DrBadgeConfig =
  | {
      alt?: string
      domain: string
      provider: 'serp-dr'
      style?: 'serp-dr-v3'
    }
  | {
      alt: string
      height: number
      href: string
      imageSrc: string
      kind: 'raw'
      width: number
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

export type DeployConfig = {
  branch: string
  preserve: string[]
  repoUrl: string
  strategy: 'github-pages-repo-sync'
}

export type SiteFeatureFlags = {
  showAuth: boolean
  showCreatorProjects: boolean
  showDocs: boolean
  showDeveloperTools: boolean
  showFavorites: boolean
  showFeaturedGuides: boolean
  showGuides: boolean
  showNewsletter: boolean
  showProjects: boolean
}

export type CheckedInSiteConfig = {
  branding: {
    drBadge: DrBadgeConfig
    favicon?: AssetSource
    logo?: AssetSource
    opengraphImage?: AssetSource
  }
  build: {
    appOutDir: string
    artifactDir: string
    mode: 'static-directory'
  }
  content: {
    listingSource: ListingSourceConfig
  }
  deploy?: DeployConfig
  features: SiteFeatureFlags
  id: string
  routes: {
    listingBasePath: string
  }
  site: {
    description: string
    domain: string
    name: string
    publicUrl: string
    tagline: string
  }
  social: {
    githubIssueOwner: string
    githubIssueRepo: string
    githubIssueTemplate: string
    githubIssuesUrl: string
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

export type CheckedInSiteConfigOverride = DeepPartial<
  Omit<CheckedInSiteConfig, 'id'>
> & {
  id: string
}

export type ResolvedDrBadge = {
  alt: string
  height: number
  href: string
  imageSrc: string
  width: number
}

export function resolveDrBadgeConfig(badge: DrBadgeConfig): ResolvedDrBadge {
  if ('provider' in badge) {
    return {
      alt: badge.alt || `Verified DR badge for ${badge.domain}`,
      height: 50,
      href: 'https://dr.serp.co/',
      imageSrc: `https://dr.serp.co/badge/${badge.domain}?style=${badge.style || 'serp-dr-v3'}`,
      width: 200
    }
  }

  return {
    alt: badge.alt,
    height: badge.height,
    href: badge.href,
    imageSrc: badge.imageSrc,
    width: badge.width
  }
}
