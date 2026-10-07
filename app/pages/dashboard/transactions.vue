<script setup lang="ts">
import type { TransactionWithBudget } from '~/types/database.types'
import { groupTransactionsByDate } from '~/utils/timelineGrouping'

definePageMeta({
  layout: 'dashboard',
  title: 'Transactions'
})

useHead({
  title: 'Transactions - Financial Tracker'
})

const { budgets, fetchBudgets, budgetsLoaded: _budgetsLoaded } = useBudgets()
const {
  transactions,
  loading: txsLoading,
  selectedMonth,
  fetchTransactions,
  deleteTransaction,
  transactionsLoaded
} = useTransactions()

const isTransactionModalOpen = ref(false)
const isBudgetModalOpen = ref(false)
const transactionToEdit = ref<TransactionWithBudget | null>(null)
const defaultBudgetId = ref<string | null>(null)

const isLoading = computed(() => (!transactionsLoaded.value && transactions.value.length === 0) || txsLoading.value)

// Filters
const route = useRoute()
const initialBudgetId = typeof route.query.budget === 'string' && route.query.budget ? route.query.budget : 'all'
const selectedBudgetId = ref<string>(initialBudgetId)
const searchQuery = ref('')
const selectedPaymentMethod = ref<string>('all')
const selectedType = ref<string>('all')
const showFilters = ref(false)

watch(() => route.query.budget, (newBudgetId) => {
  if (typeof newBudgetId === 'string' && newBudgetId) {
    selectedBudgetId.value = newBudgetId
  } else if (!newBudgetId) {
    selectedBudgetId.value = 'all'
  }
})

const budgetFilterOptions = computed(() => [
  { label: 'All Budgets', value: 'all' },
  { label: 'Unbudgeted', value: 'unbudgeted' },
  ...budgets.value.map(b => ({
    label: b.name,
    value: b.id
  }))
])

const paymentMethodOptions = [
  { label: 'All Payment Methods', value: 'all' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'E-Wallet', value: 'E-Wallet' },
  { label: 'QRIS', value: 'QRIS' }
]

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Expenses only', value: 'expense' },
  { label: 'Income only', value: 'income' }
]

const filteredTransactions = computed(() => {
  return transactions.value.filter((t) => {
    // Search query matches description
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      if (!t.description.toLowerCase().includes(q)) return false
    }

    // Budget filter
    if (selectedBudgetId.value !== 'all') {
      if (selectedBudgetId.value === 'unbudgeted') {
        if (t.budget_id) return false
      } else if (t.budget_id !== selectedBudgetId.value) {
        return false
      }
    }

    // Payment method filter
    if (selectedPaymentMethod.value !== 'all') {
      if (t.payment_method !== selectedPaymentMethod.value) return false
    }

    // Type filter
    if (selectedType.value !== 'all') {
      if (t.type !== selectedType.value) return false
    }

    return true
  })
})

const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== ''
    || selectedBudgetId.value !== 'all'
    || selectedPaymentMethod.value !== 'all'
    || selectedType.value !== 'all'
})

// Daily timeline grouping
const groupedTransactions = computed(() => {
  return groupTransactionsByDate(filteredTransactions.value)
})

// Monthly timeline aggregations
const monthlyIncome = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
})

const monthlyExpense = computed(() => {
  return filteredTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
})

const monthlyTotal = computed(() => {
  return monthlyIncome.value - monthlyExpense.value
})

function resetFilters() {
  searchQuery.value = ''
  selectedBudgetId.value = 'all'
  selectedPaymentMethod.value = 'all'
  selectedType.value = 'all'
}

function openNewTransactionModal(budgetId?: string) {
  transactionToEdit.value = null
  defaultBudgetId.value = budgetId || null
  isTransactionModalOpen.value = true
}

function handleEditTransaction(tx: TransactionWithBudget) {
  transactionToEdit.value = tx
  isTransactionModalOpen.value = true
}

async function handleDeleteTransaction(tx: TransactionWithBudget) {
  if (confirm(`Are you sure you want to delete "${tx.description}"?`)) {
    await deleteTransaction(tx.id)
  }
}

async function refreshAllData() {
  await Promise.all([
    fetchBudgets(),
    fetchTransactions()
  ])
}

function handleOpenCreateBudgetFromTx() {
  isTransactionModalOpen.value = false
  isBudgetModalOpen.value = true
}
</script>

<template>
  <div class="space-y-3 sm:space-y-4 pb-20">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-lg sm:text-2xl font-bold tracking-tight text-highlighted">
          Transaction Ledger
        </h2>
        <p class="hidden sm:block text-xs text-muted">
          Daily chronological timeline categorized by budget buckets.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <MonthPicker />

        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="xs"
          class="hidden sm:inline-flex"
          @click="openNewTransactionModal()"
        >
          Add Transaction
        </UButton>
      </div>
    </div>

    <!-- Monthly Summary Bar (Income, Exp., Total) -->
    <TransactionDailyHeader
      :income="monthlyIncome"
      :expense="monthlyExpense"
      :total="monthlyTotal"
    />

    <!-- Filters & Search Toolbar -->
    <UCard class="p-2 sm:p-2.5">
      <div class="flex items-center gap-1.5 sm:gap-2">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Search description..."
          size="xs"
          class="flex-1"
        />

        <UButton
          :icon="showFilters ? 'i-lucide-filter-x' : 'i-lucide-filter'"
          :color="hasActiveFilters ? 'primary' : 'neutral'"
          :variant="hasActiveFilters ? 'subtle' : 'ghost'"
          size="xs"
          class="sm:hidden"
          :title="showFilters ? 'Hide filters' : 'Show filters'"
          @click="showFilters = !showFilters"
        >
          Filters
        </UButton>

        <UButton
          v-if="hasActiveFilters"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          title="Reset filters"
          aria-label="Reset filters"
          @click="resetFilters"
        />
      </div>

      <div
        class="gap-1.5 sm:gap-2 mt-2"
        :class="showFilters ? 'grid grid-cols-1 sm:grid-cols-3' : 'hidden sm:grid sm:grid-cols-3'"
      >
        <USelect
          v-model="selectedBudgetId"
          :items="budgetFilterOptions"
          size="xs"
          class="w-full"
        />

        <USelect
          v-model="selectedPaymentMethod"
          :items="paymentMethodOptions"
          size="xs"
          class="w-full"
        />

        <USelect
          v-model="selectedType"
          :items="typeOptions"
          size="xs"
          class="w-full"
        />
      </div>
    </UCard>

    <!-- Ledger Content -->
    <!-- Case 0: Loading skeleton -->
    <UCard
      v-if="isLoading"
      class="p-4 space-y-4"
    >
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-center justify-between py-2 border-b border-default/50"
      >
        <div class="flex items-center gap-3">
          <USkeleton class="size-9 rounded-lg" />
          <div class="space-y-1">
            <USkeleton class="h-4 w-36" />
            <USkeleton class="h-3 w-24" />
          </div>
        </div>
        <USkeleton class="h-5 w-24" />
      </div>
    </UCard>

    <!-- Case 1: Empty state (No transactions this month) -->
    <div
      v-else-if="transactions.length === 0"
      class="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center"
    >
      <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <UIcon
          name="i-lucide-receipt"
          class="size-8"
        />
      </div>
      <h3 class="text-xl font-bold text-highlighted">
        No transactions logged for {{ selectedMonth }}
      </h3>
      <p class="mx-auto mt-2 max-w-md text-sm text-muted">
        Record your expenses or income to track where your money is going and see your daily timeline.
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <UButton
          size="lg"
          color="primary"
          icon="i-lucide-plus"
          @click="openNewTransactionModal()"
        >
          Add Your First Transaction
        </UButton>
      </div>
    </div>

    <!-- Case 2: Filter results empty -->
    <div
      v-else-if="filteredTransactions.length === 0"
      class="rounded-xl border border-default p-8 text-center"
    >
      <UIcon
        name="i-lucide-filter-x"
        class="mx-auto size-8 text-muted mb-2"
      />
      <p class="text-sm font-medium text-highlighted">
        No transactions match your current filters.
      </p>
      <p class="text-xs text-muted mt-1">
        Try resetting your search query or selecting "All" in the filters.
      </p>
      <UButton
        size="xs"
        variant="subtle"
        color="neutral"
        class="mt-3"
        @click="resetFilters"
      >
        Reset filters
      </UButton>
    </div>

    <!-- Case 3: Daily Timeline Ledger -->
    <UCard
      v-else
      class="overflow-hidden p-0"
    >
      <TransactionDailyGroup
        v-for="group in groupedTransactions"
        :key="group.date"
        :group="group"
        @edit="handleEditTransaction"
        @delete="handleDeleteTransaction"
      />
    </UCard>

    <!-- Floating Action Button (FAB) -->
    <div class="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-30">
      <button
        type="button"
        class="flex size-12 sm:size-14 items-center justify-center rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-hidden focus:ring-4 focus:ring-rose-500/30 cursor-pointer"
        title="Add Transaction"
        aria-label="Add Transaction"
        @click="openNewTransactionModal()"
      >
        <UIcon
          name="i-lucide-plus"
          class="size-6 sm:size-7 stroke-[2.5]"
        />
      </button>
    </div>

    <!-- Modals -->
    <TransactionModal
      v-model="isTransactionModalOpen"
      :transaction-to-edit="transactionToEdit"
      :default-budget-id="defaultBudgetId"
      @saved="refreshAllData"
      @open-create-budget="handleOpenCreateBudgetFromTx"
    />

    <BudgetModal
      v-model="isBudgetModalOpen"
      @saved="refreshAllData"
    />
  </div>
</template>
