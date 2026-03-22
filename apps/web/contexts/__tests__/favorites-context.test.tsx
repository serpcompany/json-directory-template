import { act } from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils.helper'
import { useFavorites } from '@/contexts/favorites-context'

function FavoritesConsumer() {
  const { favorites, isLoading, toggleFavorite } = useFavorites()

  return (
    <div>
      <p data-testid="favorites-state">{isLoading ? 'loading' : favorites.join(',')}</p>
      <button type="button" onClick={() => toggleFavorite('alpha')}>
        Toggle alpha
      </button>
    </div>
  )
}

describe('FavoritesProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads favorites from localStorage on mount', async () => {
    window.localStorage.setItem('llms-txt-hub-favorites', JSON.stringify(['alpha', 'beta']))

    render(<FavoritesConsumer />)

    await waitFor(() => {
      expect(screen.getByTestId('favorites-state')).toHaveTextContent('alpha,beta')
    })
  })

  it('updates localStorage when favorites are toggled', async () => {
    const { user } = render(<FavoritesConsumer />)

    await waitFor(() => {
      expect(screen.getByTestId('favorites-state')).toHaveTextContent('')
    })

    await user.click(screen.getByRole('button', { name: 'Toggle alpha' }))

    await waitFor(() => {
      expect(screen.getByTestId('favorites-state')).toHaveTextContent('alpha')
    })

    expect(window.localStorage.getItem('llms-txt-hub-favorites')).toBe(JSON.stringify(['alpha']))

    await user.click(screen.getByRole('button', { name: 'Toggle alpha' }))

    await waitFor(() => {
      expect(screen.getByTestId('favorites-state')).toHaveTextContent('')
    })

    expect(window.localStorage.getItem('llms-txt-hub-favorites')).toBe(JSON.stringify([]))
  })

  it('does not throw when localStorage contains invalid JSON', async () => {
    window.localStorage.setItem('llms-txt-hub-favorites', '{broken')

    await act(async () => {
      render(<FavoritesConsumer />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('favorites-state')).toHaveTextContent('')
    })
  })
})
