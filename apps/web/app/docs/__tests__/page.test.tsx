jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: () => null
}))

jest.mock('remark-gfm', () => jest.fn())

import { metadata } from '@/app/docs/page'
import { siteConfig } from '@/lib/site-config'

describe('DocsPage', () => {
  it('uses the configured docs label in metadata instead of hardcoded documentation copy', () => {
    expect(metadata.title).toBe(`${siteConfig.copy.docsLabel} - ${siteConfig.name}`)
    expect(metadata.description).toBe(
      `Reference docs, setup notes, and workflow details for ${siteConfig.name}.`
    )
    expect(metadata.keywords).not.toContain('llmstxt-cli')
  })
})
