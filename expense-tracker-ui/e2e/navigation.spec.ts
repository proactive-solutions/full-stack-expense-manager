import { test, expect } from '@playwright/test'

test.describe('Navigation and Layout', () => {
  test('loads app and navigates via sidebar', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'ExpenseTracker', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

    await page.getByRole('link', { name: 'Expenses' }).click()
    await expect(page.getByRole('heading', { name: 'Expenses', level: 1 })).toBeVisible()

    await page.getByRole('link', { name: 'Add Expense' }).click()
    await expect(page.getByRole('heading', { name: /New Expense|Edit Expense/, level: 1 })).toBeVisible()

    await page.getByRole('link', { name: 'Summary' }).click()
    await expect(page.getByRole('heading', { name: 'Summary', level: 1 })).toBeVisible()

    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  })

  test('shows active link styling', async ({ page }) => {
    await page.goto('/expenses')
    const expensesLink = page.getByRole('link', { name: 'Expenses' })
    await expect(expensesLink).toHaveClass(/active/)
  })
})
