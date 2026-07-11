import { LLMGrid } from '@thedaviddias/web-core/llm/llm-grid'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { render, screen } from '@/test/test-utils'

jest.mock('@thedaviddias/web-core/ui/favicon-with-fallback', () => ({
  FaviconWithFallback: ({ logoUrl, name }: { logoUrl?: string; name: string }) => (
    <div data-testid="favicon" data-logo-url={logoUrl || ''} data-name={name} />
  )
}))

jest.mock('@thedaviddias/web-core/ui/favorite-button', () => ({
  FavoriteButton: ({ slug, variant }: { slug: string; variant?: 'default' | 'ghost' }) => (
    <button type="button" data-testid="favorite-button" data-slug={slug} data-variant={variant} />
  )
}))

const items: WebsiteMetadata[] = [
  {
    category: 'developer-tools',
    description: '<strong>Test</strong> listing description',
    media: {
      logo: 'https://cdn.example.com/logo.png'
    },
    name: 'Example Product',
    publishedAt: '2026-03-24',
    slug: 'example-product',
    website: 'https://example.com',
    isUnofficial: true
  },
  {
    category: 'developer-tools',
    description: 'Second listing description',
    name: 'Second Product',
    publishedAt: '2026-03-25',
    slug: 'second-product',
    website: 'https://second.example.com'
  }
]

describe('LLMGrid', () => {
  it('passes listing logos through to the shared favicon renderer', () => {
    render(<LLMGrid items={items} animateIn={false} />)

    const firstFavicon = screen.getAllByTestId('favicon')[0]
    expect(firstFavicon).toHaveAttribute('data-logo-url', 'https://cdn.example.com/logo.png')
    expect(firstFavicon).toHaveAttribute('data-name', 'Example Product')
  })

  it('preserves default listing card links, analytics attributes, badges, and favorite buttons', () => {
    render(<LLMGrid items={items} animateIn={false} />)

    const link = screen.getByRole('link', { name: 'Example Product' })
    expect(link).toHaveAttribute('href', expect.stringContaining('example-product'))
    expect(link).toHaveAttribute('data-analytics', 'website-click')
    expect(link).toHaveAttribute('data-website-name', 'Example Product')
    expect(link).toHaveAttribute('data-website-slug', 'example-product')
    expect(link).toHaveAttribute('data-source', 'grid-default')
    expect(screen.getByText('Unofficial')).toBeInTheDocument()
    expect(screen.getAllByTestId('favorite-button')[0]).toHaveAttribute('data-variant', 'default')
    expect(screen.getByText('Test listing description')).toBeInTheDocument()
  })

  it('preserves compact listing card analytics source and ghost favorite button', () => {
    render(
      <LLMGrid items={items} variant="compact" analyticsSource="recently-added" animateIn={false} />
    )

    const link = screen.getByRole('link', { name: 'Example Product' })
    expect(link).toHaveAttribute('data-source', 'recently-added')
    expect(screen.getAllByTestId('favorite-button')[0]).toHaveAttribute('data-variant', 'ghost')
  })

  it('keeps maxItems overflow cards rendered but inaccessible while visually collapsed', () => {
    render(<LLMGrid items={items} maxItems={1} animateIn={false} />)

    expect(screen.queryByRole('link', { name: 'Second Product' })).not.toBeInTheDocument()

    const hiddenLink = screen.getByRole('link', {
      hidden: true,
      name: 'Second Product'
    })
    const collapsedWrapper = hiddenLink.closest('[aria-hidden="true"]')
    expect(collapsedWrapper).toHaveClass('absolute', 'pointer-events-none')
    expect(collapsedWrapper).toHaveAttribute('inert')
  })
})
