import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ExpenseForm from '../ExpenseForm'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderForm(path = '/expenses/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/expenses/new" element={<ExpenseForm />} />
        <Route path="/expenses/:id/edit" element={<ExpenseForm />} />
        <Route path="/expenses" element={<div>Expenses Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ExpenseForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockNavigate.mockClear()
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any
  })

  it('renders New Expense heading for create', () => {
    renderForm()
    expect(screen.getByRole('heading', { name: /new expense/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create expense/i })).toBeInTheDocument()
  })

  it('validates title required', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText(/amount/i), '10')
    // clear title if any
    const title = screen.getByLabelText(/title/i)
    await userEvent.clear(title)
    await userEvent.click(screen.getByRole('button', { name: /create expense/i }))
    expect(screen.getByText('Title is required')).toBeInTheDocument()
  })

  it('validates amount >0', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText(/title/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '0')
    await userEvent.click(screen.getByRole('button', { name: /create expense/i }))
    expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
  })

  it('submits POST for new expense', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) })) as any
    global.fetch = fetchSpy
    renderForm()
    await userEvent.type(screen.getByLabelText(/title/i), 'Groceries')
    await userEvent.type(screen.getByLabelText(/amount/i), '50.75')
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'food')
    await userEvent.click(screen.getByRole('button', { name: /create expense/i }))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('http://127.0.0.1:8000/expenses', expect.objectContaining({ method: 'POST' })))
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body)
    expect(body.title).toBe('Groceries')
    expect(body.amount).toBe(50.75)
    expect(body.category).toBe('food')
    expect(mockNavigate).toHaveBeenCalledWith('/expenses')
  })

  it('shows error on failed save', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ detail: 'Invalid' }) })) as any
    renderForm()
    await userEvent.type(screen.getByLabelText(/title/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /create expense/i }))
    await waitFor(() => expect(screen.getByText('Invalid')).toBeInTheDocument())
  })

  it('loads existing data in edit mode', async () => {
    const mockData = { title: 'Old Title', description: 'Desc', amount: 25, category: 'transport' }
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(mockData) })) as any
    renderForm('/expenses/1/edit')
    await waitFor(() => expect(screen.getByDisplayValue('Old Title')).toBeInTheDocument())
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toHaveValue('transport')
    expect(screen.getByRole('heading', { name: /edit expense/i })).toBeInTheDocument()
  })

  it('submits PUT for edit', async () => {
    global.fetch = vi.fn((url: string, opts?: any) => {
      if (!opts) return Promise.resolve({ json: () => Promise.resolve({ title: 'Old', description: '', amount: 10, category: 'food' }) }) as any
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) as any
    }) as any
    renderForm('/expenses/1/edit')
    await waitFor(() => expect(screen.getByDisplayValue('Old')).toBeInTheDocument())
    const fetchSpy = global.fetch as any
    await userEvent.clear(screen.getByLabelText(/title/i))
    await userEvent.type(screen.getByLabelText(/title/i), 'New Title')
    await userEvent.click(screen.getByRole('button', { name: /update expense/i }))
    await waitFor(() => {
      const putCall = fetchSpy.mock.calls.find((c: any) => c[1]?.method === 'PUT')
      expect(putCall).toBeDefined()
      expect(putCall[0]).toContain('/expenses/1')
    })
  })

  it('handles network error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('offline'))) as any
    renderForm()
    await userEvent.type(screen.getByLabelText(/title/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /create expense/i }))
    await waitFor(() => expect(screen.getByText(/Network error/)).toBeInTheDocument())
  })

  it('cancel navigates to /expenses', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/expenses')
  })
})
