import { render, screen } from '@/test/test-utils'
import { CommunitiesSection } from '@/components/sections/communities-section'
import { HowItWorksSection } from '@/components/sections/how-it-works-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { siteConfig } from '@/lib/site-config'

describe('starter section copy', () => {
  it('uses neutral directory copy in the how-it-works section', () => {
    render(<HowItWorksSection />)

    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    expect(screen.getByText(/explore the directory/i)).toBeInTheDocument()
    expect(screen.queryByText(/llms\.txt/i)).not.toBeInTheDocument()
  })

  it('uses configured social links without hardcoded linkedin community links', () => {
    render(<CommunitiesSection />)

    expect(screen.getByRole('heading', { name: /^reddit$/i }).closest('a')).toHaveAttribute(
      'href',
      siteConfig.redditUrl
    )
    expect(screen.getByRole('heading', { name: /^x$/i }).closest('a')).toHaveAttribute(
      'href',
      siteConfig.twitterUrl
    )
    expect(screen.getByRole('heading', { name: /^github$/i }).closest('a')).toHaveAttribute(
      'href',
      siteConfig.githubRepoUrl
    )
    expect(screen.queryByRole('heading', { name: /linkedin/i })).not.toBeInTheDocument()
  })

  it('replaces fake testimonials with neutral starter proof points', () => {
    render(<TestimonialsSection />)

    expect(screen.getByRole('heading', { name: /why this starter works/i })).toBeInTheDocument()
    expect(screen.getByText(/clear submission flow/i)).toBeInTheDocument()
    expect(screen.queryByText(/dr\. jane smith/i)).not.toBeInTheDocument()
  })
})
