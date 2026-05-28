import { expect, type Page, type Response, test } from '@playwright/test'

const detailListing = {
  name: '123Movies Video Downloader',
  slug: '123movies-downloader'
} as const

const searchListing = {
  query: '123movies'
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

test.describe('Static starter smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000)
    page.setDefaultTimeout(30000)
  })

  test('core public MVP routes load successfully', async ({ page }) => {
    const pages = [
      '/',
      '/about',
      '/search',
      '/submit',
      '/legal/privacy',
      '/legal/terms',
      '/legal/cookies'
    ] as const

    for (const path of pages) {
      const response = await page.goto(path, {
        timeout: 30000,
        waitUntil: 'domcontentloaded'
      })

      expect(response?.status(), `${path} should load`).toBeLessThan(400)
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })

  test('homepage search filters directory results locally', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const directoryRegion = page.getByRole('region', { name: /browse the directory/i })
    const searchInput = directoryRegion.getByPlaceholder(/search the directory/i)

    await expect(directoryRegion).toBeVisible({ timeout: 60000 })
    await expect(searchInput).toBeVisible({ timeout: 60000 })
    await searchInput.fill(searchListing.query)

    await expect(searchInput).toHaveValue(searchListing.query)
    await expect(directoryRegion.getByRole('link').first()).toBeVisible()
  })

  test('listing detail pages load under the public listing route', async ({ page }) => {
    await page.goto(`/listing/${detailListing.slug}`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1, name: detailListing.name })).toBeVisible()
  })

  test('default starter submit flow keeps GitHub issue submission disabled until configured', async ({
    page
  }) => {
    await page.goto('/submit', { waitUntil: 'networkidle' })

    const submitButton = page.getByRole('button', { name: /^submit$/i })

    await expect(page.getByText(/github issue submission is disabled/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /submit via github/i })).toHaveCount(0)
    await expect(submitButton).toBeDisabled()

    await page.getByLabel('Name').fill('Example Project')
    await page.getByLabel('Category').selectOption('developer-tools')
    await page.getByLabel('Website URL').fill('https://example.com')
    await page.getByLabel('Logo URL').fill('https://example.com/logo.png')
    await page.getByLabel('Video URL').fill('https://www.youtube.com/watch?v=abc123')
    await page.getByLabel('Short Description').fill('Example project description.')
    await page.getByLabel('Full Description').fill('Detailed example project description.')
    await page.getByLabel('FAQ question').fill('Does it work in Chrome?')
    await page.getByLabel('FAQ answer').fill('Yes.')
    await page.getByLabel('Resource link label').fill('Docs')
    await page.getByLabel('Resource link URL').fill('https://example.com/docs')
    await expect(submitButton).toBeDisabled()
  })

  test('news alias still redirects to the supported public surface', async ({ page }) => {
    await page.goto('/news', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/$/)
  })

  test('disabled default-site routes are not publicly available', async ({ page }) => {
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

  test('homepage works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible()
  })
})
