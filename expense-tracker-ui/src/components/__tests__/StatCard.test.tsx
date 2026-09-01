import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../StatCard'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Total" value="$100.00" />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<StatCard title="Total" value="$100.00" subtitle="5 expenses" />)
    expect(screen.getByText('5 expenses')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(<StatCard title="Total" value="$100.00" />)
    expect(screen.queryByText(/expenses/)).not.toBeInTheDocument()
  })

  it('applies correct class names', () => {
    const { container } = render(<StatCard title="Total" value="$10" />)
    expect(container.querySelector('.stat-card')).toBeInTheDocument()
    expect(container.querySelector('.stat-value')).toBeInTheDocument()
  })
})
