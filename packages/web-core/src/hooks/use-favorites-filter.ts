'use client'

import { useMemo } from 'react'
import type { WebsiteMetadata } from '../content-query'
import { useFavorites } from '../root-shell-client'

export function useFavoritesFilter(websites: WebsiteMetadata[]) {
  const { favorites } = useFavorites()

  const favoriteWebsites = useMemo(() => {
    return websites.filter(website => favorites.includes(website.slug))
  }, [websites, favorites])

  return {
    favoriteWebsites,
    hasFavorites: favorites.length > 0,
    favoritesCount: favorites.length,
  }
}
