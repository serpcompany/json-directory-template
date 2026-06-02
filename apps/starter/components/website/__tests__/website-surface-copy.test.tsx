import { WebsiteRelatedProjectsRoute as WebsiteRelatedProjects } from '@thedaviddias/web-core/website/website-related-projects-route'
import { WebsiteResourcesSectionRoute as WebsiteResourcesSection } from '@thedaviddias/web-core/website/website-resources-section-route'
import { render, screen } from '@/test/test-utils'

jest.mock('@thedaviddias/web-core/ui/favorite-button', () => ({
  FavoriteButton: () => <div data-testid="favorite-button" />
}))

const sampleWebsite = {
  slug: 'example-project',
  name: 'Example Project',
  description: 'A test directory entry',
  resourceLinks: [
    {
      label: 'Support Docs',
      url: 'https://example.com/docs'
    }
  ],
  website: 'https://example.com',
  category: 'developer-tools',
  publishedAt: '2026-03-22'
}

describe('website surface copy', () => {
  it('uses generic links copy and keeps the supplemental links in the shared sticky-header list style', () => {
    const { container } = render(<WebsiteResourcesSection website={sampleWebsite} />)

    expect(screen.getByRole('heading', { name: /^links$/i })).toBeInTheDocument()
    expect(container.querySelector('.sticky.top-16')).not.toBeNull()
    expect(container.querySelector('ul.divide-y')).not.toBeNull()
    expect(container.querySelector('li')).not.toBeNull()
    expect(screen.getByRole('link', { name: /support docs/i })).toHaveAttribute(
      'href',
      'https://example.com/docs'
    )
    expect(screen.queryByText(/example\.com/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /open link/i })).not.toBeInTheDocument()
  })

  it('does not render a generic GitHub organization link from stale listing data', () => {
    render(
      <WebsiteResourcesSection
        website={{
          ...sampleWebsite,
          resourceLinks: [
            {
              label: 'GitHub',
              url: 'https://github.com/serpapps'
            }
          ]
        }}
      />
    )

    expect(screen.queryByRole('heading', { name: /^links$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /github/i })).not.toBeInTheDocument()
  })

  it('uses generic related-entry copy on website detail pages', () => {
    render(<WebsiteRelatedProjects websites={[sampleWebsite]} />)

    expect(screen.getByRole('heading', { name: /related entries/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse the directory/i })).toBeInTheDocument()
  })
})
