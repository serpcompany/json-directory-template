import type { SiteOwnedContent } from '@thedaviddias/site-contract/types'

const emptySiteContent: SiteOwnedContent = {
  externalResources: [],
  listingCliInstall: null,
  networkLinks: []
}

describe('resolveNetworkLinks', () => {
  const originalNextPublicSiteId = process.env.NEXT_PUBLIC_SITE_ID
  const originalSiteId = process.env.SITE_ID

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_ID = originalNextPublicSiteId
    process.env.SITE_ID = originalSiteId
    jest.resetModules()
  })

  it('omits issue tracker links when the site has no configured public issue target', async () => {
    process.env.NEXT_PUBLIC_SITE_ID = 'default'
    process.env.SITE_ID = 'default'
    jest.resetModules()

    const { resolveNetworkLinks } = await import('@thedaviddias/web-core/network-links')
    const links = resolveNetworkLinks(emptySiteContent)

    expect(links.map(link => link.label)).toEqual([])
    expect(links).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Issues'
        })
      ])
    )
  })
})
