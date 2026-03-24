import { GET } from './route'

jest.mock('@/lib/content-loader', () => ({
  getWebsites: jest.fn()
}))

const { getWebsites } = jest.requireMock('@/lib/content-loader') as {
  getWebsites: jest.Mock
}

describe('rss route', () => {
  it('uses listing-neutral categories in the JSON feed', async () => {
    getWebsites.mockResolvedValue([
      {
        category: 'developer-tools',
        description: 'A concise description for the example listing.',
        name: 'Example Project',
        publishedAt: '2026-03-22',
        slug: 'example-project',
        website: 'https://example.com'
      }
    ])

    const response = await GET()
    const feed = await response.json() as {
      items: Array<{ categories: string[] }>
    }

    expect(feed.items[0]?.categories[0]).toBe('Listing')
    expect(feed.items[0]?.categories).not.toContain('Website')
  })
})
