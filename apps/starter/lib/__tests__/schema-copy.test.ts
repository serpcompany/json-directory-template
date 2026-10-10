import { generateArticleSchema, generateWebsiteDetailSchema } from '@thedaviddias/web-core/schema'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import type { WebsiteMetadata } from '@/lib/content-loader'

const sampleWebsite: WebsiteMetadata = {
  category: 'developer-tools',
  description: 'A concise description for the example listing.',
  name: 'Example Project',
  publishedAt: '2026-03-22',
  resourceLinks: [
    {
      label: 'Support Docs',
      url: 'https://example.com/docs'
    }
  ],
  slug: 'example-project',
  website: 'https://example.com'
}

describe('schema copy', () => {
  it('uses listing terminology in article and detail schemas', () => {
    const articleSchema = generateArticleSchema(sampleWebsite)
    const detailSchema = generateWebsiteDetailSchema(sampleWebsite)
    const graph = detailSchema['@graph']

    const webPageSchema = graph.find(item => item['@type'] === 'WebPage')
    const softwareSchema = graph.find(item => item['@type'] === 'SoftwareApplication')
    const detailArticleSchema = graph.find(item => item['@type'] === 'TechArticle')
    const faqSchema = graph.find(item => item['@type'] === 'FAQPage')

    expect(articleSchema.headline).toBe(`Example Project ${siteCopy.listingName.singularTitle}`)
    expect(webPageSchema?.name).toBe(`Example Project ${siteCopy.listingName.singularTitle}`)
    // The visible Breadcrumb component emits the page's only BreadcrumbList.
    expect(graph.some(item => item['@type'] === 'BreadcrumbList')).toBe(false)
    expect(webPageSchema).not.toHaveProperty('breadcrumb')
    // No price or rating data exists in listing sources, so none is claimed.
    expect(softwareSchema).not.toHaveProperty('offers')
    expect(softwareSchema).not.toHaveProperty('aggregateRating')
    expect(detailArticleSchema?.headline).toBe('Example Project Overview')
    expect(detailArticleSchema?.description).toContain("Explore Example Project's listing")
    expect(detailArticleSchema?.keywords).toContain('listing details')
    expect(detailArticleSchema?.keywords).not.toContain('directory entry')
    expect(faqSchema?.mainEntity[0]?.name).toBe("What is included in Example Project's listing?")
    expect(faqSchema?.mainEntity[0]?.acceptedAnswer?.text).toContain('primary link')
    expect(faqSchema?.mainEntity[0]?.acceptedAnswer?.text).not.toContain('website link')
  })
})
