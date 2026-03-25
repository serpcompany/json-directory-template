import { render, screen } from '@/test/test-utils'
import { WebsitesListWithSort } from '@/components/websites-list-with-sort'
import type { WebsiteMetadata } from '@/lib/content-loader'

jest.mock('@/components/analytics-tracker', () => ({
  useAnalyticsEvents: () => ({
    trackSortChange: jest.fn()
  })
}))

jest.mock('@/components/ui/favicon-with-fallback', () => ({
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

const websites: WebsiteMetadata[] = [
  {
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
]

describe('WebsitesListWithSort', () => {
  it('passes the listing logo to each card favicon renderer', () => {
    render(<WebsitesListWithSort initialWebsites={websites} />)

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
