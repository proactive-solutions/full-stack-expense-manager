import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ExpenseItem from '../components/ExpenseItem'

interface Expense {
  id: number
  title: string
  description: string
  amount: number
  category: string
  created_at: string
  updated_at: string
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const limit = 10
  const navigate = useNavigate()

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ skip: String(page * limit), limit: String(limit) })
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await fetch(`http://127.0.0.1:8000/expenses?${params}`)
      const data = await res.json()

      let filtered = data.expenses || []
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (e: Expense) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
        )
      }

      setExpenses(filtered)
      setTotal(data.total || 0)
    } catch {
      console.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [page, categoryFilter, searchQuery])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return
    try {
      await fetch(`http://127.0.0.1:8000/expenses/${id}`, { method: 'DELETE' })
      loadExpenses()
    } catch {
      console.error('Failed to delete expense')
    }
  }

  const handleEdit = (id: number) => {
    navigate(`/expenses/${id}/edit`)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="expense-list-page">
      <div className="page-header">
        <h1>Expenses</h1>
        <button onClick={() => navigate('/expenses/new')} className="btn-primary">+ New Expense</button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}
          className="category-filter"
        >
          <option value="all">All Categories</option>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="entertainment">Entertainment</option>
          <option value="utilities">Utilities</option>
          <option value="healthcare">Healthcare</option>
          <option value="education">Education</option>
          <option value="shopping">Shopping</option>
          <option value="other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">No expenses found.</div>
      ) : (
        <>
          <div className="expense-list">
            {expenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                id={expense.id}
                title={expense.title}
                description={expense.description}
                amount={expense.amount}
                category={expense.category}
                createdAt={expense.created_at}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page + 1} of {totalPages || 1}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  )
}
