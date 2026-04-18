import { render, screen } from '@/test/test-utils'
import { WebsiteError } from '@/components/website/website-error'

describe('WebsiteError', () => {
  it('renders the generic website error state through the package-owned wrapper', () => {
    render(<WebsiteError />)

    expect(screen.getByText(/error loading website/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /return to the websites list/i })
    ).toHaveAttribute('href', '/listing')
  })
})
