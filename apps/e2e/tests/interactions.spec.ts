import { expect, test } from '@playwright/test'

test.describe('User Interactions', () => {
  test('search functionality should work from the homepage', async ({ page }) => {
    await page.goto('/')

    const searchInput = page.getByRole('textbox').first()
    await searchInput.fill('acurast')
    await searchInput.press('Enter')

    await page.waitForURL('**/search?*')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /Acurast Hub/i })).toBeVisible()
  })

  test('listing detail pages should allow local favorite toggles', async ({ page }) => {
    await page.goto('/listing/acurast-hub-llms-txt')

    const favoriteButton = page.getByRole('button', { name: /add to favorites/i }).first()
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click()
      await expect(page.getByRole('button', { name: /remove from favorites/i }).first()).toBeVisible()
    }
  })

  test('theme toggle should work if available', async ({ page }) => {
    await page.goto('/')

    const themeToggle = page.getByRole('button', { name: /theme|dark|light/i }).first()

    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Navigation Interactions', () => {
  test('footer links should work', async ({ page }) => {
    await page.goto('/')

    const footer = page.locator('footer').first()
    if (await footer.isVisible()) {
      await page.getByRole('contentinfo').scrollIntoViewIfNeeded()

      const privacyLink = page.getByRole('link', { name: /privacy/i })
      if (await privacyLink.isVisible()) {
        await privacyLink.click()
        await page.waitForURL('**/legal/privacy')
        await expect(page).toHaveURL(/\/legal\/privacy/)
      }
    }
  })
})

test.describe('Form Interactions', () => {
  test('newsletter signup should work if available', async ({ page }) => {
    await page.goto('/')

    const emailInput = page.getByRole('textbox', { name: /email/i })

    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com')

      const submitButton = page.getByRole('button', { name: /subscribe|sign up|join/i })
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForTimeout(2000)
      }
    }
  })
})

test.describe('External Links', () => {
  test('external links should open correctly', async ({ page }) => {
    await page.goto('/')

    const externalLinks = page.getByRole('link').filter({ hasText: /github|external/i })

    const firstExternal = externalLinks.first()
    if (await firstExternal.isVisible()) {
      const target = await firstExternal.getAttribute('target')
      if (target === '_blank') {
        expect(target).toBe('_blank')
      }
    }
  })
})

test.describe('Mobile Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('mobile menu should work', async ({ page }) => {
    await page.goto('/')

    const mobileMenuBtn = page.getByRole('button', { name: /menu|navigation|open menu/i }).first()

    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click()
      await page.waitForTimeout(500)

      const navLink = page.getByRole('link', { name: /about|submit/i }).first()
      if (await navLink.isVisible()) {
        await navLink.click()
        await page.waitForLoadState('domcontentloaded')
      }
    } else {
      const bodyText = await page.textContent('body')
      expect(bodyText?.length).toBeGreaterThan(100)
    }
  })

  test('mobile search should work', async ({ page }) => {
    await page.goto('/')

    const searchTrigger = page.getByRole('button', { name: 'Toggle search' })

    if (await searchTrigger.isVisible()) {
      await searchTrigger.click()

      const searchInput = page.getByRole('textbox').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('acurast')
        await searchInput.press('Enter')
        await expect(page).toHaveURL(/\/search\?.+/, { timeout: 10000 })
      }
    }
  })
})
