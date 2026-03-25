import { render, screen } from '@/test/test-utils'
import { LLMGrid } from '@/components/llm/llm-grid'
import type { WebsiteMetadata } from '@/lib/content-loader'

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

jest.mock('@/components/ui/favorite-button', () => ({
  FavoriteButton: () => <div data-testid="favorite-button" />
}))

const items: WebsiteMetadata[] = [
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

describe('LLMGrid', () => {
  it('passes listing logos through to the shared favicon renderer', () => {
    render(<LLMGrid items={items} animateIn={false} />)

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
