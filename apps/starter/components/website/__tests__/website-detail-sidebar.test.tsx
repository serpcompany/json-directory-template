import { WebsiteDetailSidebar } from '@thedaviddias/web-core/website/website-detail-sidebar'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { render, screen } from '@/test/test-utils'

const website: WebsiteMetadata = {
  category: 'video-downloaders',
  categories: ['video-downloaders', 'developer-tools'],
  description: 'Test website description',
  name: 'Example Product',
  publishedAt: '2026-03-24',
  slug: 'example-product',
  website: 'https://serp.ly/example-product'
}

describe('WebsiteDetailSidebar', () => {
  it('renders a prominent sticky primary CTA to the listing website', () => {
    const { container } = render(<WebsiteDetailSidebar website={website} />)

    const cta = screen.getByRole('link', { name: /open example product/i })

    expect(cta).toHaveAttribute('href', 'https://serp.ly/example-product?via=example.com')
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
    expect(cta).toHaveClass('sticky')
    expect(cta).toHaveClass('top-20')
    expect(cta).toHaveClass('bg-primary')
    expect(container.querySelector('aside.lg\\:sticky')).not.toBeNull()
  })

  it('leaves non-SERP listing URLs unchanged', () => {
    render(
      <WebsiteDetailSidebar
        website={{
          ...website,
          website: 'https://example.com'
        }}
      />
    )

    expect(screen.getByRole('link', { name: /open example product/i })).toHaveAttribute(
      'href',
      'https://example.com'
    )
  })

  it('renders links for the primary and secondary categories', () => {
    render(<WebsiteDetailSidebar website={website} />)

    expect(screen.getByText(/^Categories$/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Video Downloaders' })).toHaveAttribute(
      'href',
      '/categories/video-downloaders/'
    )
    expect(screen.getByRole('link', { name: 'Developer Tools' })).toHaveAttribute(
      'href',
      '/categories/developer-tools/'
    )
  })
})
