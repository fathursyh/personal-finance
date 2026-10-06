<script setup lang="ts">
import type { PaymentMethod, TransactionWithBudget } from '~/types/database.types'

definePageMeta({
  layout: 'dashboard',
  title: 'Transactions'
})

useHead({
  title: 'Transactions - Financial Tracker'
})

const { budgets, fetchBudgets } = useBudgets()
const {
  transactions,
  selectedMonth,
  fetchTransactions,
  deleteTransaction
} = useTransactions()
const {
  formatCurrency,
  totalSpent,
  totalIncome
} = useFinancialSummary()

const isTransactionModalOpen = ref(false)
const isBudgetModalOpen = ref(false)
const transactionToEdit = ref<TransactionWithBudget | null>(null)
const defaultBudgetId = ref<string | null>(null)

// Filters
const searchQuery = ref('')
const selectedBudgetId = ref<string>('all')
const selectedPaymentMethod = ref<string>('all')
const selectedType = ref<string>('all')

onMounted(async () => {
  await Promise.all([
    fetchBudgets(),
    fetchTransactions()
  ])
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

function handleOpenCreateBudgetFromTx() {
  isTransactionModalOpen.value = false
  isBudgetModalOpen.value = true
}

function getPaymentIcon(method: PaymentMethod) {
  switch (method) {
    case 'Cash':
      return 'i-lucide-banknote'
    case 'Debit Card':
    case 'Credit Card':
      return 'i-lucide-credit-card'
    case 'Bank Transfer':
      return 'i-lucide-landmark'
    case 'E-Wallet':
      return 'i-lucide-smartphone'
    case 'QRIS':
      return 'i-lucide-qr-code'
    default:
      return 'i-lucide-credit-card'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-highlighted">
          Transaction Ledger
        </h2>
        <p class="text-sm text-muted">
          Record purchases, view category breakdowns, and filter by payment method.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <MonthPicker />

        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="openNewTransactionModal()"
        >
          Add Transaction
        </UButton>
      </div>
    </div>

    <!-- Quick Stats for the Active Month -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Spent
          </p>
          <UIcon
            name="i-lucide-trending-down"
            class="size-4 text-rose-500"
          />
        </div>
        <p class="mt-2 text-2xl font-bold text-highlighted">
          {{ formatCurrency(totalSpent) }}
        </p>
        <p class="mt-1 text-xs text-muted">
          Expenses for {{ selectedMonth }}
        </p>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Income
          </p>
          <UIcon
            name="i-lucide-trending-up"
            class="size-4 text-emerald-500"
          />
        </div>
        <p class="mt-2 text-2xl font-bold text-emerald-500">
          {{ formatCurrency(totalIncome) }}
        </p>
        <p class="mt-1 text-xs text-muted">
          Income recorded this month
        </p>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Net Cashflow
          </p>
          <UIcon
            name="i-lucide-scale"
            class="size-4 text-muted"
          />
        </div>
        <p
          class="mt-2 text-2xl font-bold"
          :class="totalIncome - totalSpent >= 0 ? 'text-emerald-500' : 'text-rose-500'"
        >
          {{ formatCurrency(totalIncome - totalSpent) }}
        </p>
        <p class="mt-1 text-xs text-muted">
          {{ totalIncome - totalSpent >= 0 ? 'Net positive flow' : 'Net negative flow' }}
        </p>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Records
          </p>
          <UIcon
            name="i-lucide-receipt"
            class="size-4 text-muted"
          />
        </div>
        <p class="mt-2 text-2xl font-bold text-highlighted">
          {{ transactions.length }}
        </p>
        <p class="mt-1 text-xs text-muted">
          {{ filteredTransactions.length }} matching filters
        </p>
      </UCard>
    </div>

    <!-- Filters & Search Toolbar -->
    <UCard class="p-1">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search description..."
            size="sm"
            class="w-full"
          />
        </div>

        <div>
          <USelect
            v-model="selectedBudgetId"
            :items="budgetFilterOptions"
            size="sm"
            class="w-full"
          />
        </div>

        <div>
          <USelect
            v-model="selectedPaymentMethod"
            :items="paymentMethodOptions"
            size="sm"
            class="w-full"
          />
        </div>

        <div class="flex items-center gap-2">
          <USelect
            v-model="selectedType"
            :items="typeOptions"
            size="sm"
            class="w-full"
          />

          <UButton
            v-if="hasActiveFilters"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            title="Reset filters"
            aria-label="Reset filters"
            @click="resetFilters"
          />
        </div>
      </div>
    </UCard>

    <!-- Ledger Content -->
    <!-- Case 1: Empty state (No transactions this month) -->
    <div
      v-if="transactions.length === 0"
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
        Record your expenses or income to track where your money is going and see your remaining budget balances.
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

    <!-- Case 3: Ledger List -->
    <UCard
      v-else
      class="overflow-hidden"
    >
      <div class="divide-y divide-default">
        <div
          v-for="tx in filteredTransactions"
          :key="tx.id"
          class="flex items-center justify-between p-4 transition-colors hover:bg-elevated/50"
        >
          <!-- Left side: Category Icon, Description, Date, Tags -->
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
              :class="{
                'bg-emerald-500/10 text-emerald-500': tx.budget?.color === 'emerald',
                'bg-amber-500/10 text-amber-500': tx.budget?.color === 'amber',
                'bg-rose-500/10 text-rose-500': tx.budget?.color === 'rose',
                'bg-violet-500/10 text-violet-500': tx.budget?.color === 'violet',
                'bg-cyan-500/10 text-cyan-500': tx.budget?.color === 'cyan'
              }"
            >
              <UIcon
                :name="tx.budget?.icon || 'i-lucide-receipt'"
                class="size-5"
              />
            </div>

            <div class="min-w-0 truncate">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-highlighted truncate">
                  {{ tx.description }}
                </p>
                <UBadge
                  v-if="tx.type === 'income'"
                  color="success"
                  variant="subtle"
                  size="xs"
                >
                  Income
                </UBadge>
              </div>

              <div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{{ tx.date }}</span>
                <span>•</span>
                <span class="inline-flex items-center gap-1">
                  <UIcon
                    :name="getPaymentIcon(tx.payment_method)"
                    class="size-3"
                  />
                  {{ tx.payment_method }}
                </span>

                <template v-if="tx.budget">
                  <span>•</span>
                  <span class="inline-flex items-center gap-1 font-medium text-highlighted">
                    <span
                      class="size-1.5 rounded-full"
                      :class="{
                        'bg-emerald-500': tx.budget.color === 'emerald',
                        'bg-amber-500': tx.budget.color === 'amber',
                        'bg-rose-500': tx.budget.color === 'rose',
                        'bg-violet-500': tx.budget.color === 'violet',
                        'bg-cyan-500': tx.budget.color === 'cyan',
                        'bg-primary': !tx.budget.color || tx.budget.color === 'primary'
                      }"
                    />
                    {{ tx.budget.name }}
                  </span>
                </template>
                <template v-else>
                  <span>•</span>
                  <span class="text-muted italic">Unbudgeted</span>
                </template>
              </div>
            </div>
          </div>

          <!-- Right side: Amount & Action Dropdown -->
          <div class="flex items-center gap-3">
            <span
              class="text-base font-bold whitespace-nowrap"
              :class="tx.type === 'income' ? 'text-emerald-500' : 'text-highlighted'"
            >
              {{ tx.type === 'income' ? '+' : '-' }}{{ formatCurrency(Number(tx.amount)) }}
            </span>

            <UDropdownMenu
              :items="[
                [
                  { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => handleEditTransaction(tx) },
                  { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => handleDeleteTransaction(tx) }
                ]
              ]"
            >
              <UButton
                icon="i-lucide-more-vertical"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Actions"
              />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Modals -->
    <TransactionModal
      v-model="isTransactionModalOpen"
      :transaction-to-edit="transactionToEdit"
      :default-budget-id="defaultBudgetId"
      @saved="fetchTransactions"
      @open-create-budget="handleOpenCreateBudgetFromTx"
    />

    <BudgetModal
      v-model="isBudgetModalOpen"
      @saved="fetchBudgets"
    />
  </div>
</template>
