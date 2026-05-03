import {
  buildHomePageData,
  getFeaturedProjects,
  getRecentlyUpdatedProjects,
} from '@thedaviddias/web-core/home-page'
import type { WebsiteMetadata } from '@thedaviddias/web-core/content-query'

function website(
  slug: string,
  publishedAt: string,
  featured = false
): WebsiteMetadata {
  return {
    category: 'developer-tools',
    description: `${slug} description`,
    featured,
    name: slug,
    publishedAt,
    slug,
    website: `https://${slug}.example.com`,
  }
}

describe('home page data builder', () => {
  it('prefers explicitly featured listings and caps the homepage feature list at eight', () => {
    const websites = Array.from({ length: 10 }, (_, index) =>
      website(`featured-${index + 1}`, `2026-03-${String(index + 1).padStart(2, '0')}`, true)
    )

    expect(getFeaturedProjects(websites)).toHaveLength(8)
    expect(getFeaturedProjects(websites).map(item => item.slug)).toEqual([
      'featured-1',
      'featured-2',
      'featured-3',
      'featured-4',
      'featured-5',
      'featured-6',
      'featured-7',
      'featured-8',
    ])
  })

  it('falls back to the newest listings when none are explicitly featured', () => {
    const websites = [
      website('oldest', '2026-03-01'),
      website('newest', '2026-03-03'),
      website('middle', '2026-03-02'),
    ]

    expect(getFeaturedProjects(websites).map(item => item.slug)).toEqual([
      'newest',
      'middle',
      'oldest',
    ])
  })

  it('builds the full homepage data payload from listing and guide inputs', () => {
    const websites = [
      website('alpha', '2026-03-01'),
      website('charlie', '2026-03-03', true),
      website('bravo', '2026-03-02'),
    ]
    const guides = [
      {
        content: '',
        description: 'Guide description',
        publishedAt: '2026-03-01',
        slug: 'guide',
        title: 'Guide',
      },
    ]

    const data = buildHomePageData({
      guides,
      websites,
    })

    expect(data.allProjects).toBe(websites)
    expect(data.featuredGuides).toBe(guides)
    expect(data.featuredProjects.map(item => item.slug)).toEqual(['charlie'])
    expect(data.recentlyUpdatedProjects.map(item => item.slug)).toEqual([
      'charlie',
      'bravo',
      'alpha',
    ])
    expect(data.totalCount).toBe(3)
  })
})
