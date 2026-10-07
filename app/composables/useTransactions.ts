import type { Database, TransactionInsert, TransactionUpdate, TransactionWithBudget } from '~/types/database.types'

export function useTransactions() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const toast = useToast()

  const currentYearMonth = new Date().toISOString().slice(0, 7)
  const selectedMonth = useState<string>('app-selected-month', () => currentYearMonth)
  const transactions = useState<TransactionWithBudget[]>('app-transactions', () => [])
  const transactionsLoaded = useState<boolean>('app-transactions-loaded', () => false)
  const cachedMonth = useState<string | null>('app-transactions-cached-month', () => null)
  const loading = useState<boolean>('app-transactions-loading', () => false)

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  function getMonthDateRange(yearMonth: string) {
    const [yearStr, monthStr] = yearMonth.split('-')
    const year = Number.parseInt(yearStr ?? '', 10)
    const month = Number.parseInt(monthStr ?? '', 10)

    const startDate = `${yearMonth}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

    return { startDate, endDate }
  }

  async function fetchTransactions(targetMonth?: string, force = false) {
    const monthToQuery = targetMonth || selectedMonth.value
    if (targetMonth && targetMonth !== selectedMonth.value) {
      selectedMonth.value = targetMonth
    }

    // Check if data is already cached for this target month
    const isCached = transactionsLoaded.value && cachedMonth.value === monthToQuery && !force
    if (isCached) {
      return transactions.value
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
        transactionsLoaded.value = false
        cachedMonth.value = null
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
      transactionsLoaded.value = true
      cachedMonth.value = monthToQuery
      return transactions.value
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

  function invalidateCache() {
    transactionsLoaded.value = false
    cachedMonth.value = null
  }

  async function refreshBudgets() {
    try {
      const { fetchBudgets } = useBudgets()
      await fetchBudgets(true)
    } catch (err) {
      console.error('Failed to refresh budgets after transaction update', err)
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

      toast.add({
        title: 'Transaction recorded',
        description: `Logged "${created.description}" of ${formatCurrency(Number(created.amount))}.`,
        color: 'success'
      })

      // If the transaction was added for another month, switch to that month
      const txMonth = created.date ? created.date.slice(0, 7) : selectedMonth.value
      if (txMonth && txMonth !== selectedMonth.value) {
        selectedMonth.value = txMonth
      }

      // Invalidate cache and force refetch from database
      invalidateCache()
      await Promise.all([
        fetchTransactions(selectedMonth.value, true),
        refreshBudgets()
      ])

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

      toast.add({
        title: 'Transaction updated',
        description: 'Transaction updated successfully.',
        color: 'success'
      })

      // Invalidate cache and force refetch from database
      invalidateCache()
      await Promise.all([
        fetchTransactions(selectedMonth.value, true),
        refreshBudgets()
      ])

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

      toast.add({
        title: 'Transaction deleted',
        description: 'Transaction removed successfully.',
        color: 'info'
      })

      // Invalidate cache and force refetch from database
      invalidateCache()
      await Promise.all([
        fetchTransactions(selectedMonth.value, true),
        refreshBudgets()
      ])
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
    transactionsLoaded,
    fetchTransactions,
    invalidateCache,
    createTransaction,
    updateTransaction,
    deleteTransaction
  }
}
