import { render, screen } from '@/test/test-utils'
import { ExternalResourcesSectionRoute as ExternalResourcesSection } from '@thedaviddias/web-core/sections/external-resources-section-route'

describe('ExternalResourcesSection', () => {
  it('does not ship llms-specific external tool cards in the default starter', () => {
    render(<ExternalResourcesSection />)

    expect(screen.queryByText(/llms\.txt checker/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/llmstxt cli/i)).not.toBeInTheDocument()
  })
})
