import { WebsiteHeroRoute as WebsiteHero } from '@thedaviddias/web-core/website/website-hero-route'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { render, screen } from '@/test/test-utils'

jest.mock('@thedaviddias/design-system/breadcrumb', () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb" />
}))

jest.mock('@thedaviddias/web-core/ui/favorite-button', () => ({
  FavoriteButton: () => <div data-testid="favorite-button" />
}))

jest.mock('@thedaviddias/web-core/ui/favicon-with-fallback', () => ({
  FaviconWithFallback: ({ logoUrl, name }: { logoUrl?: string; name: string }) => (
    <div data-testid="favicon" data-logo-url={logoUrl || ''} data-name={name} />
  )
}))

const website: WebsiteMetadata = {
  category: 'developer-tools',
  description: 'Test listing description',
  media: {
    logo: 'https://cdn.example.com/logo.png'
  },
  name: 'Example Product',
  publishedAt: '2026-03-24',
  slug: 'example-product',
  website: 'https://serp.ly/example-product'
}

describe('WebsiteHero', () => {
  it('passes the listing logo to the shared favicon renderer', () => {
    render(
      <WebsiteHero
        website={website}
        breadcrumbItems={[{ name: 'Example Product', href: '/example' }]}
      />
    )

    expect(screen.getByTestId('favicon')).toHaveAttribute(
      'data-logo-url',
      'https://cdn.example.com/logo.png'
    )
    expect(screen.getByTestId('favicon')).toHaveAttribute('data-name', 'Example Product')
  })

  it('does not render the listing website URL as hero text or an outbound link', () => {
    const { container } = render(
      <WebsiteHero
        website={website}
        breadcrumbItems={[{ name: 'Example Product', href: '/example' }]}
      />
    )

    expect(screen.queryByText('serp.ly/example-product')).not.toBeInTheDocument()
    expect(
      Array.from(container.querySelectorAll('a')).map(anchor => anchor.getAttribute('href'))
    ).not.toContain(website.website)
  })
})
