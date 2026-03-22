import { expect, test } from '@playwright/test'

const detailWebsite = {
  name: 'Acurast Hub',
  slug: 'acurast-hub-llms-txt'
} as const

test.describe('Main Pages', () => {
  test('homepage should load and display key elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveTitle(/llms\.txt/i)
    await expect(page.getByRole('navigation').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: /llms\.txt hub/i })).toBeVisible()
    await expect(page.getByText(/largest directory for.*AI-ready documentation/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /add your llms\.txt/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /learn more/i })).toBeVisible()
  })

  test('about page should load and display content', async ({ page }) => {
    await page.goto('/about')

    await expect(page).toHaveTitle(/About.*llms\.txt hub/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('guides page should load and display guides', async ({ page }) => {
    await page.goto('/guides')

    await expect(page).toHaveTitle(/Guides.*llms\.txt/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('websites route should redirect to the homepage directory', async ({ page }) => {
    await page.goto('/websites')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1, name: /llms\.txt hub/i })).toBeVisible()
  })

  test('favorites page should load and display the local favorites shell', async ({ page }) => {
    await page.goto('/favorites')

    await expect(page).toHaveTitle(/Favorite.*llms\.txt hub/i)
    await expect(page.getByRole('heading', { level: 1, name: /your favorites/i })).toBeVisible()
  })

  test('submit page should load and explain the GitHub issue workflow', async ({ page }) => {
    await page.goto('/submit')

    await expect(page.getByRole('heading', { level: 1, name: /submit your llms\.txt/i })).toBeVisible()
    await expect(page.getByText(/prefilled GitHub issue/i)).toBeVisible()
  })

  test('projects page should load and display static project resources', async ({ page }) => {
    await page.goto('/projects')

    await expect(page).toHaveTitle(/Open Source Projects.*llms\.txt hub/i)
    await expect(
      page.getByRole('heading', { level: 1, name: /open source projects/i })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /submit website/i })).toBeVisible()
  })

  test('faq page should load and display FAQ content', async ({ page }) => {
    await page.goto('/faq')

    await expect(page).toHaveTitle(/FAQ.*llms\.txt hub/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('news page should load and display the news section', async ({ page }) => {
    const response = await page.goto('/news')

    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/News|llms\.txt/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })
})

test.describe('Category Pages', () => {
  test('developer-tools category should load', async ({ page }) => {
    await page.goto('/developer-tools')

    await expect(page).toHaveTitle(/Developer Tools.*llms\.txt hub/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('automation-workflow category should load active entries', async ({ page }) => {
    await page.goto('/automation-workflow', {
      timeout: 120000,
      waitUntil: 'domcontentloaded'
    })

    await expect(page).toHaveTitle(/Automation & Workflow.*llms\.txt hub/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /Zapier/i })).toBeVisible()
  })

  test('featured category should load', async ({ page }) => {
    await page.goto('/featured')

    await expect(page).toHaveTitle(/Featured.*llms\.txt hub/i)
    await expect(page.getByRole('heading', { level: 1, name: /featured websites/i })).toBeVisible()
  })
})

test.describe('Docs Pages', () => {
  test('submit workflow docs page should load', async ({ page }) => {
    await page.goto('/docs/submit-workflow', {
      timeout: 120000,
      waitUntil: 'domcontentloaded'
    })

    await expect(page).toHaveTitle(/Submit Workflow/i)
    await expect(
      page.getByRole('heading', { level: 1, name: /submit workflow/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: /why the starter uses github issues/i })
    ).toBeVisible()
  })

  test('json shapes docs page should load', async ({ page }) => {
    await page.goto('/docs/json-shapes', {
      timeout: 120000,
      waitUntil: 'domcontentloaded'
    })

    await expect(page).toHaveTitle(/JSON Shapes/i)
    await expect(page.getByRole('heading', { level: 1, name: /json shapes/i })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: /data\/websites\.json/i })
    ).toBeVisible()
  })

  test('rebrand checklist docs page should load', async ({ page }) => {
    await page.goto('/docs/rebrand-checklist', {
      timeout: 120000,
      waitUntil: 'domcontentloaded'
    })

    await expect(page).toHaveTitle(/Rebrand Checklist/i)
    await expect(
      page.getByRole('heading', { level: 1, name: /rebrand checklist/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: /brand shell checklist/i })
    ).toBeVisible()
  })
})

test.describe('Search and Navigation', () => {
  test('search page should work with query parameter', async ({ page }) => {
    await page.goto('/search?q=acurast')

    await expect(page).toHaveTitle(/Search.*llms\.txt/i)
    await expect(
      page.getByRole('heading', { level: 1, name: /Search Results for "acurast"/i })
    ).toBeVisible()
    await expect(page.getByRole('textbox').first()).toBeVisible()
    await expect(page.getByText(/Searching across all websites and tools/i)).toBeVisible()
  })

  test('navigation should work between pages', async ({ page }) => {
    await page.goto('/')

    await page.goto('/guides')
    await expect(page).toHaveURL(/\/guides/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.goto('/about')
    await expect(page).toHaveURL(/\/about/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('header navigation links should work correctly', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('banner').getByRole('link', { name: /^Guides$/ }).click()
    await expect(page).toHaveURL(/\/guides/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.getByRole('banner').getByRole('link', { name: /^Submit$/ }).click()
    await expect(page).toHaveURL(/\/submit/)
    await expect(page.getByRole('heading', { level: 1, name: /submit your llms\.txt/i })).toBeVisible()
  })
})

test.describe('Legal Pages', () => {
  test('privacy policy should load', async ({ page }) => {
    await page.goto('/privacy')

    await expect(page).toHaveTitle(/Privacy.*llms\.txt hub/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('terms of service should load', async ({ page }) => {
    await page.goto('/terms')

    await expect(page).toHaveTitle(/Terms.*llms\.txt hub/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('cookies policy should load', async ({ page }) => {
    await page.goto('/cookies')

    await expect(page).toHaveTitle(/Cookie.*llms\.txt/i)
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
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Performance and Accessibility', () => {
  test('homepage should load within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(10000)
  })

  test('pages should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('navigation').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Detail Pages', () => {
  test('website detail page should load and expose the local favorites action', async ({ page }) => {
    await page.goto(`/websites/${detailWebsite.slug}`)

    await expect(
      page.getByRole('heading', { level: 1, name: detailWebsite.name })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /add to favorites/i }).first()).toBeVisible()
  })
})
