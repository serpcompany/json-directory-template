import {
  defaultSiteConfig,
  resolveCheckedInSiteConfig,
} from '../../../sites/index';
import {
  type SiteCopyConfig,
  type SiteFeatureFlags,
} from '../../../sites/types';

export type SiteConfig = {
  copy: SiteCopyConfig;
  description: string;
  docsRouteBasePath: string;
  domain: string;
  features: SiteFeatureFlags;
  gtmId?: string;
  githubIssueOwner: string;
  githubIssueRepo: string;
  githubIssuesUrl: string;
  githubRepoUrl: string;
  githubUrl: string;
  id: string;
  listingRouteBasePath: string;
  name: string;
  networkRouteBasePath: string;
  publicUrl: string;
  redditUrl: string;
  tagline: string;
  twitterUrl: string;
};

export function getTwitterHandleFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
    const handle = pathSegments.at(-1)

    if (!handle) {
      return null
    }

    return `@${handle}`
  } catch {
    return null
  }
}

export function resolveSiteConfig(
  siteId = process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || defaultSiteConfig.id
): SiteConfig {
  const configuredSite = resolveCheckedInSiteConfig(siteId);

  return {
    copy: configuredSite.copy,
    description: configuredSite.site.description,
    docsRouteBasePath: configuredSite.routes.docsBasePath,
    domain: configuredSite.site.domain,
    features: configuredSite.features,
    gtmId: configuredSite.analytics?.gtmId,
    githubIssueOwner: configuredSite.social.githubIssueOwner,
    githubIssueRepo: configuredSite.social.githubIssueRepo,
    githubIssuesUrl: configuredSite.social.githubIssuesUrl,
    githubRepoUrl: configuredSite.social.githubRepoUrl,
    githubUrl: configuredSite.social.githubUrl,
    id: configuredSite.id,
    listingRouteBasePath: configuredSite.routes.listingBasePath,
    name: configuredSite.site.name,
    networkRouteBasePath: configuredSite.routes.networkBasePath,
    publicUrl: configuredSite.site.publicUrl,
    redditUrl: configuredSite.social.redditUrl,
    tagline: configuredSite.site.tagline,
    twitterUrl: configuredSite.social.twitterUrl,
  };
}

export const siteConfig: SiteConfig = resolveSiteConfig();
