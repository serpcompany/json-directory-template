import { render, screen } from '@testing-library/react'
import { WebsiteContentSection } from '@/components/website/website-content-section'
import type { WebsiteMetadata } from '@/lib/content-loader'

jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: ({ source }: { source: string }) => <div data-testid="mdx-content">{source}</div>
}))

jest.mock('remark-gfm', () => jest.fn())

const baseWebsite: WebsiteMetadata = {
  category: 'developer-tools',
  description: 'Useful developer tooling.',
  llmsUrl: 'https://example.com/llms.txt',
  name: 'Example Project',
  publishedAt: '2026-03-22',
  slug: 'example-project',
  website: 'https://example.com'
}

describe('WebsiteContentSection', () => {
  it('renders the provided long-form content when it exists', () => {
    render(
      <WebsiteContentSection
        website={{
          ...baseWebsite,
          content: '## Overview\n\nThis came from data/websites.json.'
        }}
      />
    )

    expect(screen.getByTestId('mdx-content')).toHaveTextContent(
      '## Overview This came from data/websites.json.'
    )
    expect(screen.queryByText('About Example Project')).not.toBeInTheDocument()
  })
})
