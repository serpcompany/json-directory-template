import { render, screen } from '@/test/test-utils'
import { ToolsSection } from '@/components/sections/tools-section'

describe('ToolsSection', () => {
  it('does not ship llms-specific external tool cards in the default starter', () => {
    render(<ToolsSection />)

    expect(screen.queryByText(/llms\.txt checker/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/llmstxt cli/i)).not.toBeInTheDocument()
  })
})
