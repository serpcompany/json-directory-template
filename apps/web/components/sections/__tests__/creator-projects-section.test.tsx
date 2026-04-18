import { render, screen } from '@/test/test-utils'
import { CreatorProjectsSection } from '@/components/sections/creator-projects-section'

describe('CreatorProjectsSection', () => {
  it('renders the shared creator project cards and follow CTA', () => {
    render(<CreatorProjectsSection />)

    expect(
      screen.getByRole('heading', { name: 'More Projects by the Creator' })
    ).toBeInTheDocument()
    expect(screen.getByText('Front-End Checklist')).toBeInTheDocument()
    expect(screen.getByText('UX Patterns for Developers')).toBeInTheDocument()
    expect(screen.getByText('Indie Dev Toolkit')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /follow on github/i })
    ).toBeInTheDocument()
  })
})
