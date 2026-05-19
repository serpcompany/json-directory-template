import { hasConfiguredPublicSocialLinks, siteConfig } from '@thedaviddias/web-core/site-config'
import { CommunitiesSection } from '@/components/sections/communities-section'
import { HowItWorksSection } from '@/components/sections/how-it-works-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { render, screen } from '@/test/test-utils'

describe('starter section copy', () => {
  it('uses neutral directory copy in the how-it-works section', () => {
    render(<HowItWorksSection />)

    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    expect(screen.getByText(/explore the directory/i)).toBeInTheDocument()
    expect(screen.queryByText(/llms\.txt/i)).not.toBeInTheDocument()
  })

  it('does not render default placeholder social or hardcoded linkedin community links', () => {
    const { container } = render(<CommunitiesSection />)

    expect(hasConfiguredPublicSocialLinks(siteConfig)).toBe(false)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('heading', { name: /linkedin/i })).not.toBeInTheDocument()
  })

  it('replaces fake testimonials with neutral starter proof points', () => {
    render(<TestimonialsSection />)

    expect(screen.getByRole('heading', { name: /why this starter works/i })).toBeInTheDocument()
    expect(screen.getByText(/clear submission flow/i)).toBeInTheDocument()
    expect(screen.queryByText(/dr\. jane smith/i)).not.toBeInTheDocument()
  })
})
