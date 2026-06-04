import { FeaturedOnBadgeEmbedPanel } from '@thedaviddias/web-core/website/featured-on-badge-embed-panel'
import { render, screen, userEvent, waitFor } from '@/test/test-utils'

const props = {
  badgeUrls: {
    dark: 'https://directory.example/badge/featured-on-example-dark.svg',
    light: 'https://directory.example/badge/featured-on-example-light.svg'
  },
  listingUrl: 'https://directory.example/listing/example-product/',
  siteId: 'example',
  siteName: 'Example Directory'
}

describe('FeaturedOnBadgeEmbedPanel', () => {
  it('copies the light badge embed HTML with the listing URL and light badge URL', async () => {
    const user = userEvent.setup()
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<FeaturedOnBadgeEmbedPanel {...props} />)

    await user.click(screen.getByRole('button', { name: 'Copy light badge embed code' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `<a href="https://directory.example/listing/example-product/" target="_blank" rel="noopener noreferrer" title="Featured on Example Directory">
  <img src="https://directory.example/badge/featured-on-example-light.svg" alt="Featured on Example Directory" width="200" height="50" />
</a>`
      )
    })
  })

  it('copies the dark badge embed HTML with the listing URL and dark badge URL', async () => {
    const user = userEvent.setup()
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<FeaturedOnBadgeEmbedPanel {...props} />)

    await user.click(screen.getByRole('button', { name: 'Copy dark badge embed code' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `<a href="https://directory.example/listing/example-product/" target="_blank" rel="noopener noreferrer" title="Featured on Example Directory">
  <img src="https://directory.example/badge/featured-on-example-dark.svg" alt="Featured on Example Directory" width="200" height="50" />
</a>`
      )
    })
  })

  it('can show local preview images while copying absolute embed URLs', async () => {
    const user = userEvent.setup()
    const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(
      <FeaturedOnBadgeEmbedPanel
        {...props}
        badgePreviewUrls={{
          dark: '/badge/featured-on-example-dark.svg',
          light: '/badge/featured-on-example-light.svg'
        }}
      />
    )

    expect(
      screen.getByRole('img', { name: 'Light Featured on Example Directory badge' })
    ).toHaveAttribute('src', '/badge/featured-on-example-light.svg')
    expect(
      screen.getByRole('img', { name: 'Light Featured on Example Directory badge' })
    ).toHaveClass('max-w-full', 'h-auto')

    await user.click(screen.getByRole('button', { name: 'Copy light badge embed code' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `<a href="https://directory.example/listing/example-product/" target="_blank" rel="noopener noreferrer" title="Featured on Example Directory">
  <img src="https://directory.example/badge/featured-on-example-light.svg" alt="Featured on Example Directory" width="200" height="50" />
</a>`
      )
    })
  })

  it('keeps badge preview buttons as flat clickable images', () => {
    render(<FeaturedOnBadgeEmbedPanel {...props} />)

    const lightButton = screen.getByRole('button', { name: 'Copy light badge embed code' })
    const darkButton = screen.getByRole('button', { name: 'Copy dark badge embed code' })

    expect(lightButton.querySelector('img')?.parentElement).toBe(lightButton)
    expect(darkButton.querySelector('img')?.parentElement).toBe(darkButton)
    expect(lightButton.querySelector('span')).toBeNull()
    expect(darkButton.querySelector('span')).toBeNull()
  })

  it('does not style badge preview buttons as card containers', () => {
    render(<FeaturedOnBadgeEmbedPanel {...props} />)

    const lightButton = screen.getByRole('button', { name: 'Copy light badge embed code' })

    expect(lightButton).not.toHaveClass('border')
    expect(lightButton).not.toHaveClass('bg-background')
    expect(lightButton).not.toHaveClass('cursor-copy')
    expect(lightButton).not.toHaveClass('p-3')
    expect(lightButton).toHaveClass('bg-transparent', 'cursor-pointer', 'p-0')
  })
})
