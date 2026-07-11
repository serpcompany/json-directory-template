import { categories } from '@thedaviddias/web-core/categories'
import { MobileDrawer } from '@thedaviddias/web-core/layout/mobile-drawer'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { fireEvent, render, screen, waitFor } from '@/test/test-utils'

jest.mock('@thedaviddias/web-core/ui/favorites-link', () => ({
  FavoritesLink: () => <a href="/favorites">Favorites</a>
}))

describe('MobileDrawer', () => {
  it('uses a shadcn scroll area inside the open drawer', () => {
    render(<MobileDrawer isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Menu' })).not.toHaveAttribute('inert')
    expect(screen.getByText('Navigation').closest('[data-slot="scroll-area"]')).toBeInTheDocument()
  })

  it('moves focus into the open drawer, traps tab focus, and restores focus on close', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender } = render(<MobileDrawer isOpen={true} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus()
    })

    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    lastElement?.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(firstElement).toHaveFocus()

    firstElement?.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(lastElement).toHaveFocus()

    rerender(<MobileDrawer isOpen={false} onClose={jest.fn()} />)
    await waitFor(() => {
      expect(trigger).toHaveFocus()
    })
    trigger.remove()
  })

  it('keeps the backdrop out of the tab order while assistive-hidden', () => {
    render(<MobileDrawer isOpen={true} onClose={jest.fn()} />)

    const backdrop = document.querySelector('button[aria-hidden="true"]')
    expect(backdrop).toHaveAttribute('tabindex', '-1')
  })

  it('keeps the closed drawer mounted but hidden from keyboard and assistive navigation', () => {
    render(<MobileDrawer isOpen={false} onClose={jest.fn()} />)

    expect(screen.queryByRole('link', { name: siteCopy.submitLabel })).not.toBeInTheDocument()

    const drawer = document.querySelector('[role="dialog"]')
    expect(drawer).toHaveAttribute('aria-hidden', 'true')
    expect(drawer).toHaveAttribute('inert')
  })

  it('uses the configured submit label and omits the all-items anchor shortcut', () => {
    render(<MobileDrawer isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByRole('link', { name: siteCopy.submitLabel })).toHaveAttribute(
      'href',
      '/submit/'
    )
    expect(screen.queryByRole('link', { name: /all listings/i })).not.toBeInTheDocument()
  })

  it('hides external resource links when external resources are disabled for the site', () => {
    render(<MobileDrawer isOpen={true} onClose={jest.fn()} />)

    expect(screen.queryByRole('heading', { name: 'Resources' })).not.toBeInTheDocument()
    expect(screen.queryByText('Chrome Extension')).not.toBeInTheDocument()
  })

  it('renders only active categories and hides the featured shortcut when there are no featured listings', () => {
    render(
      <MobileDrawer
        isOpen={true}
        onClose={jest.fn()}
        availableCategorySlugs={[categories[0]!.slug]}
        showFeaturedCategory={false}
      />
    )

    expect(screen.getByRole('link', { name: categories[0]!.name })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'AI & Machine Learning' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /featured/i })).not.toBeInTheDocument()
  })
})
