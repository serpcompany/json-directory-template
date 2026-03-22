import { expect, test } from '@playwright/test'

const detailWebsite = {
  name: 'Acurast Hub',
  slug: 'acurast-hub-llms-txt'
} as const

test.describe('Static starter smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000)
    page.setDefaultTimeout(30000)
  })

  test('kept public pages load successfully', async ({ page }) => {
    const pages = [
      '/',
      '/about',
      '/guides',
      '/projects',
      '/news',
      '/faq',
      '/privacy',
      '/terms',
      '/cookies',
      '/favorites',
      '/submit'
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

    await expect(page.getByRole('heading', { level: 1, name: /llms\.txt hub/i })).toBeVisible()

    const searchInput = page.getByPlaceholder('Search...')
    await searchInput.fill('acurast')

    await expect(page.getByText(/Showing \d+ result/)).toBeVisible()
    await expect(page.getByRole('link', { name: /Acurast Hub/i })).toBeVisible()
  })

  test('website favorites persist into the favorites page', async ({ page }) => {
    await page.goto(`/websites/${detailWebsite.slug}`, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: detailWebsite.name })
    ).toBeVisible()

    await page.getByRole('button', { name: /add to favorites/i }).first().click()
    await expect(page.getByRole('button', { name: /remove from favorites/i }).first()).toBeVisible()

    await page.goto('/favorites', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1, name: /your favorites/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Acurast Hub/i })).toBeVisible()
  })

  test('submit flow redirects to a prefilled GitHub issue', async ({ page }) => {
    let redirectedIssueUrl = ''

    await page.route('https://github.com/**', async route => {
      redirectedIssueUrl = route.request().url()
      await route.fulfill({
        body: '<html><body>stub</body></html>',
        contentType: 'text/html',
        status: 200
      })
    })

    await page.goto('/submit', { waitUntil: 'domcontentloaded' })

    await page.getByLabel('Project name').fill('Example Project')
    await page.getByLabel('Category').selectOption('developer-tools')

    const websiteInput = page.getByLabel('Website URL')
    await websiteInput.fill('https://example.com')
    await websiteInput.blur()

    await expect(page.getByLabel('llms.txt URL')).toHaveValue('https://example.com/llms.txt')

    await page.getByRole('button', { name: /continue on github/i }).click()

    await expect(page).toHaveURL(/github\.com\/thedaviddias\/llms-txt-hub\/issues\/new/)
    await expect.poll(() => redirectedIssueUrl).toContain('template=submit-website.yml')
    await expect.poll(() => redirectedIssueUrl).toContain('Submit+llms.txt%3A+Example+Project')
    await expect
      .poll(() => redirectedIssueUrl)
      .toContain('Website%3A+https%3A%2F%2Fexample.com')
  })

  test('websites route redirects to the homepage directory', async ({ page }) => {
    await page.goto('/websites', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1, name: /llms\.txt hub/i })).toBeVisible()
  })

  test('homepage works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1, name: /llms\.txt hub/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible()
  })
})
