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

    const searchInput = page.getByPlaceholder('Search...')
    await searchInput.fill('acurast')

    await expect(page.getByText(/showing \d+ result/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Acurast Hub/i })).toBeVisible()
  })

  test('listing detail pages load under the public listing route', async ({ page }) => {
    await page.goto(`/listing/${detailListing.slug}`, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: detailListing.name })
    ).toBeVisible()
  })

  test('submit flow redirects to the configured prefilled GitHub issue', async ({ page }) => {
    let redirectedIssueUrl = ''

    await page.route('https://github.com/**', async route => {
      redirectedIssueUrl = route.request().url()
      await route.fulfill({
        body: '<html><body>stub</body></html>',
        contentType: 'text/html',
        status: 200
      })
    })

    await page.goto('/submit', { waitUntil: 'networkidle' })

    const continueButton = page.getByRole('button', { name: /continue on github/i })

    await page.getByLabel('Name').fill('Example Project')
    await page.getByLabel('Category').selectOption('developer-tools')
    await page.getByLabel('Listing URL').fill('https://example.com')
    await expect(continueButton).toBeEnabled()
    await continueButton.click()

    await expect(page).toHaveURL(
      /github\.com\/serpcompany\/json-directory-template\/issues\/new/
    )
    await expect.poll(() => redirectedIssueUrl).toContain('Submit+Listing%3A+Example+Project')
    await expect.poll(() => redirectedIssueUrl).toContain('Listing+URL%3A+https%3A%2F%2Fexample.com')
    await expect.poll(() => redirectedIssueUrl).toContain('Category%3A+developer-tools')
  })

  test('legacy aliases still redirect to the supported public surface', async ({ page }) => {
    await page.goto('/websites', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/listing$/)

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
