import { SiGithub, SiReddit, SiX } from '@icons-pack/react-simple-icons';
import Link from 'next/link';
import { ModeToggle } from '../mode-toggle';
import { getRoute } from '@thedaviddias/web-core/routes';
import { siteCopy } from '@thedaviddias/web-core/site-copy';
import { hasConfiguredPublicSocialLinks, siteConfig } from '@thedaviddias/web-core/site-config';

type FooterLink = {
  href: string;
  label: string;
};

/**
 * Footer component with site navigation and external links
 * Features: Bold typography, refined spacing, clean layout
 */
export function Footer() {
  const showSocialLinks = hasConfiguredPublicSocialLinks(siteConfig);
  const directoryLinks: FooterLink[] = [
    {
      href: getRoute('submit'),
      label: siteCopy.submitLabel,
    },
  ];
  const resourceLinks: FooterLink[] = [];

  if (siteConfig.features.showProjects) {
    resourceLinks.push({
      href: getRoute('projects'),
      label: siteCopy.networkLabel,
    });
  }

  if (siteConfig.features.showBrands) {
    resourceLinks.push({
      href: getRoute('brands'),
      label: siteCopy.brandsLabel,
    });
  }

  if (siteConfig.features.showDocs) {
    resourceLinks.push({
      href: getRoute('docs.list'),
      label: siteCopy.docsLabel,
    });
  }

  if (siteConfig.features.showGuides) {
    resourceLinks.push({
      href: getRoute('guides.list'),
      label: 'Posts',
    });
  }

  return (
    <footer className="border-t border-border/50 py-12 md:py-16 bg-muted/30">
      <h2 className="sr-only">Footer</h2>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:gap-12">
          <div className="space-y-4 md:col-span-2">
            <h3 className="font-bold text-lg tracking-tight">
              {siteConfig.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {siteConfig.tagline}
            </p>
            <div className="flex items-center gap-1 my-6">
              <ModeToggle />
              {showSocialLinks ? (
                <>
                  <Link
                    href={siteConfig.githubUrl}
                    className="inline-flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiGithub className="size-5" />
                    <span className="sr-only">GitHub</span>
                  </Link>
                  <Link
                    href={siteConfig.redditUrl}
                    className="inline-flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiReddit className="size-5" />
                    <span className="sr-only">Reddit</span>
                  </Link>
                  <Link
                    href={siteConfig.twitterUrl}
                    className="inline-flex items-center justify-center size-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiX className="size-5" />
                    <span className="sr-only">X (Twitter)</span>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Directory
              </h4>
              <ul className="space-y-2 text-sm">
                {directoryLinks.map((link) => (
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
                  {resourceLinks.map((link) => (
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
                  <Link
                    href={getRoute('about')}
                    className="hover:text-foreground"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href={getRoute('privacy')}
                    className="hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href={getRoute('terms')}
                    className="hover:text-foreground"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href={getRoute('affiliateDisclosure')}
                    className="hover:text-foreground"
                  >
                    Affiliate Disclosure
                  </Link>
                </li>
                <li>
                  <Link
                    href={getRoute('dmca')}
                    className="hover:text-foreground"
                  >
                    DMCA
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground"></div>
      </div>
    </footer>
  );
}
