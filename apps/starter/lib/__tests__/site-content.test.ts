import { resolveSiteContent } from '@thedaviddias/web-core/site-content'

describe('resolveSiteContent', () => {
  it('loads the checked-in SERP Downloaders site-owned content', () => {
    const content = resolveSiteContent('serpdownloaders.com')

    expect(content).toEqual({
      externalResources: [],
      listingCliInstall: null,
      networkLinks: [
        {
          description: 'Read SERP Downloaders posts on Medium.',
          href: 'https://medium.com/howtodownloadvideosimages',
          label: 'Medium',
          title: 'Medium'
        },
        {
          description: 'Visit the SERP Downloaders Google Sites page.',
          href: 'https://sites.google.com/serp.co/serpdownloaders/',
          label: 'Google Sites',
          title: 'Google Sites'
        },
        {
          description: 'Visit the SERP Downloaders company profile on Peerlist.',
          href: 'https://peerlist.io/company/serpdownloaders',
          label: 'Peerlist',
          title: 'Peerlist'
        },
        {
          description: 'Watch SERP Downloaders videos on YouTube.',
          href: 'https://youtube.com/@serp-downloaders',
          label: 'YouTube',
          title: 'YouTube'
        }
      ]
    })
  })

  it('rejects removed site ids explicitly', () => {
    expect(() => resolveSiteContent('extensions.serp.co')).toThrow(
      'Site "extensions.serp.co" was removed from this repo. Use a supported checked-in site id instead.'
    )
  })
})
