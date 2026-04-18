import { render, screen } from '@/test/test-utils'
import { WebsiteCliSectionRoute as WebsiteCliSection } from '@thedaviddias/web-core/website/website-cli-section-route'
import type { WebsiteMetadata } from '@/lib/content-loader'

const website: WebsiteMetadata = {
  category: 'developer-tools',
  description: 'Test website description',
  name: 'Agent Docs',
  publishedAt: '2026-03-24',
  slug: 'agent-docs',
  website: 'https://example.com'
}

describe('WebsiteCliSection', () => {
  it('stays hidden unless the active site explicitly provides a CLI install mapping', () => {
    render(<WebsiteCliSection website={website} />)

    expect(screen.queryByRole('heading', { name: /cli install command/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/npx llmstxt-cli install/i)).not.toBeInTheDocument()
  })
})
