import { render, screen } from '@/test/test-utils'

describe('Shared brands page content', () => {
  const originalNextPublicSiteId = process.env.NEXT_PUBLIC_SITE_ID
  const originalSiteId = process.env.SITE_ID

  beforeEach(() => {
    jest.resetModules()
    process.env.NEXT_PUBLIC_SITE_ID = 'serpdownloaders.com'
    process.env.SITE_ID = 'serpdownloaders.com'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_ID = originalNextPublicSiteId
    process.env.SITE_ID = originalSiteId
  })

  it('uses each brand name as the external link text instead of a generic visit link', async () => {
    const { default: BrandsPage } = await import('@thedaviddias/web-core/static-pages/brands-page')

    render(<BrandsPage />)

    expect(screen.getByRole('link', { name: /awesome shadcn ui/i })).toHaveAttribute(
      'href',
      'https://awesome-shadcn-ui.com'
    )
    expect(screen.queryByRole('link', { name: /^visit$/i })).not.toBeInTheDocument()
  })

  it('uses the configured SERPXXX brand group for pornvideodownloaders.com', async () => {
    process.env.NEXT_PUBLIC_SITE_ID = 'pornvideodownloaders.com'
    process.env.SITE_ID = 'pornvideodownloaders.com'

    const { default: BrandsPage } = await import('@thedaviddias/web-core/static-pages/brands-page')

    render(<BrandsPage />)

    expect(screen.getByRole('link', { name: /serp xxx/i })).toHaveAttribute(
      'href',
      'https://serp.xxx'
    )
    expect(screen.getByRole('link', { name: /onlyfans video downloader/i })).toHaveAttribute(
      'href',
      'https://onlyfansvideodownloader.com'
    )
    expect(screen.getByRole('link', { name: /justforfans downloader/i })).toHaveAttribute(
      'href',
      'https://justforfansdownloader.com'
    )
    expect(screen.getByRole('link', { name: /porn video downloaders/i })).toHaveAttribute(
      'href',
      'https://pornvideodownloaders.com'
    )
    expect(screen.getByRole('link', { name: /porno downloaders/i })).toHaveAttribute(
      'href',
      'https://pornodownloaders.com'
    )
    expect(screen.queryByRole('link', { name: /awesome shadcn ui/i })).not.toBeInTheDocument()
  })
})
