import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

interface ExpenseFormData {
  title: string
  description: string
  amount: string
  category: string
}

const CATEGORIES = ['food', 'transport', 'entertainment', 'utilities', 'healthcare', 'education', 'shopping', 'other']

export default function ExpenseForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ExpenseFormData>({
    title: '',
    description: '',
    amount: '',
    category: 'food',
  })

  useEffect(() => {
    if (isEdit && id) {
      fetch(`http://127.0.0.1:8000/expenses/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setForm({
            title: data.title,
            description: data.description || '',
            amount: String(data.amount),
            category: data.category,
          })
        })
        .catch(() => setError('Failed to load expense'))
    }
  }, [id, isEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Amount must be greater than 0'); return }

    setLoading(true)
    try {
      const url = isEdit ? `http://127.0.0.1:8000/expenses/${id}` : 'http://127.0.0.1:8000/expenses'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          category: form.category,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Failed to save expense')
        return
      }

      navigate('/expenses')
    } catch {
      setError('Network error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="expense-form-page">
      <h1>{isEdit ? 'Edit Expense' : 'New Expense'}</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="expense-form" noValidate>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Grocery shopping"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional description"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount ($) *</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/expenses')} className="btn-cancel">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Create Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}
