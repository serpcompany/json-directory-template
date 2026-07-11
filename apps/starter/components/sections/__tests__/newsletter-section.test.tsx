import { NewsletterSection } from '@thedaviddias/web-core/sections/newsletter-section'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { render, screen } from '@/test/test-utils'

describe('NewsletterSection', () => {
  it('uses the configured submit label for the call to action', () => {
    render(<NewsletterSection />)

    const submitLink = screen.getByRole('link', { name: siteCopy.submitLabel })
    expect(submitLink).toHaveAttribute('href', '/submit/')
    expect(submitLink).toHaveAttribute('data-slot', 'button')
    expect(submitLink).toHaveClass('rounded-none')
    expect(screen.getByText(/keep the directory growing/i)).toBeInTheDocument()
  })
})
