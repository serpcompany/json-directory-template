import { generateStaticParams } from '@/app/[category]/page'

jest.mock('@/actions/get-home-page-data', () => ({
  getHomePageData: jest.fn(async () => ({
    allProjects: [],
    featuredProjects: [],
    recentlyUpdatedProjects: [],
    totalCount: 0
  }))
}))

jest.mock('@/lib/content-loader', () => ({
  getGuides: jest.fn(async () => []),
  getWebsites: jest.fn(() => [
    {
      slug: 'example-dev-tool',
      name: 'Example Dev Tool',
      description: 'Developer tool listing',
      website: 'https://example.com',
      category: 'developer-tools',
      publishedAt: '2026-03-24'
    },
    {
      slug: 'example-automation-tool',
      name: 'Example Automation Tool',
      description: 'Automation listing',
      website: 'https://automation.example.com',
      category: 'integration-automation',
      publishedAt: '2026-03-24'
    }
  ])
}))

describe('CategoryPage.generateStaticParams', () => {
  it('only emits category routes that have attached listings', async () => {
    await expect(generateStaticParams()).resolves.toEqual([
      { category: 'developer-tools' },
      { category: 'automation-workflow' }
    ])
  })
})
