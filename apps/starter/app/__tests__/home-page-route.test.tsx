import { render, screen } from '@/test/test-utils'
import { HomePageRoute, type HomePageData } from '@thedaviddias/web-core/home-page'
import type { WebsiteMetadata } from '@thedaviddias/web-core/content-query'

function buildWebsite(index: number): WebsiteMetadata {
  return {
    slug: `product-${index}`,
    name: `Product ${String(index).padStart(3, '0')}`,
    description: `Product ${index} description`,
    website: `https://example-${index}.com`,
    category: 'video-downloaders',
    categories: ['video-downloaders'],
    publishedAt: '2026-03-24'
  }
}

const emptySection = () => null

describe('HomePageRoute', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      arc: jest.fn(),
      beginPath: jest.fn(),
      clearRect: jest.fn(),
      fill: jest.fn(),
      fillStyle: ''
    })) as unknown as HTMLCanvasElement['getContext']
  })

  it('caps the homepage products section at 200 listings', () => {
    const allProjects = Array.from({ length: 250 }, (_, index) => buildWebsite(index + 1))
    const data: HomePageData = {
      allProjects,
      featuredGuides: [],
      featuredProjects: [],
      recentlyUpdatedProjects: [],
      totalCount: allProjects.length
    }

    render(
      <HomePageRoute
        data={data}
        slots={{
          CreatorProjectsSection: emptySection,
          ExternalResourcesSection: emptySection,
          FeaturedGuidesSection: emptySection,
          FeaturedProjectsSection: emptySection,
          JsonLd: () => <script type="application/ld+json" />,
          RecentlyAddedSection: emptySection,
          StaticWebsitesList: ({ websites, totalCount, displayLimit }) => (
            <div
              data-testid="homepage-products"
              data-display-limit={displayLimit}
              data-total-count={totalCount}
            >
              {websites.length}
            </div>
          )
        }}
      />
    )

    expect(screen.getByTestId('homepage-products')).toHaveTextContent('200')
    expect(screen.getByTestId('homepage-products')).toHaveAttribute(
      'data-display-limit',
      '200'
    )
    expect(screen.getByTestId('homepage-products')).toHaveAttribute(
      'data-total-count',
      '250'
    )
  })
})
