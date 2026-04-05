import { siteContent } from '@/lib/site-content'
import { hasConfiguredPublicSocialLinks, siteConfig } from '@/lib/site-config'
import type { SiteNetworkLink, SiteOwnedContent } from '../../../sites/types'

export type NetworkLink = SiteNetworkLink

function resolveDefaultNetworkLinks(): NetworkLink[] {
  if (!hasConfiguredPublicSocialLinks(siteConfig)) {
    return []
  }

  return [
    {
      description: `Browse the source, starter structure, and build workflow for ${siteConfig.name}.`,
      href: siteConfig.githubRepoUrl,
      label: 'Repository',
      title: 'Site repository'
    },
    {
      description: 'See open follow-up work, submission discussions, and compatibility tasks.',
      href: siteConfig.githubIssuesUrl,
      label: 'Issues',
      title: 'Issue tracker'
    },
    {
      description: 'Open the broader GitHub profile behind this site and any related projects.',
      href: siteConfig.githubUrl,
      label: 'GitHub',
      title: 'GitHub profile'
    }
  ]
}

export function resolveNetworkLinks(content: SiteOwnedContent = siteContent): NetworkLink[] {
  const links = [...resolveDefaultNetworkLinks(), ...content.networkLinks]
  const dedupedLinks = new Map<string, NetworkLink>()

  for (const link of links) {
    dedupedLinks.set(link.href, link)
  }

  return Array.from(dedupedLinks.values())
}

export const networkLinks: NetworkLink[] = resolveNetworkLinks()
