import { useState, useEffect, useCallback } from 'react'

interface CategorySummary {
  category: string
  total: number
  count: number
}

interface SummaryData {
  total_amount: number
  total_count: number
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#ef4444',
  transport: '#3b82f6',
  entertainment: '#8b5cf6',
  utilities: '#f59e0b',
  healthcare: '#10b981',
  education: '#6366f1',
  shopping: '#ec4899',
  other: '#6b7280',
}

export default function Summary() {
  const [summary, setSummary] = useState<SummaryData>({ total_amount: 0, total_count: 0 })
  const [byCategory, setByCategory] = useState<CategorySummary[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sumRes, catRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/summary'),
        fetch('http://127.0.0.1:8000/summary/by-category'),
      ])
      setSummary(await sumRes.json())
      setByCategory(await catRes.json())
    } catch {
      console.error('Failed to load summary')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <div className="loading">Loading...</div>

  const maxTotal = Math.max(...byCategory.map((c) => c.total), 1)

  return (
    <div className="summary-page">
      <h1>Summary</h1>

      <div className="summary-overview">
        <div className="stat-card large">
          <h4>Total Spending</h4>
          <p className="stat-value">${summary.total_amount.toFixed(2)}</p>
          <p className="stat-subtitle">{summary.total_count} expenses</p>
        </div>
      </div>

      <section className="category-breakdown">
        <h2>By Category</h2>
        {byCategory.length === 0 ? (
          <p>No data available.</p>
        ) : (
          <div className="category-bars">
            {byCategory.map((cat) => (
              <div key={cat.category} className="category-bar-row">
                <div className="category-label">
                  <span
                    className="category-dot"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280' }}
                  />
                  <span className="category-name">{cat.category}</span>
                  <span className="category-count">({cat.count})</span>
                </div>
                <div className="bar-container">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(cat.total / maxTotal) * 100}%`,
                      backgroundColor: CATEGORY_COLORS[cat.category] || '#6b7280',
                    }}
                  />
                </div>
                <span className="category-total">${cat.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
