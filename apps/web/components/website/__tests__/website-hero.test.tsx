import { render, screen } from '@/test/test-utils'
import { WebsiteHero } from '@/components/website/website-hero'
import type { WebsiteMetadata } from '@/lib/content-loader'

jest.mock('@thedaviddias/design-system/breadcrumb', () => ({
  Breadcrumb: () => <nav data-testid="breadcrumb" />
}))

jest.mock('@thedaviddias/web-core/ui/favorite-button', () => ({
  FavoriteButton: () => <div data-testid="favorite-button" />
}))

jest.mock('@thedaviddias/web-core/ui/favicon-with-fallback', () => ({
  FaviconWithFallback: ({
    logoUrl,
    name
  }: {
    logoUrl?: string
    name: string
  }) => (
    <div
      data-testid="favicon"
      data-logo-url={logoUrl || ''}
      data-name={name}
    />
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
  website: 'https://example.com'
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
    expect(screen.getByTestId('favicon')).toHaveAttribute(
      'data-name',
      'Example Product'
    )
  })
})
