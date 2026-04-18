import { render, screen } from '@/test/test-utils'
import { HeroSection } from '@thedaviddias/web-core/sections/hero-section'
import { siteConfig } from '@thedaviddias/web-core/site-config'

jest.mock('@thedaviddias/web-core/ui/animated-background', () => ({
  AnimatedBackground: () => <div data-testid="animated-background" />
}))

describe('HeroSection', () => {
  it('renders the configured site name with generic directory copy', async () => {
    render(<HeroSection websiteCount={42} />)

    expect(screen.getByRole('heading', { name: siteConfig.name })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(siteConfig.tagline, 'i'))).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/listings in directory/i)).toBeInTheDocument()
    expect(screen.getByText(/resources, and documentation links/i)).toBeInTheDocument()
    expect(screen.queryByText(/tools, and documentation links/i)).not.toBeInTheDocument()
    expect(screen.getByText(/searchable directory/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submit a listing/i })).toBeInTheDocument()
  })
})
