import type { Database, TransactionInsert, TransactionUpdate, TransactionWithBudget } from '~/types/database.types'

export function useTransactions() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const toast = useToast()
  const { fetchBudgets } = useBudgets()

  const currentYearMonth = new Date().toISOString().slice(0, 7)
  const selectedMonth = useState<string>('app-selected-month', () => currentYearMonth)
  const transactions = useState<TransactionWithBudget[]>('app-transactions', () => [])
  const loading = useState<boolean>('app-transactions-loading', () => false)

  function getMonthDateRange(yearMonth: string) {
    const [yearStr, monthStr] = yearMonth.split('-')
    const year = Number.parseInt(yearStr ?? '', 10)
    const month = Number.parseInt(monthStr ?? '', 10)

    const startDate = `${yearMonth}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

    return { startDate, endDate }
  }

  async function fetchTransactions(targetMonth?: string) {
    const monthToQuery = targetMonth || selectedMonth.value
    if (targetMonth && targetMonth !== selectedMonth.value) {
      selectedMonth.value = targetMonth
    }

    const { startDate, endDate } = getMonthDateRange(monthToQuery)

    loading.value = true
    try {
      let activeUser = user.value
      if (!activeUser) {
        const { data: authData } = await supabase.auth.getUser()
        if (authData?.user) {
          activeUser = authData.user as unknown as typeof user.value
        }
      }

      if (!activeUser) {
        transactions.value = []
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*, budget:budgets(*)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      transactions.value = (data as unknown as TransactionWithBudget[]) || []
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.add({
        title: 'Error loading transactions',
        description: error.message ?? 'Failed to fetch transactions.',
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  async function createTransaction(payload: Omit<TransactionInsert, 'user_id'>) {
    const { data: authData } = await supabase.auth.getUser()
    const activeUserId = authData.user?.id || user.value?.id

    if (!activeUserId) throw new Error('You must be logged in to log a transaction.')

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...payload,
          user_id: activeUserId
        })
        .select('*, budget:budgets(*)')
        .single()

      if (error) throw error

      const created = data as unknown as TransactionWithBudget
      transactions.value = [created, ...transactions.value]

      // Refetch budgets so their last_updated and remaining amounts update instantly
      await fetchBudgets()

      toast.add({
        title: 'Transaction recorded',
        description: `Logged "${created.description}" of ${formatCurrency(Number(created.amount))}.`,
        color: 'success'
      })

      return created
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.add({
        title: 'Error creating transaction',
        description: error.message ?? 'Failed to save transaction.',
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTransaction(id: string, payload: TransactionUpdate) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .select('*, budget:budgets(*)')
        .single()

      if (error) throw error

      const updated = data as unknown as TransactionWithBudget
      transactions.value = transactions.value.map(t => (t.id === id ? updated : t))

      await fetchBudgets()

      toast.add({
        title: 'Transaction updated',
        description: 'Transaction updated successfully.',
        color: 'success'
      })

      return updated
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.add({
        title: 'Error updating transaction',
        description: error.message ?? 'Failed to update transaction.',
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTransaction(id: string) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      transactions.value = transactions.value.filter(t => t.id !== id)

      await fetchBudgets()

      toast.add({
        title: 'Transaction deleted',
        description: 'Transaction removed successfully.',
        color: 'info'
      })
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.add({
        title: 'Error deleting transaction',
        description: error.message ?? 'Failed to delete transaction.',
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    transactions,
    selectedMonth,
    loading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
  }
}
