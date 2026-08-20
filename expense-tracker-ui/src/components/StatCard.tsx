interface StatCardProps {
  title: string
  value: string
  subtitle?: string
}

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <h4>{title}</h4>
      <p className="stat-value">{value}</p>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
    </div>
  )
}
