'use client'
import { siteCopy } from '@thedaviddias/web-core/site-copy'
import { useRef } from 'react'
import { SearchAutocomplete } from '../search/search-autocomplete'
import { SearchInput } from '../search/search-input'

interface DesktopSearchFormProps {
  availableCategorySlugs: string[]
  searchQuery: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onInputFocus: () => void
  onSubmit: (e: React.FormEvent) => void
  showAutocomplete: boolean
  onAutocompleteClose: () => void
  onAutocompleteSelect: () => void
}

/**
 * Desktop search form component
 *
 * @param searchQuery - Current search query
 * @param onSearchChange - Search input change handler
 * @param onInputFocus - Input focus handler
 * @param onSubmit - Form submission handler
 * @param showAutocomplete - Whether autocomplete is shown
 * @param onAutocompleteClose - Autocomplete close handler
 * @param onAutocompleteSelect - Autocomplete selection handler
 * @returns JSX.Element - Desktop search form
 */
export function DesktopSearchForm({
  availableCategorySlugs,
  searchQuery,
  onSearchChange,
  onInputFocus,
  onSubmit,
  showAutocomplete,
  onAutocompleteClose,
  onAutocompleteSelect
}: DesktopSearchFormProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="hidden md:block flex-1 2xl:flex-none 2xl:w-full max-w-2xl 2xl:max-w-none">
      <form
        aria-label="Desktop search"
        onSubmit={onSubmit}
        className="relative 2xl:max-w-2xl 2xl:mx-auto"
      >
        <SearchInput
          ref={searchInputRef}
          aria-label="Search"
          placeholder={siteCopy.listingSearchPlaceholder}
          value={searchQuery}
          onChange={onSearchChange}
          onFocus={onInputFocus}
        />
        <SearchAutocomplete
          availableCategorySlugs={availableCategorySlugs}
          searchQuery={searchQuery}
          isOpen={showAutocomplete}
          onClose={onAutocompleteClose}
          anchorRef={searchInputRef}
          onSelect={onAutocompleteSelect}
        />
      </form>
    </div>
  )
}

interface MobileSearchOverlayProps {
  availableCategorySlugs: string[]
  showMobileSearch: boolean
  searchQuery: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onInputFocus: () => void
  onSubmit: (e: React.FormEvent) => void
  showMobileAutocomplete: boolean
  onMobileSearchClose: () => void
  onAutocompleteSelect: () => void
}

/**
 * Mobile search overlay component
 *
 * @param showMobileSearch - Whether mobile search is shown
 * @param searchQuery - Current search query
 * @param onSearchChange - Search input change handler
 * @param onInputFocus - Input focus handler
 * @param onSubmit - Form submission handler
 * @param showMobileAutocomplete - Whether mobile autocomplete is shown
 * @param onMobileSearchClose - Mobile search close handler
 * @param onAutocompleteSelect - Autocomplete selection handler
 * @returns JSX.Element - Mobile search overlay
 */
export function MobileSearchOverlay({
  availableCategorySlugs,
  showMobileSearch,
  searchQuery,
  onSearchChange,
  onInputFocus,
  onSubmit,
  showMobileAutocomplete,
  onMobileSearchClose,
  onAutocompleteSelect
}: MobileSearchOverlayProps) {
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  if (!showMobileSearch) return null

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="md:hidden fixed inset-0 top-16 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onMobileSearchClose}
        aria-label="Close search"
      />
      {/* Search container */}
      <div className="md:hidden fixed inset-x-0 top-16 z-50 bg-background">
        <div className="px-4 sm:px-6 py-3 border-t">
          <form aria-label="Mobile search" onSubmit={onSubmit} className="relative">
            <SearchInput
              ref={mobileSearchInputRef}
              aria-label="Search listings"
              placeholder={siteCopy.listingSearchPlaceholder}
              value={searchQuery}
              onChange={onSearchChange}
              onFocus={onInputFocus}
            />
            <SearchAutocomplete
              availableCategorySlugs={availableCategorySlugs}
              searchQuery={searchQuery}
              isOpen={showMobileAutocomplete}
              onClose={() => onMobileSearchClose()}
              anchorRef={mobileSearchInputRef}
              onSelect={onAutocompleteSelect}
            />
          </form>
        </div>
      </div>
    </>
  )
}
