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
    expect(() => resolveSiteContent('serp.software')).toThrow(
      'Site "serp.software" was removed from this repo. Use a supported checked-in site id instead.'
    )
  })
})
