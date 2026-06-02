import { WebsiteDetailSidebar } from '@thedaviddias/web-core/website/website-detail-sidebar'
import type { WebsiteMetadata } from '@/lib/content-loader'
import { render, screen, userEvent, waitFor } from '@/test/test-utils'

const website: WebsiteMetadata = {
  category: 'video-downloaders',
  categories: ['video-downloaders', 'developer-tools'],
  description: 'Test website description',
  name: 'Example Product',
  publishedAt: '2026-03-24',
  slug: 'example-product',
  website: 'https://example.com'
}

describe('WebsiteDetailSidebar', () => {
  it('renders a prominent sticky primary CTA to the listing website', () => {
    const { container } = render(<WebsiteDetailSidebar website={website} />)

    const cta = screen.getByRole('link', { name: /open example product/i })

    expect(cta).toHaveAttribute('href', 'https://example.com')
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
    expect(cta).toHaveClass('sticky')
    expect(cta).toHaveClass('top-20')
    expect(cta).toHaveClass('bg-primary')
    expect(container.querySelector('aside.lg\\:sticky')).not.toBeNull()
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

  it('renders local badge previews and copies site-hosted embed URLs', async () => {
    const user = userEvent.setup()
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    const { container } = render(<WebsiteDetailSidebar website={website} />)

    expect(
      screen.getByRole('heading', { name: 'Add a badge to your website. Click the badge below to copy the code.' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Light Featured on Directory Starter badge' })
    ).toHaveAttribute('src', '/badge/featured-on-default-light.svg')
    expect(
      screen.getByRole('img', { name: 'Dark Featured on Directory Starter badge' })
    ).toHaveAttribute('src', '/badge/featured-on-default-dark.svg')

    expect(screen.queryByLabelText('Light badge embed HTML')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Dark badge embed HTML')).not.toBeInTheDocument()
    expect(container.innerHTML).not.toContain('data-verify-token')

    await user.click(screen.getByRole('button', { name: 'Copy light badge embed code' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `<a href="https://example.com/listing/example-product/" target="_blank" rel="noopener noreferrer" title="Example Product featured on Directory Starter">
  <img src="https://example.com/badge/featured-on-default-light.svg" alt="Featured on Directory Starter" width="200" height="50" />
</a>`
      )
    })
  })

  it('does not render the added date metadata', () => {
    render(<WebsiteDetailSidebar website={website} />)

    expect(screen.queryByText('Added')).not.toBeInTheDocument()
    expect(screen.queryByText('March 24, 2026')).not.toBeInTheDocument()
  })
})
