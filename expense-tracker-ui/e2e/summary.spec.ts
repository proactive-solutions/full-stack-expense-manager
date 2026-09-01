import { test, expect } from '@playwright/test'
import { clearAllExpenses } from './helpers'

test.describe('Summary E2E', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllExpenses(request)
  })

  test('shows empty state then totals after creation', async ({ page, request }) => {
    await page.goto('/summary')
    await expect(page.getByText('Total Spending')).toBeVisible()
    await expect(page.getByText('$0.00')).toBeVisible()
    await expect(page.getByText('No data available.')).toBeVisible()

    await request.post('http://127.0.0.1:8000/expenses', { data: { title: 'A', amount: 10, category: 'food' } })
    await request.post('http://127.0.0.1:8000/expenses', { data: { title: 'B', amount: 20, category: 'food' } })
    await request.post('http://127.0.0.1:8000/expenses', { data: { title: 'C', amount: 5, category: 'transport' } })

    await page.reload()
    await expect(page.getByText('$35.00')).toBeVisible()
    await expect(page.getByText('3 expenses')).toBeVisible()
    await expect(page.getByText('food')).toBeVisible()
    await expect(page.getByText('transport')).toBeVisible()
    // bar width proportional to max
    const bars = page.locator('.bar-fill')
    await expect(bars).toHaveCount(2)
  })
})
