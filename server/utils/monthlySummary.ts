import type { Budget, Transaction } from '~/types/database.types'
import type { MonthlySummaryBudget, MonthlySummaryData } from './emailTemplate'

export interface CompileSummaryResult {
  hasTransactions: boolean
  data?: MonthlySummaryData
}

export async function compileUserMonthlySummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  userEmail: string,
  userName: string,
  yearMonth: string,
  appUrl: string
): Promise<CompileSummaryResult> {
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = Number.parseInt(yearStr ?? '', 10)
  const month = Number.parseInt(monthStr ?? '', 10)

  const startDate = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const monthDate = new Date(year, month - 1, 1)
  const monthLabel = monthDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  })

  // 1. Fetch user's transactions for the month
  const { data: transactionsData, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (txError) throw txError

  const transactions: Transaction[] = (transactionsData as Transaction[]) || []
  if (transactions.length === 0) {
    return { hasTransactions: false }
  }

  // 2. Fetch user's budgets
  const { data: budgetsData, error: bgError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)

  if (bgError) throw bgError

  const rawBudgets: Budget[] = (budgetsData as Budget[]) || []

  // 3. Compute stats
  const totalSpent = transactions
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0)

  const totalIncome = transactions
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0)

  const totalBudget = rawBudgets.reduce((sum: number, b: Budget) => sum + (Number(b.amount) || 0), 0)

  const budgetSummaries: MonthlySummaryBudget[] = rawBudgets.map((b: Budget) => {
    const allocated = Number(b.amount) || 0

    const expenses = transactions
      .filter((t: Transaction) => t.budget_id === b.id && t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0)

    const income = transactions
      .filter((t: Transaction) => t.budget_id === b.id && t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + (Number(t.amount) || 0), 0)

    const spent = Math.max(0, expenses - income)
    const remaining = allocated - expenses + income

    const percentage = allocated > 0
      ? Math.min(100, Math.max(0, Math.round((spent / allocated) * 100)))
      : 0

    let status: 'normal' | 'warning' | 'exceeded' = 'normal'
    if (spent >= allocated && allocated > 0) {
      status = 'exceeded'
    } else if (percentage >= 75) {
      status = 'warning'
    }

    return {
      name: b.name,
      icon: b.icon,
      color: b.color,
      allocated,
      spent,
      remaining,
      percentage,
      status
    }
  })

  const totalRemaining = budgetSummaries.reduce((sum: number, b: MonthlySummaryBudget) => sum + b.remaining, 0)
  const overallPercentage = totalBudget > 0
    ? Math.min(100, Math.round((totalSpent / totalBudget) * 100))
    : 0

  // 4. Find top expense category
  const sortedBySpend = [...budgetSummaries].filter((b: MonthlySummaryBudget) => b.spent > 0).sort((a: MonthlySummaryBudget, b: MonthlySummaryBudget) => b.spent - a.spent)
  const top = sortedBySpend.length > 0 ? sortedBySpend[0] : null
  const topCategory = top && totalSpent > 0
    ? {
        name: top.name,
        spent: top.spent,
        share: Math.round((top.spent / totalSpent) * 100)
      }
    : null

  return {
    hasTransactions: true,
    data: {
      userName,
      userEmail,
      monthLabel,
      totalSpent,
      totalIncome,
      totalBudget,
      totalRemaining,
      overallPercentage,
      transactionCount: transactions.length,
      budgets: budgetSummaries,
      topCategory,
      appUrl
    }
  }
}
