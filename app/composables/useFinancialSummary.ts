import type { Budget } from '~/types/database.types'

export interface BudgetSummaryItem extends Budget {
  spent: number
  remaining: number
  percentage: number
  status: 'normal' | 'warning' | 'exceeded'
  lastUpdatedFormatted: string
}

export function useFinancialSummary() {
  const { budgets } = useBudgets()
  const { transactions } = useTransactions()

  function formatRelativeTime(dateString: string) {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const budgetSummaries = computed<BudgetSummaryItem[]>(() => {
    return budgets.value.map((b) => {
      const budgetAmount = Number(b.amount) || 0

      // Sum all expense transactions for this specific budget
      const expenses = transactions.value
        .filter(t => t.budget_id === b.id && t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      // Sum all income transactions assigned to this specific budget (refunds, cashback, top-ups)
      const income = transactions.value
        .filter(t => t.budget_id === b.id && t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      // Net spent deducts income refunds/top-ups from total expenses
      const spent = Math.max(0, expenses - income)
      const remaining = budgetAmount - expenses + income

      const percentage = budgetAmount > 0
        ? Math.min(100, Math.max(0, Math.round((spent / budgetAmount) * 100)))
        : 0

      let status: 'normal' | 'warning' | 'exceeded' = 'normal'
      if (spent >= budgetAmount && budgetAmount > 0) {
        status = 'exceeded'
      } else if (percentage >= 75) {
        status = 'warning'
      }

      return {
        ...b,
        spent,
        remaining,
        percentage,
        status,
        lastUpdatedFormatted: formatRelativeTime(b.updated_at)
      }
    })
  })

  const totalBudget = computed(() => {
    return budgets.value.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  })

  const totalSpent = computed(() => {
    return transactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  })

  const totalIncome = computed(() => {
    return transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  })

  const totalRemaining = computed(() => {
    return budgetSummaries.value.reduce((sum, b) => sum + b.remaining, 0)
  })

  const overallPercentage = computed(() => {
    if (totalBudget.value <= 0) return 0
    return Math.min(100, Math.round((totalSpent.value / totalBudget.value) * 100))
  })

  return {
    budgetSummaries,
    totalBudget,
    totalSpent,
    totalIncome,
    totalRemaining,
    overallPercentage,
    formatCurrency,
    formatRelativeTime
  }
}
