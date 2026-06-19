import { resolveGoogleTagManagerId } from '@thedaviddias/web-core/google-tag-manager'
import { describe, expect, it } from 'vitest'

describe('resolveGoogleTagManagerId', () => {
  it('returns the configured GTM id in production', () => {
    expect(
      resolveGoogleTagManagerId(
        {
          gtmId: 'GTM-M82HC3SC',
        },
        'production'
      )
    ).toBe('GTM-M82HC3SC')
  })

  it('returns the configured GTM id for local site verification', () => {
    expect(
      resolveGoogleTagManagerId({
        gtmId: 'GTM-M82HC3SC',
      })
    ).toBe('GTM-M82HC3SC')
  })

  it('does not return a GTM id when the active site is not configured for it', () => {
    expect(resolveGoogleTagManagerId({})).toBeUndefined()
  })
})
