import { render, screen } from '@/test/test-utils'
import { CommunitiesSection } from '@/components/sections/communities-section'
import { siteConfig } from '@/lib/site-config'

describe('CommunitiesSection', () => {
  it('uses configured social and repo URLs', () => {
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
    expect(
      screen.getByText(new RegExp(`Stay close to ${siteConfig.name}`, 'i'))
    ).toBeInTheDocument()
  })
})
