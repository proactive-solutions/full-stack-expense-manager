import { test, expect } from '@playwright/test'
import { clearAllExpenses } from './helpers'

test.describe('Expense CRUD E2E (real backend via webServer)', () => {
  test.beforeEach(async ({ request }) => {
    await clearAllExpenses(request)
  })

  test('create expense via form and appears in list and dashboard', async ({ page }) => {
    await page.goto('/expenses/new')

    await page.getByLabel('Title *').fill('E2E Groceries')
    await page.getByLabel('Description').fill('E2E weekly shopping')
    await page.getByLabel('Amount ($) *').fill('123.45')
    await page.getByLabel('Category').selectOption('food')

    await page.getByRole('button', { name: 'Create Expense' }).click()

    // redirects to /expenses
    await expect(page).toHaveURL(/\/expenses$/)
    await expect(page.getByText('E2E Groceries')).toBeVisible()
    await expect(page.getByText('$123.45')).toBeVisible()
    await expect(page.locator('.expense-category', { hasText: 'food' }).first()).toBeVisible()

    // appears on dashboard recent + stats
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('E2E Groceries')).toBeVisible()
    await expect(page.locator('.expense-amount', { hasText: '123.45' }).first()).toBeVisible()
    await expect(page.locator('.stat-card').first()).toContainText('123.45')
  })

  test('validates form client-side', async ({ page }) => {
    await page.goto('/expenses/new')
    // submit empty title -> error
    await page.getByLabel('Amount ($) *').fill('10')
    await page.getByRole('button', { name: 'Create Expense' }).click()
    await expect(page.getByText('Title is required')).toBeVisible()

    // amount <=0
    await page.getByLabel('Title *').fill('Test')
    await page.getByLabel('Amount ($) *').fill('0')
    await page.getByRole('button', { name: 'Create Expense' }).click()
    await expect(page.getByText('Amount must be greater than 0')).toBeVisible()
  })

  test('edit expense', async ({ page, request }) => {
    // seed via API
    const res = await request.post('http://127.0.0.1:8000/expenses', {
      data: { title: 'To Edit', description: 'old', amount: 10, category: 'food' },
    })
    const { id } = await res.json()

    await page.goto(`/expenses/${id}/edit`)
    await expect(page.locator('#title')).toHaveValue('To Edit')
    await page.getByLabel('Title *').clear()
    await page.getByLabel('Title *').fill('Edited Title')
    await page.getByLabel('Amount ($) *').clear()
    await page.getByLabel('Amount ($) *').fill('99.99')
    await page.getByLabel('Category').selectOption('transport')
    await page.getByRole('button', { name: 'Update Expense' }).click()

    await expect(page).toHaveURL(/\/expenses$/)
    await expect(page.getByText('Edited Title')).toBeVisible()
    await expect(page.locator('.expense-amount', { hasText: '99.99' }).first()).toBeVisible()
    await expect(page.locator('.expense-category', { hasText: 'transport' }).first()).toBeVisible()
  })

  test('delete expense from list', async ({ page, request }) => {
    await request.post('http://127.0.0.1:8000/expenses', {
      data: { title: 'To Delete', amount: 5, category: 'other' },
    })
    await page.goto('/expenses')
    await expect(page.getByText('To Delete')).toBeVisible()

    // handle confirm dialog (must be set before click)
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Delete' }).first().click()
    await expect(page.getByText('To Delete')).not.toBeVisible({ timeout: 7000 })
    await expect(page.getByText('No expenses found.')).toBeVisible()
  })

  test('filter by category and search', async ({ page, request }) => {
    await request.post('http://127.0.0.1:8000/expenses', { data: { title: 'Food Item', amount: 10, category: 'food' } })
    await request.post('http://127.0.0.1:8000/expenses', { data: { title: 'Bus ride', amount: 2, category: 'transport' } })
    await request.post('http://127.0.0.1:8000/expenses', { data: { title: 'Cinema', amount: 15, category: 'entertainment' } })

    await page.goto('/expenses')
    await expect(page.locator('.expense-item')).toHaveCount(3)

    // search client-side
    await page.getByPlaceholder('Search expenses...').fill('Bus')
    await expect(page.locator('.expense-item')).toHaveCount(1)
    await expect(page.getByText('Bus ride')).toBeVisible()
    await page.getByPlaceholder('Search expenses...').fill('')

    // category filter server-side
    await page.locator('.category-filter').selectOption('food')
    await expect(page.locator('.expense-item')).toHaveCount(1)
    await expect(page.getByText('Food Item')).toBeVisible()
  })

  test('pagination', async ({ page, request }) => {
    for (let i = 0; i < 12; i++) {
      await request.post('http://127.0.0.1:8000/expenses', { data: { title: `Item ${i}`, amount: 1 + i, category: 'food' } })
    }
    await page.goto('/expenses')
    await expect(page.getByText('Page 1 of 2')).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Page 2 of 2')).toBeVisible()
    await page.getByRole('button', { name: 'Previous' }).click()
    await expect(page.getByText('Page 1 of 2')).toBeVisible()
  })
})
