import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpenseItem from '../ExpenseItem'

describe('ExpenseItem', () => {
  const defaultProps = {
    id: 1,
    title: 'Groceries',
    description: 'Weekly shopping',
    amount: 50.75,
    category: 'food',
    createdAt: '2024-01-01T00:00:00',
    onDelete: vi.fn(),
    onEdit: vi.fn(),
  }

  it('renders title, description, category, date and amount', () => {
    render(<ExpenseItem {...defaultProps} />)
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Weekly shopping')).toBeInTheDocument()
    expect(screen.getByText('food')).toBeInTheDocument()
    expect(screen.getByText('2024-01-01T00:00:00')).toBeInTheDocument()
    expect(screen.getByText('$50.75')).toBeInTheDocument()
  })

  it('formats amount to 2 decimals', () => {
    render(<ExpenseItem {...defaultProps} amount={2} />)
    expect(screen.getByText('$2.00')).toBeInTheDocument()
  })

  it('calls onEdit with id when Edit clicked', async () => {
    const onEdit = vi.fn()
    render(<ExpenseItem {...defaultProps} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(1)
  })

  it('calls onDelete with id when Delete clicked', async () => {
    const onDelete = vi.fn()
    render(<ExpenseItem {...defaultProps} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('renders with empty description', () => {
    render(<ExpenseItem {...defaultProps} description="" />)
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })
})
