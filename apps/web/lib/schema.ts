import { getFaviconUrl } from '@thedaviddias/utils/get-favicon-url'
import { SITE_LOGO_URL, SITE_NAME, SITE_PUBLIC_URL, SITE_URL } from '@/lib/seo/seo-config'
import { siteCopy } from '@/lib/site-copy'
import type { GuideMetadata, WebsiteMetadata } from './content-loader'
import { getRoute } from './routes'

export interface SchemaOrg {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: any
}

export interface WebsiteSchema extends SchemaOrg {
  '@type': 'Service'
  name: string
  description: string
  url: string
  provider: {
    '@type': 'Organization'
    name: string
    url: string
  }
  category: string
}

export interface ArticleSchema extends SchemaOrg {
  '@type': 'TechArticle'
  headline: string
  description: string
  datePublished: string
  author: {
    '@type': 'Organization'
    name: string
  }
}

export interface CollectionPageSchema extends SchemaOrg {
  '@type': 'CollectionPage'
  name: string
  description: string
  hasPart: WebsiteSchema[]
}

export interface GuideSchema extends SchemaOrg {
  '@type': 'TechArticle'
  headline: string
  description: string
  datePublished: string
  author: {
    '@type': 'Person'
    name: string
    url?: string
  }
  articleSection: string
  timeRequired: string
}

/**
 * Generates schema.org structured data for a website
 *
 * @param website - Website metadata
 * @returns Schema.org Service structured data
 */
export function generateWebsiteSchema(website: WebsiteMetadata): WebsiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: website.name,
    description: website.description,
    url: website.website,
    provider: {
      '@type': 'Organization',
      name: website.name,
      url: website.website
    },
    category: website.category || 'DeveloperAPI'
  }
}

/**
 * Generates schema.org structured data for an article about a website
 *
 * @param website - Website metadata
 * @returns Schema.org TechArticle structured data
 */
export function generateArticleSchema(website: WebsiteMetadata): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${website.name} ${siteCopy.listingName.singularTitle}`,
    description: website.description,
    datePublished: website.publishedAt,
    author: {
      '@type': 'Organization',
      name: SITE_NAME
    }
  }
}

/**
 * Generates comprehensive schema.org structured data for a website detail page
 * This creates a rich @graph with multiple schema types for better SEO
 *
 * @param website - Website metadata
 * @returns Schema.org structured data graph
 */
export function generateWebsiteDetailSchema(website: WebsiteMetadata) {
  const pageUrl = `${SITE_URL}${getRoute('listing.detail', { slug: website.slug })}`
  const categoryFormatted = website.category
    ? website.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Developer Tools'
  const listingLabel = siteCopy.listingName.singular
  const listingLabelTitle = siteCopy.listingName.singularTitle

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // Main WebPage
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${website.name} ${listingLabelTitle}`,
        description: website.description,
        isPartOf: {
          '@id': `${SITE_URL}/#website`
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: getFaviconUrl(website.website, 256)
        },
        datePublished: website.publishedAt,
        dateModified: website.publishedAt,
        breadcrumb: {
          '@id': `${pageUrl}#breadcrumb`
        }
      },
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: siteCopy.allLabel,
            item: `${SITE_URL}${getRoute('listing.list')}`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: website.name,
            item: pageUrl
          }
        ]
      },
      // SoftwareApplication - better for tools/platforms
      {
        '@type': 'SoftwareApplication',
        '@id': `${pageUrl}#software`,
        name: website.name,
        description: website.description,
        url: website.website,
        applicationCategory: categoryFormatted,
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        publisher: {
          '@type': 'Organization',
          name: website.name,
          url: website.website
        },
        ...(website.llmsUrl && {
          documentation: website.llmsUrl
        })
      },
      // TechArticle about the implementation
      {
        '@type': 'TechArticle',
        '@id': `${pageUrl}#article`,
        headline: `${website.name} Overview`,
        description: `${website.description} Explore ${website.name}'s ${listingLabel}, documentation links, and related resources.`,
        datePublished: website.publishedAt,
        dateModified: website.publishedAt,
        author: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_PUBLIC_URL
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_PUBLIC_URL,
          logo: {
            '@type': 'ImageObject',
            url: SITE_LOGO_URL
          }
        },
        mainEntityOfPage: {
          '@id': `${pageUrl}#webpage`
        },
        about: {
          '@id': `${pageUrl}#software`
        },
        keywords: [
          website.name,
          `${listingLabel} details`,
          'documentation links',
          categoryFormatted
        ].join(', ')
      },
      // FAQ Schema for common questions
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `What is included in ${website.name}'s ${listingLabel}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${website.name}'s ${listingLabel} includes its summary, category details, primary link, and any published documentation links included with the ${listingLabel}.`
            }
          },
          {
            '@type': 'Question',
            name: `How do I access ${website.name}'s published links?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `You can visit ${website.name} directly at ${website.website}.${website.llmsUrl ? ` This entry also links to published documentation at ${website.llmsUrl}.` : ''}${website.llmsFullUrl ? ` Additional extended documentation is linked at ${website.llmsFullUrl}.` : ''}`
            }
          },
          {
            '@type': 'Question',
            name: `What category does ${website.name} belong to?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${website.name} is categorized under "${categoryFormatted}" in the ${SITE_NAME} directory. ${website.description}`
            }
          }
        ]
      }
    ]
  }
}

/**
 * Generates schema.org structured data for the websites collection page
 *
 * @param websites - Array of website metadata
 * @returns Schema.org CollectionPage structured data
 */
export function generateCollectionSchema(websites: WebsiteMetadata[]): CollectionPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${SITE_NAME} Directory`,
    description: 'Directory of websites, tools, and resources',
    hasPart: websites.map(site => generateWebsiteSchema(site))
  }
}

/**
 * Generates schema.org structured data for a guide
 *
 * @param guide - Guide metadata
 * @returns Schema.org TechArticle structured data
 */
export function generateGuideSchema(guide: GuideMetadata): GuideSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt || guide.date,
    author: {
      '@type': 'Person',
      name: guide.authors[0].name,
      ...(guide.authors[0].url && { url: guide.authors[0].url })
    },
    articleSection: guide.category,
    timeRequired: `PT${Math.ceil(guide.readingTime || 5)}M`,
    difficulty: guide.difficulty
  }
}
