import { render, screen } from '@/test/test-utils'
import { WebsiteCliSection } from '@/components/website/website-cli-section'
import type { WebsiteMetadata } from '@/lib/content-loader'

const website: WebsiteMetadata = {
  category: 'developer-tools',
  description: 'Test website description',
  llmsUrl: 'https://example.com/llms.txt',
  name: 'Agent llms.txt',
  publishedAt: '2026-03-24',
  slug: 'agent-llms-txt',
  website: 'https://example.com'
}

describe('WebsiteCliSection', () => {
  it('stays hidden unless the active site explicitly provides a CLI install mapping', () => {
    render(<WebsiteCliSection website={website} />)

    expect(screen.queryByRole('heading', { name: /cli install command/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/npx llmstxt-cli install/i)).not.toBeInTheDocument()
  })
})
