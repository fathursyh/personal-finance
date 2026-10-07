import type { Budget, BudgetInsert, BudgetUpdate, Database } from '~/types/database.types'

export function useBudgets() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const toast = useToast()

  const budgets = useState<Budget[]>('app-budgets', () => [])
  const budgetsLoaded = useState<boolean>('app-budgets-loaded', () => false)
  const loading = useState<boolean>('app-budgets-loading', () => false)

  async function fetchBudgets(force = false) {
    // If already cached and force is false, return cached data immediately
    if (budgetsLoaded.value && !force) {
      return budgets.value
    }

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
        budgets.value = []
        budgetsLoaded.value = false
        return
      }

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      budgets.value = (data as Budget[]) || []
      budgetsLoaded.value = true
      return budgets.value
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.add({
        title: 'Error loading budgets',
        description: error.message ?? 'Failed to fetch budgets.',
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  function invalidateCache() {
    budgetsLoaded.value = false
  }

  async function refreshTransactions() {
    try {
      const { fetchTransactions } = useTransactions()
      await fetchTransactions(undefined, true)
    } catch (err) {
      console.error('Failed to refresh transactions after budget update', err)
    }
  }

  async function createBudget(payload: Omit<BudgetInsert, 'user_id'>) {
    const { data: authData } = await supabase.auth.getUser()
    const activeUserId = authData.user?.id || user.value?.id

    if (!activeUserId) throw new Error('You must be logged in to create a budget.')

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          ...payload,
          user_id: activeUserId
        })
        .select()
        .single()

      if (error) throw error

      const created = data as Budget

      toast.add({
        title: 'Budget created',
        description: `Budget "${created.name}" created successfully.`,
        color: 'success'
      })

      // Invalidate cache and force refetch from database
      invalidateCache()
      await Promise.all([
        fetchBudgets(true),
        refreshTransactions()
      ])

      return created
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.add({
        title: 'Error creating budget',
        description: error.message ?? 'Failed to save budget.',
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateBudget(id: string, payload: BudgetUpdate) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updated = data as Budget

      toast.add({
        title: 'Budget updated',
        description: `Budget "${updated.name}" updated successfully.`,
        color: 'success'
      })

      // Invalidate cache and force refetch from database
      invalidateCache()
      await Promise.all([
        fetchBudgets(true),
        refreshTransactions()
      ])

      return updated
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.add({
        title: 'Error updating budget',
        description: error.message ?? 'Failed to update budget.',
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBudget(id: string) {
    loading.value = true
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.add({
        title: 'Budget deleted',
        description: 'Budget removed successfully.',
        color: 'info'
      })

      // Invalidate cache and force refetch from database
      invalidateCache()
      await Promise.all([
        fetchBudgets(true),
        refreshTransactions()
      ])
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.add({
        title: 'Error deleting budget',
        description: error.message ?? 'Failed to delete budget.',
        color: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    budgets,
    budgetsLoaded,
    loading,
    fetchBudgets,
    invalidateCache,
    createBudget,
    updateBudget,
    deleteBudget
  }
}
