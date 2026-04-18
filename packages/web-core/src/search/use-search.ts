'use client'

import { logger } from '@thedaviddias/logging'
import { useEffect, useState } from 'react'
import {
  SEARCH_INDEX_PUBLIC_PATH,
  searchIndexSchema,
  type SearchIndexEntry,
} from '../search-index'
import type { SearchWebsiteMetadata } from './search-utils'
import {
  filterAndSortEntries,
  transformAndSanitizeEntries,
  tryLenientProcessing,
  validateEntries,
} from './use-search-helpers'

export function useSearch(query: string) {
  const [results, setResults] = useState<SearchWebsiteMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchIndex, setSearchIndex] = useState<SearchIndexEntry[]>([])
  const [indexLoaded, setIndexLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSearchIndex() {
      try {
        const response = await fetch(SEARCH_INDEX_PUBLIC_PATH, {
          headers: {
            'Cache-Control': 'max-age=300',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch search index: ${response.status}`)
        }

        const data = await response.json()
        const index = searchIndexSchema.parse(data)

        if (isMounted) {
          setSearchIndex(index)
          setIndexLoaded(true)
        }
      } catch (error) {
        logger.error('Error loading search index:', { data: error, tags: { type: 'component' } })
        if (isMounted) {
          setError(
            `Failed to load search index: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
          setIndexLoaded(true)
        }
      }
    }

    loadSearchIndex()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query) {
        setResults([])
        setLoading(false)
        return
      }

      if (!indexLoaded) {
        setLoading(true)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const filtered = filterAndSortEntries(searchIndex, query)
        const valid = validateEntries(filtered)

        if (valid.length === 0) {
          const lenientResults = tryLenientProcessing(filtered)
          setResults(lenientResults)
          return
        }

        const results = transformAndSanitizeEntries(valid)
        setResults(results)
      } catch (error) {
        logger.error('Error fetching or processing search results:', {
          data: error,
          tags: { type: 'component' },
        })
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSearchResults, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, indexLoaded, searchIndex])

  return { results, loading, error }
}
