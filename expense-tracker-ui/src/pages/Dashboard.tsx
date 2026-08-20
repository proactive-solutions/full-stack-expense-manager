import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'

interface Expense {
  id: number
  title: string
  description: string
  amount: number
  category: string
  created_at: string
  updated_at: string
}

interface Summary {
  total_amount: number
  total_count: number
}

export default function Dashboard() {
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<Summary>({ total_amount: 0, total_count: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [expensesRes, summaryRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/expenses?limit=5'),
        fetch('http://127.0.0.1:8000/summary'),
      ])
      const expensesData = await expensesRes.json()
      const summaryData = await summaryRes.json()
      setRecentExpenses(expensesData.expenses || [])
      setSummary(summaryData)
    } catch {
      console.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/expenses/${id}`, { method: 'DELETE' })
      loadData()
    } catch {
      console.error('Failed to delete expense')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <StatCard title="Total Expenses" value={`$${summary.total_amount.toFixed(2)}`} />
        <StatCard title="Expense Count" value={String(summary.total_count)} />
        <StatCard
          title="Average"
          value={summary.total_count > 0 ? `$${(summary.total_amount / summary.total_count).toFixed(2)}` : '$0.00'}
        />
      </div>

      <section className="recent-expenses">
        <h2>Recent Expenses</h2>
        {recentExpenses.length === 0 ? (
          <p>No expenses yet. <button onClick={() => navigate('/expenses/new')}>Add your first expense</button></p>
        ) : (
          <div className="expense-list">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div className="expense-info">
                  <h3>{expense.title}</h3>
                  <span className="expense-category">{expense.category}</span>
                </div>
                <div className="expense-actions">
                  <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                  <button onClick={() => handleDelete(expense.id)} className="btn-delete">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {recentExpenses.length > 0 && (
          <button onClick={() => navigate('/expenses')} className="btn-view-all">View All Expenses</button>
        )}
      </section>
    </div>
  )
}
