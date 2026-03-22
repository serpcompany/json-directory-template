'use client'

export function AnalyticsTracker() {
  return null
}

export function useAnalyticsEvents() {
  const noop = (..._args: unknown[]) => {}

  return {
    trackAccountDeleteCancel: noop,
    trackAccountDeleteStart: noop,
    trackAccountDeleteSuccess: noop,
    trackFetchMetadataError: noop,
    trackFetchMetadataSuccess: noop,
    trackFormError: noop,
    trackFormStepComplete: noop,
    trackFormStepStart: noop,
    trackLoadMore: noop,
    trackProfileModalOpen: noop,
    trackProfileUpdateError: noop,
    trackProfileUpdateSuccess: noop,
    trackProfileVisibilityToggle: noop,
    trackSearch: noop,
    trackSearchAutocomplete: noop,
    trackShowAll: noop,
    trackShowLess: noop,
    trackSortChange: noop,
    trackSubmitError: noop,
    trackSubmitSuccess: noop
  }
}
