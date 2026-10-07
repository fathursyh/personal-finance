import type { TransactionWithBudget } from '~/types/database.types'

export interface DailyBudgetSubtotal {
  budgetId: string | null
  budgetName: string
  color?: string
  totalExpense: number
  totalIncome: number
}

export interface DailyTransactionGroup {
  date: string // 'YYYY-MM-DD'
  dayNumber: string // '06'
  dayOfWeek: string // 'Sun', 'Mon', 'Tue', ...
  isSunday: boolean
  isSaturday: boolean
  isToday: boolean
  totalIncome: number
  totalExpense: number
  netBalance: number
  transactions: TransactionWithBudget[]
  budgetSubtotals: DailyBudgetSubtotal[]
}

