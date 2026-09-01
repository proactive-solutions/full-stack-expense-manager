import { APIRequestContext, expect } from '@playwright/test'

// backend base URL (must match frontend fetch hardcode)
export const API_URL = 'http://127.0.0.1:8000'

export async function clearAllExpenses(request: APIRequestContext) {
  const res = await request.get(`${API_URL}/expenses?limit=500`)
  if (!res.ok()) return
  const data = await res.json()
  for (const e of data.expenses || []) {
    await request.delete(`${API_URL}/expenses/${e.id}`)
  }
}

export async function createExpenseViaApi(request: APIRequestContext, payload: Record<string, unknown>) {
  const res = await request.post(`${API_URL}/expenses`, { data: payload })
  expect(res.ok()).toBeTruthy()
  return await res.json()
}
