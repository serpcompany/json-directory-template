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

  it('uses each naked brand URL as the external link text', async () => {
    const { default: BrandsPage } = await import('@thedaviddias/web-core/static-pages/brands-page')

    render(<BrandsPage />)

    expect(screen.getByText('Awesome Shadcn UI')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://awesome-shadcn-ui.com' })).toHaveAttribute(
      'href',
      'https://awesome-shadcn-ui.com'
    )
    expect(screen.queryByRole('link', { name: /^visit$/i })).not.toBeInTheDocument()
  })
})
