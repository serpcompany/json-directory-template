import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'
import type { WebsiteMetadata } from '../content-query'
import { getListingSpecificResourceLinks } from '../resource-links'

type SectionProps = {
  children: ReactNode
  description?: string
  title: string
  titleId?: string
}

type WebsiteCliSectionProps = {
  website: WebsiteMetadata
}

export interface WebsiteResourcesSectionProps {
  website: WebsiteMetadata
  slots: {
    Section: ComponentType<SectionProps>
    WebsiteCliSection: ComponentType<WebsiteCliSectionProps>
  }
}

export function WebsiteResourcesSection({
  website,
  slots: { Section, WebsiteCliSection },
}: WebsiteResourcesSectionProps) {
  const resourceLinks = getListingSpecificResourceLinks(website.resourceLinks)

  return (
    <>
      <WebsiteCliSection website={website} />

      {resourceLinks.length > 0 ? (
        <section className="animate-fade-in-up opacity-0 stagger-3">
          <Section
            title="Links"
            description="Helpful links for this entry"
            titleId="links"
          >
            <div className="rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden">
              <ul className="divide-y divide-border/80">
                {resourceLinks.map((link) => (
                  <li key={`${link.label}-${link.url}`}>
                    <Link
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                          {link.label}
                        </span>
                      </span>
                      <ExternalLink
                        className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-1"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </section>
      ) : null}
    </>
  )
}
