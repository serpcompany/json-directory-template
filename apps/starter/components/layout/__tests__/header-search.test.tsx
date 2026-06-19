import { render, screen } from '@/test/test-utils'
import { DesktopSearchForm, MobileSearchOverlay } from '@thedaviddias/web-core/layout/header-search'

jest.mock('@thedaviddias/web-core/search/search-autocomplete', () => ({
  SearchAutocomplete: () => null
}))

const baseProps = {
  onAutocompleteClose: jest.fn(),
  onAutocompleteSelect: jest.fn(),
  onInputFocus: jest.fn(),
  onSearchChange: jest.fn(),
  onSubmit: jest.fn(),
  searchQuery: '',
  showAutocomplete: false
}

describe('header search copy', () => {
  it('uses listing-neutral placeholder copy on desktop', () => {
    render(<DesktopSearchForm {...baseProps} />)

    expect(
      screen.getByPlaceholderText(/Search/i)
    ).toBeInTheDocument()
  })

  it('uses listing-neutral placeholder copy on mobile', () => {
    render(
      <MobileSearchOverlay
        showMobileSearch={true}
        showMobileAutocomplete={false}
        onMobileSearchClose={jest.fn()}
        searchQuery=""
        onSearchChange={jest.fn()}
        onInputFocus={jest.fn()}
        onSubmit={jest.fn()}
        onAutocompleteSelect={jest.fn()}
      />
    )

    expect(
      screen.getByPlaceholderText(/Search/i)
    ).toBeInTheDocument()
  })
})
