import { siteConfig } from '@/lib/site-config'
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_PUBLIC_URL,
  SITE_TAGLINE,
  SITE_TWITTER_HANDLE,
  generateWebsiteSchema as generateRootWebsiteSchema
} from '@/lib/seo/seo-config'

describe('seo-config', () => {
  it('uses the runtime site config for core brand values', () => {
    expect(SITE_NAME).toBe(siteConfig.name)
    expect(SITE_TAGLINE).toBe(siteConfig.tagline)
    expect(SITE_PUBLIC_URL).toBe(`https://${siteConfig.domain}`)
    expect(DEFAULT_OG_IMAGE.alt).toBe(`${siteConfig.name} - ${siteConfig.tagline}`)
    expect(SITE_TWITTER_HANDLE).toBe('@dvnschmchr')
  })

  it('uses the configured social URLs in website schema publisher links', () => {
    const schema = generateRootWebsiteSchema()

    expect(schema.publisher.sameAs).toEqual([
      siteConfig.githubUrl,
      siteConfig.redditUrl,
      siteConfig.twitterUrl
    ])
  })
})
