import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from '../Layout'

function renderLayout(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<div>Dashboard Content</div>} />
          <Route path="/expenses" element={<div>Expenses Content</div>} />
          <Route path="/summary" element={<div>Summary Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  it('renders logo', () => {
    renderLayout()
    expect(screen.getByText('ExpenseTracker')).toBeInTheDocument()
  })

  it('renders all nav links', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Expenses' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add Expense' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Summary' })).toBeInTheDocument()
  })

  it('links have correct hrefs', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Expenses' })).toHaveAttribute('href', '/expenses')
    expect(screen.getByRole('link', { name: 'Add Expense' })).toHaveAttribute('href', '/expenses/new')
    expect(screen.getByRole('link', { name: 'Summary' })).toHaveAttribute('href', '/summary')
  })

  it('renders outlet content', () => {
    renderLayout('/expenses')
    expect(screen.getByText('Expenses Content')).toBeInTheDocument()
  })

  it('applies active class to active NavLink', () => {
    renderLayout('/')
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' })
    expect(dashboardLink.className).toMatch(/active/)
  })
})
