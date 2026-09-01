import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'

const mockExpenses = [
  { id: 1, title: 'Groceries', description: 'Food', amount: 50, category: 'food', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 2, title: 'Bus', description: 'Transport', amount: 2.5, category: 'transport', created_at: '2024-01-02', updated_at: '2024-01-02' },
]

function mockFetchSuccess() {
  return vi.fn((url: string) => {
    if (url.includes('/expenses')) {
      return Promise.resolve({ json: () => Promise.resolve({ expenses: mockExpenses }) })
    }
    if (url.includes('/summary')) {
      return Promise.resolve({ json: () => Promise.resolve({ total_amount: 52.5, total_count: 2 }) })
    }
    return Promise.reject(new Error('unknown url'))
  })
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading initially', () => {
    global.fetch = mockFetchSuccess() as any
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders stats after load', async () => {
    global.fetch = mockFetchSuccess() as any
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    expect(screen.getByText('$52.50')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('$26.25')).toBeInTheDocument() // average
  })

  it('renders recent expenses', async () => {
    global.fetch = mockFetchSuccess() as any
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    expect(screen.getByText('Bus')).toBeInTheDocument()
    expect(screen.getByText('food')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
  })

  it('shows empty state when no expenses', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/expenses')) return Promise.resolve({ json: () => Promise.resolve({ expenses: [] }) })
      return Promise.resolve({ json: () => Promise.resolve({ total_amount: 0, total_count: 0 }) })
    }) as any
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText(/No expenses yet/)).toBeInTheDocument())
  })

  it('handles fetch failure gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network error'))) as any
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('deletes expense and reloads', async () => {
    const fetchMock = mockFetchSuccess()
    global.fetch = fetchMock as any
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    const deleteBtn = screen.getAllByRole('button', { name: /delete/i })[0]
    // need userEvent
    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.click(deleteBtn)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/expenses/1'), expect.objectContaining({ method: 'DELETE' }))
    })
  })
})
