import { siteCopy } from '@/lib/site-copy'
import { generateArticleSchema, generateWebsiteDetailSchema } from '@/lib/schema'
import type { WebsiteMetadata } from '@/lib/content-loader'

const sampleWebsite: WebsiteMetadata = {
  category: 'developer-tools',
  description: 'A concise description for the example listing.',
  llmsFullUrl: 'https://example.com/llms-full.txt',
  llmsUrl: 'https://example.com/llms.txt',
  name: 'Example Project',
  publishedAt: '2026-03-22',
  slug: 'example-project',
  website: 'https://example.com'
}

describe('schema copy', () => {
  it('uses listing terminology in article and detail schemas', () => {
    const articleSchema = generateArticleSchema(sampleWebsite)
    const detailSchema = generateWebsiteDetailSchema(sampleWebsite)
    const graph = detailSchema['@graph']

    const webPageSchema = graph.find(item => item['@type'] === 'WebPage')
    const breadcrumbSchema = graph.find(item => item['@type'] === 'BreadcrumbList')
    const detailArticleSchema = graph.find(item => item['@type'] === 'TechArticle')
    const faqSchema = graph.find(item => item['@type'] === 'FAQPage')

    expect(articleSchema.headline).toBe(`Example Project ${siteCopy.listingName.singularTitle}`)
    expect(webPageSchema?.name).toBe(`Example Project ${siteCopy.listingName.singularTitle}`)
    expect(breadcrumbSchema?.itemListElement[1]?.name).toBe(siteCopy.allLabel)
    expect(detailArticleSchema?.headline).toBe('Example Project Overview')
    expect(detailArticleSchema?.description).toContain("Explore Example Project's listing")
    expect(detailArticleSchema?.keywords).toContain('listing details')
    expect(detailArticleSchema?.keywords).not.toContain('directory entry')
    expect(faqSchema?.mainEntity[0]?.name).toBe("What is included in Example Project's listing?")
    expect(faqSchema?.mainEntity[0]?.acceptedAnswer?.text).toContain('primary link')
    expect(faqSchema?.mainEntity[0]?.acceptedAnswer?.text).not.toContain('website link')
  })
})
