import {
  SiFacebook,
  SiGithub,
  SiGoogle,
  SiInstagram,
  SiMedium,
  SiPeerlist,
  SiReddit,
  SiX,
  SiYoutube
} from '@icons-pack/react-simple-icons'
import { getRoute } from '@thedaviddias/web-core/routes'
import { hasConfiguredPublicSocialLinks, siteConfig } from '@thedaviddias/web-core/site-config'
import { siteContent } from '@thedaviddias/web-core/site-content'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { Linkedin } from 'lucide-react'
import Link from 'next/link'
import type { ComponentType } from 'react'
import { ModeToggle } from '../mode-toggle'
import { resolveDrBadgeConfig } from './dr-badge'

type FooterLink = {
  href: string
  label: string
}

type SocialLink = {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
}

function getSiteContentSocialIcon(href: string): SocialLink['icon'] | null {
  const normalizedHref = href.toLowerCase()

  if (normalizedHref.includes('linkedin.com') || normalizedHref.includes('/linkedin')) {
    return Linkedin
  }

  if (
    normalizedHref.includes('youtube.com') ||
    normalizedHref.includes('youtu.be') ||
    normalizedHref.includes('/youtube')
  ) {
    return SiYoutube
  }

  if (normalizedHref.includes('facebook.com') || normalizedHref.includes('/facebook')) {
    return SiFacebook
  }

  if (normalizedHref.includes('instagram.com') || normalizedHref.includes('/instagram')) {
    return SiInstagram
  }

  if (normalizedHref.includes('medium.com') || normalizedHref.includes('/medium')) {
    return SiMedium
  }

  if (normalizedHref.includes('sites.google.com') || normalizedHref.includes('/google-sites')) {
    return SiGoogle
  }

  if (normalizedHref.includes('peerlist.io') || normalizedHref.includes('/peerlist')) {
    return SiPeerlist
  }

  return null
}

function getFooterSocialLinks(): SocialLink[] {
  const socialLinks = new Map<string, SocialLink>()

  if (hasConfiguredPublicSocialLinks(siteConfig)) {
    socialLinks.set(siteConfig.githubUrl, {
      href: siteConfig.githubUrl,
      icon: SiGithub,
      label: 'GitHub'
    })
    socialLinks.set(siteConfig.redditUrl, {
      href: siteConfig.redditUrl,
      icon: SiReddit,
      label: 'Reddit'
    })
    socialLinks.set(siteConfig.twitterUrl, {
      href: siteConfig.twitterUrl,
      icon: SiX,
      label: 'X (Twitter)'
    })
  }

  for (const link of siteContent.networkLinks) {
    const icon = getSiteContentSocialIcon(link.href)

    if (!icon) {
      continue
    }

    socialLinks.set(link.href, {
      href: link.href,
      icon,
      label: link.label
    })
  }

  return Array.from(socialLinks.values())
}

/**
 * Footer component with site navigation and external links
 * Features: Bold typography, refined spacing, clean layout
 */
export function Footer() {
  const drBadge = resolveDrBadgeConfig(siteConfig.domain)
  const socialLinks = getFooterSocialLinks()
  const directoryLinks: FooterLink[] = [
    {
      href: getRoute('submit'),
      label: siteCopy.submitLabel
    }
  ]
  const resourceLinks: FooterLink[] = []

  if (siteConfig.features.showProjects) {
    resourceLinks.push({
      href: getRoute('projects'),
      label: siteCopy.networkLabel
    })
  }

  if (siteConfig.features.showBrands) {
    resourceLinks.push({
      href: getRoute('brands'),
      label: siteCopy.brandsLabel
    })
  }

  if (siteConfig.features.showDocs) {
    resourceLinks.push({
      href: getRoute('docs.list'),
      label: siteCopy.docsLabel
    })
  }

  if (siteConfig.features.showGuides) {
    resourceLinks.push({
      href: getRoute('guides.list'),
      label: 'Posts'
    })
  }

  return (
    <footer className="border-t border-border/50 py-12 md:py-16 bg-muted/30">
      <h2 className="sr-only">Footer</h2>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:gap-12">
          <div className="space-y-4 md:col-span-2">
            <h3 className="font-bold text-lg tracking-tight">{siteConfig.name}</h3>
            <p className="text-sm text-muted-foreground">{siteConfig.tagline}</p>
            <div className="flex items-center gap-1 my-6">
              <ModeToggle />
              {socialLinks.length > 0
                ? socialLinks.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      aria-label={label}
                      className="inline-flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="size-5" />
                      <span className="sr-only">{label}</span>
                    </Link>
                  ))
                : null}
            </div>
          </div>
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Directory
              </h4>
              <ul className="space-y-2 text-sm">
                {directoryLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {resourceLinks.length > 0 ? (
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                  Resources
                </h4>
                <ul className="space-y-2 text-sm">
                  {resourceLinks.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Legal
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href={getRoute('about')} className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href={getRoute('privacy')} className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href={getRoute('terms')} className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href={getRoute('affiliateDisclosure')} className="hover:text-foreground">
                    Affiliate Disclosure
                  </Link>
                </li>
                <li>
                  <Link href={getRoute('dmca')} className="hover:text-foreground">
                    DMCA
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          {drBadge ? (
            <Link
              href={drBadge.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <img
                src={drBadge.src}
                alt={drBadge.alt}
                width="200"
                height="50"
                loading="lazy"
                decoding="async"
              />
            </Link>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
