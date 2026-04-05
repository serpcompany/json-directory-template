import { expect, test } from '@playwright/test'

const detailListing = {
  name: 'Example API Toolkit',
  slug: 'example-api-toolkit'
} as const

const searchListing = {
  hiddenName: 'Harbor Cloud',
  name: 'Northwind Analytics',
  query: 'northwind'
} as const

async function expectUnavailableRoute(page: Parameters<typeof test>[1] extends never ? never : any, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
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
    const pages = ['/', '/about', '/search', '/submit', '/legal/privacy', '/legal/terms', '/legal/cookies'] as const

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
    await searchInput.fill(searchListing.query)

    await expect(
      directoryRegion.getByRole('link', { name: new RegExp(searchListing.name, 'i') })
    ).toBeVisible()
    await expect(
      directoryRegion.getByRole('link', { name: new RegExp(searchListing.hiddenName, 'i') })
    ).toHaveCount(0)
  })

  test('listing detail pages load under the public listing route', async ({ page }) => {
    await page.goto(`/listing/${detailListing.slug}`, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: detailListing.name })
    ).toBeVisible()
  })

  test('default starter submit flow stays disabled until the GitHub issue target is configured', async ({ page }) => {
    await page.goto('/submit', { waitUntil: 'networkidle' })

    const continueButton = page.getByRole('button', { name: /continue on github/i })

    await expect(page.getByText(/configure the github issue target/i)).toBeVisible()
    await expect(continueButton).toBeDisabled()

    await page.getByLabel('Name').fill('Example Project')
    await page.getByLabel('Category').selectOption('developer-tools')
    await page.getByLabel('Listing URL').fill('https://example.com')
    await expect(continueButton).toBeDisabled()
  })

  test('news alias still redirects to the supported public surface', async ({ page }) => {
    await page.goto('/news', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/$/)
  })

  test('disabled default-site routes are not publicly available', async ({ page }) => {
    const disabledRoutes = ['/login', '/account', '/favorites', '/docs', '/posts', '/network'] as const

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
