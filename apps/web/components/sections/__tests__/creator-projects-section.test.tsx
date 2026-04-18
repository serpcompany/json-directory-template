import { fireEvent, render, screen } from '@/test/test-utils'
import { CreatorProjectsSectionRoute as CreatorProjectsSection } from '@thedaviddias/web-core/sections/creator-projects-section-route'
import { analytics } from '@thedaviddias/web-core/analytics'

jest.mock('@thedaviddias/web-core/analytics', () => ({
  analytics: {
    creatorProjectClick: jest.fn(),
  },
}))

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

  it('tracks creator project clicks through the shared analytics helper', () => {
    render(<CreatorProjectsSection />)

    fireEvent.click(screen.getAllByRole('link', { name: /visit site/i })[0])

    expect(analytics.creatorProjectClick).toHaveBeenCalledWith(
      'Front-End Checklist',
      'https://frontendchecklist.io',
      'visit-site',
      undefined
    )
  })
})
