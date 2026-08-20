declare module '*.purs.js' {
  export function fetchExpensesImpl(): Promise<unknown>
  export function fetchSummaryImpl(): Promise<unknown>
  export function createExpenseImpl(expense: unknown): Promise<unknown>
  export function deleteExpenseImpl(id: number): Promise<unknown>
  export function fetchSummaryByCategoryImpl(): Promise<unknown>
}
