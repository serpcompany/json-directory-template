import { expect, type Page, test } from '@playwright/test'

import { detailListing } from './listing-fixture'

const listingRouteBasePath = process.env.E2E_LISTING_ROUTE_BASE_PATH ?? 'listing'

async function prepareVisualPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }

      [data-nextjs-dev-tools-button],
      nextjs-portal {
        display: none !important;
      }
    `
  })
  await expect(page.getByRole('main').first()).toBeVisible()
}

test.describe('visual regression coverage', () => {
  test('homepage remains visually stable', async ({ page }) => {
    await prepareVisualPage(page, '/')

    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    })
  })

  test('listing detail page remains visually stable', async ({ page }) => {
    await prepareVisualPage(page, `/${listingRouteBasePath}/${detailListing.slug}`)
    await expect(
      page.getByRole('heading', { level: 1, name: detailListing.namePattern })
    ).toBeVisible()

    await expect(page).toHaveScreenshot('listing-detail-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    })
  })

  test('brands page remains visually stable', async ({ page }) => {
    await prepareVisualPage(page, '/brands')

    await expect(page).toHaveScreenshot('brands-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    })
  })

  test('search page remains visually stable', async ({ page }) => {
    await prepareVisualPage(page, `/search?q=${encodeURIComponent(detailListing.searchQuery)}`)
    await expect(page.getByRole('link', { name: detailListing.namePattern })).toBeVisible()

    await expect(page).toHaveScreenshot('search-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    })
  })
})
