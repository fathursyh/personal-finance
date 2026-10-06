import type { Budget, BudgetInsert, BudgetUpdate, Database } from '~/types/database.types'

export function useBudgets() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const toast = useToast()

  const budgets = useState<Budget[]>('app-budgets', () => [])
  const loading = useState<boolean>('app-budgets-loading', () => false)

  async function fetchBudgets() {
    if (!user.value) {
      budgets.value = []
      return
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      budgets.value = (data as Budget[]) || []
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
      budgets.value = [...budgets.value, created]

      toast.add({
        title: 'Budget created',
        description: `Budget "${created.name}" created successfully.`,
        color: 'success'
      })

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
      budgets.value = budgets.value.map(b => (b.id === id ? updated : b))

      toast.add({
        title: 'Budget updated',
        description: `Budget "${updated.name}" updated successfully.`,
        color: 'success'
      })

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

      budgets.value = budgets.value.filter(b => b.id !== id)

      toast.add({
        title: 'Budget deleted',
        description: 'Budget removed successfully.',
        color: 'info'
      })
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
    loading,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget
  }
}
