jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: () => null
}))

jest.mock('remark-gfm', () => jest.fn())

import { metadata } from '@/app/docs/page'
import { siteConfig } from '@/lib/site-config'

describe('DocsPage', () => {
  it('uses generic documentation metadata instead of llmstxt-cli-specific route copy', () => {
    expect(metadata.title).toBe(`Documentation - ${siteConfig.name}`)
    expect(metadata.description).toBe(
      `Reference documentation, setup notes, and workflow details for ${siteConfig.name}.`
    )
    expect(metadata.keywords).not.toContain('llmstxt-cli')
  })
})
