import { toWebsiteBrowseCardMetadata, type WebsiteMetadata } from '../content-query'
import { buildHomepageCategorySections } from '../homepage-category-sections'
import { Section } from '../layout/section'
import { LLMGrid } from '../llm/llm-grid'
import { siteConfig } from '../site-config'
import { siteCopy } from '../site-copy'

interface HomepageCategorySectionsRouteProps {
  listings: WebsiteMetadata[]
}

export function HomepageCategorySectionsRoute({ listings }: HomepageCategorySectionsRouteProps) {
  const sections = buildHomepageCategorySections(listings, {
    limit: siteConfig.browse.homepageCategorySectionLimit,
    siteId: siteConfig.id
  })

  return (
    <div className="space-y-12" id={siteCopy.allAnchorId}>
      {sections.map(section => (
        <Section
          key={section.category.slug}
          title={section.name}
          description={section.category.description}
          titleId={`category-${section.category.slug}`}
          viewAllHref={section.href}
          viewAllText={`View all ${section.totalCount} ${section.name}`}
        >
          <LLMGrid items={section.listings.map(toWebsiteBrowseCardMetadata)} />
        </Section>
      ))}
    </div>
  )
}
