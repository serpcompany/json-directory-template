import { render, screen } from '@/test/test-utils'
import { CommunitiesSection } from '@/components/sections/communities-section'
import { siteConfig } from '@/lib/site-config'

describe('CommunitiesSection', () => {
  it('uses configured Reddit and X URLs', () => {
    render(<CommunitiesSection />)

    expect(screen.getByRole('link', { name: /Reddit/i })).toHaveAttribute(
      'href',
      siteConfig.redditUrl
    )
    expect(screen.getByRole('link', { name: /X Community/i })).toHaveAttribute(
      'href',
      siteConfig.twitterUrl
    )
    expect(screen.getByText(new RegExp(siteConfig.name, 'i'))).toBeInTheDocument()
  })
})
