import { expect, type Page, type Response, test } from '@playwright/test'

const detailListing = {
  slug: '123movies-downloader'
} as const

async function gotoWithRetry(page: Page, path: string): Promise<Response | null> {
  let lastError: unknown

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await page.goto(path, { waitUntil: 'domcontentloaded' })
    } catch (error) {
      lastError = error
      await page.waitForTimeout(1000)
    }
  }

  throw lastError
}

async function expectUnavailableRoute(page: Page, path: string) {
  const response = await gotoWithRetry(page, path)
  const status = response?.status()

  if (status === 404) {
    return
  }

  await expect(page.getByRole('heading', { level: 1, name: /page not found/i })).toBeVisible()
}

test.describe('Main Pages', () => {
  test('homepage should load and display key elements', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('link', { name: /^Directory Starter$/ })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(
      page.getByRole('banner').getByRole('link', { name: /submit a listing/i })
    ).toBeVisible()

    if (testInfo.project.name === 'mobile') {
      await expect(page.getByRole('button', { name: /toggle search/i })).toBeVisible()
    } else {
      await expect(
        page.getByPlaceholder(/search listings, categories, and descriptions/i)
      ).toBeVisible()
    }
  })

  test('about page should load and display content', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('submit page should load and explain the GitHub issue workflow', async ({ page }) => {
    await page.goto('/submit')

    await expect(page.getByRole('heading', { level: 1, name: /submit a listing/i })).toBeVisible()
    await expect(page.getByText(/github issue submission is disabled/i)).toBeVisible()
  })

  test('disabled optional routes should not be publicly available by default', async ({ page }) => {
    const disabledRoutes = [
      '/login',
      '/account',
      '/favorites',
      '/docs',
      '/posts',
      '/network'
    ] as const

    for (const path of disabledRoutes) {
      await expectUnavailableRoute(page, path)
    }
  })
})

test.describe('Listing and Category Pages', () => {
  test('public listing detail route should load', async ({ page }) => {
    await page.goto(`/listing/${detailListing.slug}`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  })

  test('video downloaders category should load', async ({ page }) => {
    await page.goto('/categories/video-downloaders/', { waitUntil: 'commit' })

    await expect(page.getByRole('heading', { level: 1, name: /video downloaders/i })).toBeVisible()
  })

  test('featured category should load', async ({ page }) => {
    await page.goto('/categories/featured')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Search and Navigation', () => {
  test('search page should work with a query parameter', async ({ page }, testInfo) => {
    await page.goto('/search?q=directory')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    if (testInfo.project.name !== 'mobile') {
      await expect(page.getByRole('textbox').first()).toBeVisible()
    }
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('primary navigation links should work correctly', async ({ page }) => {
    await page.goto('/')

    await page
      .getByRole('banner')
      .getByRole('link', { name: /submit a listing/i })
      .click()
    await expect(page).toHaveURL(/\/submit/)
    await expect(page.getByRole('heading', { level: 1, name: /submit a listing/i })).toBeVisible()

    await page.goto('/')
    await page
      .getByRole('contentinfo')
      .getByRole('link', { name: /^About$/ })
      .click()
    await expect(page).toHaveURL(/\/about/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Legal Pages', () => {
  test('privacy policy should load', async ({ page }) => {
    await page.goto('/legal/privacy')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('terms of service should load', async ({ page }) => {
    await page.goto('/legal/terms')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('cookies policy should load', async ({ page }) => {
    await page.goto('/legal/cookies')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(
      page.getByText(/most starter sites do not set login or analytics cookies by default/i)
    ).toBeVisible()
  })
})

test.describe('Error Pages', () => {
  test('default 404 page stays on-site instead of pointing at the template repo issue flow', async ({
    page
  }) => {
    await page.goto('/404.html')

    await expect(page.getByRole('heading', { level: 1, name: /page not found/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /back to homepage/i })).toBeVisible()
    await expect(page.getByText(/report an issue on github/i)).toHaveCount(0)
  })
})

test.describe('Responsive Design', () => {
  test('homepage should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible()
  })
})
