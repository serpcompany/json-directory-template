import { siteCopy } from '@/lib/site-copy'
import { siteConfig } from '@/lib/site-config'
import { GET } from './route'

jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    body: string
    headers: Headers
    status: number

    constructor(body: string, init?: { headers?: Record<string, string>; status?: number }) {
      this.body = body
      this.headers = new Headers(init?.headers)
      this.status = init?.status ?? 200
    }

    static json(body: unknown, init?: { status?: number }) {
      return {
        body,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => body,
        status: init?.status ?? 200
      }
    }
  }
}))

jest.mock('@/lib/content-loader', () => ({
  getResources: jest.fn(),
  getWebsites: jest.fn()
}))

const { getResources, getWebsites } = jest.requireMock('@/lib/content-loader') as {
  getResources: jest.Mock
  getWebsites: jest.Mock
}

describe('llms.txt route', () => {
  it('uses site-aware listing terminology in the generated text export', async () => {
    getWebsites.mockReturnValue([
      {
        category: 'developer-tools',
        description: 'A concise description for the example listing.',
        llmsUrl: 'https://example.com/llms.txt',
        name: 'Example Project',
        publishedAt: '2026-03-22',
        slug: 'example-project',
        website: 'https://example.com'
      }
    ])
    getResources.mockReturnValue([
      {
        category: 'docs',
        description: 'Helpful onboarding notes.',
        title: 'Getting Started',
        url: 'https://example.com/docs'
      }
    ])

    const response = await GET()
    const body = response.body as string

    expect(body).toContain(`# ${siteConfig.name}`)
    expect(body).toContain(`## ${siteCopy.listingName.pluralTitle}`)
    expect(body).toContain(`${siteCopy.submitLabel}: ${siteConfig.githubIssuesUrl}`)
    expect(body).not.toContain('LLMs.txt Hub Directory')
    expect(body).not.toContain('Want to add your website?')
  })
})
