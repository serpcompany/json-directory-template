import { resolveSiteContent } from '@thedaviddias/web-core/site-content'

describe('resolveSiteContent', () => {
  it('loads the checked-in SERP Downloaders site-owned content', () => {
    const content = resolveSiteContent('serpdownloaders.com')

    expect(content).toEqual({
      externalResources: [],
      listingCliInstall: null,
      networkLinks: []
    })
  })

  it('rejects removed site ids explicitly', () => {
    expect(() => resolveSiteContent('extensions.serp.co')).toThrow(
      'Site "extensions.serp.co" was removed from this repo. Use a supported checked-in site id instead.'
    )
  })
})
