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
