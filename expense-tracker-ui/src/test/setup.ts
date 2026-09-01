import '@testing-library/jest-dom/vitest'
import { vi, beforeEach } from 'vitest'

// mock window.confirm globally (used by ExpenseList)
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
})

// reset fetch mock before each test
beforeEach(() => {
  vi.restoreAllMocks()
})
