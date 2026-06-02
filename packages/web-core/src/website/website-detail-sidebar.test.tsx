import React, { isValidElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { siteConfig } from '../site-config'
import { WebsiteDetailSidebar } from './website-detail-sidebar'

function collectHrefProps(node: ReactNode): string[] {
  if (Array.isArray(node)) {
    return node.flatMap(child => collectHrefProps(child))
  }

  if (!isValidElement(node)) {
    return []
  }

  const props = node.props as {
    children?: ReactNode
    href?: string
  }

  return [...(props.href ? [props.href] : []), ...collectHrefProps(props.children)]
}

describe('WebsiteDetailSidebar', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('decorates the primary Visit Site URL with the current site ref domain', () => {
    const sidebar = WebsiteDetailSidebar({
      website: {
        name: 'Example Product',
        slug: 'example-product',
        website: 'https://vendor.example.com/pricing?plan=pro#buy'
      }
    })

    expect(collectHrefProps(sidebar)).toContain(
      `https://vendor.example.com/pricing?plan=pro&ref=${siteConfig.domain}#buy`
    )
  })
})
