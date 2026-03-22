'use client'

import { logger } from '@thedaviddias/logging'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'

export interface FavoritesContextValue {
  favorites: string[]
  isFavorite: (slug: string) => boolean
  addFavorite: (slug: string) => void
  removeFavorite: (slug: string) => void
  toggleFavorite: (slug: string) => void
  isLoading: boolean
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

const STORAGE_KEY = 'llms-txt-hub-favorites'

interface FavoritesProviderProps {
  children: ReactNode
}

/**
 * Provides favorites state management with localStorage and server sync
 */
export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setFavorites(parsed)
        }
      }
    } catch (error) {
      logger.error('Failed to load favorites from localStorage', {
        data: error,
        tags: { context: 'favorites' }
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveFavoritesToStorage = useCallback((newFavorites: string[]) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites))
    } catch (error) {
      logger.error('Failed to save favorites to localStorage', {
        data: error,
        tags: { context: 'favorites' }
      })
    }
  }, [])

  const isFavorite = useCallback(
    (slug: string): boolean => {
      return favorites.includes(slug)
    },
    [favorites]
  )

  const addFavorite = useCallback(
    (slug: string) => {
      if (!favorites.includes(slug)) {
        const newFavorites = [...favorites, slug]
        setFavorites(newFavorites)
        saveFavoritesToStorage(newFavorites)
      }
    },
    [favorites, saveFavoritesToStorage]
  )

  const removeFavorite = useCallback(
    (slug: string) => {
      if (favorites.includes(slug)) {
        const newFavorites = favorites.filter(fav => fav !== slug)
        setFavorites(newFavorites)
        saveFavoritesToStorage(newFavorites)
      }
    },
    [favorites, saveFavoritesToStorage]
  )

  const toggleFavorite = useCallback(
    (slug: string) => {
      if (favorites.includes(slug)) {
        removeFavorite(slug)
      } else {
        addFavorite(slug)
      }
    },
    [favorites, addFavorite, removeFavorite]
  )

  const value: FavoritesContextValue = {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoading
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

/**
 * Hook that provides access to the favorites context with safe defaults
 */
export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext)

  // Return default values during SSR or if provider is not available
  if (!context) {
    return {
      favorites: [],
      isFavorite: () => false,
      addFavorite: () => {},
      removeFavorite: () => {},
      toggleFavorite: () => {},
      isLoading: true
    }
  }

  return context
}
