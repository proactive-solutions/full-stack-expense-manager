import { describe, it, expect } from 'vitest'
import * as BL from '../../output/App.BusinessLogic/index.js'
import * as Types from '../../output/App.Types/index.js'

// PureScript compiled modules are tested via the JS output to ensure the
// Vitest suite also guards the PureScript business logic (preferred by user).
// This complements the `spago test` spec suite in `test/Main.purs`.

const sampleExpenses = [
  { id: 1, title: 'Groceries', description: 'Weekly shopping', amount: 50.0, category: 'food', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 2, title: 'Bus ticket', description: 'Commute', amount: 2.5, category: 'transport', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  { id: 3, title: 'Movie', description: 'Cinema', amount: 15.0, category: 'entertainment', createdAt: '2024-01-03', updatedAt: '2024-01-03' },
  { id: 4, title: 'Lunch', description: 'Food again', amount: 12.75, category: 'food', createdAt: '2024-01-04', updatedAt: '2024-01-04' },
]

describe('PureScript BusinessLogic via compiled JS', () => {
  it('formatCurrency', () => {
    expect(BL.formatCurrency(10.0)).toBe('$10.00')
    expect(BL.formatCurrency(12.5)).toBe('$12.50')
    expect(BL.formatCurrency(2.05)).toBe('$2.05')
    expect(BL.formatCurrency(0.0)).toBe('$0.00')
  })

  it('formatDate', () => {
    expect(BL.formatDate('')).toBe('N/A')
    expect(BL.formatDate('2024-01-01')).toBe('2024-01-01')
  })

  it('filterExpensesByCategory', () => {
    expect(BL.filterExpensesByCategory(sampleExpenses)('all')).toHaveLength(4)
    expect(BL.filterExpensesByCategory(sampleExpenses)('')).toHaveLength(4)
    expect(BL.filterExpensesByCategory(sampleExpenses)('FOOD')).toHaveLength(2)
    expect(BL.filterExpensesByCategory(sampleExpenses)('transport')).toHaveLength(1)
  })

  it('searchExpenses', () => {
    expect(BL.searchExpenses(sampleExpenses)('')).toHaveLength(4)
    expect(BL.searchExpenses(sampleExpenses)('groceries')).toHaveLength(1)
    expect(BL.searchExpenses(sampleExpenses)('cinema')).toHaveLength(1)
    expect(BL.searchExpenses(sampleExpenses)('xyz')).toHaveLength(0)
  })

  it('calculateTotal', () => {
    expect(BL.calculateTotal(sampleExpenses)).toBeCloseTo(80.25)
    expect(BL.calculateTotal([])).toBe(0)
  })

  it('categorizeExpenses', () => {
    expect(BL.categorizeExpenses(sampleExpenses)).toHaveLength(3)
    expect(BL.categorizeExpenses([])).toHaveLength(0)
  })

  it('getExpenseStats', () => {
    const stats = BL.getExpenseStats(sampleExpenses)
    expect(stats.totalCount).toBe(4)
    expect(stats.totalAmount).toBeCloseTo(80.25)
    expect(stats.averageAmount).toBeCloseTo(20.0625)
    expect(stats.highestExpense.value0.amount).toBe(50)
    expect(stats.lowestExpense.value0.amount).toBe(2.5)
    const empty = BL.getExpenseStats([])
    expect(empty.totalCount).toBe(0)
    expect(empty.totalAmount).toBe(0)
    // PureScript Maybe Nothing is object with tag "Nothing"
    expect((empty.highestExpense as any).constructor.name).toBe('Nothing')
    expect((empty.lowestExpense as any).constructor.name).toBe('Nothing')
  })
})

describe('PureScript Types via compiled JS', () => {
  it('categoryToString / stringToCategory / allCategories', async () => {
    // Types exports constructors
    expect(Types.categoryToString(Types.Food.value)).toBe('food')
    expect(Types.categoryToString(Types.Other.value)).toBe('other')
    // stringToCategory returns Maybe
    const maybeFood = Types.stringToCategory('food')
    expect(maybeFood.constructor.name).toBe('Just')
    const maybeInvalid = Types.stringToCategory('invalid')
    expect(maybeInvalid.constructor.name).toBe('Nothing')
    expect(Types.allCategories).toHaveLength(8)
  })
})
