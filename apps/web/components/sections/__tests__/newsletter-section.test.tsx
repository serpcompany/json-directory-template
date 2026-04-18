import { render, screen } from '@/test/test-utils'
import { NewsletterSection } from '@/components/sections/newsletter-section'
import { siteCopy } from '@thedaviddias/web-core/site-copy'

describe('NewsletterSection', () => {
  it('uses the configured submit label for the call to action', () => {
    render(<NewsletterSection />)

    expect(screen.getByRole('link', { name: siteCopy.submitLabel })).toHaveAttribute(
      'href',
      '/submit'
    )
    expect(screen.getByText(/keep the directory growing/i)).toBeInTheDocument()
  })
})
