'use client'
import { Menu, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { useAnalyticsEvents } from '@/components/analytics-tracker'
import { GithubStars } from '@/components/stats/github-stars'
import { useSearch } from '@/hooks/use-search'
import type { HeaderAuthState } from '@/lib/auth'
import { getRoute } from '@/lib/routes'
import { siteCopy } from '@/lib/site-copy'
import { siteConfig } from '@/lib/site-config'
import { NavLink } from './header-nav-link'
import { DesktopSearchForm, MobileSearchOverlay } from './header-search'
import { MobileDrawer } from './mobile-drawer'

/**
 * Main header component with navigation, search, and user actions
 *
 * @returns JSX.Element - Header component
 */
export function Header({ authState }: { authState?: HeaderAuthState }) {
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [showMobileAutocomplete, setShowMobileAutocomplete] = useState(false)
  const { searchQuery, setSearchQuery, handleSearch } = useSearch()
  const { trackSearch } = useAnalyticsEvents()
  const isAuthenticated = authState?.isAuthenticated ?? false
  const isAuthConfigured = authState?.isConfigured ?? true

  // Auto-focus mobile search input when it appears and handle escape key
  useEffect(() => {
    if (showMobileSearch) {
      // Prevent body scroll when search is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [showMobileSearch])

  /**
   * Handles form submission for search
   *
   * @param e - Form event
   */
  const onSubmit = (e: FormEvent<Element>) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Track search submission
      trackSearch(
        searchQuery,
        0,
        showMobileSearch ? 'header-mobile-search' : 'header-desktop-search'
      )
      handleSearch(searchQuery)
      setSearchQuery('')
      setShowAutocomplete(false)
      setShowMobileAutocomplete(false)
      if (showMobileSearch) {
        setShowMobileSearch(false)
        setShowMobileAutocomplete(false)
      }
    }
  }

  /**
   * Handles desktop search input focus
   */
  const handleInputFocus = () => {
    setShowAutocomplete(true)
  }

  /**
   * Handles mobile search input focus
   */
  const handleMobileInputFocus = () => {
    setShowMobileAutocomplete(true)
  }

  /**
   * Handles desktop search input change
   *
   * @param e - Input change event
   */
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!showAutocomplete) setShowAutocomplete(true)
  }

  /**
   * Handles mobile search input change
   *
   * @param e - Input change event
   */
  const handleMobileSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!showMobileAutocomplete) setShowMobileAutocomplete(true)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="w-full px-4 sm:px-6 h-16 flex 2xl:grid 2xl:grid-cols-3 items-center justify-between 2xl:justify-center gap-3 sm:gap-4">
          {/* Logo + Menu - Left */}
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setShowMobileDrawer(true)}
              className="block sm:hidden p-2 hover:bg-muted rounded-md transition-colors -ml-2"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href={getRoute('home')}
              className="group text-lg font-bold whitespace-nowrap tracking-tight"
            >
              <span className="inline transition-colors">{siteConfig.name}</span>
            </Link>
          </div>

          {/* Search - Center (prominent on desktop) */}
          <DesktopSearchForm
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onInputFocus={handleInputFocus}
            onSubmit={onSubmit}
            showAutocomplete={showAutocomplete}
            onAutocompleteClose={() => setShowAutocomplete(false)}
            onAutocompleteSelect={() => {
              setShowAutocomplete(false)
              setSearchQuery('')
            }}
          />

          {/* Navigation + Actions - Right */}
          <div className="flex items-center gap-2 sm:gap-4 2xl:justify-end">
            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              {siteConfig.features.showProjects ? (
                <NavLink href={getRoute('projects')}>Projects</NavLink>
              ) : null}
              {siteConfig.features.showDocs ? (
                <NavLink href={getRoute('docs.list')}>Docs</NavLink>
              ) : null}
              {siteConfig.features.showGuides ? (
                <NavLink href={getRoute('guides.list')}>Guides</NavLink>
              ) : null}
              {/* <NavLink href={getRoute('news')}>News</NavLink> */}
            </nav>

            {/* Mobile search icon */}
            <button
              type="button"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </button>

            <div>
              <GithubStars mobileCompact={true} />
            </div>

            <Link
              href={getRoute('submit')}
              className="inline-flex items-center justify-center rounded-none text-sm font-bold h-9 px-4 bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 press-effect"
              aria-label={siteCopy.submitLabel}
              title={siteCopy.submitLabel}
            >
              <Plus className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">{siteCopy.submitLabel}</span>
            </Link>

            {siteConfig.features.showAuth && isAuthenticated ? (
              <>
                <Link
                  href={getRoute('account')}
                  className="hidden sm:inline-flex items-center justify-center rounded-none text-sm font-bold h-9 px-4 border border-border hover:bg-accent transition-colors"
                >
                  Account
                </Link>
                <SignOutButton className="hidden sm:inline-flex rounded-none text-sm font-bold h-9 px-4" />
              </>
            ) : siteConfig.features.showAuth && isAuthConfigured ? (
              <Link
                href={getRoute('login')}
                className="hidden sm:inline-flex items-center justify-center rounded-none text-sm font-bold h-9 px-4 border border-border hover:bg-accent transition-colors"
              >
                Sign up / Sign in
              </Link>
            ) : null}
          </div>
        </div>

        {/* Mobile search overlay */}
        <MobileSearchOverlay
          showMobileSearch={showMobileSearch}
          searchQuery={searchQuery}
          onSearchChange={handleMobileSearchChange}
          onInputFocus={handleMobileInputFocus}
          onSubmit={onSubmit}
          showMobileAutocomplete={showMobileAutocomplete}
          onMobileSearchClose={() => {
            setShowMobileSearch(false)
            setShowMobileAutocomplete(false)
          }}
          onAutocompleteSelect={() => {
            setShowMobileAutocomplete(false)
            setShowMobileSearch(false)
            setSearchQuery('')
          }}
        />
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        featuredCount={6}
        authState={authState}
      />
    </>
  )
}
