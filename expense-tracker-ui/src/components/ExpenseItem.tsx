interface ExpenseItemProps {
  id: number
  title: string
  description: string
  amount: number
  category: string
  createdAt: string
  onDelete: (id: number) => void
  onEdit: (id: number) => void
}

export default function ExpenseItem({ id, title, description, amount, category, createdAt, onDelete, onEdit }: ExpenseItemProps) {
  return (
    <div className="expense-item">
      <div className="expense-info">
        <h3>{title}</h3>
        <p className="expense-description">{description}</p>
        <span className="expense-category">{category}</span>
        <span className="expense-date">{createdAt}</span>
      </div>
      <div className="expense-actions">
        <span className="expense-amount">${amount.toFixed(2)}</span>
        <button onClick={() => onEdit(id)} className="btn-edit">Edit</button>
        <button onClick={() => onDelete(id)} className="btn-delete">Delete</button>
      </div>
    </div>
  )
}
