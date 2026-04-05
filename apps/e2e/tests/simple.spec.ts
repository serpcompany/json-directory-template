import { expect, test } from '@playwright/test'

async function expectUnavailableRoute(page: Parameters<typeof test>[1] extends never ? never : any, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
  const status = response?.status()

  if (status === 404) {
    return
  }

  await expect(page.getByRole('heading', { level: 1, name: /page not found/i })).toBeVisible()
}

test.describe('Basic Page Load Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(45000)
    page.setDefaultTimeout(30000)
  })

  test('homepage loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)

    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(bodyText?.length).toBeGreaterThan(100)
  })

  test('about page loads', async ({ page }) => {
    const response = await page.goto('/about', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('search page loads', async ({ page }) => {
    const response = await page.goto('/search', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('disabled optional routes do not load on the default site', async ({ page }) => {
    const disabledRoutes = ['/login', '/account', '/favorites', '/docs', '/posts', '/network'] as const

    for (const path of disabledRoutes) {
      await expectUnavailableRoute(page, path)
    }
  })

  test('search functionality exists on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const searchInput = page.locator('input[type="text"], input[type="search"]').first()
    const hasSearch = await searchInput.isVisible()

    expect(hasSearch).toBeTruthy()
  })

  test('404 page handles non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345', {
      waitUntil: 'domcontentloaded'
    })

    const status = response?.status()
    expect(status === 404 || status === 200).toBeTruthy()

    if (status === 200) {
      const has404Text = await page.locator('text=/404/').first().isVisible()
      const hasNotFoundHeading = await page.locator('h1:has-text(\"Page Not Found\")').isVisible()
      const hasNotFoundClass = await page.locator('.not-found').isVisible()

      expect(has404Text || hasNotFoundHeading || hasNotFoundClass).toBeTruthy()
    }
  })
})

test.describe('Navigation Tests', () => {
  test('can navigate between the homepage and about page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const aboutLink = page.getByRole('link', { name: /about/i }).first()
    if (await aboutLink.isVisible()) {
      await aboutLink.click()
      await page.waitForURL(/\/about/)
      expect(page.url()).toContain('/about')
    } else {
      const bodyText = await page.textContent('body')
      expect(bodyText?.length).toBeGreaterThan(100)
    }
  })
})

test.describe('Responsive Tests', () => {
  test('homepage works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)

    const bodyText = await page.textContent('body')
    expect(bodyText?.length).toBeGreaterThan(100)
  })
})
