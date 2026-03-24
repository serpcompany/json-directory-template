jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: () => null
}))

jest.mock('remark-gfm', () => jest.fn())

jest.mock('@/lib/content-loader', () => ({
  getDocBySlug: jest.fn(async () => ({
    content: '',
    description: 'Install and use the CLI.',
    slug: 'cli-install',
    title: 'CLI Install'
  })),
  getDocs: jest.fn(() => [])
}))

import { generateMetadata } from '@/app/docs/[slug]/page'
import { getRoute } from '@/lib/routes'

describe('DocPage', () => {
  it('uses generic documentation metadata on the configured docs route', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        slug: 'cli-install'
      })
    })

    expect(metadata.title).toBe('CLI Install - Docs')
    expect(metadata.alternates?.canonical).toBe(`https://example.com${getRoute('docs.doc', { slug: 'cli-install' })}`)
    expect(metadata.keywords).toContain('documentation')
    expect(metadata.keywords).toContain('reference')
    expect(metadata.keywords).not.toContain('llmstxt-cli')
  })
})
