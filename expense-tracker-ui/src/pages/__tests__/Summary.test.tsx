import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Summary from '../Summary'

describe('Summary', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as any
    render(<Summary />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders summary data', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/by-category')) return Promise.resolve({ json: () => Promise.resolve([{ category: 'food', total: 30, count: 2 }, { category: 'transport', total: 5, count: 1 }]) })
      return Promise.resolve({ json: () => Promise.resolve({ total_amount: 35, total_count: 3 }) })
    }) as any
    render(<Summary />)
    await waitFor(() => expect(screen.getByText('Summary')).toBeInTheDocument())
    expect(screen.getByText('$35.00')).toBeInTheDocument()
    expect(screen.getByText('3 expenses')).toBeInTheDocument()
    expect(screen.getByText('food')).toBeInTheDocument()
    expect(screen.getByText('transport')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('shows No data when empty', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/by-category')) return Promise.resolve({ json: () => Promise.resolve([]) })
      return Promise.resolve({ json: () => Promise.resolve({ total_amount: 0, total_count: 0 }) })
    }) as any
    render(<Summary />)
    await waitFor(() => expect(screen.getByText('No data available.')).toBeInTheDocument())
  })

  it('renders category bars with correct width', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/by-category')) return Promise.resolve({ json: () => Promise.resolve([{ category: 'food', total: 100, count: 1 }, { category: 'other', total: 50, count: 1 }]) })
      return Promise.resolve({ json: () => Promise.resolve({ total_amount: 150, total_count: 2 }) })
    }) as any
    const { container } = render(<Summary />)
    await waitFor(() => expect(screen.getByText('food')).toBeInTheDocument())
    const bars = container.querySelectorAll('.bar-fill')
    expect(bars[0]).toHaveStyle('width: 100%')
    expect(bars[1]).toHaveStyle('width: 50%')
  })

  it('handles fetch error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('fail'))) as any
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Summary />)
    await waitFor(() => expect(screen.getByText('Summary')).toBeInTheDocument())
    // should still render with defaults
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(consoleSpy).toHaveBeenCalled()
  })
})
