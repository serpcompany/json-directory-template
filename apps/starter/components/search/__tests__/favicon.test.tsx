import { LISTING_LOGO_FALLBACK_PATH } from '@thedaviddias/web-core/listing-logo-presentation'
import { Favicon } from '@thedaviddias/web-core/search/favicon'
import { fireEvent, render, screen } from '@/test/test-utils'

describe('search Favicon', () => {
  it('uses the local listing fallback instead of a remote favicon service', () => {
    render(<Favicon website="https://example.com" title="Example Project" />)

    expect(screen.getByRole('img', { name: 'Example Project logo' })).toHaveAttribute(
      'src',
      LISTING_LOGO_FALLBACK_PATH
    )
  })

  it('shows the icon fallback when the local asset fails', () => {
    render(<Favicon website="https://example.com" title="Example Project" />)

    fireEvent.error(screen.getByRole('img', { name: 'Example Project logo' }))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTitle('Example Project')).toBeInTheDocument()
  })
})
