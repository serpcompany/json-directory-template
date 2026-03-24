import { getTwitterHandleFromUrl, siteConfig } from '@/lib/site-config'
import {
  DEFAULT_OG_IMAGE,
  KEYWORDS,
  SITE_APPLE_TOUCH_ICON_URL,
  SITE_FAVICON_URL,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_PUBLIC_URL,
  SITE_TAGLINE,
  SITE_TWITTER_HANDLE,
  generateAltText,
  generateDynamicMetadata,
  generateWebsiteSchema as generateRootWebsiteSchema
} from '@/lib/seo/seo-config'

describe('seo-config', () => {
  it('uses the runtime site config for core brand values', () => {
    expect(SITE_NAME).toBe(siteConfig.name)
    expect(SITE_TAGLINE).toBe(siteConfig.tagline)
    expect(SITE_PUBLIC_URL).toBe(`https://${siteConfig.domain}`)
    expect(DEFAULT_OG_IMAGE.alt).toBe(`${siteConfig.name} - ${siteConfig.tagline}`)
    expect(SITE_FAVICON_URL).toBe(`${SITE_PUBLIC_URL}/favicon.ico`)
    expect(SITE_APPLE_TOUCH_ICON_URL).toBe(`${SITE_PUBLIC_URL}/apple-touch-icon.png`)
    expect(SITE_LOGO_URL).toBe(`${SITE_PUBLIC_URL}/logo.png`)
    expect(SITE_TWITTER_HANDLE).toBe(getTwitterHandleFromUrl(siteConfig.twitterUrl))
  })

  it('uses the configured social URLs in website schema publisher links', () => {
    const schema = generateRootWebsiteSchema()

    expect(schema.publisher.sameAs).toEqual([
      siteConfig.githubUrl,
      siteConfig.redditUrl,
      siteConfig.twitterUrl
    ])
    expect(schema.publisher.logo.url).toBe(SITE_LOGO_URL)
  })

  it('uses listing-neutral starter keywords for directory metadata', () => {
    expect(KEYWORDS.global).toContain('directory listings')
    expect(KEYWORDS.homepage).toContain('directory listings')
    expect(KEYWORDS.global).not.toContain('website directory')
    expect(KEYWORDS.homepage).not.toContain('website directory')
  })

  it('uses listing-neutral alt text helpers', () => {
    expect(generateAltText('favicon', 'Example Project')).toBe('Example Project favicon')
    expect(generateAltText('avatar', 'Example Project')).toBe('Example Project profile picture')
    expect(generateAltText('website', 'Example Project')).toBe('Example Project listing')
  })

  it('does not append legacy category title suffixes to category metadata', () => {
    const metadata = generateDynamicMetadata({
      type: 'category',
      name: 'Developer Tools Listings',
      description: 'Directory copy for a category page.',
      slug: 'developer-tools'
    })

    expect(metadata.title).toBe('Developer Tools Listings')
    expect(metadata.title).not.toBe('Developer Tools Listings AI Tools & Platforms')
  })
})
