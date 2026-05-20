import { hasConfiguredPublicSocialLinks, siteConfig } from '@thedaviddias/web-core/site-config'
import { CommunitiesSection } from '@/components/sections/communities-section'
import { render, screen } from '@/test/test-utils'

describe('CommunitiesSection', () => {
  it('does not render default placeholder social links', () => {
    const { container } = render(<CommunitiesSection />)

    expect(hasConfiguredPublicSocialLinks(siteConfig)).toBe(false)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('heading', { name: /^reddit$/i })).not.toBeInTheDocument()
  })
})
