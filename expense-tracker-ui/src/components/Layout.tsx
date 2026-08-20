import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app">
      <nav className="sidebar">
        <h2 className="logo">ExpenseTracker</h2>
        <ul>
          <li>
            <NavLink to="/" end>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/expenses">Expenses</NavLink>
          </li>
          <li>
            <NavLink to="/expenses/new">Add Expense</NavLink>
          </li>
          <li>
            <NavLink to="/summary">Summary</NavLink>
          </li>
        </ul>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
