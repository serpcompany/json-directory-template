jest.mock('@/.content-collections/generated', () => ({
  allAboutPages: [
    {
      communityBody: 'Mock community body.',
      communityTitle: 'Mock community title',
      contactBody: 'Mock contact body.',
      contactEmail: 'hello@example.com',
      contactTitle: 'Mock contact title',
      description: 'Mock about page.',
      introBody: 'Mock intro body.',
      introTitle: 'About this directory',
      keywords: ['about this directory'],
      metaDescription: 'Mock meta description.',
      metaTitle: 'Mock meta title',
      missionIntro: 'Mock mission intro.',
      missionItems: ['One'],
      missionTitle: 'Mock mission title',
      primaryCtaLabel: 'Submit a Listing',
      published: true,
      secondaryCtaLabel: 'Browse',
      slug: 'about',
      steps: [
        { body: 'One', icon: 'file-text', title: 'One' },
        { body: 'Two', icon: 'code', title: 'Two' },
        { body: 'Three', icon: 'zap', title: 'Three' }
      ],
      stepsTitle: 'Mock steps title',
      title: 'About',
      whatIsBody: 'Mock what is body.',
      whatIsTitle: 'Mock what is title'
    }
  ],
  allDocs: [],
  allGuides: [],
  allLegals: [],
  allResources: []
}))

import { getAboutPage } from '@/lib/content-loader'

describe('about content', () => {
  it('loads the about page from the content collection', async () => {
    const aboutPage = await getAboutPage()

    expect(aboutPage).not.toBeNull()
    expect(aboutPage?.slug).toBe('about')
    expect(aboutPage?.introTitle).toMatch(/about this directory/i)
    expect(aboutPage?.steps).toHaveLength(3)
    expect(aboutPage?.primaryCtaLabel).toBe('Submit a Listing')
  })
})
