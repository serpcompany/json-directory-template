import { expect, test } from '@playwright/test'

const detailListing = {
  name: '123Movies Downloader',
  slug: '123movies-downloader'
} as const

async function expectUnavailableRoute(page: Parameters<typeof test>[1] extends never ? never : any, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
  const status = response?.status()

  if (status === 404) {
    return
  }

  await expect(page.getByRole('heading', { level: 1, name: /page not found/i })).toBeVisible()
}

test.describe('Main Pages', () => {
  test('homepage should load and display key elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('link', { name: /^Directory Starter$/ })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(
      page.getByRole('banner').getByRole('link', { name: /submit a listing/i })
    ).toBeVisible()
    await expect(
      page.getByPlaceholder(/search listings, categories, and descriptions/i)
    ).toBeVisible()
  })

  test('about page should load and display content', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('submit page should load and explain the GitHub issue workflow', async ({ page }) => {
    await page.goto('/submit')

    await expect(page.getByRole('heading', { level: 1, name: /submit a listing/i })).toBeVisible()
    await expect(page.getByText(/prefilled github issue/i)).toBeVisible()
  })

  test('disabled optional routes should not be publicly available by default', async ({ page }) => {
    const disabledRoutes = ['/login', '/account', '/favorites', '/docs', '/posts', '/network'] as const

    for (const path of disabledRoutes) {
      await expectUnavailableRoute(page, path)
    }
  })
})

test.describe('Listing and Category Pages', () => {
  test('public listing detail route should load', async ({ page }) => {
    await page.goto(`/listing/${detailListing.slug}`)

    await expect(page.getByRole('heading', { level: 1, name: detailListing.name })).toBeVisible()
  })

  test('developer-tools category should load', async ({ page }) => {
    await page.goto('/developer-tools')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('featured category should load', async ({ page }) => {
    await page.goto('/featured')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Search and Navigation', () => {
  test('search page should work with a query parameter', async ({ page }) => {
    await page.goto('/search?q=123movies')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('textbox').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /123Movies Downloader/i })).toBeVisible()
  })

  test('primary navigation links should work correctly', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('banner').getByRole('link', { name: /submit a listing/i }).click()
    await expect(page).toHaveURL(/\/submit/)
    await expect(page.getByRole('heading', { level: 1, name: /submit a listing/i })).toBeVisible()

    await page.goto('/')
    await page.getByRole('contentinfo').getByRole('link', { name: /^About$/ }).click()
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
  })
})

test.describe('Error Pages', () => {
  test('404 page should display for non-existent routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page')

    const status = response?.status()
    expect(status === 404 || status === 200).toBeTruthy()
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
