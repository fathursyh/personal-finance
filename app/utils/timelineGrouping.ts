import type { TransactionWithBudget } from '~/types/database.types'
import type { DailyBudgetSubtotal, DailyTransactionGroup } from '~/types/timeline.types'

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function groupTransactionsByDate(transactions: TransactionWithBudget[]): DailyTransactionGroup[] {
  if (!transactions || transactions.length === 0) {
    return []
  }

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Group raw items by date string
  const groupsMap = new Map<string, TransactionWithBudget[]>()

  for (const tx of transactions) {
    const dateKey = tx.date || todayStr
    let list = groupsMap.get(dateKey)
    if (!list) {
      list = []
      groupsMap.set(dateKey, list)
    }
    list.push(tx)
  }

  // Sort dates descending (newest date first)
  const sortedDateKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a))

  return sortedDateKeys.map((dateStr) => {
    const txs = groupsMap.get(dateStr) || []

    // Sort transactions within the day (newest created_at or id first if available)
    txs.sort((a, b) => {
      if (a.created_at && b.created_at) {
        return b.created_at.localeCompare(a.created_at)
      }
      return 0
    })

    const parts = dateStr.split('-').map(Number)
    let dayNumber = '01'
    let dayOfWeek = 'Mon'
    let isSunday = false
    let isSaturday = false

    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      dayNumber = String(parts[2]).padStart(2, '0')
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      const dayIdx = d.getDay()
      dayOfWeek = WEEKDAY_NAMES[dayIdx] || 'Mon'
      isSunday = dayIdx === 0
      isSaturday = dayIdx === 6
    }

    let totalIncome = 0
    let totalExpense = 0
    const budgetMap = new Map<string, DailyBudgetSubtotal>()

    for (const tx of txs) {
      const amount = Number(tx.amount) || 0
      if (tx.type === 'expense') {
        totalExpense += amount
      } else {
        totalIncome += amount
      }

      const budgetKey = tx.budget_id || '__unbudgeted__'
      if (!budgetMap.has(budgetKey)) {
        budgetMap.set(budgetKey, {
          budgetId: tx.budget_id,
          budgetName: tx.budget?.name || 'LAIN LAIN',
          color: tx.budget?.color,
          totalExpense: 0,
          totalIncome: 0
        })
      }

      const subtotal = budgetMap.get(budgetKey)!
      if (tx.type === 'expense') {
        subtotal.totalExpense += amount
      } else {
        subtotal.totalIncome += amount
      }
    }

    const budgetSubtotals = Array.from(budgetMap.values()).sort(
      (a, b) => b.totalExpense - a.totalExpense
    )

    return {
      date: dateStr,
      dayNumber,
      dayOfWeek,
      isSunday,
      isSaturday,
      isToday: dateStr === todayStr,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactions: txs,
      budgetSubtotals
    }
  })
}

