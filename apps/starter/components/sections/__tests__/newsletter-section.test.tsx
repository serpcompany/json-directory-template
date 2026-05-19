import { NewsletterSection } from '@thedaviddias/web-core/sections/newsletter-section'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { render, screen } from '@/test/test-utils'

describe('NewsletterSection', () => {
  it('uses the configured submit label for the call to action', () => {
    render(<NewsletterSection />)

    expect(screen.getByRole('link', { name: siteCopy.submitLabel })).toHaveAttribute(
      'href',
      '/submit/'
    )
    expect(screen.getByText(/keep the directory growing/i)).toBeInTheDocument()
  })
})
