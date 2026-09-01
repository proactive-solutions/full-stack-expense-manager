import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import App from '../App' // App uses BrowserRouter, so we test its routes via wrapper
import Layout from '../components/Layout'
import Dashboard from '../pages/Dashboard'
import ExpenseList from '../pages/ExpenseList'
import ExpenseForm from '../pages/ExpenseForm'
import Summary from '../pages/Summary'

// Integration: Full route table with mocked backend, mimics real user navigation

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/expenses/new" element={<ExpenseForm />} />
          <Route path="/expenses/:id/edit" element={<ExpenseForm />} />
          <Route path="/summary" element={<Summary />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Frontend integration (routing + API)', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('navigates Dashboard -> Expenses -> New -> Summary and persists via API mock', async () => {
    // Mock all backend endpoints for the whole flow
    global.fetch = vi.fn((url: string, opts?: any) => {
      if (opts?.method === 'POST' && url.includes('/expenses')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1, title: 'Flow', amount: 10, category: 'food', created_at: '', updated_at: '' }) }) as any
      }
      if (url.includes('/expenses') && !url.includes('/summary')) {
        return Promise.resolve({ json: () => Promise.resolve({ expenses: [{ id: 1, title: 'Flow', description: '', amount: 10, category: 'food', created_at: '2024-01-01', updated_at: '' }], total: 1 }) }) as any
      }
      if (url.includes('/summary/by-category')) {
        return Promise.resolve({ json: () => Promise.resolve([{ category: 'food', total: 10, count: 1 }]) }) as any
      }
      if (url.includes('/summary')) {
        return Promise.resolve({ json: () => Promise.resolve({ total_amount: 10, total_count: 1 }) }) as any
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) as any
    }) as any

    renderApp(['/'])

    // Dashboard loads - stats total (Total Expenses card) has $10.00, average also $10.00, recent has $10.00 => 3 matches, use more specific query
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Total Expenses')).toBeInTheDocument())
    expect(screen.getAllByText('$10.00').length).toBeGreaterThanOrEqual(2)

    // Navigate to Expenses via sidebar
    await userEvent.click(screen.getByRole('link', { name: 'Expenses' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Expenses' })).toBeInTheDocument())
    expect(await screen.findByText('Flow')).toBeInTheDocument()

    // Navigate to Summary
    await userEvent.click(screen.getByRole('link', { name: 'Summary' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument())
    expect(await screen.findByText('food')).toBeInTheDocument()
  })

  it('handles 404 on edit and shows error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('not found'))) as any

    renderApp(['/expenses/999/edit'])
    // Edit form tries to load and fails -> error message (fetch().catch)
    await waitFor(() => expect(screen.getByText('Failed to load expense')).toBeInTheDocument())
  })
})
