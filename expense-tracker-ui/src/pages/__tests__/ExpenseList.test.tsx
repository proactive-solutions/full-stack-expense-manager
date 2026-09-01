import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ExpenseList from '../ExpenseList'

const mockExpenses = [
  { id: 1, title: 'Groceries', description: 'Weekly', amount: 50, category: 'food', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 2, title: 'Bus ticket', description: 'Commute', amount: 2.5, category: 'transport', created_at: '2024-01-02', updated_at: '2024-01-02' },
  { id: 3, title: 'Movie', description: 'Cinema', amount: 15, category: 'entertainment', created_at: '2024-01-03', updated_at: '2024-01-03' },
]

function setupFetch(expenses = mockExpenses, total = expenses.length) {
  return vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ expenses, total }) })) as any
}

describe('ExpenseList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = setupFetch()
  })

  it('shows loading then list', async () => {
    render(<MemoryRouter><ExpenseList /></MemoryRouter>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    expect(screen.getByText('Bus ticket')).toBeInTheDocument()
  })

  it('shows empty state when no expenses', async () => {
    global.fetch = setupFetch([], 0)
    render(<MemoryRouter><ExpenseList /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('No expenses found.')).toBeInTheDocument())
  })

  it('filters by search query client-side', async () => {
    render(<MemoryRouter><ExpenseList /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    const search = screen.getByPlaceholderText('Search expenses...')
    await userEvent.type(search, 'Bus')
    await waitFor(() => expect(screen.getByText('Bus ticket')).toBeInTheDocument())
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('filters by category via fetch param', async () => {
    const fetchSpy = setupFetch([mockExpenses[0]], 1)
    global.fetch = fetchSpy
    render(<MemoryRouter><ExpenseList /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    const select = screen.getByDisplayValue('All Categories')
    await userEvent.selectOptions(select, 'food')
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('category=food')))
  })

  it('handles pagination', async () => {
    global.fetch = setupFetch(mockExpenses, 25)
    render(<MemoryRouter><ExpenseList /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument())
    const next = screen.getByRole('button', { name: /next/i })
    await userEvent.click(next)
    await waitFor(() => expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument())
  })

  it('disables Previous on first page', async () => {
    render(<MemoryRouter><ExpenseList /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  it('calls delete with confirm true', async () => {
    const fetchSpy = setupFetch()
    global.fetch = fetchSpy
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<MemoryRouter><ExpenseList /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    const deleteBtns = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteBtns[0])
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/expenses/1'), expect.objectContaining({ method: 'DELETE' })))
  })

  it('does not delete when confirm false', async () => {
    const fetchSpy = setupFetch()
    global.fetch = fetchSpy
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<MemoryRouter><ExpenseList /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    const deleteBtns = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteBtns[0])
    // fetch should not have been called with DELETE
    expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/expenses/1'), expect.anything())
  })
})
